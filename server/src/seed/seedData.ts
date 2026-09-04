import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { Continent, Country, State, Destination } from '../models/Destination.js';
import { Package, TravelTheme, PackageCategory } from '../models/Package.js';
import { Activity } from '../models/Activity.js';
import { Blog, Testimonial, FAQ, Setting } from '../models/CMS.js';
import { Enquiry } from '../models/Enquiry.js';

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
    const telanganaState = await State.create({ country: india._id, name: 'Telangana', slug: 'telangana' });
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
    const telaganaDest = await Destination.create({
      country: india._id,
      state: telanganaState._id,
      name: 'TELAGANA',
      slug: 'telagana',
      banner: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop',
      shortDescription: 'Charminar, Golconda Fort sound & light show, Ramoji Film City & Hussain Sagar lake.',
      bestTime: 'Nov - Feb',
      featured: true,
      status: 'Active'
    });

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
      category: 'International',
      isDomestic: false,
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
      category: 'International',
      isDomestic: false,
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
      category: 'International',
      isDomestic: false,
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
      category: 'International',
      isDomestic: false,
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
      category: 'International',
      isDomestic: false,
      banner: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1200&auto=format&fit=crop',
      shortDescription: 'Gardens by the Bay, Universal Studios & luxury shopping.',
      bestTime: 'Year Round',
      featured: true,
      status: 'Active'
    });

    // 7. Activities Seeding (Exactly 2 per category = 14 total)
    await Activity.deleteMany({});
    await Activity.create([
      // Adventure (2)
      {
        activityCode: 'ACT-HC-101',
        title: 'Bungee Jumping & Flying Fox Extreme',
        slug: 'bungee-jumping-rishikesh',
        destinationName: 'Rishikesh, Uttarakhand',
        category: 'Adventure',
        duration: '3 Hours',
        startingPrice: 3500,
        discountPrice: 4200,
        coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
        rating: 4.95,
        overview: 'Experience India’s highest 83-meter fixed platform Bungee Jump over the stunning Mohan Chatti valley in Rishikesh with certified safety experts.',
        highlights: ['83m Fixed Cantilever Platform', 'Safety Gear & Jump Certificate', 'HD Video Footage Included', 'Professional Jump Masters'],
        inclusions: ['Jump Entry Pass', 'Safety Gear Harness', 'Jump Certificate', 'Briefing Session'],
        exclusions: ['Transport to Jump Zone', 'Personal Expenses'],
        location: 'Mohan Chatti, Rishikesh',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-111',
        title: 'Zipline Canopy & Aerial Obstacle Adventure',
        slug: 'flying-fox-zipline-tour',
        destinationName: 'Neemrana / Rishikesh',
        category: 'Adventure',
        duration: '2 Hours',
        startingPrice: 1800,
        discountPrice: 2300,
        coverImage: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1200&auto=format&fit=crop',
        rating: 4.88,
        overview: 'Fly across 5 zip wire lines suspended 200 feet over ancient fort walls and deep river gorges.',
        highlights: ['5 Zip Wire Circuit Lines', 'Dual Safety Line System', 'Certified Safety Instructors', 'Aerial Valley Views'],
        inclusions: ['Full Safety Harness', 'Helmet & Gloves', 'Guide Instructor'],
        exclusions: ['Locker Rental'],
        location: 'Neemrana Fort Hills',
        featured: true,
        status: 'Active'
      },

      // Water Sports (2)
      {
        activityCode: 'ACT-HC-102',
        title: 'Ganges River Rafting 16KM & Cliff Jump',
        slug: 'river-rafting-rishikesh',
        destinationName: 'Rishikesh, Uttarakhand',
        category: 'Water Sports',
        duration: 'Half Day (4 Hours)',
        startingPrice: 1200,
        discountPrice: 1600,
        coverImage: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=1200&auto=format&fit=crop',
        rating: 4.88,
        overview: 'Conquer Grade III & IV Ganges rapids from Shivpuri to Rishikesh with experienced river guides and optional cliff jumping.',
        highlights: ['16 KM White Water Rafting', 'Grade III+ Roller Coaster Rapids', 'Cliff Jumping & Body Surfing', 'Life Jacket & Safety Helmet'],
        inclusions: ['Rafting Equipment', 'Life Jacket & Helmet', 'Certified River Guide', 'Body Surfing'],
        exclusions: ['Wet Suit (Winter only)', 'Personal Transport'],
        location: 'Shivpuri to Laxman Jhula, Rishikesh',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-103',
        title: 'Scuba Diving & Grand Island Boat Cruise',
        slug: 'scuba-diving-goa',
        destination: goaDest._id,
        destinationName: 'Goa',
        category: 'Water Sports',
        duration: 'Full Day (6 Hours)',
        startingPrice: 2499,
        discountPrice: 3500,
        coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
        rating: 4.90,
        overview: 'Explore underwater coral reefs and marine life off Grand Island in Goa with PADI certified instructors, lunch, and underwater photos.',
        highlights: ['Underwater Photo & Video Drive', '20-Min Guided Scuba Dive', 'Grand Island Boat Safari', 'Buffet Lunch & Drinks'],
        inclusions: ['Scuba Gear & Breathing Tank', '1-on-1 Instructor Guide', 'Boat Trip & Buffet Lunch', 'Underwater GoPro Photos'],
        exclusions: ['Hotel Pick-up outside Calangute/Baga'],
        location: 'Grand Island, North Goa',
        featured: true,
        status: 'Active'
      },

      // Air Sports (2)
      {
        activityCode: 'ACT-HC-105',
        title: 'Solang Valley Paragliding Tandem Flight',
        slug: 'paragliding-manali',
        destination: himachalDest._id,
        destinationName: 'Manali, Himachal Pradesh',
        category: 'Air Sports',
        duration: '1 Hour (15-min flight)',
        startingPrice: 2800,
        discountPrice: 3500,
        coverImage: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1200&auto=format&fit=crop',
        rating: 4.89,
        overview: 'Soar like a bird high above Solang Valley and snow-capped Himalayan peaks with a licensed tandem pilot.',
        highlights: ['Tandem Flight with Master Pilot', 'High-altitude Solang Takeoff', 'Panoramic Himalayan Views', 'Action Cam Recording Option'],
        inclusions: ['Flight Equipment & Helmet', 'Licensed Tandem Pilot', 'Glider Briefing'],
        exclusions: ['GoPro Video Footage (₹500 extra)', 'Valley Entry Fee'],
        location: 'Solang Valley, Manali',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-106',
        title: 'Jaipur Forts Sunrise Hot Air Balloon Ride',
        slug: 'hot-air-balloon-jaipur',
        destination: rajasthanDest._id,
        destinationName: 'Jaipur, Rajasthan',
        category: 'Air Sports',
        duration: '3 Hours (1-hour flight)',
        startingPrice: 8900,
        discountPrice: 11000,
        coverImage: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=1200&auto=format&fit=crop',
        rating: 4.94,
        overview: 'Float peacefully over Amer Fort, royal palaces, and Rajasthan countryside during a sunrise hot air balloon flight.',
        highlights: ['1-Hour Flight at Sunrise', 'Overfly Amer Fort & Palaces', 'Flight Certificate Signed by Pilot', 'Hotel Transfers'],
        inclusions: ['1-Hour Balloon Flight', 'Hotel Pick-up & Drop', 'Flight Certificate', 'Light Refreshments'],
        exclusions: ['Personal Souvenirs'],
        location: 'Amer Fort Flight Zone, Jaipur',
        featured: true,
        status: 'Active'
      },

      // Safari (2)
      {
        activityCode: 'ACT-HC-104',
        title: 'Dubai Red Dune Desert Safari & BBQ Dinner',
        slug: 'desert-safari-dubai',
        destination: dubaiDest._id,
        destinationName: 'Dubai, UAE',
        category: 'Safari',
        duration: '6 Hours (Evening)',
        startingPrice: 3800,
        discountPrice: 4800,
        coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop',
        rating: 4.97,
        overview: 'Adrenaline 4x4 dune bashing in Lahbab desert followed by camel riding, sandboarding, belly dance, and lavish desert camp BBQ dinner.',
        highlights: ['4x4 Land Cruiser Dune Bashing', 'Sunset Sandboarding & Camel Ride', 'Belly Dance & Tanoura Show', '5-Star Buffet BBQ Dinner'],
        inclusions: ['Hotel Pick up & Drop in 4x4', 'Dune Bashing & Sandboarding', 'Unlimited Drinks & Henna', 'Buffet BBQ Dinner'],
        exclusions: ['Quad Bike ATV (Optional Add-on)'],
        location: 'Lahbab Red Dunes, Dubai',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-109',
        title: 'Jim Corbett National Park Tiger Jeep Safari',
        slug: 'jim-corbett-jeep-safari',
        destinationName: 'Jim Corbett, Uttarakhand',
        category: 'Safari',
        duration: '3.5 Hours',
        startingPrice: 4500,
        discountPrice: 5200,
        coverImage: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=1200&auto=format&fit=crop',
        rating: 4.87,
        overview: 'Exclusive 4x4 open Gypsy jungle safari through Bijrani/Dhikala zone in search of Royal Bengal Tigers and wild elephants.',
        highlights: ['Private 4x4 Open Maruti Gypsy', 'Official Forest Naturalist Guide', 'Tiger & Wildlife Tracking', 'Zone Entry Permit Included'],
        inclusions: ['Gypsy Rental & Fuel', 'Forest Permit & Naturalist', 'Resort Pick-up'],
        exclusions: ['Camera Permit Fees'],
        location: 'Bijrani / Jhirna Zone, Corbett',
        featured: true,
        status: 'Active'
      },

      // Trekking (2)
      {
        activityCode: 'ACT-HC-113',
        title: 'Triund Peak Day Trek & Cloud Line View',
        slug: 'triund-day-trek-dharamshala',
        destinationName: 'McLeod Ganj, Dharamshala',
        category: 'Trekking',
        duration: '1 Day (7 Hours)',
        startingPrice: 1500,
        discountPrice: 2000,
        coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
        rating: 4.92,
        overview: 'Popular Himalayan day trek through oak and rhododendron forests leading to scenic views of the snow-covered Dhauladhar range.',
        highlights: ['Oak & Rhododendron Forest Trail', 'Triund Ridge Sunset & Cloud Line', 'Dhauladhar Snow Peaks View', 'Trek Guide & Energy Snacks'],
        inclusions: ['Certified Trek Guide', 'Packed Lunch Box', 'First Aid Kit'],
        exclusions: ['Overnight Tent Stay'],
        location: 'Gallu Devi Temple to Triund Top',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-114',
        title: 'Kedarkantha Winter Snow Summit Trek',
        slug: 'kedarkantha-snow-summit-trek',
        destinationName: 'Sankri, Uttarakhand',
        category: 'Trekking',
        duration: '4 Days / 3 Nights',
        startingPrice: 5900,
        discountPrice: 7200,
        coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
        rating: 4.96,
        overview: 'Climb 12,500 feet Kedarkantha Peak with 360-degree views of Swargarohini, Bandarpoonch, and Black Peak Himalayan ranges.',
        highlights: ['12,500 Feet Summit Push', 'Juda Ka Talab Frozen Lake Campsite', 'Stargazing Snow Tents', 'Himalayan Ridge Sunrise'],
        inclusions: ['All Meals & Tea', 'High Altitude Tents & Sleeping Bags', 'Microspikes & Gaiters', 'Experienced Trek Leaders'],
        exclusions: ['Offloading Personal Backpack'],
        location: 'Sankri Base Camp, Garhwal',
        featured: true,
        status: 'Active'
      },

      // Sightseeing (2)
      {
        activityCode: 'ACT-HC-116',
        title: 'Burj Khalifa 124th Floor & Dubai Fountain Pass',
        slug: 'burj-khalifa-observation-deck',
        destination: dubaiDest._id,
        destinationName: 'Dubai, UAE',
        category: 'Sightseeing',
        duration: '2 Hours',
        startingPrice: 3950,
        discountPrice: 4600,
        coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop',
        rating: 4.95,
        overview: 'Ride the world’s fastest double-deck elevator to Level 124 & 125 of Burj Khalifa for 360-degree views over Dubai skyline.',
        highlights: ['World’s Tallest Building Access', 'Level 124 & 125 Observation Decks', 'High-powered Telescope View', 'Dubai Mall Fountain Show View'],
        inclusions: ['Skip-the-line E-Ticket', 'Level 124 & 125 Entry'],
        exclusions: ['Level 148 Sky VIP Lounge'],
        location: 'Downtown Dubai',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-117',
        title: 'Marina Bay Sands SkyPark & Gardens by the Bay',
        slug: 'marina-bay-sands-skypark-singapore',
        destination: singaporeDest._id,
        destinationName: 'Singapore',
        category: 'Sightseeing',
        duration: '3 Hours',
        startingPrice: 2400,
        discountPrice: 2900,
        coverImage: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1200&auto=format&fit=crop',
        rating: 4.91,
        overview: 'Visit the 57th-floor Sands SkyPark Deck overlooking Marina Bay plus access to Flower Dome & Cloud Forest Supertrees.',
        highlights: ['57th Floor Observation Deck', 'Gardens by the Bay Flower Dome', 'Cloud Forest Indoor Waterfall', 'Supertree Grove Light Show'],
        inclusions: ['SkyPark Ticket', 'Double Conservatory Ticket'],
        exclusions: ['OCBC Skyway Aerial Walk Ticket'],
        location: 'Marina Bay Sands, Singapore',
        featured: true,
        status: 'Active'
      },

      // Theme Park (2)
      {
        activityCode: 'ACT-HC-112',
        title: 'Water Kingdom & Aqua Slide Super Pass',
        slug: 'water-kingdom-aqua-pass',
        destinationName: 'Mumbai / Pattaya',
        category: 'Theme Park',
        duration: 'Full Day Pass',
        startingPrice: 1450,
        discountPrice: 1850,
        coverImage: 'https://images.unsplash.com/photo-1582650625119-3a31f8418b0d?q=80&w=1200&auto=format&fit=crop',
        rating: 4.84,
        overview: 'Asia’s largest water theme park featuring high-speed wave pools, vertical drop water slides, and lazy river rides.',
        highlights: ['Unlimited Access to All Slides', 'Giant Wave Pool & DJ Zone', 'Kids Splash Lagoon', 'Safety Lifeguard Station'],
        inclusions: ['Full Day Park Entry', 'Locker & Shower Access'],
        exclusions: ['Costumes & Swimwear Rental', 'Food Coupons'],
        location: 'Gorai Water Kingdom, Mumbai',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-120',
        title: 'Universal Studios Singapore One-Day Express Pass',
        slug: 'universal-studios-singapore-pass',
        destination: singaporeDest._id,
        destinationName: 'Singapore',
        category: 'Theme Park',
        duration: 'Full Day Pass',
        startingPrice: 5800,
        discountPrice: 6500,
        coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
        rating: 4.96,
        overview: 'Experience cutting-edge rides, shows, and attractions based on blockbuster movies at Universal Studios Sentosa Island.',
        highlights: ['Transformers 3D Thrill Ride', 'Battlestar Galactica Roller Coaster', 'Mummy Revenge Indoor Ride', 'Jurassic Park Rapids Adventure'],
        inclusions: ['One-Day Park E-Ticket', 'Sentosa Island Entry'],
        exclusions: ['VIP Express Queue Pass'],
        location: 'Resorts World Sentosa, Singapore',
        featured: true,
        status: 'Active'
      }
    ]);
    console.log('[Seed] Seeded default activities into MongoDB.');
    const { ThemeBanner } = await import('../models/ThemeBanner.js');
    await ThemeBanner.deleteMany({});
    const defaultThemes = [
      {
        themeName: 'Honeymoon Tour',
        imageUrl: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1200&auto=format&fit=crop',
        description: 'Romantic getaways with candlelight dinners, luxury stays, scenic sunset moments, and memorable couple experiences.',
        active: true
      },
      {
        themeName: 'Leisure',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
        description: 'Easygoing holidays that blend beach relaxation, resort stays, and curated city or coastal sightseeing.',
        active: true
      },
      {
        themeName: 'Hill Station',
        imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop',
        description: 'Cool-weather escapes with mountain views, pine valleys, tea gardens, and peaceful nature retreats.',
        active: true
      },
      {
        themeName: 'Trekking',
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
        description: 'Trail-based adventures through scenic mountains, guided treks, camp stays, and landscape-rich routes.',
        active: true
      },
      {
        themeName: 'Adventure',
        imageUrl: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1200&auto=format&fit=crop',
        description: 'High-energy trips featuring rafting, zipline rides, off-road thrills, and adrenaline-filled experiences.',
        active: true
      },
      {
        themeName: 'Religious',
        imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1200&auto=format&fit=crop',
        description: 'Sacred journeys to temples, heritage sites, and peaceful spiritual destinations with guided comfort.',
        active: true
      },
      {
        themeName: 'Family Tour',
        imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1200&auto=format&fit=crop',
        description: 'Comfort-focused family holidays with sightseeing, kid-friendly activities, and memorable shared experiences.',
        active: true
      },
      {
        themeName: 'Wildlife Safari',
        imageUrl: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=1200&auto=format&fit=crop',
        description: 'Wildlife-rich escapes with jungle safaris, nature lodges, forest drives, and unforgettable animal encounters.',
        active: true
      }
    ];
    await ThemeBanner.insertMany(defaultThemes);
    console.log('[Seed] Seeded default theme banners into MongoDB.');

    // 6. Packages
    await Package.deleteMany({});
    await PackageCategory.deleteMany({});
    const domesticCat = await PackageCategory.create({ name: 'Domestic Packages', slug: 'domestic' });
    const intlCat = await PackageCategory.create({ name: 'International Packages', slug: 'international' });

    // TELANGANA PACKAGES
    await Package.create({
      packageCode: 'PKG-TEL-001',
      title: 'Telangana & Hyderabad City of Pearls Heritage Tour',
      slug: 'telagana-hyderabad-heritage-tour-4-days',
      destination: telaganaDest._id,
      category: [domesticCat._id],
      duration: { nights: 3, days: 4 },
      startingPrice: 11900,
      discountPrice: 14500,
      coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop',
      rating: 4.85,
      overview: 'Explore Charminar, Golconda Fort sound & light show, Ramoji Film City day excursion & Hussain Sagar lake.',
      highlights: ['Golconda Fort Light & Sound Show', 'Full Day Ramoji Film City Pass', 'Hussain Sagar Sunset Boat Cruise'],
      inclusions: ['4-Star City Hotel Stay', 'Daily Buffet Breakfast', 'Private AC Vehicle'],
      exclusions: ['Airfare / Train Tickets'],
      pricingTiers: [
        { category: 'Standard', price: 11900, hotel: '3 Star Business Hotel', meal: 'Breakfast Included', transport: 'Shared AC Coach', availability: true },
        { category: 'Deluxe', price: 14900, hotel: '4 Star Luxury Hotel', meal: 'Breakfast & Dinner', transport: 'Private AC Sedan', availability: true },
        { category: 'Luxury', price: 24900, hotel: '5 Star Taj Falaknuma Palace', meal: 'All Meals Included', transport: 'Private SUV', availability: true }
      ],
      itinerary: [
        { day: 1, title: 'Arrival & Old City Walk', description: 'Check-in to hotel, visit Charminar and Laad Bazaar.' },
        { day: 2, title: 'Golconda Fort & Qutb Shahi Tombs', description: 'Guided tour of Golconda Fort and evening sound & light show.' },
        { day: 3, title: 'Ramoji Film City Excursion', description: 'Full day magical film city tour with live stunt shows and studio sets.' },
        { day: 4, title: 'Hussain Sagar & Departure', description: 'Visit Buddha Statue, Salar Jung Museum and airport drop.' }
      ],
      featured: true,
      status: 'Active'
    });

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

    // SEED ACTIVITIES FOR ALL CATEGORIES
    await Activity.deleteMany({});
    await Activity.create([
      {
        activityCode: 'ACT-HC-101',
        title: 'Bungee Jumping & Flying Fox Extreme',
        slug: 'bungee-jumping-rishikesh',
        destination: himachalDest._id,
        destinationName: 'Rishikesh, Uttarakhand',
        category: 'Adventure',
        duration: '3 Hours',
        startingPrice: 3500,
        discountPrice: 4200,
        coverImage: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1200&auto=format&fit=crop',
        rating: 4.95,
        overview: 'Experience India’s highest 83-meter fixed platform Bungee Jump over the stunning Mohan Chatti valley in Rishikesh with certified safety experts.',
        highlights: ['83m Fixed Cantilever Platform', 'Safety Gear & Jump Certificate', 'HD Video Footage Included', 'Professional Jump Masters'],
        inclusions: ['Jump Entry Pass', 'Safety Gear Harness', 'Jump Certificate', 'Briefing Session'],
        exclusions: ['Transport to Jump Zone', 'Personal Expenses'],
        location: 'Mohan Chatti, Rishikesh',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-102',
        title: 'Ganges River Rafting 16KM & Cliff Jump',
        slug: 'river-rafting-rishikesh',
        destination: himachalDest._id,
        destinationName: 'Rishikesh, Uttarakhand',
        category: 'Water Sports',
        duration: 'Half Day (4 Hours)',
        startingPrice: 1200,
        discountPrice: 1600,
        coverImage: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=1200&auto=format&fit=crop',
        rating: 4.88,
        overview: 'Conquer Grade III & IV Ganges rapids from Shivpuri to Rishikesh with experienced river guides and optional cliff jumping.',
        highlights: ['16 KM White Water Rafting', 'Grade III+ Roller Coaster Rapids', 'Cliff Jumping & Body Surfing', 'Life Jacket & Safety Helmet'],
        inclusions: ['Rafting Equipment', 'Life Jacket & Helmet', 'Certified River Guide', 'Body Surfing'],
        exclusions: ['Wet Suit (Winter only)', 'Personal Transport'],
        location: 'Shivpuri to Laxman Jhula, Rishikesh',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-103',
        title: 'Scuba Diving & Coral Reef Exploration',
        slug: 'scuba-diving-goa',
        destination: goaDest._id,
        destinationName: 'Goa',
        category: 'Water Sports',
        duration: 'Full Day (6 Hours)',
        startingPrice: 2499,
        discountPrice: 3500,
        coverImage: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=1200&auto=format&fit=crop',
        rating: 4.90,
        overview: 'Explore underwater coral reefs and marine life off Grand Island in Goa with PADI certified instructors, lunch, and underwater photos.',
        highlights: ['Underwater Photo & Video Drive', '20-Min Guided Scuba Dive', 'Grand Island Boat Safari', 'Buffet Lunch & Drinks'],
        inclusions: ['Scuba Gear & Breathing Tank', '1-on-1 Instructor Guide', 'Boat Trip & Buffet Lunch', 'Underwater GoPro Photos'],
        exclusions: ['Hotel Pick-up outside Calangute/Baga'],
        location: 'Grand Island, North Goa',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-104',
        title: 'Dubai Red Dune Desert Safari & BBQ Dinner',
        slug: 'desert-safari-dubai',
        destination: dubaiDest._id,
        destinationName: 'Dubai, UAE',
        category: 'Safari',
        duration: '6 Hours (Evening)',
        startingPrice: 3800,
        discountPrice: 4800,
        coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
        rating: 4.97,
        overview: 'Adrenaline 4x4 dune bashing in Lahbab desert followed by camel riding, sandboarding, belly dance, and lavish desert camp BBQ dinner.',
        highlights: ['4x4 Land Cruiser Dune Bashing', 'Sunset Sandboarding & Camel Ride', 'Belly Dance & Tanoura Show', '5-Star Buffet BBQ Dinner'],
        inclusions: ['Hotel Pick up & Drop in 4x4', 'Dune Bashing & Sandboarding', 'Unlimited Drinks & Henna', 'Buffet BBQ Dinner'],
        exclusions: ['Quad Bike ATV (Optional Add-on)'],
        location: 'Lahbab Red Dunes, Dubai',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-105',
        title: 'Solang Valley Paragliding Tandem Flight',
        slug: 'paragliding-manali',
        destination: himachalDest._id,
        destinationName: 'Manali, Himachal Pradesh',
        category: 'Air Sports',
        duration: '1 Hour (15-min flight)',
        startingPrice: 2800,
        discountPrice: 3500,
        coverImage: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=1200&auto=format&fit=crop',
        rating: 4.89,
        overview: 'Soar like a bird high above Solang Valley and snow-capped Himalayan peaks with a licensed tandem pilot.',
        highlights: ['Tandem Flight with Master Pilot', 'High-altitude Solang Takeoff', 'Panoramic Himalayan Views', 'Action Cam Recording Option'],
        inclusions: ['Flight Equipment & Helmet', 'Licensed Tandem Pilot', 'Glider Briefing'],
        exclusions: ['GoPro Video Footage (₹500 extra)', 'Valley Entry Fee'],
        location: 'Solang Valley, Manali',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-106',
        title: 'Jaipur Forts Sunrise Hot Air Balloon Ride',
        slug: 'hot-air-balloon-jaipur',
        destination: rajasthanDest._id,
        destinationName: 'Jaipur, Rajasthan',
        category: 'Air Sports',
        duration: '3 Hours (1-hour flight)',
        startingPrice: 8900,
        discountPrice: 11000,
        coverImage: 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=1200&auto=format&fit=crop',
        rating: 4.94,
        overview: 'Float peacefully over Amer Fort, royal palaces, and Rajasthan countryside during a sunrise hot air balloon flight.',
        highlights: ['1-Hour Flight at Sunrise', 'Overfly Amer Fort & Palaces', 'Flight Certificate Signed by Pilot', 'Hotel Transfers'],
        inclusions: ['1-Hour Balloon Flight', 'Hotel Pick-up & Drop', 'Flight Certificate', 'Light Refreshments'],
        exclusions: ['Personal Souvenirs'],
        location: 'Amer Fort Flight Zone, Jaipur',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-107',
        title: 'Tandem Skydiving 10,000 Feet Jump',
        slug: 'tandem-skydiving-experience',
        destinationName: 'Pondicherry / Dubai',
        category: 'Air Sports',
        duration: '4 Hours',
        startingPrice: 26500,
        discountPrice: 29900,
        coverImage: 'https://images.unsplash.com/photo-1521673161882-77d446979244?q=80&w=1200&auto=format&fit=crop',
        rating: 4.99,
        overview: 'Ultimate freefall experience at 10,000 feet attached to a certified USPA master instructor with breathtaking ocean views.',
        highlights: ['10,000 Feet High Jump', '45 Seconds Pure Freefall', '5-Minute Parachute Glide', 'USPA Master Instructor'],
        inclusions: ['Flight Slot & Jumpsuit', 'Safety Harness & Goggles', 'Commemorative Certificate'],
        exclusions: ['Third Party Video Shooter'],
        location: 'Drop Zone Airfield',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-108',
        title: 'Himalayan Ridge Alpine Trek & Camp',
        slug: 'himalayan-alpine-ridge-trek',
        destination: himachalDest._id,
        destinationName: 'Kasol & Tosh, Himachal',
        category: 'Trekking',
        duration: '2 Days / 1 Night',
        startingPrice: 3200,
        discountPrice: 4000,
        coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
        rating: 4.91,
        overview: 'Guided mountain trek through pine forests, wooden Himalayan villages, and night stargazing bonfire camping.',
        highlights: ['Guided Forest & Ridge Trail', 'Overnight Dome Tent Stay', 'Bonfire & Stargazing Session', 'Fresh Alpine Hot Meals'],
        inclusions: ['Trek Leader & Support Staff', 'Dome Tents & Sleeping Bags', 'Dinner & Breakfast', 'Forest Entry Permit'],
        exclusions: ['Personal Rucksack Carrying'],
        location: 'Kheerganga Ridge Trail',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-109',
        title: 'Jim Corbett National Park Tiger Jeep Safari',
        slug: 'jim-corbett-jeep-safari',
        destinationName: 'Jim Corbett, Uttarakhand',
        category: 'Safari',
        duration: '3.5 Hours',
        startingPrice: 4500,
        discountPrice: 5200,
        coverImage: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=1200&auto=format&fit=crop',
        rating: 4.87,
        overview: 'Exclusive 4x4 open Gypsy jungle safari through Bijrani/Dhikala zone in search of Royal Bengal Tigers and wild elephants.',
        highlights: ['Private 4x4 Open Maruti Gypsy', 'Official Forest Naturalist Guide', 'Tiger & Wildlife Tracking', 'Zone Entry Permit Included'],
        inclusions: ['Gypsy Rental & Fuel', 'Forest Permit & Naturalist', 'Resort Pick-up'],
        exclusions: ['Camera Permit Fees'],
        location: 'Bijrani / Jhirna Zone, Corbett',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-110',
        title: 'Sentosa Cable Car & SkyHelix Panoramic Ride',
        slug: 'sentosa-cable-car-singapore',
        destination: singaporeDest._id,
        destinationName: 'Singapore',
        category: 'Sightseeing',
        duration: '2 Hours',
        startingPrice: 2200,
        discountPrice: 2700,
        coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
        rating: 4.86,
        overview: 'Soar 360 degrees above Mount Faber and Sentosa Island on the iconic Singapore Cable Car Sky Network.',
        highlights: ['Roundtrip Cable Car Pass', '360 Skylight Ocean Views', 'Mount Faber Peak Access', 'SkyHelix Open Air Ride'],
        inclusions: ['Cable Car Pass (2 Lines)', 'Sentosa Entry Fee'],
        exclusions: ['Food & Beverages'],
        location: 'Mount Faber Peak, Singapore',
        featured: false,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-111',
        title: 'Zipline Canopy & Aerial Obstacle Adventure',
        slug: 'flying-fox-zipline-tour',
        destinationName: 'Neemrana / Rishikesh',
        category: 'Adventure',
        duration: '2 Hours',
        startingPrice: 1800,
        discountPrice: 2300,
        coverImage: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1200&auto=format&fit=crop',
        rating: 4.88,
        overview: 'Fly across 5 zip wire lines suspended 200 feet over ancient fort walls and deep river gorges.',
        highlights: ['5 Zip Wire Circuit Lines', 'Dual Safety Line System', 'Certified Safety Instructors', 'Aerial Valley Views'],
        inclusions: ['Full Safety Harness', 'Helmet & Gloves', 'Guide Instructor'],
        exclusions: ['Locker Rental'],
        location: 'Neemrana Fort Hills',
        featured: false,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-112',
        title: 'Water Kingdom & Aqua Slide Super Pass',
        slug: 'water-kingdom-aqua-pass',
        destinationName: 'Mumbai / Pattaya',
        category: 'Theme Park',
        duration: 'Full Day Pass',
        startingPrice: 1450,
        discountPrice: 1850,
        coverImage: 'https://images.unsplash.com/photo-1582650625119-3a31f8418b0d?q=80&w=1200&auto=format&fit=crop',
        rating: 4.84,
        overview: 'Asia’s largest water theme park featuring high-speed wave pools, vertical drop water slides, and lazy river rides.',
        highlights: ['Unlimited Access to All Slides', 'Giant Wave Pool & DJ Zone', 'Kids Splash Lagoon', 'Safety Lifeguard Station'],
        inclusions: ['Full Day Park Entry', 'Locker & Shower Access'],
        exclusions: ['Costumes & Swimwear Rental', 'Food Coupons'],
        location: 'Gorai Water Kingdom, Mumbai',
        featured: false,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-113',
        title: 'Triund Peak Day Trek & Cloud Line View',
        slug: 'triund-day-trek-dharamshala',
        destinationName: 'McLeod Ganj, Dharamshala',
        category: 'Trekking',
        duration: '1 Day (7 Hours)',
        startingPrice: 1500,
        discountPrice: 2000,
        coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
        rating: 4.92,
        overview: 'Popular Himalayan day trek through oak and rhododendron forests leading to scenic views of the snow-covered Dhauladhar range.',
        highlights: ['Oak & Rhododendron Forest Trail', 'Triund Ridge Sunset & Cloud Line', 'Dhauladhar Snow Peaks View', 'Trek Guide & Energy Snacks'],
        inclusions: ['Certified Trek Guide', 'Packed Lunch Box', 'First Aid Kit'],
        exclusions: ['Overnight Tent Stay'],
        location: 'Gallu Devi Temple to Triund Top',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-114',
        title: 'Kedarkantha Winter Snow Summit Trek',
        slug: 'kedarkantha-snow-summit-trek',
        destinationName: 'Sankri, Uttarakhand',
        category: 'Trekking',
        duration: '4 Days / 3 Nights',
        startingPrice: 5900,
        discountPrice: 7200,
        coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
        rating: 4.96,
        overview: 'Climb 12,500 feet Kedarkantha Peak with 360-degree views of Swargarohini, Bandarpoonch, and Black Peak Himalayan ranges.',
        highlights: ['12,500 Feet Summit Push', 'Juda Ka Talab Frozen Lake Campsite', 'Stargazing Snow Tents', 'Himalayan Ridge Sunrise'],
        inclusions: ['All Meals & Tea', 'High Altitude Tents & Sleeping Bags', 'Microspikes & Gaiters', 'Experienced Trek Leaders'],
        exclusions: ['Offloading Personal Backpack'],
        location: 'Sankri Base Camp, Garhwal',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-115',
        title: 'Valley of Flowers UNESCO Alpine Trek',
        slug: 'valley-of-flowers-trek',
        destinationName: 'Chamoli, Uttarakhand',
        category: 'Trekking',
        duration: '3 Days / 2 Nights',
        startingPrice: 4800,
        discountPrice: 5900,
        coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
        rating: 4.94,
        overview: 'Walk through carpeted valleys of rare blue poppies, Brahma Kamal, and orchids nestled inside a UNESCO World Heritage National Park.',
        highlights: ['UNESCO World Heritage Flora', 'Pushpawati River Trail', '500+ Species of Alpine Flowers', 'Guided Nature Walk'],
        inclusions: ['Park Entry Permit', 'Ghangaria Hotel/Guesthouse Stay', 'Local Certified Guide', 'Meals'],
        exclusions: ['Pony/Mule Charges'],
        location: 'Govindghat to Ghangaria, Chamoli',
        featured: false,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-116',
        title: 'Burj Khalifa 124th Floor & Dubai Fountain Pass',
        slug: 'burj-khalifa-observation-deck',
        destination: dubaiDest._id,
        destinationName: 'Dubai, UAE',
        category: 'Sightseeing',
        duration: '2 Hours',
        startingPrice: 3950,
        discountPrice: 4600,
        coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop',
        rating: 4.95,
        overview: 'Ride the world’s fastest double-deck elevator to Level 124 & 125 of Burj Khalifa for 360-degree views over Dubai skyline.',
        highlights: ['World’s Tallest Building Access', 'Level 124 & 125 Observation Decks', 'High-powered Telescope View', 'Dubai Mall Fountain Show View'],
        inclusions: ['Skip-the-line E-Ticket', 'Level 124 & 125 Entry'],
        exclusions: ['Level 148 Sky VIP Lounge'],
        location: 'Downtown Dubai',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-117',
        title: 'Marina Bay Sands SkyPark & Gardens by the Bay',
        slug: 'marina-bay-sands-skypark-singapore',
        destination: singaporeDest._id,
        destinationName: 'Singapore',
        category: 'Sightseeing',
        duration: '3 Hours',
        startingPrice: 2400,
        discountPrice: 2900,
        coverImage: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1200&auto=format&fit=crop',
        rating: 4.91,
        overview: 'Visit the 57th-floor Sands SkyPark Deck overlooking Marina Bay plus access to Flower Dome & Cloud Forest Supertrees.',
        highlights: ['57th Floor Observation Deck', 'Gardens by the Bay Flower Dome', 'Cloud Forest Indoor Waterfall', 'Supertree Grove Light Show'],
        inclusions: ['SkyPark Ticket', 'Double Conservatory Ticket'],
        exclusions: ['OCBC Skyway Aerial Walk Ticket'],
        location: 'Marina Bay Sands, Singapore',
        featured: true,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-118',
        title: 'Golden Hands Bridge & Da Nang Cable Car Pass',
        slug: 'golden-hands-bridge-vietnam',
        destinationName: 'Da Nang, Vietnam',
        category: 'Sightseeing',
        duration: 'Full Day Pass',
        startingPrice: 3100,
        discountPrice: 3800,
        coverImage: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1200&auto=format&fit=crop',
        rating: 4.93,
        overview: 'Ride the Guinness World Record cable car up Ba Na Hills to walk on the famous Golden Bridge held by colossal stone hands.',
        highlights: ['Golden Bridge Giant Hands Walk', 'World Record Ba Na Hills Cable Car', 'French Village Architecture', 'Fantasy Park Rides'],
        inclusions: ['Roundtrip Cable Car Ticket', 'Golden Bridge Access', 'Fantasy Park Pass'],
        exclusions: ['Wax Museum Ticket'],
        location: 'Ba Na Hills, Da Nang',
        featured: false,
        status: 'Active'
      },
      {
        activityCode: 'ACT-HC-119',
        title: 'Goa Mandovi River Sunset Dance Cruise',
        slug: 'mandovi-river-sunset-cruise-goa',
        destination: goaDest._id,
        destinationName: 'Panjim, Goa',
        category: 'Sightseeing',
        duration: '1 Hour',
        startingPrice: 650,
        discountPrice: 850,
        coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
        rating: 4.85,
        overview: 'Leisurely 1-hour evening boat cruise on Mandovi River with traditional Goan Fugdi dance, live DJ music, and sunset river views.',
        highlights: ['Goan Folk Cultural Dance', 'Live DJ Music & Dancing Deck', 'Sunset Mandovi River Panorama', 'Panjim Floating Casino Views'],
        inclusions: ['1-Hour Boat Cruise Entry', 'Cultural Dance Performance'],
        exclusions: ['Food & Beverages on Board'],
        location: 'Santa Monica Jetty, Panjim',
        featured: false,
        status: 'Active'
      }
    ]);

    // SEED 7 CUSTOMER ENQUIRIES (LEADS)
    await Enquiry.deleteMany({});
    const VALID_ENQUIRY_STATUS = ['New', 'Contacted', 'FollowupPending', 'QuotationSent', 'Negotiation', 'Confirmed', 'Cancelled', 'Lost', 'Completed'];
    const enquirySeeds = [
      {
        fullName: 'Ramesh Kumar',
        email: 'ramesh.kumar@gmail.com',
        mobile: '+91 98490 12345',
        destination: telaganaDest._id,
        travelDate: new Date('2026-08-25'),
        adults: 2,
        children: 1,
        budget: 35000,
        status: 'New',
        priority: 'High',
        message: 'Interested in family package with Ramoji Film City pass and 4-star stay.'
      },
      {
        fullName: 'Sunita Verma',
        email: 'sunita.v@outlook.com',
        mobile: '+91 97012 88452',
        destination: keralaDest._id,
        travelDate: new Date('2026-09-10'),
        adults: 2,
        children: 0,
        budget: 48000,
        status: 'Contacted',
        priority: 'Urgent',
        message: 'Looking for honeymoon villa in Munnar with private pool and Alleppey luxury houseboat.'
      },
      {
        fullName: 'Amit Patel',
        email: 'amit.patel@techcorp.in',
        mobile: '+91 99887 65432',
        destination: maldivesDest._id,
        travelDate: new Date('2026-10-05'),
        adults: 2,
        children: 0,
        budget: 185000,
        status: 'Qualified',
        priority: 'High',
        message: 'Require all-inclusive resort with speed boat transfer and sunset dinner.'
      },
      {
        fullName: 'Priya Sharma',
        email: 'priya.sharma@yahoo.com',
        mobile: '+91 98112 34567',
        destination: himachalDest._id,
        travelDate: new Date('2026-11-20'),
        adults: 4,
        children: 2,
        budget: 65000,
        status: 'Converted',
        priority: 'Medium',
        message: 'Family vacation requesting Rohtang Pass permit and local AC Volvo transport.'
      },
      {
        fullName: 'Vikram Singh',
        email: 'vikram.singh@gmail.com',
        mobile: '+91 96543 21098',
        destination: rajasthanDest._id,
        travelDate: new Date('2026-11-15'),
        adults: 3,
        children: 1,
        budget: 55000,
        status: 'New',
        priority: 'Medium',
        message: 'Interested in Jaisalmer desert camel safari and heritage palace stays.'
      },
      {
        fullName: 'Ananya Roy',
        email: 'ananya.roy@gmail.com',
        mobile: '+91 98300 44556',
        destination: singaporeDest._id,
        travelDate: new Date('2026-12-01'),
        adults: 2,
        children: 1,
        budget: 120000,
        status: 'Contacted',
        priority: 'High',
        message: 'Universal Studios express pass + Marina Bay Sands skypark entry needed.'
      },
      {
        fullName: 'Rajesh Naidu',
        email: 'rajesh.naidu@gmail.com',
        mobile: '+91 94401 98765',
        destination: baliDest._id,
        travelDate: new Date('2026-09-25'),
        adults: 2,
        children: 0,
        budget: 95000,
        status: 'Qualified',
        priority: 'Medium',
        message: 'Ubud jungle resort + Seminyak beach club pass.'
      }
    ];
    await Enquiry.create(
      enquirySeeds.map((e, i) => ({
        ...e,
        enquiryId: `HC-2026-${1001 + i}`,
        status: VALID_ENQUIRY_STATUS.includes(e.status) ? e.status : 'Contacted',
      }))
    );

    console.log('[Seed] Database seeded with packages for ALL destinations including Telangana!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seed();
