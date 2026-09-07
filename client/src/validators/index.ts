import { z } from 'zod';

export const enquirySchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  mobile: z.string().regex(/^[0-9+\-\s()]{7,15}$/, 'Please enter a valid phone number'),
  destination: z.string().optional(),
  package: z.string().optional(),
  activity: z.string().optional(),
  activityTitle: z.string().optional(),
  enquiryType: z.enum(['package', 'activity', 'general', 'custom_quote']).optional(),
  travelDate: z.string().optional(),
  adults: z.number().min(1, 'At least 1 adult traveler required').default(1),
  children: z.number().min(0).default(0),
  budget: z.number().optional(),
  travelType: z.enum(['Solo', 'Couple', 'Family', 'Friends', 'Corporate']).optional(),
  message: z.string().max(1000, 'Message cannot exceed 1000 characters').optional(),
  source: z.string().optional().default('PackagePage')
});

export const bookingSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  email: z.string().email('Please enter a valid email address'),
  mobile: z.string().regex(/^[0-9+\-\s()]{7,15}$/, 'Please enter a valid phone number'),
  bookingType: z.enum(['package', 'activity']).default('package'),
  package: z.string().optional(),
  activity: z.string().optional(),
  destination: z.string().optional(),
  travelDate: z.string().min(1, 'Travel date is required'),
  adults: z.number().min(1, 'At least 1 adult traveler required').default(1),
  children: z.number().min(0).default(0),
  pricingTier: z.string().default('Standard'),
  specialRequests: z.string().max(1000).optional()
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
