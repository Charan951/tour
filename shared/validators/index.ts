import { z } from 'zod';

export const enquirySchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  mobile: z.string().regex(/^[0-9+\-\s()]{7,15}$/, 'Please enter a valid phone number'),
  destination: z.string().optional(),
  package: z.string().optional(),
  travelDate: z.string().optional(),
  adults: z.number().min(1, 'At least 1 adult traveler required').default(1),
  children: z.number().min(0).default(0),
  budget: z.number().optional(),
  travelType: z.enum(['Solo', 'Couple', 'Family', 'Friends', 'Corporate']).optional(),
  message: z.string().max(1000, 'Message cannot exceed 1000 characters').optional(),
  source: z.enum(['PackagePage', 'DestinationPage', 'ContactForm', 'WhatsApp', 'CallRequest', 'PopupModal']).default('PackagePage')
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Invalid phone number'),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters')
});

export const newsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

export const packageSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  slug: z.string().optional(),
  destination: z.string().min(1, 'Destination is required'),
  duration: z.object({
    nights: z.number().min(1),
    days: z.number().min(1)
  }),
  startingPrice: z.number().min(0, 'Starting price must be positive'),
  discountPrice: z.number().optional(),
  coverImage: z.string().min(1, 'Cover image is required'),
  gallery: z.array(z.string()).optional(),
  overview: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  inclusions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  featured: z.boolean().default(false),
  trending: z.boolean().default(false),
  popular: z.boolean().default(false),
  status: z.enum(['Active', 'Draft', 'Inactive']).default('Active')
});

export const destinationSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().optional(),
  name: z.string().min(2, 'Destination name is required'),
  slug: z.string().optional(),
  banner: z.string().min(1, 'Banner image is required'),
  shortDescription: z.string().optional(),
  overview: z.string().optional(),
  bestTime: z.string().optional(),
  featured: z.boolean().default(false),
  status: z.enum(['Active', 'Inactive']).default('Active')
});
