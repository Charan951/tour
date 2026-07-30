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
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin?: Date;
  failedAttempts: number;
  accountLockedUntil?: Date;
  createdBy?: any;
  updatedBy?: any;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: any;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    mobile: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    department: { type: String, enum: ['Sales', 'Content', 'Marketing', 'Management', 'IT'], default: 'Sales' },
    avatar: { type: String, default: null },
    status: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' },
    lastLogin: { type: Date, default: null },
    failedAttempts: { type: Number, default: 0 },
    accountLockedUntil: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
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
