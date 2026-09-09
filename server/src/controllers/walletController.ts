import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { WalletTransaction } from '../models/WalletTransaction.js';
import { Booking } from '../models/Booking.js';
import { AuthRequest } from '../middleware/auth.js';
import { emitDataUpdate } from '../config/socketEvents.js';
import { createNotification } from '../services/notificationService.js';

/**
 * @route GET /api/v1/wallet/my
 * @desc Get user wallet balance and transaction history
 */
export const getUserWallet = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const emailQuery = (req.query.email || '').toString().trim().toLowerCase();
    const resolvedEmail = authReq.user?.email || emailQuery;

    if (!resolvedEmail) {
      return res.status(400).json({ success: false, message: 'User email is required to view wallet' });
    }

    const user = await User.findOne({ email: resolvedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    const transactions = await WalletTransaction.find({
      $or: [{ user: user._id }, { email: resolvedEmail }]
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        balance: user.walletBalance || 0,
        transactions
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route POST /api/v1/wallet/withdraw
 * @desc Request wallet balance withdrawal to UPI / Bank Account
 */
export const requestWithdrawal = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { amount, upiId, bankName, accountNumber, ifscCode, holderName, email } = req.body;

    const resolvedEmail = authReq.user?.email || (email || '').toString().trim().toLowerCase();
    if (!resolvedEmail) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid withdrawal amount is required' });
    }

    const user = await User.findOne({ email: resolvedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    const currentBalance = user.walletBalance || 0;
    if (numAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Available: ₹${currentBalance.toLocaleString()}`
      });
    }

    const newBalance = currentBalance - numAmount;
    user.walletBalance = newBalance;
    await user.save();

    const payoutInfo = {
      upiId: upiId || '',
      bankName: bankName || '',
      accountNumber: accountNumber || '',
      ifscCode: ifscCode || '',
      holderName: holderName || ''
    };

    const transaction = await WalletTransaction.create({
      user: user._id,
      email: resolvedEmail,
      type: 'withdrawal',
      amount: numAmount,
      balanceAfter: newBalance,
      description: `Withdrawal request to ${upiId || bankName || 'Bank/UPI'}`,
      reason: `Payout to ${holderName || resolvedEmail}`,
      status: 'completed',
      payoutDetails: payoutInfo
    });

    emitDataUpdate('Wallet', { userId: user._id, email: resolvedEmail, balance: newBalance }, 'general_updates');

    // 🔔 Dispatch in-app & mobile push notification for withdrawal request
    createNotification({
      type: 'payment',
      title: `💸 Wallet Withdrawal: ₹${numAmount.toLocaleString()}`,
      message: `Your withdrawal of ₹${numAmount.toLocaleString()} to ${upiId || bankName || 'Bank/UPI'} has been processed successfully.`,
      entityId: transaction._id ? transaction._id.toString() : user._id.toString(),
      userEmail: resolvedEmail,
      link: '/wallet',
      metadata: {
        amount: numAmount,
        payoutDetails: payoutInfo
      }
    }).catch(err => console.error('Failed to send withdrawal notification:', err));

    return res.status(200).json({
      success: true,
      message: `Withdrawal of ₹${numAmount.toLocaleString()} processed successfully!`,
      data: {
        newBalance,
        transaction
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route POST /api/v1/wallet/apply
 * @desc Apply wallet balance towards booking payment
 */
export const applyWalletPayment = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { bookingId, amountToUse, email, isAdvancePayment } = req.body;

    const resolvedEmail = authReq.user?.email || (email || '').toString().trim().toLowerCase();
    if (!resolvedEmail) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }

    const numAmount = Number(amountToUse);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid wallet amount is required' });
    }

    const user = await User.findOne({ email: resolvedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    const currentBalance = user.walletBalance || 0;
    if (numAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Available: ₹${currentBalance.toLocaleString()}`
      });
    }

    const isValidObjectId = (str: string) =>
      typeof str === 'string' && str.length === 24 && /^[0-9a-fA-F]{24}$/.test(str) && mongoose.Types.ObjectId.isValid(str);

    let booking = isValidObjectId(bookingId)
      ? await Booking.findById(bookingId)
      : await Booking.findOne({ bookingId });

    if (!booking || booking.isDeleted) {
      return res.status(404).json({ success: false, message: 'Booking record not found' });
    }

    // Deduct wallet balance
    const newBalance = currentBalance - numAmount;
    user.walletBalance = newBalance;
    await user.save();

    booking.walletAmountUsed = (booking.walletAmountUsed || 0) + numAmount;
    booking.paymentMethod = 'Wallet Balance';
    booking.transactionId = `WLT-PAY-${Date.now().toString().slice(-6)}`;

    const totalPaidSoFar = (booking.advancePaid ? booking.advanceAmount : 0) + numAmount;
    if (totalPaidSoFar >= booking.totalPrice || isAdvancePayment === false) {
      booking.paymentStatus = 'Full Paid';
      booking.advancePaid = true;
      booking.remainingBalance = 0;
    } else {
      booking.paymentStatus = 'Advance Paid';
      booking.advancePaid = true;
      booking.remainingBalance = Math.max(0, booking.totalPrice - booking.advanceAmount - booking.walletAmountUsed);
    }

    await booking.save();

    const transaction = await WalletTransaction.create({
      user: user._id,
      email: resolvedEmail,
      type: 'debit',
      amount: numAmount,
      balanceAfter: newBalance,
      description: `Payment for booking #${booking.bookingId}`,
      bookingId: booking.bookingId,
      status: 'completed'
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('destination', 'name slug banner')
      .populate('package', 'title slug packageCode startingPrice duration images');

    emitDataUpdate('Booking', populatedBooking, 'general_updates');
    emitDataUpdate('Wallet', { userId: user._id, email: resolvedEmail, balance: newBalance }, 'general_updates');

    return res.status(200).json({
      success: true,
      message: `Applied ₹${numAmount.toLocaleString()} from Wallet successfully!`,
      data: {
        newBalance,
        booking: populatedBooking,
        transaction
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
