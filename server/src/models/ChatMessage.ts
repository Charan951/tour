import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  topicId: string; // e.g. "BK-2026-1004" or "HC-2026-1001" or "USER-email@gmail.com"
  topicType: 'Booking' | 'Enquiry' | 'General';
  topicTitle?: string; // Package or Destination title
  senderType: 'User' | 'Admin';
  senderId?: string;
  senderName: string;
  senderEmail: string;
  message: string;
  attachments?: string[];
  isReadByAdmin: boolean;
  isReadByUser: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema: Schema = new Schema(
  {
    topicId: { type: String, required: true, index: true },
    topicType: { type: String, default: 'General' },
    topicTitle: { type: String, default: '' },
    senderType: { type: String, enum: ['User', 'Admin'], required: true },
    senderId: { type: String, default: '' },
    senderName: { type: String, required: true, trim: true },
    senderEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    message: { type: String, required: true, trim: true },
    attachments: [{ type: String }],
    isReadByAdmin: { type: Boolean, default: false },
    isReadByUser: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
