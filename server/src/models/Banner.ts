import { Schema, model } from 'mongoose';
import './Destination.js';

const bannerSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    destination: { type: Schema.Types.ObjectId, ref: 'Destination', default: null, index: true },
    linkUrl: { type: String, default: '' },
    offerText: { type: String, default: 'Limited Offer' },
    priceText: { type: String, default: '₹8,500 Per Person' },
    durationText: { type: String, default: '03 Night / 04 Days' },
    targetSection: {
      type: String,
      enum: ['HomeBanner', 'OfferCard', 'DestinationBanner', 'HeroBanner'],
      default: 'OfferCard',
      index: true
    },
    active: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export const Banner = model('Banner', bannerSchema);
