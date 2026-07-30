import { Request, Response } from 'express';
import { Banner } from '../models/Banner.js';
import { AuthRequest } from '../middleware/auth.js';

export const getBanners = async (req: Request, res: Response) => {
  try {
    const { targetSection, destination } = req.query;
    const query: any = { active: true, isDeleted: false };
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
    const banner = await Banner.create(payload);
    return res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
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
    const banner = await Banner.findById(id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    banner.isDeleted = true;
    await banner.save();
    return res.status(200).json({ success: true, message: 'Banner soft-deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
