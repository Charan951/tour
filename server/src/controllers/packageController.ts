import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Package } from '../models/Package.js';
import { Destination } from '../models/Destination.js';
import { AuthRequest } from '../middleware/auth.js';

export const getPackages = async (req: Request, res: Response) => {
  try {
    const { search, destination, category, theme, minPrice, maxPrice, featured, trending, page = 1, limit = 12 } = req.query;

    const query: any = { status: 'Active', isDeleted: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { packageCode: { $regex: search, $options: 'i' } },
        { highlights: { $regex: search, $options: 'i' } }
      ];
    }

    if (destination) {
      if (mongoose.Types.ObjectId.isValid(destination as string)) {
        query.destination = destination;
      } else {
        const foundDest = await Destination.findOne({
          $or: [
            { slug: destination as string },
            { name: { $regex: destination as string, $options: 'i' } }
          ]
        });
        if (foundDest) {
          query.destination = foundDest._id;
        } else {
          query.destination = null;
        }
      }
    }
    if (category) query.category = category;
    if (theme) query.theme = theme;
    if (featured) query.featured = featured === 'true';
    if (trending) query.trending = trending === 'true';

    if (minPrice || maxPrice) {
      query.startingPrice = {};
      if (minPrice) query.startingPrice.$gte = Number(minPrice);
      if (maxPrice) query.startingPrice.$lte = Number(maxPrice);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const total = await Package.countDocuments(query);
    const packages = await Package.find(query)
      .populate('destination', 'name slug banner country state')
      .populate('category', 'name slug')
      .populate('theme', 'name slug icon')
      .sort({ featured: -1, createdAt: -1 })
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
    const count = await Package.countDocuments();
    const packageCode = payload.packageCode || `PKG-HC-${(count + 101).toString()}`;
    const slug = payload.slug || payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newPackage = await Package.create({
      ...payload,
      packageCode,
      slug,
      createdBy: req.user?.id
    });

    return res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: newPackage
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const tourPackage = await Package.findByIdAndUpdate(
      id,
      { ...payload, updatedBy: req.user?.id },
      { new: true, runValidators: true }
    );

    if (!tourPackage) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Package updated successfully',
      data: tourPackage
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tourPackage = await Package.findById(id);

    if (!tourPackage) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    tourPackage.isDeleted = true;
    tourPackage.deletedAt = new Date();
    tourPackage.deletedBy = req.user?.id as any;
    await tourPackage.save();

    return res.status(200).json({
      success: true,
      message: 'Package soft-deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
