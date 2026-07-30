import { Schema, model } from 'mongoose';

const enquiryNoteSchema = new Schema({
  note: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const enquirySchema = new Schema(
  {
    enquiryId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, index: true },
    mobile: { type: String, required: true, index: true },
    destination: { type: Schema.Types.ObjectId, ref: 'Destination', default: null },
    package: { type: Schema.Types.ObjectId, ref: 'Package', default: null },
    travelDate: { type: Date, default: null },
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    budget: { type: Number, default: null },
    travelType: { type: String, enum: ['Solo', 'Couple', 'Family', 'Friends', 'Corporate'], default: 'Family' },
    message: { type: String, default: '' },
    source: { 
      type: String, 
      enum: ['PackagePage', 'DestinationPage', 'ContactForm', 'WhatsApp', 'CallRequest', 'PopupModal'], 
      default: 'PackagePage' 
    },
    status: { 
      type: String, 
      enum: ['New', 'Contacted', 'FollowupPending', 'QuotationSent', 'Negotiation', 'Confirmed', 'Cancelled', 'Lost', 'Completed'], 
      default: 'New', 
      index: true 
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    followupDate: { type: Date, default: null },
    notes: [enquiryNoteSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export const Enquiry = model('Enquiry', enquirySchema);
