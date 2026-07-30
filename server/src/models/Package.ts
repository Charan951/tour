import { Schema, model } from 'mongoose';
import './Destination.js';

const itinerarySchema = new Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  hotel: { type: String, default: '' },
  meal: [{ type: String, enum: ['Breakfast', 'Lunch', 'Dinner'] }],
  activities: [{ type: String }]
});

const packageHotelSchema = new Schema({
  name: { type: String, required: true },
  rating: { type: Number, enum: [3, 4, 5], required: true },
  roomType: { type: String, default: 'Deluxe Room' },
  amenities: [{ type: String }],
  images: [{ type: String }]
});

const pricingTierSchema = new Schema({
  category: { type: String, enum: ['Standard', 'Deluxe', 'Premium', 'Luxury'], required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  hotel: { type: String, default: '' },
  meal: { type: String, default: 'Breakfast Included' },
  transport: { type: String, default: 'Private Transfer' },
  availability: { type: Boolean, default: true }
});

const packageSchema = new Schema(
  {
    packageCode: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    destination: { type: Schema.Types.ObjectId, ref: 'Destination', required: true, index: true },
    category: [{ type: Schema.Types.ObjectId, ref: 'PackageCategory' }],
    theme: [{ type: Schema.Types.ObjectId, ref: 'TravelTheme', index: true }],
    themeName: { 
      type: String, 
      enum: ['Honeymoon Tour', 'Leisure', 'Hill Station', 'Trekking', 'Adventure', 'Religious', 'Family Tour', 'Wildlife Safari'], 
      default: 'Leisure',
      index: true 
    },
    duration: {
      nights: { type: Number, required: true },
      days: { type: Number, required: true }
    },
    startingPrice: { type: Number, required: true, index: true },
    discountPrice: { type: Number, default: null },
    coverImage: { type: String, required: true },
    gallery: [{ type: String }],
    rating: { type: Number, default: 4.8 },
    overview: { type: String, default: '' },
    highlights: [{ type: String }],
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    itinerary: [itinerarySchema],
    hotels: [packageHotelSchema],
    pricingTiers: [pricingTierSchema],
    transport: { type: String, default: 'AC Private Cab' },
    meals: { type: String, default: 'Daily Breakfast' },
    activities: [{ type: String }],
    pickup: { type: String, default: 'Airport / Railway Station' },
    drop: { type: String, default: 'Airport / Railway Station' },
    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false, index: true },
    popular: { type: Boolean, default: false },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String]
    },
    status: { type: String, enum: ['Active', 'Draft', 'Inactive'], default: 'Active', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export const Package = model('Package', packageSchema);

const categorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String, default: '' },
  banner: { type: String, default: '' }
});

export const PackageCategory = model('PackageCategory', categorySchema);

const themeSchema = new Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, index: true },
  icon: { type: String, default: '' },
  description: { type: String, default: '' },
  banner: { type: String, default: '' }
});

export const TravelTheme = model('TravelTheme', themeSchema);
