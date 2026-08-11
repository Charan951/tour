import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Banner } from '../models/Banner.js';
import { AuthRequest } from '../middleware/auth.js';


export const getBanners = async (req: Request, res: Response) => {
  try {
    const { targetSection, destination } = req.query;
    const query: any = { isDeleted: false };
    if (targetSection) query.targetSection = targetSection;
    if (destination) query.destination = destination;

    const banners = await Banner.find(query)
      .populate('destination', 'name slug banner')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Banners fetched successfully',
      data: banners
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createBanner = async (req: AuthRequest, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.title || !payload.title.trim()) {
      return res.status(400).json({ success: false, message: 'Banner title is required' });
    }
    if (!payload.imageUrl || !payload.imageUrl.trim()) {
      return res.status(400).json({ success: false, message: 'Banner image URL is required' });
    }

    const destinationId = payload.destination && mongoose.Types.ObjectId.isValid(payload.destination) ? payload.destination : null;

    const banner = await Banner.create({
      title: payload.title.trim(),
      imageUrl: payload.imageUrl.trim(),
      destination: destinationId,
      linkUrl: payload.linkUrl || '',
      offerText: payload.offerText || 'Limited Offer',
      priceText: payload.priceText || '₹8,500 Per Person',
      durationText: payload.durationText || '03 Night / 04 Days',
      targetSection: payload.targetSection || 'OfferCard',
      active: true,
      isDeleted: false
    });

    const populatedBanner = await Banner.findById(banner._id)
      .populate('destination', 'name slug')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: populatedBanner
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    if (payload.destination !== undefined) {
      payload.destination = payload.destination && mongoose.Types.ObjectId.isValid(payload.destination) ? payload.destination : null;
    }

    const banner = await Banner.findByIdAndUpdate(id, payload, { new: true, runValidators: false })
      .populate('destination', 'name slug')
      .lean();

    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    return res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: banner
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const deleteBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    return res.status(200).json({ success: true, message: 'Banner deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


