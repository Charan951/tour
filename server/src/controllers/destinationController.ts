import { Request, Response } from 'express';
import { Destination, Country, State, City } from '../models/Destination.js';
import { Package } from '../models/Package.js';
import { AuthRequest } from '../middleware/auth.js';

export const getDestinations = async (req: Request, res: Response) => {
  try {
    const { search, featured, category } = req.query;
    const query: any = { status: 'Active', isDeleted: false };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (featured) {
      query.featured = featured === 'true';
    }

    const destinations = await Destination.find(query)
      .populate('country', 'name slug isoCode')
      .populate('state', 'name slug')
      .sort({ featured: -1, name: 1 })
      .lean();

    // Compute dynamic package count per destination
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
    const slug = payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const destination = await Destination.create({
      ...payload,
      slug,
      createdBy: req.user?.id
    });

    return res.status(201).json({
      success: true,
      message: 'Destination created successfully',
      data: destination
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDestination = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const destination = await Destination.findByIdAndUpdate(
      id,
      { ...payload, updatedBy: req.user?.id },
      { new: true, runValidators: true }
    );

    if (!destination) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Destination updated successfully',
      data: destination
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDestination = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const destination = await Destination.findById(id);

    if (!destination) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }

    destination.isDeleted = true;
    destination.deletedAt = new Date();
    destination.deletedBy = req.user?.id as any;
    await destination.save();

    return res.status(200).json({
      success: true,
      message: 'Destination soft-deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
