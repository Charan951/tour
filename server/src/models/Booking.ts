import { Schema, model } from 'mongoose';

const bookingNoteSchema = new Schema({
  note: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const bookingSchema = new Schema(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    package: { type: Schema.Types.ObjectId, ref: 'Package', default: null, index: true },
    destination: { type: Schema.Types.ObjectId, ref: 'Destination', default: null },

    packageName: { type: String, required: true, trim: true },
    packageCode: { type: String, default: '' },
    destinationName: { type: String, default: '' },

    customerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, index: true },
    mobile: { type: String, required: true, index: true },

    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      fullAddress: { type: String, default: '' }
    },

    travelDate: { type: Date, required: true },
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    pricingTier: { type: String, default: 'Standard' },

    totalPrice: { type: Number, required: true },
    advanceAmount: { type: Number, required: true, default: 0 },
    advancePaid: { type: Boolean, default: false, index: true },
    remainingBalance: { type: Number, default: 0 },

    paymentStatus: {
      type: String,
      enum: ['Pending Advance', 'Advance Paid', 'Full Paid', 'Refunded', 'Failed'],
      default: 'Pending Advance',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['UPI / Online', 'Bank Transfer', 'Card', 'Cash', 'Other'],
      default: 'UPI / Online'
    },
    transactionId: { type: String, default: '' },
    paymentDetails: {
      upiId: { type: String, default: '' },
      cardLast4: { type: String, default: '' },
      cardHolder: { type: String, default: '' },
      cardExpiry: { type: String, default: '' },
      bankName: { type: String, default: '' }
    },
    specialRequests: { type: String, default: '' },

    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
      default: 'Pending',
      index: true
    },

    notes: [bookingNoteSchema],
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export const Booking = model('Booking', bookingSchema);
