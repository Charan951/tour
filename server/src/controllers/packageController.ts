import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Package } from '../models/Package.js';
import { Destination } from '../models/Destination.js';
import { AuthRequest } from '../middleware/auth.js';
import { emitCreate, emitUpdate, emitDelete } from '../config/socketEvents.js';

export const getPackages = async (req: Request, res: Response) => {
  try {
    const { search, destination, category, theme, minPrice, maxPrice, featured, trending, page = 1, limit = 50 } = req.query;

    const query: any = { isDeleted: false };


    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { packageCode: { $regex: search, $options: 'i' } },
        { highlights: { $regex: search, $options: 'i' } }
      ];
    }

    if (destination) {
      const destStr = (destination as string).trim();
      if (mongoose.Types.ObjectId.isValid(destStr)) {
        const destDoc = await Destination.findById(destStr).lean();
        const cleanName = (destDoc?.name || '').split(',')[0].trim();
        const searchTerms = [cleanName, destDoc?.slug].filter(Boolean) as string[];
        const nameRegexes = searchTerms.map(t => new RegExp(t, 'i'));

        query.$or = [
          { destination: destStr },
          ...(nameRegexes.length > 0 ? [
            { title: { $in: nameRegexes } },
            { overview: { $in: nameRegexes } }
          ] : [])
        ];
      } else {
        const cleanName = destStr.split(',')[0].trim();
        const matchingDests = await Destination.find({
          isDeleted: false,
          $or: [
            { slug: { $regex: destStr, $options: 'i' } },
            { name: { $regex: cleanName, $options: 'i' } }
          ]
        }).select('_id name').lean();

        const destIds = matchingDests.map(d => d._id);
        const destNames = matchingDests.map(d => d.name);

        query.$or = [
          ...(destIds.length > 0 ? [{ destination: { $in: destIds } }] : []),
          { title: { $regex: cleanName, $options: 'i' } },
          { overview: { $regex: cleanName, $options: 'i' } },
          ...destNames.map(n => ({ title: { $regex: n.split(',')[0].trim(), $options: 'i' } })),
          ...destNames.map(n => ({ overview: { $regex: n.split(',')[0].trim(), $options: 'i' } }))
        ];
      }
    }
    if (category) {
      if (category === 'Domestic' || category === 'International') {
        const isDom = category === 'Domestic';
        const matchingDests = await Destination.find({
          isDeleted: false,
          $or: [
            { category },
            { isDomestic: isDom }
          ]
        }).select('_id').lean();
        const destIds = matchingDests.map((d) => d._id);
        query.destination = { $in: destIds };
      } else if (mongoose.Types.ObjectId.isValid(category as string)) {
        query.category = category;
      }
    }

    if (theme) {
      if (mongoose.Types.ObjectId.isValid(theme as string)) {
        query.$or = [
          { theme: theme },
          { themeName: { $regex: theme as string, $options: 'i' } }
        ];
      } else {
        const themeStr = (theme as string).trim();
        const cleanTheme = themeStr.replace(/tour/gi, '').trim();
        const keywords = cleanTheme.split(/\s+/).filter((k) => k.length > 2);

        query.$or = [
          { themeName: { $regex: themeStr, $options: 'i' } },
          { themeName: { $regex: cleanTheme, $options: 'i' } },
          { title: { $regex: cleanTheme, $options: 'i' } },
          { overview: { $regex: cleanTheme, $options: 'i' } },
          { highlights: { $regex: cleanTheme, $options: 'i' } },
          ...keywords.map((kw) => ({ title: { $regex: kw, $options: 'i' } })),
          ...keywords.map((kw) => ({ highlights: { $regex: kw, $options: 'i' } })),
          ...keywords.map((kw) => ({ overview: { $regex: kw, $options: 'i' } }))
        ];
      }
    }

    if (featured) query.featured = featured === 'true';
    if (trending) query.trending = trending === 'true';


    if (minPrice || maxPrice) {
      query.startingPrice = {};
      if (minPrice) query.startingPrice.$gte = Number(minPrice);
      if (maxPrice) query.startingPrice.$lte = Number(maxPrice);
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit as string) || 50), 100);
    const skip = (pageNum - 1) * limitNum;

    const total = await Package.countDocuments(query);
    const packages = await Package.find(query)
      .populate('destination', 'name slug banner country state')
      .populate('category', 'name slug')
      .populate('theme', 'name slug icon')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();


    return res.status(200).json({
      success: true,
      message: 'Packages fetched successfully',
      data: packages,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPackageBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const tourPackage = await Package.findOne({ slug, isDeleted: false })
      .populate({
        path: 'destination',
        populate: [{ path: 'country' }, { path: 'state' }]
      })
      .populate('category')
      .populate('theme');

    if (!tourPackage) {
      return res.status(404).json({ success: false, message: 'Tour package not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Package details fetched',
      data: tourPackage
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createPackage = async (req: AuthRequest, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.title || !payload.title.trim()) {
      return res.status(400).json({ success: false, message: 'Package title is required' });
    }

    if (!payload.destination || !mongoose.Types.ObjectId.isValid(payload.destination)) {
      return res.status(400).json({ success: false, message: 'Please select a valid Destination' });
    }

    const count = await Package.countDocuments();
    let baseCode = payload.packageCode || `PKG-HC-${(count + 1001).toString()}`;
    let packageCode = baseCode;
    let codeAttempts = 0;
    while ((await Package.findOne({ packageCode })) && codeAttempts < 10) {
      codeAttempts++;
      packageCode = `PKG-HC-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    let baseSlug = (payload.slug || payload.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!baseSlug) baseSlug = `pkg-${Date.now().toString().slice(-4)}`;

    let slug = baseSlug;
    let slugAttempts = 0;
    while ((await Package.findOne({ slug })) && slugAttempts < 10) {
      slugAttempts++;
      slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const sanitizedItinerary = Array.isArray(payload.itinerary) && payload.itinerary.length > 0
      ? payload.itinerary.map((item: any, idx: number) => ({
          day: item.day || idx + 1,
          title: item.title || `Day ${idx + 1}`,
          description: item.description || 'Day itinerary details.',
          hotel: item.hotel || '',
          activities: item.activities || []
        }))
      : [
          {
            day: 1,
            title: 'Day 1: Arrival & Transfer',
            description: 'Arrival at destination, transfer to pre-booked hotel and evening free for leisure.',
            hotel: '',
            activities: []
          }
        ];

    const newPackage = await Package.create({
      title: payload.title.trim(),
      packageCode,
      slug,
      destination: payload.destination,
      themeName: payload.themeName || 'Leisure',
      startingPrice: Number(payload.startingPrice) || 25000,
      discountPrice: payload.discountPrice ? Number(payload.discountPrice) : undefined,
      duration: {
        nights: Number(payload.duration?.nights) || 3,
        days: Number(payload.duration?.days) || 4
      },
      coverImage: payload.coverImage || 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop',
      gallery: Array.isArray(payload.gallery)
        ? payload.gallery.filter((u: any) => typeof u === 'string' && u.trim())
        : (Array.isArray(payload.images)
            ? payload.images.filter((u: any) => typeof u === 'string' && u.trim())
            : []),
      overview: payload.overview || '',
      highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
      inclusions: Array.isArray(payload.inclusions) ? payload.inclusions : [],
      exclusions: Array.isArray(payload.exclusions) ? payload.exclusions : [],
      itinerary: sanitizedItinerary,
      featured: payload.featured !== false,
      createdBy: req.user?.id
    });

    const populatedPackage = await Package.findById(newPackage._id)
      .populate('destination', 'name slug banner country state')
      .lean();

    // ✅ Emit real-time event to all connected clients
    emitCreate('Package', populatedPackage, 'general_updates');

    return res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: populatedPackage
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `A package with this ${duplicateField} already exists. Please use a unique ${duplicateField}.`
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePackage = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string || '');
    const payload = req.body;

    if (Array.isArray(payload.itinerary) && payload.itinerary.length > 0) {
      payload.itinerary = payload.itinerary.map((item: any, idx: number) => ({
        day: item.day || idx + 1,
        title: item.title || `Day ${idx + 1}`,
        description: item.description || 'Day itinerary details.',
        hotel: item.hotel || '',
        activities: item.activities || []
      }));
    }

    let tourPackage: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      tourPackage = await Package.findByIdAndUpdate(
        id,
        { ...payload, updatedBy: req.user?.id },
        { new: true, runValidators: false }
      ).populate('destination', 'name slug banner country state').lean();
    }

    if (!tourPackage) {
      const search = payload.packageCode ? { packageCode: payload.packageCode } : { title: payload.title };
      const existing = await Package.findOne(search);
      if (existing) {
        Object.assign(existing, payload);
        await existing.save();
        tourPackage = existing.toObject();
      } else {
        let baseSlug = (payload.slug || payload.title || 'package').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const created = await Package.create({
          packageCode: payload.packageCode || `PKG-${Date.now().toString().slice(-4)}`,
          title: payload.title || 'New Tour Package',
          slug: `${baseSlug}-${Date.now().toString().slice(-4)}`,
          destination: payload.destination,
          duration: payload.duration || '3 Days / 2 Nights',
          price: payload.price || 9999,
          originalPrice: payload.originalPrice || 12999,
          category: payload.category || 'Domestic',
          overview: payload.overview || 'Amazing holiday package.',
          highlights: payload.highlights || [],
          itinerary: payload.itinerary || [],
          inclusions: payload.inclusions || [],
          exclusions: payload.exclusions || [],
          images: payload.images || ['https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200'],
          pricingTiers: payload.pricingTiers || [],
          isFeatured: payload.isFeatured !== false,
          status: 'Active',
          isDeleted: false
        });
        tourPackage = created.toObject();
      }
    }

    // ✅ Emit real-time event to all connected clients
    emitUpdate('Package', tourPackage, 'general_updates');

    return res.status(200).json({
      success: true,
      message: 'Package updated successfully',
      data: tourPackage
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `A package with this ${duplicateField} already exists.`
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePackage = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      await Package.findByIdAndDelete(id);
    } else {
      await Package.deleteMany({ $or: [{ packageCode: id }, { title: id }] });
    }

    // ✅ Emit real-time deletion event to all connected clients
    emitDelete('Package', id, 'general_updates');

    return res.status(200).json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


