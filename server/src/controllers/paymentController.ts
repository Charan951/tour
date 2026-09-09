import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { AuthRequest } from '../middleware/auth.js';
import { emitDataUpdate, emitUpdate } from '../config/socketEvents.js';
import { sendPaymentReceiptEmail, sendBookingStatusUpdateEmail } from '../services/emailService.js';
import { createNotification } from '../services/notificationService.js';

// Lazy-initialized Razorpay instance getter using server/.env credentials
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay API key and secret must be configured in server environment variables.');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
};

/**
 * @route GET /api/v1/payments/razorpay-key
 * @desc Get public Razorpay Key ID for client checkout UI
 * @access Public
 */
export const getRazorpayKey = async (_req: Request, res: Response) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    if (!keyId) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay Key ID is not configured on the server.'
      });
    }

    return res.status(200).json({
      success: true,
      key: keyId
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route POST /api/v1/payments/create-order
 * @desc Create a new Razorpay Order (amount in INR)
 * @access Public / Authenticated
 */
export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', bookingId, notes } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid positive amount in INR is required to create a payment order.'
      });
    }

    // Convert amount to paise (1 INR = 100 paise)
    let amountInPaise = Math.round(numAmount * 100);

    // Razorpay Test Mode limits test transactions (max ~15,000 INR per test transaction).
    // If using Razorpay Test Key, cap test order amount to 15,000 INR so Razorpay Test Engine never throws
    // "Amount exceeds maximum amount allowed."
    const isTestMode = (process.env.RAZORPAY_KEY_ID || '').startsWith('rzp_test_');
    if (isTestMode && amountInPaise > 1500000) {
      amountInPaise = 1500000;
    }

    const razorpay = getRazorpayInstance();
    const options = {
      amount: amountInPaise,
      currency: currency.toUpperCase(),
      receipt: bookingId ? `receipt_${bookingId}_${Date.now()}`.slice(0, 40) : `receipt_${Date.now()}`,
      notes: {
        bookingId: bookingId || '',
        customerEmail: (req as AuthRequest).user?.email || notes?.email || '',
        ...notes
      }
    };

    const order = await razorpay.orders.create(options);

    return res.status(201).json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        id: order.id,
        entity: order.entity,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error: any) {
    console.error('[Razorpay] Create order error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create Razorpay payment order.'
    });
  }
};

/**
 * @route POST /api/v1/payments/verify
 * @desc Verify Razorpay HMAC-SHA256 signature and confirm booking payment
 * @access Public / Authenticated
 */
export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      isAdvancePayment = false
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required for verification.'
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay secret key is not configured on the server.'
      });
    }

    // Verify HMAC-SHA256 signature
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isSignatureValid = generatedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Razorpay verification failed.'
      });
    }

    // If bookingId was supplied, update the booking record
    let populatedBooking: any = null;
    if (bookingId) {
      const isValidObjectId = (str: string) =>
        typeof str === 'string' && str.length === 24 && /^[0-9a-fA-F]{24}$/.test(str) && mongoose.Types.ObjectId.isValid(str);

      let booking = isValidObjectId(bookingId)
        ? await Booking.findById(bookingId)
        : await Booking.findOne({ bookingId });

      if (booking && !booking.isDeleted) {
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
          razorpaySignature: razorpay_signature
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

        // Send payment confirmation notifications
        const paidAmount = isAdvancePayment ? booking.advanceAmount : (booking.totalPrice - (booking.advanceAmount || 0));
        sendPaymentReceiptEmail(populatedBooking, Number(paidAmount || booking.totalPrice), !isAdvancePayment).catch(err =>
          console.error('[Razorpay] Payment receipt email trigger failed:', err)
        );
        sendBookingStatusUpdateEmail(populatedBooking).catch(err =>
          console.error('[Razorpay] Booking status update email failed:', err)
        );

        if (booking.email) {
          createNotification({
            type: 'booking',
            title: '💳 Payment Received via Razorpay',
            message: `Payment of ₹${paidAmount} received for booking #${booking.bookingId}. Status: ${booking.paymentStatus}`,
            entityId: booking._id.toString(),
            status: booking.status,
            userEmail: booking.email.toString().trim().toLowerCase()
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Razorpay payment verified successfully!',
      data: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        booking: populatedBooking
      }
    });
  } catch (error: any) {
    console.error('[Razorpay] Verification error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed.'
    });
  }
};
