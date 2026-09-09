import { Schema, model, Document } from 'mongoose';

export interface IDeviceTokenDocument extends Document {
  token: string;
  email?: string;
  mobile?: string;
  platform?: string;
  isAdmin?: boolean;
  lastActive: Date;
}

const deviceTokenSchema = new Schema<IDeviceTokenDocument>(
  {
    token: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: null, lowercase: true, trim: true, index: true },
    mobile: { type: String, default: null, trim: true, index: true },
    platform: { type: String, default: 'android' },
    isAdmin: { type: Boolean, default: false, index: true },
    lastActive: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const DeviceToken = model<IDeviceTokenDocument>('DeviceToken', deviceTokenSchema);
