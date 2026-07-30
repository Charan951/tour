import { Schema, model } from 'mongoose';

const themeBannerSchema = new Schema(
  {
    themeName: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String, required: true },
    description: { type: String, default: '' },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const ThemeBanner = model('ThemeBanner', themeBannerSchema);
