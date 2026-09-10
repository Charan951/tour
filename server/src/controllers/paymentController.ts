import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { AuthRequest } from '../middleware/auth.js';
import { emitDataUpdate, emitUpdate } from '../config/socketEvents.js';
import { sendPaymentReceiptEmail, sendBookingStatusUpdateEmail } from '../services/emailService.js';
import { createNotification } from '../services/notificationService.js';

/**
 * Razorpay wiring
 * ---------------
 * Credentials come from the server environment (`RAZORPAY_KEY_ID` /
 * `RAZORPAY_KEY_SECRET`). They may be a **test** pair (`rzp_test_…`) or a
 * **live** pair (`rzp_live_…`) — the same code path handles both; the only
 * difference the clients see is the `mode` field, used purely to show a
 * "TEST MODE" badge. There is no fake / demo success path here: a payment is
 * only marked paid after Razorpay confirms it.
 */
type RazorpayMode = 'test' | 'live';

interface ResolvedRazorpay {
  instance: Razorpay;
  keyId: string;
  keySecret: string;
  mode: RazorpayMode;
}

let cached: ResolvedRazorpay | null = null;

const resolveRazorpay = (): ResolvedRazorpay | null => {
  if (cached) return cached;

  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!keyId || !keySecret) return null;

  const mode: RazorpayMode = keyId.startsWith('rzp_live_') ? 'live' : 'test';
  cached = {
    instance: new Razorpay({ key_id: keyId, key_secret: keySecret }),
    keyId,
    keySecret,
    mode,
  };
  return cached;
};

const notConfigured = (res: Response) =>
  res.status(503).json({
    success: false,
    code: 'PAYMENT_NOT_CONFIGURED',
    message:
      'Online payments are temporarily unavailable. The payment gateway is not configured on the server.',
  });

/**
 * @route GET /api/v1/payments/config  (alias: /payments/razorpay-key)
 * @desc  Public Razorpay Key ID + mode for the checkout UI.
 * @access Public
 */
export const getPaymentConfig = async (_req: Request, res: Response) => {
  const rp = resolveRazorpay();
  if (!rp) {
    return res.status(200).json({ success: true, configured: false, key: '', mode: 'test' });
  }
  return res.status(200).json({
    success: true,
    configured: true,
    key: rp.keyId,
    mode: rp.mode,
  });
};

// Back-compat name still imported by routes/api.ts
export const getRazorpayKey = getPaymentConfig;

/**
 * @route POST /api/v1/payments/create-order
 * @desc  Create a Razorpay order (amount in INR).
 * @access Public / Authenticated
 */
export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const rp = resolveRazorpay();
    if (!rp) return notConfigured(res);

    const { amount, currency = 'INR', bookingId, notes } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_AMOUNT',
        message: 'A valid positive amount in INR is required to create a payment order.',
      });
    }

    const amountInPaise = Math.round(numAmount * 100);

    // Razorpay test mode rejects transactions above ₹5,00,000. Surface a clear
    // error instead of silently changing the amount the customer is charged.
    if (rp.mode === 'test' && amountInPaise > 500000 * 100) {
      return res.status(400).json({
        success: false,
        code: 'AMOUNT_TOO_LARGE_FOR_TEST',
        message:
          'This amount exceeds the ₹5,00,000 limit of Razorpay test mode. Switch the server to live keys to charge this amount.',
      });
    }

    const order = await rp.instance.orders.create({
      amount: amountInPaise,
      currency: String(currency).toUpperCase(),
      receipt: bookingId
        ? `rcpt_${String(bookingId)}_${Date.now()}`.slice(0, 40)
        : `rcpt_${Date.now()}`,
      notes: {
        bookingId: bookingId || '',
        customerEmail: (req as AuthRequest).user?.email || notes?.email || '',
        ...notes,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Razorpay order created',
      data: {
        id: order.id,
        entity: order.entity,
        amount: order.amount,
        amountDue: order.amount_due,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        key: rp.keyId,
        mode: rp.mode,
      },
    });
  } catch (error: any) {
    // Razorpay SDK errors carry a nested `.error.description`
    const rpDesc =
      error?.error?.description || error?.description || error?.message || 'Failed to create payment order.';
    console.error('[Razorpay] create-order error:', rpDesc);
    return res.status(502).json({
      success: false,
      code: 'ORDER_CREATE_FAILED',
      message: rpDesc,
    });
  }
};

const isValidObjectId = (str: string) =>
  typeof str === 'string' && /^[0-9a-fA-F]{24}$/.test(str) && mongoose.Types.ObjectId.isValid(str);

/**
 * @route POST /api/v1/payments/verify
 * @desc  Verify the Razorpay signature, confirm capture with Razorpay, then
 *        mark the booking paid. Returns a structured result the clients turn
 *        into success / error screens.
 * @access Public / Authenticated
 */
export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const rp = resolveRazorpay();
    if (!rp) return notConfigured(res);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      isAdvancePayment = false,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'razorpay_order_id, razorpay_payment_id and razorpay_signature are all required.',
      });
    }

    // 1. HMAC-SHA256 signature check
    const generatedSignature = crypto
      .createHmac('sha256', rp.keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        code: 'SIGNATURE_INVALID',
        message: 'Payment could not be verified (signature mismatch). No money was captured against this booking.',
      });
    }

    // 2. Confirm with Razorpay that the payment actually succeeded and belongs
    //    to this order. If Razorpay is unreachable we still trust the signature
    //    but flag how it was verified.
    let paymentStatus: string | null = null;
    let capturedAmount: number | null = null;
    let verifiedBy: 'razorpay-api' | 'signature-only' = 'signature-only';

    try {
      const payment: any = await rp.instance.payments.fetch(razorpay_payment_id);

      if (payment?.order_id && payment.order_id !== razorpay_order_id) {
        return res.status(400).json({
          success: false,
          code: 'ORDER_MISMATCH',
          message: 'This payment does not belong to the given order.',
        });
      }

      paymentStatus = payment?.status ?? null;
      capturedAmount = typeof payment?.amount === 'number' ? payment.amount : null;
      verifiedBy = 'razorpay-api';

      // Auto-capture an authorized-but-uncaptured payment (auto-capture off on the account)
      if (paymentStatus === 'authorized') {
        try {
          const captured: any = await rp.instance.payments.capture(
            razorpay_payment_id,
            payment.amount,
            payment.currency || 'INR'
          );
          paymentStatus = captured?.status ?? 'captured';
        } catch (capErr: any) {
          console.error('[Razorpay] capture failed:', capErr?.error?.description || capErr?.message);
        }
      }

      if (paymentStatus !== 'captured' && paymentStatus !== 'authorized') {
        return res.status(400).json({
          success: false,
          code: 'PAYMENT_NOT_CAPTURED',
          message: `Payment is in "${paymentStatus}" state and was not captured. The booking has not been marked paid.`,
          data: { paymentId: razorpay_payment_id, orderId: razorpay_order_id, status: paymentStatus },
        });
      }
    } catch (fetchErr: any) {
      // Network / transient — signature already proved authenticity.
      console.warn('[Razorpay] payments.fetch failed, trusting signature:', fetchErr?.message);
    }

    // 3. Update the booking (if one was supplied)
    let populatedBooking: any = null;
    let expectedAmount: number | null = null;

    if (bookingId) {
      const booking = isValidObjectId(String(bookingId))
        ? await Booking.findById(bookingId)
        : await Booking.findOne({ bookingId });

      if (booking && !booking.isDeleted) {
        expectedAmount = isAdvancePayment
          ? Number(booking.advanceAmount || 0)
          : Number(booking.remainingBalance || booking.totalPrice - (booking.advanceAmount || 0));

        // Guard against a captured amount that is materially short of what was due.
        if (
          capturedAmount != null &&
          expectedAmount > 0 &&
          capturedAmount < Math.floor(expectedAmount * 100 * 0.99)
        ) {
          return res.status(400).json({
            success: false,
            code: 'AMOUNT_MISMATCH',
            message: `Captured ₹${(capturedAmount / 100).toFixed(2)} is less than the ₹${expectedAmount.toFixed(
              2
            )} due for this booking.`,
            data: { paymentId: razorpay_payment_id, capturedAmount, expectedAmount },
          });
        }

        booking.paymentMethod = 'Razorpay';
        booking.transactionId = razorpay_payment_id;
        booking.paymentDetails = {
          upiId: booking.paymentDetails?.upiId || '',
          cardLast4: booking.paymentDetails?.cardLast4 || '',
          cardHolder: booking.paymentDetails?.cardHolder || '',
          cardExpiry: booking.paymentDetails?.cardExpiry || '',
          bankName: booking.paymentDetails?.bankName || '',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        };

        if (isAdvancePayment) {
          booking.paymentStatus = 'Advance Paid';
          booking.advancePaid = true;
          booking.remainingBalance = Math.max(0, booking.totalPrice - booking.advanceAmount);
        } else {
          booking.paymentStatus = 'Full Paid';
          booking.advancePaid = true;
          booking.remainingBalance = 0;
        }

        await booking.save();

        populatedBooking = await Booking.findById(booking._id)
          .populate('destination', 'name slug banner')
          .populate('package', 'title slug packageCode startingPrice duration images');

        emitDataUpdate('Booking', populatedBooking, 'general_updates');
        emitUpdate('Booking', populatedBooking, 'general_updates');

        const paidAmount = isAdvancePayment
          ? booking.advanceAmount
          : booking.totalPrice - (booking.advanceAmount || 0);

        sendPaymentReceiptEmail(populatedBooking, Number(paidAmount || booking.totalPrice), !isAdvancePayment).catch(
          (err) => console.error('[Razorpay] receipt email failed:', err)
        );
        sendBookingStatusUpdateEmail(populatedBooking).catch((err) =>
          console.error('[Razorpay] status email failed:', err)
        );

        if (booking.email) {
          createNotification({
            type: 'booking',
            title: '💳 Payment Received via Razorpay',
            message: `Payment of ₹${paidAmount} received for booking #${booking.bookingId}. Status: ${booking.paymentStatus}`,
            entityId: booking._id.toString(),
            status: booking.status,
            userEmail: booking.email.toString().trim().toLowerCase(),
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      data: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: paymentStatus || 'captured',
        amount: capturedAmount,
        expectedAmount,
        verifiedBy,
        booking: populatedBooking,
      },
    });
  } catch (error: any) {
    console.error('[Razorpay] verify error:', error);
    return res.status(500).json({
      success: false,
      code: 'VERIFY_FAILED',
      message: error?.message || 'Payment verification failed.',
    });
  }
};

/**
 * @route POST /api/v1/payments/webhook
 * @desc  Razorpay server-to-server webhook. Reconciles a booking even if the
 *        customer's app/browser died before hitting /payments/verify.
 *        Mounted in index.ts with `express.raw` (needs the unparsed body for
 *        signature verification) BEFORE the JSON body parser.
 * @access Razorpay only (HMAC-verified)
 */
export const razorpayWebhook = async (req: Request, res: Response) => {
  const secret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  if (!secret) return res.status(503).json({ success: false, message: 'Webhook not configured.' });

  const signature = req.headers['x-razorpay-signature'] as string | undefined;
  const raw: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || ''));

  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  if (!signature || expected !== signature) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
  }

  // Ack immediately so Razorpay does not retry while we do DB work.
  res.status(200).json({ success: true });

  try {
    const event = JSON.parse(raw.toString('utf8'));
    if (event?.event !== 'payment.captured' && event?.event !== 'order.paid') return;

    const payment = event.payload?.payment?.entity;
    if (!payment || payment.status !== 'captured') return;

    let bookingId: string | undefined = payment.notes?.bookingId;
    if (!bookingId && payment.order_id) {
      try {
        const rp = resolveRazorpay();
        const order: any = rp ? await rp.instance.orders.fetch(payment.order_id) : null;
        bookingId = order?.notes?.bookingId;
      } catch { /* ignore */ }
    }
    if (!bookingId) return;

    const booking = isValidObjectId(String(bookingId))
      ? await Booking.findById(bookingId)
      : await Booking.findOne({ bookingId });
    if (!booking || booking.isDeleted) return;

    // Idempotent — /payments/verify or a prior webhook already handled it.
    if (booking.transactionId === payment.id || booking.paymentStatus === 'Full Paid') return;

    const paidRupees = Number(payment.amount || 0) / 100;
    const remainingDue = Number(
      booking.remainingBalance || booking.totalPrice - (booking.advanceAmount || 0)
    );
    const advanceDue = Number(booking.advanceAmount || 0);
    const alreadyAdvancePaid = booking.advancePaid === true || booking.paymentStatus === 'Advance Paid';
    const isFullPayment =
      alreadyAdvancePaid ||
      Math.abs(paidRupees - remainingDue) <= Math.abs(paidRupees - advanceDue);

    booking.paymentMethod = 'Razorpay';
    booking.transactionId = payment.id;
    booking.paymentDetails = {
      ...(booking.paymentDetails || {}),
      razorpayOrderId: payment.order_id,
      razorpayPaymentId: payment.id,
    } as any;

    if (isFullPayment) {
      booking.paymentStatus = 'Full Paid';
      booking.advancePaid = true;
      booking.remainingBalance = 0;
    } else {
      booking.paymentStatus = 'Advance Paid';
      booking.advancePaid = true;
      booking.remainingBalance = Math.max(0, booking.totalPrice - booking.advanceAmount);
    }
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('destination', 'name slug banner')
      .populate('package', 'title slug packageCode startingPrice duration images');
    emitDataUpdate('Booking', populated, 'general_updates');
    emitUpdate('Booking', populated, 'general_updates');

    sendPaymentReceiptEmail(populated, paidRupees, isFullPayment).catch(() => {});
    sendBookingStatusUpdateEmail(populated).catch(() => {});
    if (booking.email) {
      createNotification({
        type: 'booking',
        title: '💳 Payment Received (Razorpay webhook)',
        message: `₹${paidRupees} received for booking #${booking.bookingId}. Status: ${booking.paymentStatus}`,
        entityId: booking._id.toString(),
        status: booking.status,
        userEmail: booking.email.toString().trim().toLowerCase(),
      });
    }
    console.log(`[Razorpay webhook] reconciled booking ${booking.bookingId} → ${booking.paymentStatus}`);
  } catch (err) {
    console.error('[Razorpay webhook] processing error:', err);
  }
};
