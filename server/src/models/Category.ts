import { Schema, model } from 'mongoose';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    icon: { type: String, default: '⚡' },
    description: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    type: { type: String, enum: ['activity', 'package', 'both'], default: 'activity', index: true },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export const Category = model('Category', categorySchema);
