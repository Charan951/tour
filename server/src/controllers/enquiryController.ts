import { Request, Response } from 'express';
import { Enquiry } from '../models/Enquiry.js';
import { AuthRequest } from '../middleware/auth.js';

export const createEnquiry = async (req: Request, res: Response) => {
  try {
    const { fullName, email, mobile, destination, package: packageId, travelDate, adults, children, budget, travelType, message, source } = req.body;

    const count = await Enquiry.countDocuments();
    const enquiryId = `HC-2026-${(count + 1001).toString()}`;

    const enquiry = await Enquiry.create({
      enquiryId,
      fullName,
      email,
      mobile,
      destination: destination || null,
      package: packageId || null,
      travelDate: travelDate ? new Date(travelDate) : null,
      adults: adults || 1,
      children: children || 0,
      budget: budget || null,
      travelType: travelType || 'Family',
      message: message || '',
      source: source || 'PackagePage',
      status: 'New',
      priority: 'Medium'
    });

    return res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully. Our travel expert will contact you within 30 minutes.',
      data: enquiry
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getEnquiries = async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority, search, page = 1, limit = 20 } = req.query;

    const query: any = { isDeleted: false };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { enquiryId: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const total = await Enquiry.countDocuments(query);
    const enquiries = await Enquiry.find(query)
      .populate('destination', 'name slug banner')
      .populate('package', 'title slug packageCode startingPrice duration')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: 'Enquiries fetched',
      data: enquiries,
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

export const updateEnquiryStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, priority, followupDate } = req.body;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry || enquiry.isDeleted) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    if (status) enquiry.status = status;
    if (assignedTo) enquiry.assignedTo = assignedTo;
    if (priority) enquiry.priority = priority;
    if (followupDate) enquiry.followupDate = new Date(followupDate);

    await enquiry.save();

    return res.status(200).json({
      success: true,
      message: 'Enquiry updated successfully',
      data: enquiry
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addEnquiryNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ success: false, message: 'Note text is required' });
    }

    const enquiry = await Enquiry.findById(id);
    if (!enquiry || enquiry.isDeleted) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    enquiry.notes = enquiry.notes || [];
    enquiry.notes.push({
      note,
      createdBy: req.user?.id as any,
      createdAt: new Date()
    });

    await enquiry.save();

    return res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: enquiry
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEnquiry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    enquiry.isDeleted = true;
    enquiry.deletedAt = new Date();
    enquiry.deletedBy = req.user?.id as any;
    await enquiry.save();

    return res.status(200).json({
      success: true,
      message: 'Enquiry soft-deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
