import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Activity } from '../models/Activity.js';
import { Destination } from '../models/Destination.js';
import { AuthRequest } from '../middleware/auth.js';
import { emitCreate, emitUpdate, emitDelete } from '../config/socketEvents.js';

export const getActivities = async (req: Request, res: Response) => {
  try {
    const { search, destination, category, minPrice, maxPrice, featured, page = 1, limit = 1000 } = req.query;

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { activityCode: { $regex: search, $options: 'i' } },
        { overview: { $regex: search, $options: 'i' } },
        { highlights: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
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
            { destinationName: { $in: nameRegexes } },
            { location: { $in: nameRegexes } }
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
          { destinationName: { $regex: cleanName, $options: 'i' } },
          { location: { $regex: cleanName, $options: 'i' } },
          ...destNames.map(n => ({ destinationName: { $regex: n.split(',')[0].trim(), $options: 'i' } })),
          ...destNames.map(n => ({ location: { $regex: n.split(',')[0].trim(), $options: 'i' } }))
        ];
      }
    }

    if (category) {
      query.category = { $regex: category as string, $options: 'i' };
    }

    if (featured) query.featured = featured === 'true';

    if (minPrice || maxPrice) {
      query.startingPrice = {};
      if (minPrice) query.startingPrice.$gte = Number(minPrice);
      if (maxPrice) query.startingPrice.$lte = Number(maxPrice);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const total = await Activity.countDocuments(query);
    const activities = await Activity.find(query)
      .populate('destination', 'name slug banner country state')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Activities fetched successfully',
      data: activities,
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

export const getActivityBySlug = async (req: Request, res: Response) => {
  try {
    const slugStr = (req.params.slug as string) || '';
    let activity = null;
    if (mongoose.Types.ObjectId.isValid(slugStr)) {
      activity = await Activity.findOne({ _id: slugStr, isDeleted: false }).populate('destination');
    }
    if (!activity) {
      activity = await Activity.findOne({ slug: slugStr, isDeleted: false }).populate('destination');
    }

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Activity details fetched successfully',
      data: activity
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createActivity = async (req: AuthRequest, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.title || !payload.title.trim()) {
      return res.status(400).json({ success: false, message: 'Activity title is required' });
    }

    const count = await Activity.countDocuments();
    let baseCode = payload.activityCode || `ACT-HC-${(count + 101).toString()}`;
    let activityCode = baseCode;
    let codeAttempts = 0;
    while ((await Activity.findOne({ activityCode })) && codeAttempts < 10) {
      codeAttempts++;
      activityCode = `ACT-HC-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    let baseSlug = (payload.slug || payload.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!baseSlug) baseSlug = `act-${Date.now().toString().slice(-4)}`;

    let slug = baseSlug;
    let slugAttempts = 0;
    while ((await Activity.findOne({ slug })) && slugAttempts < 10) {
      slugAttempts++;
      slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    let destinationName = payload.destinationName || '';
    if (payload.destination && mongoose.Types.ObjectId.isValid(payload.destination)) {
      const dest = await Destination.findById(payload.destination).lean();
      if (dest) destinationName = dest.name;
    }

    const newActivity = await Activity.create({
      title: payload.title.trim(),
      activityCode,
      slug,
      destination: payload.destination && mongoose.Types.ObjectId.isValid(payload.destination) ? payload.destination : null,
      destinationName,
      category: payload.category || 'Adventure',
      duration: payload.duration || '2 Hours',
      startingPrice: Number(payload.startingPrice) || 1500,
      discountPrice: payload.discountPrice ? Number(payload.discountPrice) : undefined,
      coverImage: payload.coverImage || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
      gallery: Array.isArray(payload.gallery) ? payload.gallery : [],
      overview: payload.overview || '',
      highlights: Array.isArray(payload.highlights) ? payload.highlights : (payload.highlights ? payload.highlights.split(',').map((s: string) => s.trim()) : []),
      inclusions: Array.isArray(payload.inclusions) ? payload.inclusions : (payload.inclusions ? payload.inclusions.split(',').map((s: string) => s.trim()) : []),
      exclusions: Array.isArray(payload.exclusions) ? payload.exclusions : (payload.exclusions ? payload.exclusions.split(',').map((s: string) => s.trim()) : []),
      location: payload.location || '',
      featured: payload.featured !== false,
      createdBy: req.user?.id
    });

    const populatedActivity = await Activity.findById(newActivity._id)
      .populate('destination', 'name slug banner country state')
      .lean();

    emitCreate('Activity', populatedActivity, 'general_updates');

    return res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: populatedActivity
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `An activity with this ${duplicateField} already exists.`
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateActivity = async (req: AuthRequest, res: Response) => {
  try {
    const activityId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string) || '';
    const payload = req.body;

    if (payload.destination && mongoose.Types.ObjectId.isValid(payload.destination)) {
      const dest = await Destination.findById(payload.destination).lean();
      if (dest) payload.destinationName = dest.name;
    }

    if (typeof payload.highlights === 'string') {
      payload.highlights = payload.highlights.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (typeof payload.inclusions === 'string') {
      payload.inclusions = payload.inclusions.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (typeof payload.exclusions === 'string') {
      payload.exclusions = payload.exclusions.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    const titleStr = typeof payload.title === 'string' ? payload.title : '';

    let filter: any;
    if (mongoose.Types.ObjectId.isValid(activityId)) {
      filter = { _id: activityId };
    } else {
      filter = { $or: [{ slug: activityId }, { activityCode: activityId }, { title: titleStr }] };
    }

    let activity = await Activity.findOneAndUpdate(
      filter,
      { ...payload, updatedBy: req.user?.id },
      { new: true, runValidators: false }
    ).populate('destination', 'name slug banner country state').lean();

    // If updating a fallback activity not yet stored in DB, persist it into MongoDB
    if (!activity && !mongoose.Types.ObjectId.isValid(activityId)) {
      const count = await Activity.countDocuments();
      const activityCode = typeof payload.activityCode === 'string' ? payload.activityCode : `ACT-HC-${(count + 101).toString()}`;
      const baseSlug = (typeof payload.slug === 'string' ? payload.slug : titleStr || activityId);
      const slug = baseSlug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const newAct = await Activity.create({
        ...payload,
        activityCode,
        slug,
        title: titleStr || 'Activity',
        coverImage: payload.coverImage || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
        startingPrice: Number(payload.startingPrice) || 1500,
        createdBy: req.user?.id
      });

      activity = await Activity.findById(newAct._id)
        .populate('destination', 'name slug banner country state')
        .lean();
    }

    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    emitUpdate('Activity', activity, 'general_updates');

    return res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      data: activity
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteActivity = async (req: AuthRequest, res: Response) => {
  try {
    const activityId = (req.params.id as string) || '';

    let filter: any;
    if (mongoose.Types.ObjectId.isValid(activityId)) {
      filter = { _id: activityId };
    } else {
      filter = { $or: [{ slug: activityId }, { activityCode: activityId }] };
    }

    await Activity.deleteMany(filter);

    emitDelete('Activity', activityId, 'general_updates');

    return res.status(200).json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
