import { Request, Response } from 'express';
import { Blog, Testimonial, FAQ, Newsletter, ContactMessage, Setting } from '../models/CMS.js';
import { AuthRequest } from '../middleware/auth.js';

// --- BLOGS ---
export const getBlogs = async (req: Request, res: Response) => {
  try {
    const { category, search, page = 1, limit = 9 } = req.query;
    const query: any = { status: 'Published', isDeleted: false };
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const total = await Blog.countDocuments(query);
    const blogs = await Blog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);

    return res.status(200).json({
      success: true,
      message: 'Blogs fetched',
      data: blogs,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBlogBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, isDeleted: false });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog article not found' });
    blog.views = (blog.views || 0) + 1;
    await blog.save();
    return res.status(200).json({ success: true, message: 'Blog fetched', data: blog });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createBlog = async (req: AuthRequest, res: Response) => {
  try {
    const payload = req.body;
    const slug = payload.slug || payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const blog = await Blog.create({ ...payload, slug });
    return res.status(201).json({ success: true, message: 'Blog post created', data: blog });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBlog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    return res.status(200).json({ success: true, message: 'Blog updated', data: blog });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBlog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog article not found' });
    return res.status(200).json({ success: true, message: 'Blog deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// --- TESTIMONIALS ---
export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find({ isDeleted: false }).populate('destination', 'name slug').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, message: 'Testimonials fetched', data: testimonials });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createTestimonial = async (req: AuthRequest, res: Response) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    return res.status(201).json({ success: true, message: 'Testimonial created', data: testimonial });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- FAQS ---
export const getFAQs = async (req: Request, res: Response) => {
  try {
    const faqs = await FAQ.find({ active: true }).sort({ displayOrder: 1 });
    return res.status(200).json({ success: true, message: 'FAQs fetched', data: faqs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createFAQ = async (req: AuthRequest, res: Response) => {
  try {
    const faq = await FAQ.create(req.body);
    return res.status(201).json({ success: true, message: 'FAQ created', data: faq });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- NEWSLETTER ---
export const subscribeNewsletter = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(200).json({ success: true, message: 'Already subscribed!' });
    await Newsletter.create({ email: email.toLowerCase() });
    return res.status(201).json({ success: true, message: 'Successfully subscribed to newsletter' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- CONTACT MESSAGES ---
export const createContactMessage = async (req: Request, res: Response) => {
  try {
    const message = await ContactMessage.create(req.body);
    return res.status(201).json({ success: true, message: 'Message sent successfully', data: message });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- SETTINGS ---
export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    return res.status(200).json({ success: true, message: 'Settings fetched', data: settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create(req.body);
    } else {
      settings = await Setting.findByIdAndUpdate(settings._id, req.body, { new: true });
    }
    return res.status(200).json({ success: true, message: 'Settings updated', data: settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
