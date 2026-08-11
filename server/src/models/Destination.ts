import { Schema, model } from 'mongoose';

const attractionSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' }
});

const faqSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

const destinationSchema = new Schema(
  {
    country: { type: Schema.Types.ObjectId, ref: 'Country', default: null },
    state: { type: Schema.Types.ObjectId, ref: 'State', default: null },

    city: { type: Schema.Types.ObjectId, ref: 'City', default: null },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    banner: { type: String, required: true },
    gallery: [{ type: String }],
    shortDescription: { type: String, default: '' },
    overview: { type: String, default: '' },
    bestTime: { type: String, default: '' },
    weather: { type: String, default: '' },
    food: { type: String, default: '' },
    shopping: { type: String, default: '' },
    travelTips: { type: String, default: '' },
    activities: [{ type: String }],
    attractions: [attractionSchema],
    faq: [faqSchema],
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String]
    },
    featured: { type: Boolean, default: false, index: true },
    isDomestic: { type: Boolean, default: true, index: true },
    category: { type: String, enum: ['Domestic', 'International'], default: 'Domestic', index: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export const Destination = model('Destination', destinationSchema);

const continentSchema = new Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String, default: '' },
  displayOrder: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
});

export const Continent = model('Continent', continentSchema);

const countrySchema = new Schema({
  continent: { type: Schema.Types.ObjectId, ref: 'Continent' },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  image: { type: String, default: '' },
  isoCode: { type: String, uppercase: true, default: 'IN' },
  currency: { type: String, default: 'INR' },
  timezone: { type: String, default: 'IST' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
});

export const Country = model('Country', countrySchema);

const stateSchema = new Schema({
  country: { type: Schema.Types.ObjectId, ref: 'Country', required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  image: { type: String, default: '' }
});

export const State = model('State', stateSchema);

const citySchema = new Schema({
  state: { type: Schema.Types.ObjectId, ref: 'State', required: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, index: true },
  image: { type: String, default: '' }
});

export const City = model('City', citySchema);
