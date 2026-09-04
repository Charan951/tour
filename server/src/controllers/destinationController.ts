import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Destination, Country, State, City } from '../models/Destination.js';
import { Package } from '../models/Package.js';
import { AuthRequest } from '../middleware/auth.js';
import { emitCreate, emitUpdate, emitDelete } from '../config/socketEvents.js';

const resolveCountryAndState = async (payload: any) => {
  let countryId = mongoose.Types.ObjectId.isValid(payload.country) ? payload.country : null;
  let stateId = mongoose.Types.ObjectId.isValid(payload.state) ? payload.state : null;

  if (!countryId) {
    const cName = payload.countryName || 'India';
    let foundCountry = await Country.findOne({ name: { $regex: new RegExp(`^${cName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    if (!foundCountry) {
      foundCountry = await Country.findOne({});
    }
    if (foundCountry) {
      countryId = foundCountry._id;
    }
  }

  if (!stateId) {
    const sName = payload.stateName || payload.name;
    let foundState = await State.findOne({ name: { $regex: new RegExp(`^${sName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    if (!foundState && countryId) {
      foundState = await State.findOne({ country: countryId });
    }
    if (!foundState) {
      foundState = await State.findOne({});
    }
    if (foundState) {
      stateId = foundState._id;
    }
  }

  return {
    countryId: countryId || null,
    stateId: stateId || null
  };
};

export const getDestinations = async (req: Request, res: Response) => {
  try {
    const { search, featured, category } = req.query;
    const query: any = { isDeleted: false };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (featured) {
      query.featured = featured === 'true';
    }
    if (category) {
      if (category === 'Domestic') {
        query.$or = [{ category: 'Domestic' }, { isDomestic: true }];
      } else if (category === 'International') {
        query.$or = [{ category: 'International' }, { isDomestic: false }];
      } else {
        query.category = category;
      }
    }

    const destinations = await Destination.find(query)
      .populate('country', 'name slug isoCode')
      .populate('state', 'name slug')
      .sort({ createdAt: -1 })
      .lean();


    const destinationsWithCount = await Promise.all(
      destinations.map(async (dest) => {
        const count = await Package.countDocuments({
          destination: dest._id,
          status: 'Active',
          isDeleted: false
        });
        return {
          ...dest,
          packageCount: count
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Destinations fetched successfully',
      data: destinationsWithCount
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDestinationBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const destination = await Destination.findOne({ slug, isDeleted: false })
      .populate('country')
      .populate('state')
      .populate('city')
      .lean();

    if (!destination) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }

    const packageCount = await Package.countDocuments({
      destination: destination._id,
      status: 'Active',
      isDeleted: false
    });

    return res.status(200).json({
      success: true,
      message: 'Destination details fetched',
      data: {
        ...destination,
        packageCount
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createDestination = async (req: AuthRequest, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.name || !payload.name.trim()) {
      return res.status(400).json({ success: false, message: 'Destination name is required' });
    }

    let baseSlug = (payload.slug || payload.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!baseSlug) baseSlug = `dest-${Date.now().toString().slice(-4)}`;

    let slug = baseSlug;
    let attempts = 0;
    while ((await Destination.findOne({ slug })) && attempts < 10) {
      attempts++;
      slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const { countryId, stateId } = await resolveCountryAndState(payload);

    const destination = await Destination.create({
      name: payload.name.trim(),
      slug,
      category: payload.category || 'Domestic',
      isDomestic: payload.category === 'Domestic' || payload.isDomestic !== false,
      countryName: payload.countryName || 'India',
      country: countryId,
      state: stateId,
      banner: payload.banner || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop',
      shortDescription: payload.shortDescription || '',
      bestTime: payload.bestTime || 'Nov - Feb',
      weather: payload.weather || 'Pleasant Tropical Breezes',
      featured: payload.featured !== false,
      createdBy: req.user?.id
    });

    // ✅ Emit real-time event to all connected clients
    emitCreate('Destination', destination.toObject(), 'general_updates');

    return res.status(201).json({
      success: true,
      message: 'Destination created successfully',
      data: destination
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `A destination with this ${duplicateField} already exists. Please use a unique ${duplicateField}.`
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDestination = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string || '');
    const payload = req.body;

    const { countryId, stateId } = await resolveCountryAndState(payload);

    const updateData: any = {
      ...payload,
      updatedBy: req.user?.id
    };
    if (countryId) updateData.country = countryId;
    if (stateId) updateData.state = stateId;

    let destination: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      destination = await Destination.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: false }
      );
    }

    if (!destination) {
      const search = payload.slug ? { slug: payload.slug } : { name: payload.name };
      const existing = await Destination.findOne(search);
      if (existing) {
        Object.assign(existing, updateData);
        await existing.save();
        destination = existing;
      } else {
        let baseSlug = (payload.slug || payload.name || 'dest').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        destination = await Destination.create({
          name: payload.name || 'New Destination',
          slug: `${baseSlug}-${Date.now().toString().slice(-4)}`,
          category: payload.category || 'Domestic',
          isDomestic: payload.category === 'Domestic' || payload.isDomestic !== false,
          countryName: payload.countryName || 'India',
          country: countryId,
          state: stateId,
          banner: payload.banner || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200',
          shortDescription: payload.shortDescription || '',
          bestTime: payload.bestTime || 'Nov - Feb',
          weather: payload.weather || 'Pleasant',
          featured: payload.featured !== false
        });
      }
    }

    const resultObj = typeof destination.toObject === 'function' ? destination.toObject() : destination;

    // ✅ Emit real-time event to all connected clients
    emitUpdate('Destination', resultObj, 'general_updates');

    return res.status(200).json({
      success: true,
      message: 'Destination updated successfully',
      data: destination
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `A destination with this ${duplicateField} already exists.`
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDestination = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string || '');
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      await Destination.findByIdAndDelete(id);
    } else {
      await Destination.deleteMany({ $or: [{ slug: id }, { name: id }] });
    }

    // ✅ Emit real-time deletion event to all connected clients
    emitDelete('Destination', id, 'general_updates');

    return res.status(200).json({
      success: true,
      message: 'Destination deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


