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
      pricingTiers: [
        { category: 'Standard', price: 16500, hotel: '3 Star Mountain View Hotel', meal: 'Breakfast & Dinner', transport: 'Private Alto/Dzire', availability: true },
        { category: 'Deluxe', price: 21900, hotel: '4 Star Luxury Cottage Resort', meal: 'Breakfast & Dinner', transport: 'Private Etios/Sedan', availability: true },
        { category: 'Luxury', price: 32000, hotel: '5 Star Span Resort & Spa', meal: 'All Meals Included', transport: 'Private Innova Crysta', availability: true }
      ],
      itinerary: [
        { day: 1, title: 'Arrival in Manali', description: 'Check-in to mountain resort & rest.' },
        { day: 2, title: 'Local Sightseeing', description: 'Hadimba Temple, Vashisht Hot Springs & Mall Road.' },
        { day: 3, title: 'Solang Valley Adventure', description: 'Paragliding, ropeway & snow sports.' },
        { day: 4, title: 'Atal Tunnel & Sissu', description: 'Excursion to Lahaul valley via Atal Tunnel.' },
        { day: 5, title: 'Departure', description: 'Breakfast & Volvo bus drop.' }
      ],
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
      pricingTiers: [
        { category: 'Standard', price: 21900, hotel: '3 Star Shimla/Manali Hotel', meal: 'Breakfast & Dinner', transport: 'Private AC Car', availability: true },
        { category: 'Deluxe', price: 28500, hotel: '4 Star Valley View Resort', meal: 'Breakfast & Dinner', transport: 'Private Sedan', availability: true },
        { category: 'Luxury', price: 42000, hotel: '5 Star Heritage Resort', meal: 'All Meals Included', transport: 'Private SUV', availability: true }
      ],
      itinerary: [
        { day: 1, title: 'Arrival in Shimla', description: 'Check-in to hotel & Mall Road evening walk.' },
        { day: 2, title: 'Kufri & Chail Excursion', description: 'Horse riding & Himalayan Nature Park.' },
        { day: 3, title: 'Shimla to Manali Scenic Drive', description: 'Drive past Kullu valley & river rafting point.' },
        { day: 4, title: 'Manali Local & Solang', description: 'Hadimba Temple & Solang valley snow point.' },
        { day: 5, title: 'Kasol & Manikaran Day Trip', description: 'Parvati valley riverfront & Manikaran Sahib hot springs.' },
        { day: 6, title: 'Departure', description: 'Breakfast & departure transfer.' }
      ],
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
      pricingTiers: [
        { category: 'Standard', price: 12900, hotel: '3 Star Beachside Hotel', meal: 'Daily Breakfast', transport: 'Shared AC Coach', availability: true },
        { category: 'Deluxe', price: 15900, hotel: '4 Star Luxury Resort', meal: 'Breakfast & Dinner', transport: 'Private AC Sedan', availability: true },
        { category: 'Luxury', price: 24900, hotel: '5 Star Taj / Marriott Beach Resort', meal: 'All Meals Included', transport: 'Private SUV', availability: true }
      ],
      itinerary: [
        { day: 1, title: 'Arrival & Beach Chill', description: 'Airport transfer, check-in to resort, and evening stroll at Baga beach.' },
        { day: 2, title: 'North Goa & Water Sports', description: 'Parasailing, jet skiing, banana ride, and Fort Aguada photoshoot.' },
        { day: 3, title: 'South Goa & Sunset Cruise', description: 'Visit Basilica of Bom Jesus, Mangueshi Temple, and Mandovi river cruise.' },
        { day: 4, title: 'Departure', description: 'Breakfast & souvenir shopping before airport drop.' }
      ],
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
      pricingTiers: [
        { category: 'Deluxe', price: 24900, hotel: '4 Star Boutique Pool Resort', meal: 'Breakfast & Candlelight Dinner', transport: 'Private AC Sedan', availability: true },
        { category: 'Luxury', price: 34900, hotel: '5 Star Private Beach Villa', meal: 'All Meals Included', transport: 'Private Luxury SUV', availability: true }
      ],
      itinerary: [
        { day: 1, title: 'VIP Arrival & Pool Villa Welcome', description: 'Private SUV transfer & welcome drinks at South Goa resort.' },
        { day: 2, title: 'Couples Spa & Private Beach Stroll', description: 'Ayurvedic couples massage & private sunset beach walk.' },
        { day: 3, title: 'Yacht Cruise & Candlelight Dinner', description: 'Private catamaran sunset cruise & beachside dining.' },
        { day: 4, title: 'Leisure & Shopping', description: 'Explore Panjim French quarter & craft markets.' },
        { day: 5, title: 'Departure', description: 'Breakfast & luxury drop to airport.' }
      ],
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
      pricingTiers: [
        { category: 'Standard', price: 26500, hotel: '3 Star Heritage Haveli', meal: 'Breakfast & Dinner', transport: 'Private AC Sedan', availability: true },
        { category: 'Deluxe', price: 34000, hotel: '4 Star Palace Resort', meal: 'Breakfast & Royal Dinner', transport: 'Private AC SUV', availability: true },
        { category: 'Luxury', price: 54000, hotel: '5 Star Taj Lake Palace / Leela', meal: 'All Meals Included', transport: 'Luxury SUV', availability: true }
      ],
      itinerary: [
        { day: 1, title: 'Arrival in Pink City Jaipur', description: 'Check-in to heritage hotel and evening visit to Chokhi Dhani village.' },
        { day: 2, title: 'Jaipur Forts & Palaces', description: 'Explore Amer Fort, Jal Mahal, City Palace, and Hawa Mahal.' },
        { day: 3, title: 'Drive to Udaipur', description: 'Scenic highway drive via Chittorgarh Fort.' },
        { day: 4, title: 'Udaipur City of Lakes', description: 'Jagdish Temple, City Palace Udaipur, and Lake Pichola boat cruise.' },
        { day: 5, title: 'Saheliyon Ki Bari & Crafts', description: 'Visit Saheliyon ki Bari gardens and local handicrafts market.' },
        { day: 6, title: 'Departure', description: 'Breakfast & airport/railway station drop.' }
      ],
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
      pricingTiers: [
        { category: 'Standard', price: 19800, hotel: '3 Star City Hotel', meal: 'Daily Breakfast', transport: 'Private AC Sedan', availability: true },
        { category: 'Deluxe', price: 25900, hotel: '4 Star Taj View Hotel', meal: 'Breakfast & Dinner', transport: 'Private AC Sedan', availability: true },
        { category: 'Luxury', price: 42000, hotel: '5 Star Oberoi Amarvilas Agra', meal: 'All Meals Included', transport: 'Private SUV', availability: true }
      ],
      itinerary: [
        { day: 1, title: 'Delhi Sightseeing & Drive to Agra', description: 'Qutub Minar, India Gate, and drive via Yamuna Expressway.' },
        { day: 2, title: 'Sunrise Taj Mahal & Agra Fort', description: 'Early morning Taj Mahal visit & Agra Fort tour.' },
        { day: 3, title: 'Fatehpur Sikri & Drive to Jaipur', description: 'Buland Darwaza visit & check-in to Jaipur hotel.' },
        { day: 4, title: 'Jaipur Forts & Shopping', description: 'Amer Fort, Hawa Mahal photoshoot & Johari bazaar.' },
        { day: 5, title: 'Departure to Delhi', description: 'Breakfast & drop to Delhi IGI airport.' }
      ],
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
      pricingTiers: [
        { category: 'Standard', price: 59000, hotel: 'Beach Villa with Lagoon View', meal: 'Full Board (All Meals)', transport: 'Shared Speedboat', availability: true },
        { category: 'Deluxe', price: 72000, hotel: 'Private Overwater Bungalow', meal: 'All-Inclusive Drinks & Dining', transport: 'Speedboat Transfer', availability: true },
        { category: 'Luxury', price: 98000, hotel: 'Sunset Ocean Pool Villa', meal: 'Ultra All-Inclusive Dine Around', transport: 'Seaplane Flight Transfer', availability: true }
      ],
      itinerary: [
        { day: 1, title: 'Speedboat Welcome to Resort', description: 'Speedboat transfer to island resort & overwater bungalow check-in.' },
        { day: 2, title: 'Snorkeling & House Reef Exploration', description: 'Guided snorkeling session among coral reefs & sea turtles.' },
        { day: 3, title: 'Sunset Dolphin Cruise', description: 'Romantic boat cruise with champagne & dolphin sightings.' },
        { day: 4, title: 'Island Spa & Leisure', description: 'Relaxing couples massage and beachside dinner.' },
        { day: 5, title: 'Departure', description: 'Breakfast & Speedboat transfer back to Male airport.' }
      ],
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
      pricingTiers: [
        { category: 'Standard', price: 48500, hotel: '3 Star City Hotel', meal: 'Daily Breakfast', transport: 'Shared Tourist Coach', availability: true },
        { category: 'Deluxe', price: 58000, hotel: '4 Star Orchard Road Hotel', meal: 'Daily Breakfast & Lunch', transport: 'Private Sedan', availability: true },
        { category: 'Luxury', price: 85000, hotel: '5 Star Marina Bay Sands', meal: 'All Inclusive Dining', transport: 'Private Executive Van', availability: true }
      ],
      itinerary: [
        { day: 1, title: 'Arrival in Singapore & Night Safari', description: 'Airport transfer, hotel check-in, and world-famous Night Safari.' },
        { day: 2, title: 'City Tour & Gardens by the Bay', description: 'Merlion Park, Chinatown, Cloud Forest, and Supertree light show.' },
        { day: 3, title: 'Full Day Universal Studios', description: 'Thrill rides, Transformers 3D, and Jurassic Park adventure.' },
        { day: 4, title: 'Sentosa Island Exploration', description: 'Cable car ride, S.E.A. Aquarium, and Wings of Time laser show.' },
        { day: 5, title: 'Departure', description: 'Jewel Changi airport tour & flight drop.' }
      ],
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
