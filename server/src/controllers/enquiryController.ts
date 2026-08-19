import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Enquiry } from '../models/Enquiry.js';
import { Destination } from '../models/Destination.js';
import { Package } from '../models/Package.js';
import { AuthRequest } from '../middleware/auth.js';
import { emitCreate, emitDataUpdate, emitDelete, emitUpdate } from '../config/socketEvents.js';
import {
  sendEnquiryConfirmationEmail,
  sendEnquiryStatusUpdateEmail,
  sendAdminEnquiryNotificationEmail
} from '../services/emailService.js';

export const createEnquiry = async (req: Request, res: Response) => {
  try {
    const { 
      fullName, 
      name, 
      email, 
      mobile, 
      phone, 
      destination, 
      package: packageId, 
      travelDate, 
      adults, 
      travelers, 
      children, 
      budget, 
      travelType, 
      message, 
      source 
    } = req.body;

    const normalizedEmail = (email || '').toString().trim().toLowerCase();
    const resolvedFullName = fullName || name || '';
    const resolvedMobile = mobile || phone || '';
    const resolvedAdults = adults || travelers || 1;

    let resolvedDestination = null;
    let resolvedPackage = packageId || null;
    let appendedMessage = message || '';

    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (destination && typeof destination === 'string') {
      const trimmedDest = destination.trim();
      if (mongoose.Types.ObjectId.isValid(trimmedDest)) {
        resolvedDestination = trimmedDest;
      } else if (trimmedDest.length > 0) {
        const safeRegex = new RegExp(`^${escapeRegex(trimmedDest)}$`, 'i');
        // Try to match destination name or slug
        const foundDest = await Destination.findOne({
          $or: [
            { slug: trimmedDest },
            { name: { $regex: safeRegex } }
          ]
        }).lean();

        if (foundDest) {
          resolvedDestination = foundDest._id;
        } else {
          // Try to match package title or slug
          const foundPkg = await Package.findOne({
            $or: [
              { slug: trimmedDest },
              { title: { $regex: safeRegex } }
            ]
          }).lean();

          if (foundPkg) {
            resolvedPackage = foundPkg._id;
            resolvedDestination = foundPkg.destination;
          } else {
            // Append the unmatched string to message so we don't lose user's input
            appendedMessage = `[Requested Destination: ${trimmedDest}] ${appendedMessage}`.trim();
          }
        }
      }
    }

    const count = await Enquiry.countDocuments();
    const enquiryId = `HC-2026-${(count + 1001).toString()}`;

    const enquiry = await Enquiry.create({
      enquiryId,
      fullName: resolvedFullName,
      email: normalizedEmail,
      mobile: resolvedMobile,
      destination: resolvedDestination,
      package: resolvedPackage,
      travelDate: travelDate ? new Date(travelDate) : null,
      adults: resolvedAdults,
      children: children || 0,
      budget: budget || null,
      travelType: travelType || 'Family',
      message: appendedMessage,
      source: source || 'PackagePage',
      status: 'New',
      priority: 'Medium'
    });

    const populatedEnquiry = await Enquiry.findById(enquiry._id)
      .populate('destination', 'name slug banner')
      .populate('package', 'title slug packageCode startingPrice duration')
      .lean();

    emitDataUpdate('Enquiry', populatedEnquiry, 'general_updates');
    emitCreate('Enquiry', populatedEnquiry, 'general_updates');

    // Trigger instant email notification to user & admin
    sendEnquiryConfirmationEmail(populatedEnquiry).catch(err =>
      console.error('[EnquiryController] Customer email confirmation trigger failed:', err)
    );
    sendAdminEnquiryNotificationEmail(populatedEnquiry).catch(err =>
      console.error('[EnquiryController] Admin email notification trigger failed:', err)
    );

    return res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully. Our travel expert will contact you within 30 minutes.',
      data: populatedEnquiry
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
    const { 
      status, assignedTo, priority, followupDate,
      fullName, email, mobile, destination, package: packageId,
      travelDate, adults, children, budget, travelType, message
    } = req.body;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry || enquiry.isDeleted) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    if (status !== undefined) enquiry.status = status;
    if (assignedTo !== undefined) enquiry.assignedTo = assignedTo || null;
    if (priority !== undefined) enquiry.priority = priority;
    if (followupDate !== undefined) enquiry.followupDate = followupDate ? new Date(followupDate) : null;

    if (fullName !== undefined) enquiry.fullName = fullName;
    if (email !== undefined) enquiry.email = email;
    if (mobile !== undefined) enquiry.mobile = mobile;
    if (destination !== undefined) enquiry.destination = destination || null;
    if (packageId !== undefined) enquiry.package = packageId || null;
    if (travelDate !== undefined) enquiry.travelDate = travelDate ? new Date(travelDate) : null;
    if (adults !== undefined) enquiry.adults = Number(adults);
    if (children !== undefined) enquiry.children = Number(children);
    if (budget !== undefined) enquiry.budget = budget ? Number(budget) : null;
    if (travelType !== undefined) enquiry.travelType = travelType;
    if (message !== undefined) enquiry.message = message;

    enquiry.updatedBy = req.user?.id as any;

    await enquiry.save();

    const populatedEnquiry = await Enquiry.findById(enquiry._id)
      .populate('destination', 'name slug banner')
      .populate('package', 'title slug packageCode startingPrice duration')
      .populate('assignedTo', 'firstName lastName email');

    emitDataUpdate('Enquiry', populatedEnquiry, 'general_updates');
    emitUpdate('Enquiry', populatedEnquiry, 'general_updates');

    // Trigger email update notification to user
    sendEnquiryStatusUpdateEmail(populatedEnquiry).catch(err =>
      console.error('[EnquiryController] Email update trigger failed:', err)
    );

    return res.status(200).json({
      success: true,
      message: 'Enquiry updated successfully',
      data: populatedEnquiry
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

    const populatedEnquiry = await Enquiry.findById(enquiry._id)
      .populate('destination', 'name slug banner')
      .populate('package', 'title slug packageCode startingPrice duration')
      .populate('assignedTo', 'firstName lastName email');

    return res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: populatedEnquiry
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyEnquiries = async (req: AuthRequest, res: Response) => {
  try {
    // Email resolved from JWT token (if provided) or from ?email= query param
    const email = req.user?.email || (req.query.email as string | undefined);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'User email could not be resolved. Please log in.',
      });
    }

    const normalizedEmail = email.toString().trim().toLowerCase();

    const enquiries = await Enquiry.find({
      email: normalizedEmail,
      isDeleted: false,
    })
      .populate('destination', 'name slug banner')
      .populate('package', 'title slug packageCode startingPrice duration')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Your enquiries fetched',
      data: enquiries,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEnquiry = async (req: AuthRequest, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const enquiry = await Enquiry.findByIdAndDelete(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    emitDataUpdate('Enquiry', { id, deleted: true }, 'general_updates');
    emitDelete('Enquiry', id, 'general_updates');

    return res.status(200).json({
      success: true,
      message: 'Enquiry deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

