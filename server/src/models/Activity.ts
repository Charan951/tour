import { Schema, model } from 'mongoose';
import './Destination.js';

const activitySchema = new Schema(
  {
    activityCode: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    destination: { type: Schema.Types.ObjectId, ref: 'Destination', default: null, index: true },
    destinationName: { type: String, default: '' },
    category: {
      type: String,
      default: 'Adventure',
      index: true
    },
    duration: { type: String, required: true, default: '2 Hours' },
    startingPrice: { type: Number, required: true, index: true },
    discountPrice: { type: Number, default: null },
    coverImage: { type: String, required: true },
    gallery: [{ type: String }],
    rating: { type: Number, default: 4.8 },
    overview: { type: String, default: '' },
    highlights: [{ type: String }],
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    location: { type: String, default: '' },
    featured: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['Active', 'Draft', 'Inactive'], default: 'Active', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export const Activity = model('Activity', activitySchema);
