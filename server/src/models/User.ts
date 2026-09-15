import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import './Role.js';

export interface IUserDocument extends Document {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password?: string;
  role: any;
  department: string;
  avatar?: string;
  city?: string;
  preferences?: { language: string; currency: string };
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin?: Date;
  failedAttempts: number;
  accountLockedUntil?: Date;
  createdBy?: any;
  updatedBy?: any;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: any;
  walletBalance?: number;
  fcmTokens?: string[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordResetOtp?: string;
  passwordResetOtpExpires?: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: false, trim: true, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    mobile: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    department: { type: String, enum: ['Sales', 'Content', 'Marketing', 'Management', 'IT'], default: 'Sales' },
    avatar: { type: String, default: null },
    city: { type: String, default: '', trim: true },
    preferences: {
      language: { type: String, default: 'English' },
      currency: { type: String, default: 'INR' },
    },
    walletBalance: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' },
    lastLogin: { type: Date, default: null },
    failedAttempts: { type: Number, default: 0 },
    accountLockedUntil: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    fcmTokens: { type: [String], default: [] },
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
    passwordResetOtp: { type: String, default: null, select: false },
    passwordResetOtpExpires: { type: Date, default: null, select: false }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password!, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = model<IUserDocument>('User', userSchema);
