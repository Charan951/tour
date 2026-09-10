import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  X,
} from 'lucide-react';
import { apiClient } from '../../api/apiClient';

type Phase =
  | 'loading'      // loading SDK + creating order
  | 'checkout'     // Razorpay overlay is open
  | 'verifying'    // signature verification with our server
  | 'success'
  | 'failed'
  | 'timeout'
  | 'cancelled';

interface Props {
  booking: any;
  isAdvance: boolean;
  /** Called after the server has confirmed the payment. Gets the updated booking (may be null). */
  onPaid: (booking: any) => void;
  onClose: () => void;
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
const CHECKOUT_TIMEOUT_MS = 6 * 60 * 1000; // must be >= Razorpay's own `timeout`

function loadCheckoutScript(): Promise<boolean> {
  if ((window as any).Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const s = document.createElement('script');
    s.src = CHECKOUT_SRC;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const rupee = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const RazorpayPaymentModal: React.FC<Props> = ({ booking, isAdvance, onPaid, onClose }) => {
  const [phase, setPhase] = useState<Phase>('loading');
  const [message, setMessage] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [mode, setMode] = useState<'test' | 'live'>('test');

  const resolvedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rzpRef = useRef<any>(null);
  const attemptRef = useRef(0);

  const bookingIdStr = booking?._id || booking?.bookingId;
  const amount = isAdvance
    ? Number(booking?.advanceAmount) || Math.round(Number(booking?.totalPrice) * 0.25)
    : Number(booking?.remainingBalance) ||
      Number(booking?.totalPrice) - Number(booking?.advanceAmount || 0);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const settle = useCallback(
    (next: Exclude<Phase, 'loading' | 'checkout' | 'verifying'>, msg = '', code = '') => {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      clearTimer();
      setMessage(msg);
      setErrorCode(code);
      setPhase(next);
    },
    []
  );

  const start = useCallback(async () => {
    resolvedRef.current = false;
    attemptRef.current += 1;
    setPhase('loading');
    setMessage('');
    setErrorCode('');

    if (!amount || amount <= 0) {
      settle('failed', 'This booking has no payable amount.');
      return;
    }

    // 1. SDK
    const ok = await loadCheckoutScript();
    if (!ok) {
      settle('failed', 'Could not load the payment gateway. Check your internet connection and try again.');
      return;
    }

    // 2. Order
    let order: any;
    try {
      const { data } = await apiClient.post('/payments/create-order', {
        amount,
        currency: 'INR',
        bookingId: bookingIdStr,
        notes: {
          customerName: booking?.customerName || '',
          email: booking?.email || '',
          mobile: booking?.mobile || '',
        },
      });
      if (!data?.success || !data?.data?.id || !data?.data?.key) {
        settle('failed', data?.message || 'Could not start the payment. Please try again.', data?.code || '');
        return;
      }
      order = data.data;
      setMode(order.mode === 'live' ? 'live' : 'test');
    } catch (err: any) {
      const res = err?.response?.data;
      settle(
        'failed',
        res?.message || err?.message || 'Could not reach the payment server. Please try again.',
        res?.code || 'NETWORK'
      );
      return;
    }

    // 3. Checkout
    const options = {
      key: order.key,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'HolidayCity Tours',
      description: `${isAdvance ? 'Advance payment' : 'Remaining balance'} · Booking #${booking?.bookingId || ''}`,
      prefill: {
        name: booking?.customerName || '',
        email: booking?.email || '',
        contact: booking?.mobile || '',
      },
      theme: { color: '#0A6FB5' },
      timeout: Math.floor(CHECKOUT_TIMEOUT_MS / 1000) - 15,
      modal: {
        escape: true,
        ondismiss: () => settle('cancelled', 'You closed the payment window before finishing.'),
      },
      handler: async (resp: any) => {
        setPhase('verifying');
        try {
          const { data } = await apiClient.post('/payments/verify', {
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
            bookingId: bookingIdStr,
            isAdvancePayment: isAdvance,
          });
          if (data?.success) {
            resolvedRef.current = true;
            clearTimer();
            setPhase('success');
            onPaid(data?.data?.booking ?? null);
          } else {
            settle('failed', data?.message || 'We could not verify this payment.', data?.code || '');
          }
        } catch (err: any) {
          const res = err?.response?.data;
          settle(
            'failed',
            res?.message ||
              'Your payment may have gone through but we could not verify it. Do not pay again — contact support with your booking ID.',
            res?.code || 'VERIFY_NETWORK'
          );
        }
      },
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzpRef.current = rzp;
      rzp.on('payment.failed', (resp: any) => {
        const e = resp?.error || {};
        settle('failed', e.description || 'The payment failed. No money was charged.', e.code || 'PAYMENT_FAILED');
      });
      setPhase('checkout');
      clearTimer();
      timerRef.current = setTimeout(() => {
        try { rzpRef.current?.close(); } catch { /* noop */ }
        settle('timeout', 'The payment timed out. If money was deducted it will be refunded automatically.');
      }, CHECKOUT_TIMEOUT_MS);
      rzp.open();
    } catch {
      settle('failed', 'Could not open the payment window. Please try again.');
    }
  }, [amount, booking, bookingIdStr, isAdvance, onPaid, settle]);

  useEffect(() => {
    start();
    return () => {
      clearTimer();
      try { rzpRef.current?.close(); } catch { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const busy = phase === 'loading' || phase === 'checkout' || phase === 'verifying';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-ocean-600" />
            <span className="text-sm font-black text-slate-800">
              {isAdvance ? 'Advance payment' : 'Balance payment'}
            </span>
            {mode === 'test' && (
              <span className="text-[0.625rem] font-black uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                Test mode
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-slate-400 hover:text-slate-700 disabled:opacity-40 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* body */}
        <div className="px-6 py-8 text-center">
          {busy && (
            <>
              <Loader2 className="w-10 h-10 text-ocean-600 mx-auto animate-spin" />
              <p className="mt-4 text-sm font-bold text-slate-800">
                {phase === 'loading' && 'Setting up your payment…'}
                {phase === 'checkout' && 'Complete the payment in the Razorpay window'}
                {phase === 'verifying' && 'Verifying your payment…'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {phase === 'verifying'
                  ? 'Please don’t close this screen.'
                  : `Amount: ${rupee(amount)}`}
              </p>
            </>
          )}

          {phase === 'success' && (
            <>
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="mt-4 text-base font-black text-slate-900">Payment successful</p>
              <p className="mt-1 text-xs text-slate-500">
                {isAdvance ? 'Advance' : 'Balance'} of {rupee(amount)} received. A receipt has been emailed to you.
              </p>
            </>
          )}

          {phase === 'failed' && (
            <>
              <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <p className="mt-4 text-base font-black text-slate-900">Payment not completed</p>
              <p className="mt-1 text-xs text-slate-500 break-words">{message}</p>
              {errorCode && (
                <p className="mt-1 text-[0.625rem] font-mono uppercase tracking-wider text-slate-400">
                  {errorCode}
                </p>
              )}
            </>
          )}

          {phase === 'cancelled' && (
            <>
              <XCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="mt-4 text-base font-black text-slate-900">Payment cancelled</p>
              <p className="mt-1 text-xs text-slate-500">{message}</p>
            </>
          )}

          {phase === 'timeout' && (
            <>
              <Clock className="w-12 h-12 text-amber-500 mx-auto" />
              <p className="mt-4 text-base font-black text-slate-900">Payment timed out</p>
              <p className="mt-1 text-xs text-slate-500">{message}</p>
            </>
          )}
        </div>

        {/* footer */}
        <div className="px-6 pb-6 space-y-2">
          {(phase === 'failed' || phase === 'timeout' || phase === 'cancelled') && (
            <button
              type="button"
              onClick={start}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-ocean-600 to-cyan-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
          )}
          {phase === 'success' ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider active:scale-[0.98] transition"
            >
              Done
            </button>
          ) : (
            !busy && (
              <button
                type="button"
                onClick={onClose}
                className="w-full h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider transition"
              >
                Close
              </button>
            )
          )}
          <p className="pt-1 flex items-center justify-center gap-1 text-[0.625rem] text-slate-400">
            <ShieldCheck className="w-3 h-3" /> Secured by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
};
