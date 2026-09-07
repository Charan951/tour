import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  type: 'enquiry' | 'booking' | 'payment' | 'chat' | 'system' | 'package' | 'destination';
  title: string;
  message: string;
  entityId?: string;
  status?: string;
  link?: string;
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  isDeleted: boolean;
  // User-scoped field: if set, this notification belongs to a specific user
  userEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ['enquiry', 'booking', 'payment', 'chat', 'system', 'package', 'destination'],
      default: 'system'
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    entityId: { type: String },
    status: { type: String },
    link: { type: String, default: '/admin/leads' },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
    isDeleted: { type: Boolean, default: false, index: true },
    // If userEmail is set, it's a user-specific notification; null = admin notification
    userEmail: { type: String, index: true, default: null }
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
