import { Request, Response } from 'express';
import { ThemeBanner } from '../models/ThemeBanner.js';
import { AuthRequest } from '../middleware/auth.js';

export const getThemeBanners = async (req: Request, res: Response) => {
  try {
    const banners = await ThemeBanner.find({ active: true });
    return res.status(200).json({
      success: true,
      message: 'Theme banners fetched successfully',
      data: banners
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertThemeBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { themeName, imageUrl, description } = req.body;
    if (!themeName || !imageUrl) {
      return res.status(400).json({ success: false, message: 'themeName and imageUrl are required' });
    }

    const banner = await ThemeBanner.findOneAndUpdate(
      { themeName },
      { themeName, imageUrl, description, active: true },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Theme banner saved successfully',
      data: banner
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteThemeBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await ThemeBanner.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Theme banner deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
