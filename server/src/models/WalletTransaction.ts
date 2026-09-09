import { Schema, model, Document } from 'mongoose';

export interface IWalletTransactionDocument extends Document {
  user: any;
  email: string;
  type: 'credit' | 'debit' | 'withdrawal';
  amount: number;
  balanceAfter: number;
  description: string;
  reason?: string;
  bookingId?: string;
  status: 'completed' | 'pending' | 'rejected' | 'failed';
  payoutDetails?: {
    upiId?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    holderName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransactionDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, lowercase: true, index: true },
    type: { type: String, enum: ['credit', 'debit', 'withdrawal'], required: true, index: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true, default: 0 },
    description: { type: String, required: true, trim: true },
    reason: { type: String, default: '', trim: true },
    bookingId: { type: String, default: '' },
    status: { type: String, enum: ['completed', 'pending', 'rejected', 'failed'], default: 'completed', index: true },
    payoutDetails: {
      upiId: { type: String, default: '' },
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      holderName: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

export const WalletTransaction = model<IWalletTransactionDocument>('WalletTransaction', walletTransactionSchema);
