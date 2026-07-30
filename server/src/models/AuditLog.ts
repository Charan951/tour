import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  user?: mongoose.Types.ObjectId;
  userEmail?: string;
  module: string;
  action: string;
  recordId?: mongoose.Types.ObjectId | string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String, trim: true },
    module: { type: String, required: true },
    action: { type: String, required: true },
    recordId: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    details: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
