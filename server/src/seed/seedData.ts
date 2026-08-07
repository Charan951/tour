import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { Continent, Country, State, Destination } from '../models/Destination.js';
import { Package, TravelTheme, PackageCategory } from '../models/Package.js';
import { Blog, Testimonial, FAQ, Setting } from '../models/CMS.js';

dotenv.config();

// Fix Node.js DNS resolution issues on Windows/ISPs for MongoDB SRV records
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const seed = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/holidaycity';
    await mongoose.connect(connStr);
    console.log('[Seed] Connected to MongoDB Atlas...');

    // 1. Roles
    await Role.deleteMany({});
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'Full Unrestricted System Access',
      isSystemRole: true
    });
    await Role.create({ name: 'Admin', description: 'Business & Operations Manager' });

    // 2. Default Super Admin
    await User.deleteMany({});
    await User.create({
      firstName: 'HolidayCity',
      lastName: 'Admin',
      email: 'admin@holidaycity.com',
      mobile: '+91 98765 43210',
      password: 'Holiday@2026',
      role: superAdminRole._id,
      department: 'Management',
      status: 'Active'
    });

    // 3. Continents & Countries
    await Continent.deleteMany({});
    await Country.deleteMany({});
    await State.deleteMany({});
    await Destination.deleteMany({});

    const asia = await Continent.create({ name: 'Asia', slug: 'asia', displayOrder: 1 });
    
    const india = await Country.create({ continent: asia._id, name: 'India', slug: 'india', isoCode: 'IN', currency: 'INR' });
    const indonesia = await Country.create({ continent: asia._id, name: 'Indonesia', slug: 'indonesia', isoCode: 'ID', currency: 'IDR' });
    const uae = await Country.create({ continent: asia._id, name: 'United Arab Emirates', slug: 'uae', isoCode: 'AE', currency: 'AED' });
    const vietnam = await Country.create({ continent: asia._id, name: 'Vietnam', slug: 'vietnam', isoCode: 'VN', currency: 'VND' });
    const maldives = await Country.create({ continent: asia._id, name: 'Maldives', slug: 'maldives', isoCode: 'MV', currency: 'MVR' });
    const singapore = await Country.create({ continent: asia._id, name: 'Singapore', slug: 'singapore', isoCode: 'SG', currency: 'SGD' });

    // States
    const keralaState = await State.create({ country: india._id, name: 'Kerala', slug: 'kerala' });
    const kashmirState = await State.create({ country: india._id, name: 'Jammu & Kashmir', slug: 'kashmir' });
    const goaState = await State.create({ country: india._id, name: 'Goa', slug: 'goa' });
    const himachalState = await State.create({ country: india._id, name: 'Himachal Pradesh', slug: 'himachal' });
    const rajasthanState = await State.create({ country: india._id, name: 'Rajasthan', slug: 'rajasthan' });
    const agraState = await State.create({ country: india._id, name: 'Uttar Pradesh', slug: 'uttar-pradesh' });

    const baliState = await State.create({ country: indonesia._id, name: 'Bali', slug: 'bali-province' });
    const dubaiState = await State.create({ country: uae._id, name: 'Dubai', slug: 'dubai-emirate' });
    const vietnamState = await State.create({ country: vietnam._id, name: 'Da Nang & Hanoi', slug: 'vietnam-provinces' });
    const maldivesState = await State.create({ country: maldives._id, name: 'Male Atoll', slug: 'male-atoll' });
    const singaporeState = await State.create({ country: singapore._id, name: 'Marina Bay', slug: 'marina-bay' });

    // 4. Destinations
    const himachalDest = await Destination.create({
      country: india._id,
      state: himachalState._id,
      name: 'Himachal & Manali Peaks',
      slug: 'himachal',
      banner: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200&auto=format&fit=crop',
      shortDescription: 'Pine valleys, Solang valley snow adventure & Rohtang Pass.',
      bestTime: 'Oct - Jun',
      featured: true,
      status: 'Active'
    });

    const goaDest = await Destination.create({
      country: india._id,
      state: goaState._id,
      name: 'Goa Beaches & Nightlife',
      slug: 'goa',
      banner: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop',
      shortDescription: 'Golden sand beaches, water sports & Portuguese heritage villas.',
      bestTime: 'Nov - Feb',
      featured: true,
      status: 'Active'
    });

    const keralaDest = await Destination.create({
      country: india._id,
      state: keralaState._id,
      name: 'Kerala Backwaters & Munnar',
      slug: 'kerala',
      banner: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop',
      shortDescription: 'God’s Own Country featuring tea gardens & luxury houseboats.',
      bestTime: 'Sep - Mar',
      featured: true,
      status: 'Active'
    });

    const kashmirDest = await Destination.create({
      country: india._id,
      state: kashmirState._id,
      name: 'Magical Kashmir Valley',
      slug: 'kashmir',
      banner: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=1200&auto=format&fit=crop',
      shortDescription: 'Paradise on Earth with snow-capped peaks & Dal Lake shikaras.',
      bestTime: 'Oct - May',
      featured: true,
      status: 'Active'
    });

    const tajDest = await Destination.create({
      country: india._id,
      state: agraState._id,
      name: 'Golden Triangle & Agra',
      slug: 'golden-triangle',
      banner: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1200&auto=format&fit=crop',
      shortDescription: 'Experience Taj Mahal, Jaipur Forts & Old Delhi monuments.',
      bestTime: 'Oct - Mar',
      featured: true,
      status: 'Active'
    });

    const rajasthanDest = await Destination.create({
      country: india._id,
      state: rajasthanState._id,
      name: 'Rajasthan Royal Forts',
      slug: 'rajasthan',
      banner: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=1200&auto=format&fit=crop',
      shortDescription: 'Royal palaces, desert sand dunes & cultural folk dances.',
      bestTime: 'Oct - Mar',
      featured: true,
      status: 'Active'
    });

    const baliDest = await Destination.create({
      country: indonesia._id,
      state: baliState._id,
      name: 'Bali Island Paradise',
      slug: 'bali',
      banner: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop',
      shortDescription: 'Tropical paradise known for private pool villas & Nusa Penida.',
      bestTime: 'Apr - Oct',
      featured: true,
      status: 'Active'
    });

    const dubaiDest = await Destination.create({
      country: uae._id,
      state: dubaiState._id,
      name: 'Dubai Futuristic Oasis',
      slug: 'dubai',
      banner: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop',
      shortDescription: 'Burj Khalifa skyline, luxury desert safari & theme parks.',
      bestTime: 'Nov - Mar',
      featured: true,
      status: 'Active'
    });

    const vietnamDest = await Destination.create({
      country: vietnam._id,
      state: vietnamState._id,
      name: 'Vietnam & Ha Long Bay',
      slug: 'vietnam',
      banner: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop',
      shortDescription: 'Emerald bay cruises, Golden Hand bridge & lantern cities.',
      bestTime: 'Sep - Apr',
      featured: true,
      status: 'Active'
    });

    const maldivesDest = await Destination.create({
      country: maldives._id,
      state: maldivesState._id,
      name: 'Maldives Overwater Bungalows',
      slug: 'maldives',
      banner: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=1200&auto=format&fit=crop',
      shortDescription: 'Turquoise lagoons, private island resorts & coral reefs.',
      bestTime: 'Nov - Apr',
      featured: true,
      status: 'Active'
    });

    const singaporeDest = await Destination.create({
      country: singapore._id,
      state: singaporeState._id,
      name: 'Singapore & Sentosa Island',
      slug: 'singapore',
      banner: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1200&auto=format&fit=crop',
      shortDescription: 'Gardens by the Bay, Universal Studios & luxury shopping.',
      bestTime: 'Year Round',
      featured: true,
      status: 'Active'
    });

    // 5. Packages
    await Package.deleteMany({});
    await PackageCategory.deleteMany({});
    const domesticCat = await PackageCategory.create({ name: 'Domestic Packages', slug: 'domestic' });
    const intlCat = await PackageCategory.create({ name: 'International Packages', slug: 'international' });

    // HIMACHAL PACKAGES
    await Package.create({
      packageCode: 'PKG-HIM-001',
      title: 'Scenic Manali & Solang Snow Adventure',
      slug: 'scenic-manali-solang-snow-adventure-5-days',
      destination: himachalDest._id,
      category: [domesticCat._id],
      duration: { nights: 4, days: 5 },
      startingPrice: 16500,
      discountPrice: 19500,
      coverImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200&auto=format&fit=crop',
      rating: 4.92,
      overview: 'Explore Hadimba Temple, Mall Road shopping, Solang Valley ATV rides & Rohtang snow point.',
      highlights: ['Solang Valley Snow Sports', 'Rohtang Pass Day Trip', 'Private Mountain View Resort'],
      inclusions: ['Breakfast & Dinner', 'Private Cab Sightseeing'],
      exclusions: ['Heater Charges', 'Personal Shopping'],
      featured: true,
      status: 'Active'
    });

    await Package.create({
      packageCode: 'PKG-HIM-002',
      title: 'Shimla & Manali Complete Hill Station Tour',
      slug: 'shimla-manali-complete-hill-tour-6-days',
      destination: himachalDest._id,
      category: [domesticCat._id],
      duration: { nights: 5, days: 6 },
      startingPrice: 21900,
      discountPrice: 25500,
      coverImage: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=1200&auto=format&fit=crop',
      rating: 4.88,
      overview: 'Experience Kufri horse riding, Shimla Mall Road, Kasol riverfront, and Manali pine forests.',
      highlights: ['Shimla Kufri Fun World', 'Kasol & Manikaran Sahib', 'Atal Tunnel Drive'],
      inclusions: ['MAP Breakfast & Dinner', 'Private Car Transfers'],
      exclusions: ['Flight Airfare'],
      featured: true,
      status: 'Active'
    });

    // GOA PACKAGES
    await Package.create({
      packageCode: 'PKG-GOA-001',
      title: 'Vibrant Goa Beach & Water Sports Getaway',
      slug: 'vibrant-goa-beach-getaway-4-days',
      destination: goaDest._id,
      category: [domesticCat._id],
      duration: { nights: 3, days: 4 },
      startingPrice: 12900,
      discountPrice: 15900,
      coverImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop',
      rating: 4.88,
      overview: 'Experience North and South Goa beach hopping, Mandovi river sunset cruise, and thrill water sports in Calangute.',
      highlights: ['4-Star Beach Resort Stay', 'Mandovi River Sunset Cruise', 'Parasailing & Jet Skiing Combo', 'Old Goa Churches'],
      inclusions: ['Daily Buffet Breakfast', 'Private AC Sedan Airport Transfer'],
      exclusions: ['Flight Airfare'],
      featured: true,
      status: 'Active'
    });

    await Package.create({
      packageCode: 'PKG-GOA-002',
      title: 'Luxury Goa Honeymoon & Pool Villa Retreat',
      slug: 'luxury-goa-honeymoon-villa-5-days',
      destination: goaDest._id,
      category: [domesticCat._id],
      duration: { nights: 4, days: 5 },
      startingPrice: 24900,
      discountPrice: 29900,
      coverImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop',
      rating: 4.95,
      overview: 'Indulge in a 5-star private pool resort stay in South Goa with romantic candle-light dinner on the beach.',
      highlights: ['5-Star Private Pool Resort Stay', 'Romantic Candlelight Dinner', 'Couples Spa Massage Session'],
      inclusions: ['Daily Breakfast & 1 Romantic Dinner', 'Private SUV Transfers'],
      exclusions: ['Flight Airfare'],
      featured: true,
      status: 'Active'
    });

    // RAJASTHAN PACKAGES
    await Package.create({
      packageCode: 'PKG-RAJ-001',
      title: 'Royal Rajasthan Jaipur & Udaipur Palace Tour',
      slug: 'royal-rajasthan-palace-tour-6-days',
      destination: rajasthanDest._id,
      category: [domesticCat._id],
      duration: { nights: 5, days: 6 },
      startingPrice: 26500,
      discountPrice: 31000,
      coverImage: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=1200&auto=format&fit=crop',
      rating: 4.96,
      overview: 'Amer Fort elephant rides, Hawa Mahal photoshoot, Lake Pichola boat ride in Udaipur.',
      highlights: ['Jaipur Forts & Palaces', 'Udaipur Lake Pichola Boat Cruise', 'Heritage Hotel Stay'],
      inclusions: ['Breakfast & Dinner', 'Private AC Car'],
      exclusions: ['Monument Entrance Tickets'],
      featured: true,
      status: 'Active'
    });

    // GOLDEN TRIANGLE
    await Package.create({
      packageCode: 'PKG-TAJ-001',
      title: 'Golden Triangle Taj Mahal & Jaipur Heritage Tour',
      slug: 'golden-triangle-taj-mahal-5-days',
      destination: tajDest._id,
      category: [domesticCat._id],
      duration: { nights: 4, days: 5 },
      startingPrice: 19800,
      discountPrice: 23500,
      coverImage: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1200&auto=format&fit=crop',
      rating: 4.94,
      overview: 'Sunrise Taj Mahal tour in Agra, Fatehpur Sikri, Jaipur City Palace & Delhi Qutub Minar.',
      highlights: ['Sunrise Taj Mahal Guided Visit', 'Jaipur City Palace & Hawa Mahal', 'Fatehpur Sikri Excursion'],
      inclusions: ['Breakfast & Private Sedan Transfer'],
      exclusions: ['Flight Airfare'],
      featured: true,
      status: 'Active'
    });

    // MALDIVES PACKAGES
    await Package.create({
      packageCode: 'PKG-MAL-001',
      title: 'Maldives Private Water Villa & Snorkeling Paradise',
      slug: 'maldives-water-villa-honeymoon-5-days',
      destination: maldivesDest._id,
      category: [intlCat._id],
      duration: { nights: 4, days: 5 },
      startingPrice: 59000,
      discountPrice: 68000,
      coverImage: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=1200&auto=format&fit=crop',
      rating: 4.99,
      overview: '5-star private island resort with glass floor water bungalow, speedboat transfer & all meals.',
      highlights: ['Overwater Bungalow with Ocean Access', 'Speedboat Airport Transfer', 'Sunset Dolphin Cruise'],
      inclusions: ['All-Inclusive Meals & Drinks', 'Speedboat Transfer'],
      exclusions: ['International Flight'],
      featured: true,
      status: 'Active'
    });

    // SINGAPORE PACKAGES
    await Package.create({
      packageCode: 'PKG-SIN-001',
      title: 'Singapore City & Sentosa Universal Studios Extravaganza',
      slug: 'singapore-sentosa-universal-studios-5-days',
      destination: singaporeDest._id,
      category: [intlCat._id],
      duration: { nights: 4, days: 5 },
      startingPrice: 48500,
      discountPrice: 55000,
      coverImage: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1200&auto=format&fit=crop',
      rating: 4.91,
      overview: 'Gardens by the Bay Light Show, Marina Bay Sands SkyPark, Universal Studios rides & Night Safari.',
      highlights: ['Universal Studios One Day Pass', 'Gardens by the Bay Supertree Dome', 'Night Safari Tram Ride'],
      inclusions: ['Daily Breakfast, E-Visa & Transfers'],
      exclusions: ['International Flight'],
      featured: true,
      status: 'Active'
    });

    console.log('[Seed] Database seeded with packages for ALL destinations including Himachal!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seed();
