import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { Package } from '../models/Package.js';
import { Activity } from '../models/Activity.js';
import { Destination } from '../models/Destination.js';
import { AuthRequest } from '../middleware/auth.js';
import { emitCreate, emitDataUpdate, emitDelete, emitUpdate } from '../config/socketEvents.js';
import {
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail,
  sendPaymentReceiptEmail
} from '../services/emailService.js';
import { createNotification } from '../services/notificationService.js';

export const createBooking = async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      name,
      email,
      mobile,
      phone,
      bookingType,
      package: packageId,
      packageName,
      activity: activityId,
      activityName,
      activityCode,
      destination: destinationId,
      destinationName,
      travelDate,
      adults,
      children,
      travelers,
      pricingTier,
      selectedAddOns,
      totalPrice,
      advanceAmount,
      advancePaid,
      paymentMethod,
      transactionId,
      address,
      street,
      city,
      state,
      pincode,
      paymentDetails,
      upiId,
      cardNumber,
      cardHolder,
      cardExpiry,
      bankName,
      specialRequests
    } = req.body;

    const resolvedName = (customerName || name || '').toString().trim();
    const normalizedEmail = (email || '').toString().trim().toLowerCase();
    const resolvedMobile = (mobile || phone || '').toString().trim();

    if (!resolvedName || !normalizedEmail || !resolvedMobile) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and mobile number are required.'
      });
    }

    const parsedAddress = {
      street: (address?.street || street || '').toString().trim(),
      city: (address?.city || city || '').toString().trim(),
      state: (address?.state || state || '').toString().trim(),
      pincode: (address?.pincode || pincode || '').toString().trim(),
      fullAddress: (address?.fullAddress || [street, city, state, pincode].filter(Boolean).join(', ') || '').toString().trim()
    };

    const cardStr = (paymentDetails?.cardNumber || cardNumber || '').toString().trim();
    const cardLast4 = cardStr.length >= 4 ? cardStr.slice(-4) : (paymentDetails?.cardLast4 || '');

    const parsedPaymentDetails = {
      upiId: (paymentDetails?.upiId || upiId || '').toString().trim(),
      cardLast4,
      cardHolder: (paymentDetails?.cardHolder || cardHolder || '').toString().trim(),
      cardExpiry: (paymentDetails?.cardExpiry || cardExpiry || '').toString().trim(),
      bankName: (paymentDetails?.bankName || bankName || '').toString().trim()
    };

    const isValidObjectId = (id: any) =>
      typeof id === 'string' &&
      id.length === 24 &&
      /^[0-9a-fA-F]{24}$/.test(id) &&
      mongoose.Types.ObjectId.isValid(id);

    const resolvedBookingType = bookingType === 'activity' || activityId ? 'activity' : 'package';
    let resolvedPackage = isValidObjectId(packageId) ? packageId : null;
    let resolvedPackageName = packageName || (resolvedBookingType === 'package' ? 'Custom Tour Package' : '');
    let resolvedPackageCode = '';
    let resolvedActivity = isValidObjectId(activityId) ? activityId : null;
    let resolvedActivityName = activityName || (resolvedBookingType === 'activity' ? 'Tour Activity' : '');
    let resolvedActivityCode = activityCode || '';
    let resolvedDestination = isValidObjectId(destinationId) ? destinationId : null;
    let resolvedDestinationName = destinationName || '';

    // If packageId supplied and valid, fetch package details
    if (resolvedPackage) {
      const pkg = await Package.findById(resolvedPackage).lean();
      if (pkg) {
        resolvedPackageName = pkg.title;
        resolvedPackageCode = pkg.packageCode || '';
        if (!resolvedDestination && pkg.destination) {
          resolvedDestination = pkg.destination;
        }
      }
    }

    // If activityId supplied and valid, fetch activity details
    if (resolvedActivity) {
      const act = await Activity.findById(resolvedActivity).lean();
      if (act) {
        resolvedActivityName = act.title;
        resolvedActivityCode = act.activityCode || '';
        if (!resolvedDestination && act.destination) {
          resolvedDestination = act.destination;
        }
      }
    }

    // If destinationId supplied and valid, fetch destination details
    if (resolvedDestination) {
      const dest = await Destination.findById(resolvedDestination).lean();
      if (dest) {
        resolvedDestinationName = dest.name;
      }
    }

    const count = await Booking.countDocuments();
    const bookingId = `BK-2026-${(count + 1001).toString()}`;

    const numTotal = Number(totalPrice || 0);
    const numAdvance = Number(advanceAmount || Math.round(numTotal * 0.25));
    const isAdvPaid = Boolean(advancePaid);
    const remaining = Math.max(0, numTotal - (isAdvPaid ? numAdvance : 0));

    const formattedAddOns = Array.isArray(selectedAddOns) ? selectedAddOns.map((addon: any) => ({
      id: isValidObjectId(addon.id || addon._id) ? addon.id || addon._id : null,
      title: addon.title || 'Add-on Activity',
      price: Number(addon.price || 0)
    })) : [];

    const booking = await Booking.create({
      bookingId,
      bookingType: resolvedBookingType,
      user: (req as AuthRequest).user?.id || null,
      package: resolvedPackage,
      activity: resolvedActivity,
      destination: resolvedDestination,
      packageName: resolvedPackageName,
      packageCode: resolvedPackageCode,
      activityName: resolvedActivityName,
      activityCode: resolvedActivityCode,
      destinationName: resolvedDestinationName,
      customerName: resolvedName,
      email: normalizedEmail,
      mobile: resolvedMobile,
      address: parsedAddress,
      travelDate: travelDate ? new Date(travelDate) : new Date(),
      adults: Number(adults || (travelers && typeof travelers === 'object' ? travelers.adults : travelers) || 1),
      children: Number(children || (travelers && typeof travelers === 'object' ? travelers.children : 0) || 0),
      pricingTier: pricingTier || 'Standard',
      selectedAddOns: formattedAddOns,
      totalPrice: numTotal,
      advanceAmount: numAdvance,
      advancePaid: isAdvPaid,
      remainingBalance: remaining,
      paymentStatus: isAdvPaid ? 'Advance Paid' : 'Pending Advance',
      paymentMethod: paymentMethod || 'UPI / Online',
      transactionId: transactionId || '',
      paymentDetails: parsedPaymentDetails,
      specialRequests: specialRequests || '',
      status: 'Pending'
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('destination', 'name slug banner')
      .populate('package', 'title slug packageCode startingPrice duration images')
      .populate('activity', 'title slug activityCode startingPrice duration coverImage')
      .lean();

    emitDataUpdate('Booking', populatedBooking, 'general_updates');
    emitCreate('Booking', populatedBooking, 'general_updates');

    const exactPackageName =
      (populatedBooking?.package as any)?.title ||
      resolvedPackageName ||
      (populatedBooking?.activity as any)?.title ||
      resolvedActivityName ||
      (populatedBooking?.destination as any)?.name ||
      resolvedDestinationName ||
      'Tour Package';

    createNotification({
      type: 'booking',
      title: '🎉 New Tour Booking!',
      message: `${resolvedName} booked "${exactPackageName}" (${bookingId})`,
      entityId: booking._id.toString(),
      link: '/admin/bookings'
    });

    // Trigger instant email notification to customer
    sendBookingConfirmationEmail(populatedBooking).catch(err =>
      console.error('[BookingController] Email trigger failed:', err)
    );

    return res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully!',
      data: populatedBooking
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;

    const query: any = { isDeleted: false };
    if (status && status !== 'All') query.status = status;
    if (paymentStatus && paymentStatus !== 'All') query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { bookingId: { $regex: search, $options: 'i' } },
        { packageName: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('destination', 'name slug banner')
      .populate('package', 'title slug packageCode startingPrice duration images')
      .populate('activity', 'title slug activityCode startingPrice duration coverImage')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      message: 'Bookings fetched successfully',
      data: bookings,
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

export const getUserBookings = async (req: AuthRequest, res: Response) => {
  try {
    const email = req.user?.email || (req.query.email as string | undefined);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'User email is required. Please log in.'
      });
    }

    const normalizedEmail = email.toString().trim().toLowerCase();

    const bookings = await Booking.find({
      email: normalizedEmail,
      isDeleted: false
    })
      .populate('destination', 'name slug banner')
      .populate('package', 'title slug packageCode startingPrice duration images')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'User bookings fetched successfully',
      data: bookings
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const {
      status,
      advanceAmount,
      advancePaid,
      paymentStatus,
      totalPrice,
      paymentMethod,
      transactionId,
      assignedTo,
      specialRequests
    } = req.body;

    const isValidObjectId = (str: string) =>
      typeof str === 'string' && str.length === 24 && /^[0-9a-fA-F]{24}$/.test(str) && mongoose.Types.ObjectId.isValid(str);

    let booking = null;
    if (isValidObjectId(id)) {
      booking = await Booking.findById(id);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingId: id });
    }

    if (!booking || booking.isDeleted) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (status !== undefined) booking.status = status;
    if (totalPrice !== undefined) booking.totalPrice = Number(totalPrice);
    if (advanceAmount !== undefined) booking.advanceAmount = Number(advanceAmount);
    if (advancePaid !== undefined) booking.advancePaid = Boolean(advancePaid);
    if (paymentStatus !== undefined) booking.paymentStatus = paymentStatus;
    if (paymentMethod !== undefined) booking.paymentMethod = paymentMethod;
    if (transactionId !== undefined) booking.transactionId = transactionId;
    if (assignedTo !== undefined) booking.assignedTo = assignedTo || null;
    if (specialRequests !== undefined) booking.specialRequests = specialRequests;

    // Recalculate remaining balance
    const isPaid = booking.advancePaid || booking.paymentStatus === 'Advance Paid' || booking.paymentStatus === 'Full Paid';
    if (booking.paymentStatus === 'Full Paid') {
      booking.remainingBalance = 0;
      booking.advancePaid = true;
    } else {
      booking.remainingBalance = Math.max(0, booking.totalPrice - (isPaid ? booking.advanceAmount : 0));
    }

    if (booking.updatedBy && !mongoose.Types.ObjectId.isValid(booking.updatedBy.toString())) {
      booking.updatedBy = null as any;
    }
    if (booking.assignedTo && !mongoose.Types.ObjectId.isValid(booking.assignedTo.toString())) {
      booking.assignedTo = null as any;
    }

    if (req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
      booking.updatedBy = req.user.id as any;
    } else {
      booking.updatedBy = null;
    }
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('destination', 'name slug banner')
      .populate('package', 'title slug packageCode startingPrice duration images')
      .populate('assignedTo', 'firstName lastName email');

    emitDataUpdate('Booking', populatedBooking, 'general_updates');
    emitUpdate('Booking', populatedBooking, 'general_updates');

    // User-scoped notification: attach the booking owner's email so the mobile app can fetch it
    if (booking.email && booking.email.toString().trim().length > 0) {
      const exactPackageName =
        (populatedBooking?.package as any)?.title ||
        populatedBooking?.packageName ||
        (populatedBooking?.activity as any)?.title ||
        populatedBooking?.activityName ||
        (populatedBooking?.destination as any)?.name ||
        populatedBooking?.destinationName ||
        'Tour Package';

      createNotification({
        type: 'booking',
        title: 'Booking Status Update',
        message: `Booking #${booking.bookingId} ("${exactPackageName}") status is now "${booking.status}".`,
        entityId: booking._id.toString(),
        status: booking.status,
        link: '/admin/bookings',
        userEmail: booking.email.toString().trim().toLowerCase()
      });
    }

    // Trigger email notification to customer on status / payment update
    sendBookingStatusUpdateEmail(populatedBooking).catch(err =>
      console.error('[BookingController] Email update trigger failed:', err)
    );

    return res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: populatedBooking
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBooking = async (req: AuthRequest, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const isValidObjectId = (str: string) =>
      typeof str === 'string' && str.length === 24 && /^[0-9a-fA-F]{24}$/.test(str) && mongoose.Types.ObjectId.isValid(str);

    let booking = null;
    if (isValidObjectId(id)) {
      booking = await Booking.findByIdAndDelete(id);
    }
    if (!booking) {
      booking = await Booking.findOneAndDelete({ bookingId: id });
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    emitDataUpdate('Booking', { id: booking._id, deleted: true }, 'general_updates');
    emitDelete('Booking', booking._id.toString(), 'general_updates');

    return res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const payRemainingBalance = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const { paymentMethod, transactionId, paymentDetails, isAdvancePayment } = req.body;

    const isValidObjectId = (str: string) =>
      typeof str === 'string' && str.length === 24 && /^[0-9a-fA-F]{24}$/.test(str) && mongoose.Types.ObjectId.isValid(str);

    let booking = null;
    if (isValidObjectId(id)) {
      booking = await Booking.findById(id);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingId: id });
    }

    if (!booking || booking.isDeleted) {
      return res.status(404).json({ success: false, message: 'Booking record not found' });
    }

    if (isAdvancePayment) {
      booking.paymentStatus = 'Advance Paid';
      booking.advancePaid = true;
      booking.remainingBalance = Math.max(0, booking.totalPrice - booking.advanceAmount);
    } else {
      booking.paymentStatus = 'Full Paid';
      booking.advancePaid = true;
      booking.remainingBalance = 0;
    }
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (transactionId) booking.transactionId = transactionId;
    if (paymentDetails) {
      const cardStr = (paymentDetails.cardNumber || '').toString().trim();
      const cardLast4 = cardStr.length >= 4 ? cardStr.slice(-4) : (booking.paymentDetails?.cardLast4 || '');
      booking.paymentDetails = {
        upiId: (paymentDetails.upiId || booking.paymentDetails?.upiId || '').toString().trim(),
        cardLast4,
        cardHolder: (paymentDetails.cardHolder || booking.paymentDetails?.cardHolder || '').toString().trim(),
        cardExpiry: (paymentDetails.cardExpiry || booking.paymentDetails?.cardExpiry || '').toString().trim(),
        bankName: (paymentDetails.bankName || booking.paymentDetails?.bankName || '').toString().trim()
      };
    }

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('destination', 'name slug banner')
      .populate('package', 'title slug packageCode startingPrice duration images');

    emitDataUpdate('Booking', populatedBooking, 'general_updates');
    emitUpdate('Booking', populatedBooking, 'general_updates');

    // Trigger payment receipt email & booking status email to customer
    const paidAmount = isAdvancePayment ? booking.advanceAmount : booking.remainingBalance || booking.totalPrice;
    sendPaymentReceiptEmail(populatedBooking, Number(paidAmount || 0), !isAdvancePayment).catch(err =>
      console.error('[BookingController] Payment receipt trigger failed:', err)
    );
    sendBookingStatusUpdateEmail(populatedBooking).catch(err =>
      console.error('[BookingController] Booking status email trigger failed:', err)
    );

    return res.status(200).json({
      success: true,
      message: 'Remaining balance payment recorded successfully!',
      data: populatedBooking
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
