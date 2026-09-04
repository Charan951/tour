import { Request, Response } from 'express';
import { Category } from '../models/Category.js';

const INITIAL_SEED_CATEGORIES = [
  { name: 'Adventure', slug: 'adventure', icon: '🧗', description: 'Thrilling outdoor activities like rock climbing, bungee jumping & ziplining', displayOrder: 1 },
  { name: 'Water Sports', slug: 'water-sports', icon: '🤿', description: 'Scuba diving, snorkeling, jet skiing & white water river rafting', displayOrder: 2 },
  { name: 'Air Sports', slug: 'air-sports', icon: '🪂', description: 'Tandem paragliding, skydiving, hot air ballooning & helicopter rides', displayOrder: 3 },
  { name: 'Safari', slug: 'safari', icon: '🦁', description: 'Desert dune buggies, jeep wildlife safaris & jungle expeditions', displayOrder: 4 },
  { name: 'Trekking', slug: 'trekking', icon: '🥾', description: 'Guided mountain trails, alpine valley hikes & forest treks', displayOrder: 5 },
  { name: 'Sightseeing', slug: 'sightseeing', icon: '📸', description: 'Panoramic city tours, island hopping cruises & cable car rides', displayOrder: 6 },
  { name: 'Theme Park', slug: 'theme-park', icon: '🎡', description: 'Aqua water parks, rollercoasters & family amusement passes', displayOrder: 7 }
];

export const getCategories = async (req: Request, res: Response) => {
  try {
    let categories = await Category.find({ isDeleted: false }).sort({ displayOrder: 1, createdAt: -1 });

    // Seed defaults if database is empty
    if (categories.length === 0) {
      await Category.insertMany(INITIAL_SEED_CATEGORIES);
      categories = await Category.find({ isDeleted: false }).sort({ displayOrder: 1, createdAt: -1 });
    }

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching categories' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, icon, description, coverImage, type, displayOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await Category.findOne({ $or: [{ name: name.trim() }, { slug }], isDeleted: false });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      icon: icon || '⚡',
      description: description || '',
      coverImage: coverImage || '',
      type: type || 'activity',
      displayOrder: displayOrder ? parseInt(displayOrder) : 0
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create category' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, icon, description, coverImage, type, displayOrder, status } = req.body;

    const category = await Category.findOne({ _id: id, isDeleted: false });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name && name.trim()) {
      category.name = name.trim();
      category.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    if (icon !== undefined) category.icon = icon;
    if (description !== undefined) category.description = description;
    if (coverImage !== undefined) category.coverImage = coverImage;
    if (type !== undefined) category.type = type;
    if (displayOrder !== undefined) category.displayOrder = parseInt(displayOrder);
    if (status !== undefined) category.status = status;

    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update category' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({ _id: id, isDeleted: false });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.isDeleted = true;
    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};
