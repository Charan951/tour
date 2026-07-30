export type UserRoleName = 'Super Admin' | 'Admin' | 'Sales Executive' | 'Content Manager' | 'Marketing Executive';
export type LeadStatus = 'New' | 'Contacted' | 'FollowupPending' | 'QuotationSent' | 'Negotiation' | 'Confirmed' | 'Cancelled' | 'Lost' | 'Completed';
export type LeadPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type HotelStarRating = 3 | 4 | 5;
export type PricingCategory = 'Standard' | 'Deluxe' | 'Premium' | 'Luxury';

export interface IBaseAudit {
  _id?: string;
  createdBy?: string;
  updatedBy?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUser extends IBaseAudit {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: string | IRole;
  department?: string;
  avatar?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin?: string;
}

export interface IRole extends IBaseAudit {
  name: UserRoleName;
  description?: string;
  permissions: string[] | IPermission[];
  isSystemRole?: boolean;
}

export interface IPermission {
  _id?: string;
  module: string;
  action: 'View' | 'Create' | 'Edit' | 'Delete' | 'Publish' | 'Export';
  description?: string;
}

export interface IEnquiryNote {
  _id?: string;
  note: string;
  createdBy: string;
  createdAt?: string;
}

export interface IEnquiry extends IBaseAudit {
  enquiryId: string;
  fullName: string;
  email: string;
  mobile: string;
  destination?: string | IDestination;
  package?: string | IPackage;
  travelDate?: string;
  adults: number;
  children: number;
  budget?: number;
  travelType?: 'Solo' | 'Couple' | 'Family' | 'Friends' | 'Corporate';
  message?: string;
  source: 'PackagePage' | 'DestinationPage' | 'ContactForm' | 'WhatsApp' | 'CallRequest' | 'PopupModal';
  status: LeadStatus;
  assignedTo?: string | IUser;
  priority: LeadPriority;
  followupDate?: string;
  notes?: IEnquiryNote[];
}

export interface ICustomer extends IBaseAudit {
  enquiry: string | IEnquiry;
  customerCode: string;
  fullName: string;
  email: string;
  mobile: string;
  dob?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  passportNumber?: string;
  preferredDestinations?: string[];
  notes?: string;
}

export interface IDestinationAttraction {
  name: string;
  description: string;
  image?: string;
}

export interface IDestinationFAQ {
  question: string;
  answer: string;
}

export interface IDestination extends IBaseAudit {
  country: string | ICountry;
  state: string | IState;
  city?: string | ICity;
  name: string;
  slug: string;
  banner: string;
  gallery?: string[];
  shortDescription?: string;
  overview?: string;
  bestTime?: string;
  weather?: string;
  food?: string;
  shopping?: string;
  travelTips?: string;
  activities?: string[];
  attractions?: IDestinationAttraction[];
  faq?: IDestinationFAQ[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  featured?: boolean;
  status: 'Active' | 'Inactive';
}

export interface IContinent {
  _id?: string;
  name: string;
  slug: string;
  image?: string;
  displayOrder?: number;
  status?: 'Active' | 'Inactive';
}

export interface ICountry {
  _id?: string;
  continent: string | IContinent;
  name: string;
  slug: string;
  image?: string;
  isoCode: string;
  currency?: string;
  timezone?: string;
  status?: 'Active' | 'Inactive';
}

export interface IState {
  _id?: string;
  country: string | ICountry;
  name: string;
  slug: string;
  image?: string;
}

export interface ICity {
  _id?: string;
  state: string | IState;
  name: string;
  slug: string;
  image?: string;
}

export interface ITravelTheme {
  _id?: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  banner?: string;
}

export interface IPackageCategory {
  _id?: string;
  name: string;
  slug: string;
  icon?: string;
  banner?: string;
}

export interface IItineraryDay {
  day: number;
  title: string;
  description: string;
  hotel?: string;
  meal?: ('Breakfast' | 'Lunch' | 'Dinner')[];
  activities?: string[];
}

export interface IPackageHotel {
  name: string;
  rating: HotelStarRating;
  roomType?: string;
  amenities?: string[];
  images?: string[];
}

export interface IPackagePricingTier {
  category: PricingCategory;
  price: number;
  discount?: number;
  hotel?: string;
  meal?: string;
  transport?: string;
  availability?: boolean;
}

export interface IPackage extends IBaseAudit {
  packageCode: string;
  title: string;
  slug: string;
  destination: string | IDestination;
  category?: (string | IPackageCategory)[];
  theme?: (string | ITravelTheme)[];
  duration: {
    nights: number;
    days: number;
  };
  startingPrice: number;
  discountPrice?: number;
  coverImage: string;
  gallery?: string[];
  rating?: number;
  overview?: string;
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  itinerary?: IItineraryDay[];
  hotels?: IPackageHotel[];
  pricingTiers?: IPackagePricingTier[];
  transport?: string;
  meals?: string;
  activities?: string[];
  pickup?: string;
  drop?: string;
  featured?: boolean;
  trending?: boolean;
  popular?: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  status: 'Active' | 'Draft' | 'Inactive';
}

export interface IBlog extends IBaseAudit {
  title: string;
  slug: string;
  category: string;
  author: string;
  banner: string;
  content: string;
  tags?: string[];
  views?: number;
  featured?: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  status: 'Draft' | 'Published';
}

export interface ITestimonial extends IBaseAudit {
  customerName: string;
  customerPhoto?: string;
  destination?: string | IDestination;
  rating: number;
  review: string;
  videoUrl?: string;
  featured?: boolean;
}

export interface IFAQ {
  _id?: string;
  category: 'General' | 'Booking' | 'Visa' | 'Payment' | 'Cancellation';
  question: string;
  answer: string;
  displayOrder?: number;
  active?: boolean;
}

export interface INewsletter {
  _id?: string;
  email: string;
  subscribedAt?: string;
}

export interface IContactMessage extends IBaseAudit {
  name: string;
  email: string;
  phone: string;
  subject?: string;
  message: string;
  status: 'New' | 'Read' | 'Replied';
  assignedTo?: string;
}

export interface ISetting {
  _id?: string;
  companyName: string;
  logo?: string;
  favicon?: string;
  emails?: {
    primary?: string;
    support?: string;
  };
  phones?: {
    primary?: string;
    whatsapp?: string;
  };
  address?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  };
  smtp?: {
    host?: string;
    port?: number;
    user?: string;
    secure?: boolean;
  };
  seoDefaults?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
  maintenanceMode?: boolean;
}

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: { field: string; message: string }[];
}
