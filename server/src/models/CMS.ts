import { Schema, model } from 'mongoose';

const blogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    author: { type: String, default: 'HolidayCity Editorial' },
    banner: { type: String, required: true },
    content: { type: String, required: true },
    tags: [{ type: String }],
    views: { type: Number, default: 0 },
    featured: { type: Boolean, default: false, index: true },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String]
    },
    status: { type: String, enum: ['Draft', 'Published'], default: 'Published' },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export const Blog = model('Blog', blogSchema);

const testimonialSchema = new Schema(
  {
    customerName: { type: String, required: true },
    customerPhoto: { type: String, default: '' },
    destination: { type: Schema.Types.ObjectId, ref: 'Destination', default: null },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    review: { type: String, required: true },
    videoUrl: { type: String, default: null },
    featured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Testimonial = model('Testimonial', testimonialSchema);

const faqSchema = new Schema(
  {
    category: { 
      type: String, 
      enum: ['General', 'Booking', 'Visa', 'Payment', 'Cancellation'], 
      default: 'General' 
    },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const FAQ = model('FAQ', faqSchema);

const newsletterSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  subscribedAt: { type: Date, default: Date.now }
});

export const Newsletter = model('Newsletter', newsletterSchema);

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    subject: { type: String, default: '' },
    message: { type: String, required: true },
    status: { type: String, enum: ['New', 'Read', 'Replied'], default: 'New' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const ContactMessage = model('ContactMessage', contactMessageSchema);

const settingSchema = new Schema(
  {
    companyName: { type: String, default: 'HolidayCity' },
    logo: { type: String, default: '' },
    favicon: { type: String, default: '' },
    emails: {
      primary: { type: String, default: 'info@holidaycity.com' },
      support: { type: String, default: 'support@holidaycity.com' }
    },
    phones: {
      primary: { type: String, default: '+91 98765 43210' },
      whatsapp: { type: String, default: '+91 98765 43210' }
    },
    address: { type: String, default: 'HolidayCity Headquarters, MG Road, Kochi, Kerala, India' },
    socialLinks: {
      facebook: String,
      instagram: String,
      youtube: String,
      linkedin: String
    },
    smtp: {
      host: String,
      port: Number,
      user: String,
      secure: Boolean
    },
    seoDefaults: {
      metaTitle: { type: String, default: 'HolidayCity | Explore. Experience. Enjoy.' },
      metaDescription: { type: String, default: 'Discover domestic and international holiday packages with HolidayCity.' }
    },
    theme: {
      primaryColor: { type: String, default: '#0A6FB5' },
      secondaryColor: { type: String, default: '#58B8E8' }
    },
    maintenanceMode: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Setting = model('Setting', settingSchema);

const activityLogSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, default: '' },
  module: { type: String, required: true },
  action: { type: String, required: true },
  recordId: { type: Schema.Types.ObjectId, default: null },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now, index: true }
});

export const ActivityLog = model('ActivityLog', activityLogSchema);

const customerSchema = new Schema(
  {
    enquiry: { type: Schema.Types.ObjectId, ref: 'Enquiry', required: true },
    customerCode: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    mobile: { type: String, required: true },
    dob: { type: Date },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    passportNumber: { type: String, default: null },
    preferredDestinations: [{ type: Schema.Types.ObjectId, ref: 'Destination' }],
    notes: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Customer = model('Customer', customerSchema);
