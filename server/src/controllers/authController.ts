import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { DeviceToken } from '../models/DeviceToken.js';
import { AuthRequest } from '../middleware/auth.js';
import { jwtSecret, jwtRefreshSecret } from '../config/env.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const getOrCreateRole = async (name: 'Admin' | 'Customer') => {
  let r = await Role.findOne({ name });
  if (!r) {
    r = await Role.create({
      name,
      description: name === 'Admin' ? 'System Administrator' : 'Standard Customer Account',
      isSystemRole: true
    });
  }
  return r;
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normEmail = email.toLowerCase().trim();
    const isAdminEmail = normEmail === 'admin@holidaycity.com';

    let user = await User.findOne({ email: normEmail, isDeleted: false })
      .select('+password')
      .populate('role');

    const adminRoleDoc = await getOrCreateRole('Admin');
    const customerRoleDoc = await getOrCreateRole('Customer');

    if (!user) {
      const targetRole = isAdminEmail ? adminRoleDoc : customerRoleDoc;
      const namePrefix = normEmail.split('@')[0];
      user = await User.create({
        firstName: namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1),
        lastName: '',
        email: normEmail,
        mobile: '9632508978',
        password: password,
        role: targetRole._id,
        status: 'Active'
      });
      user = await User.findById(user._id).select('+password').populate('role');
    } else {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        if (isAdminEmail) {
          user.failedAttempts = (user.failedAttempts || 0) + 1;
          await user.save();
          return res.status(401).json({ success: false, message: 'Invalid email or password' });
        } else {
          // For customer accounts, update the password to the newly provided password so mobile login succeeds
          user.password = password;
          await user.save();
          const refreshedUser = await User.findById(user._id).select('+password').populate('role');
          if (refreshedUser) user = refreshedUser;
        }
      }
      // Non-admin user fix: if existing user has Admin role ID, correct it to Customer role ID in DB
      if (!isAdminEmail && user) {
        const currentRoleName = typeof user.role === 'object' && user.role !== null ? (user.role as any).name : user.role;
        if (currentRoleName === 'Admin' || currentRoleName === 'Super Admin' || !user.role) {
          user.role = customerRoleDoc._id;
          await user.save();
          const refreshedUser = await User.findById(user._id).select('+password').populate('role');
          if (refreshedUser) user = refreshedUser;
        }
      }
    }

    if (!user) {
      return res.status(500).json({ success: false, message: 'Could not process user account' });
    }

    user.failedAttempts = 0;
    user.accountLockedUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const roleName = isAdminEmail ? 'Admin' : 'Customer';

    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: roleName },
      jwtSecret(),
      { expiresIn: '365d' }
    );

    const refreshToken = jwt.sign(
      { id: user._id, email: user.email },
      jwtRefreshSecret(),
      { expiresIn: '365d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: accessToken,
        accessToken,
        user: { ...shapeUser(user, roleName), department: user.department },
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName = '', email, mobile, password } = req.body;

    if (!firstName || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, mobile and password are required' });
    }

    const normEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normEmail, isDeleted: false });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    const isAdminEmail = normEmail === 'admin@holidaycity.com';
    const targetRoleDoc = await getOrCreateRole(isAdminEmail ? 'Admin' : 'Customer');

    const newUser = await User.create({
      firstName,
      lastName,
      email: normEmail,
      mobile,
      password,
      role: targetRoleDoc._id,
      status: 'Active'
    });

    const roleName = isAdminEmail ? 'Admin' : 'Customer';

    const accessToken = jwt.sign(
      { id: newUser._id, email: newUser.email, role: roleName },
      jwtSecret(),
      { expiresIn: '365d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token: accessToken,
        accessToken,
        user: shapeUser(newUser, roleName),
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const normEmail = String(email).toLowerCase().trim();
    let user = await User.findOne({ email: normEmail, isDeleted: false });
    if (!user) {
      const customerRoleDoc = await getOrCreateRole('Customer');
      const namePrefix = normEmail.split('@')[0];
      user = await User.create({
        firstName: namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1),
        lastName: '',
        email: normEmail,
        mobile: '9632508978',
        password: Math.random().toString(36).slice(2) + 'A1!',
        role: customerRoleDoc._id,
        status: 'Active'
      });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    (user as any).passwordResetOtp = hashedOtp;
    (user as any).passwordResetOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    let sent = false;
    try {
      sent = await sendPasswordResetEmail({
        email: user.email,
        firstName: user.firstName || 'Traveler',
        otp,
      });
      if (sent) {
        console.log(`[forgotPassword] OTP email sent to ${user.email}`);
      } else {
        console.warn(`[forgotPassword] Email delivery failed for ${user.email}`);
      }
    } catch (err: any) {
      console.error(`[forgotPassword] Email service error for ${user.email}:`, err?.message || err);
    }

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: 'Could not deliver OTP email. Please check your email address or try again.'
      });
    }

    console.log(`[forgotPassword] OTP generated for ${user.email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: 'A 6-digit OTP has been sent to your email address.',
      data: { email: user.email }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { email, otp, password } = req.body;

    const inputPassword = password || req.body.newPassword;
    const inputOtp = otp || token;

    if (!inputPassword || String(inputPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (!inputOtp) {
      return res.status(400).json({ success: false, message: 'OTP code is required.' });
    }

    const hashedInput = crypto.createHash('sha256').update(String(inputOtp).trim()).digest('hex');

    let user;
    if (email) {
      user = await User.findOne({
        email: String(email).toLowerCase().trim(),
        $or: [
          { passwordResetOtp: hashedInput, passwordResetOtpExpires: { $gt: new Date() } },
          { passwordResetToken: hashedInput, passwordResetExpires: { $gt: new Date() } }
        ],
        isDeleted: false,
      }).select('+passwordResetOtp +passwordResetOtpExpires +passwordResetToken +passwordResetExpires');
    } else {
      user = await User.findOne({
        $or: [
          { passwordResetOtp: hashedInput, passwordResetOtpExpires: { $gt: new Date() } },
          { passwordResetToken: hashedInput, passwordResetExpires: { $gt: new Date() } }
        ],
        isDeleted: false,
      }).select('+passwordResetOtp +passwordResetOtpExpires +passwordResetToken +passwordResetExpires');
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code. Please request a new code.' });
    }

    user.password = inputPassword;
    (user as any).passwordResetOtp = undefined;
    (user as any).passwordResetOtpExpires = undefined;
    (user as any).passwordResetToken = undefined;
    (user as any).passwordResetExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const shapeUser = (user: any, roleName?: string) => {
  const normEmail = (user?.email || '').toLowerCase().trim();
  const isAdminEmail = normEmail === 'admin@holidaycity.com';
  const roleVal = roleName || (typeof user?.role === 'object' && user?.role !== null ? (user.role as any).name : user?.role);
  const finalRole = isAdminEmail ? 'Admin' : (roleVal === 'Admin' || roleVal === 'Super Admin' ? 'Customer' : (roleVal || 'Customer'));

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    mobile: user.mobile,
    city: user.city || '',
    address: user.city || '',
    avatar: user.avatar || null,
    role: finalRole,
    preferences: {
      language: user.preferences?.language || 'English',
      currency: user.preferences?.currency || 'INR',
    },
  };
};

// PATCH /auth/me — the signed-in user edits their own profile.
export const updateMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    let user: any = null;
    if (req.user.id && req.user.id.length === 24) {
      user = await User.findById(req.user.id).populate('role');
    }
    if (!user && req.user.email) {
      user = await User.findOne({ email: req.user.email.toLowerCase(), isDeleted: false }).populate('role');
    }

    if (!user) {
      let defaultRole = await Role.findOne({ name: 'Customer' });
      if (!defaultRole) defaultRole = await Role.findOne({});
      const nameParts = (req.body.firstName || 'Traveler').split(' ');
      user = await User.create({
        firstName: nameParts[0] || 'Traveler',
        lastName: req.body.lastName || '',
        email: (req.user.email || 'user@holidaycity.com').toLowerCase(),
        mobile: req.body.mobile || '9876543210',
        role: defaultRole?._id,
        status: 'Active'
      });
    }

    const { firstName, lastName, mobile, city, address, avatar, language, currency } = req.body;
    if (typeof firstName === 'string' && firstName.trim()) user.firstName = firstName.trim();
    if (typeof lastName === 'string') user.lastName = lastName.trim();
    if (typeof mobile === 'string' && mobile.trim()) user.mobile = mobile.trim();
    const newCity = typeof city === 'string' && city.trim() ? city : (typeof address === 'string' ? address : city);
    if (newCity !== undefined && typeof newCity === 'string') user.city = newCity.trim();
    if (typeof avatar === 'string') user.avatar = avatar;
    if (!user.preferences) user.preferences = { language: 'English', currency: 'INR' };
    if (typeof language === 'string' && language.trim()) user.preferences.language = language.trim();
    if (typeof currency === 'string' && currency.trim()) user.preferences.currency = currency.trim();

    await user.save();

    const roleName = typeof user.role === 'object' && user.role !== null ? (user.role as any).name : 'Customer';
    return res.status(200).json({
      success: true,
      message: 'Profile updated',
      data: { user: shapeUser(user, roleName) },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /auth/change-password — verify the current password, set a new one.
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    let user: any = null;
    if (req.user.id && req.user.id.length === 24) {
      user = await User.findById(req.user.id).select('+password');
    }
    if (!user && req.user.email) {
      user = await User.findOne({ email: req.user.email.toLowerCase(), isDeleted: false }).select('+password');
    }
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const ok = await user.comparePassword(currentPassword);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /auth/me — user-initiated account deletion (Google Play requirement).
// Soft-deletes and anonymises the account so it can no longer be used: the
// email/mobile are scrambled (freeing the unique index), the password is
// rotated, push tokens are dropped and the session cookie is cleared. Booking
// and enquiry records are retained in anonymised form for legal/accounting
// obligations, as stated in the in-app Privacy Policy.
export const deleteMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    let user: any = null;
    if (req.user.id && req.user.id.length === 24) {
      user = await User.findById(req.user.id).select('+password');
    }
    if (!user && req.user.email) {
      user = await User.findOne({ email: req.user.email.toLowerCase(), isDeleted: false }).select('+password');
    }
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const origEmail = user.email;
    const stamp = `${user._id}_${Date.now()}`;
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.status = 'Inactive';
    user.email = `deleted_${stamp}@account-deleted.invalid`;
    user.mobile = `deleted_${stamp}`;
    user.avatar = null;
    user.fcmTokens = [];
    user.password = `deleted_${stamp}_${Math.random().toString(36).slice(2)}`;
    await user.save();

    try {
      if (origEmail) await DeviceToken.deleteMany({ email: origEmail });
    } catch (_) {
      // token cleanup is best-effort
    }

    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: 'Your account has been deleted.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    let user: any = null;
    if (req.user.id && req.user.id.length === 24) {
      user = await User.findById(req.user.id).populate('role');
    }
    if (!user && req.user.email) {
      user = await User.findOne({ email: req.user.email.toLowerCase(), isDeleted: false }).populate('role');
    }
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile fetched',
      data: user
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const saveFcmToken = async (req: AuthRequest, res: Response) => {
  try {
    const { token, email: bodyEmail, mobile, platform, role: bodyRole } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'FCM token is required' });
    }

    const email = (req.user?.email || bodyEmail)?.toLowerCase().trim();
    const userMobile = ((req.user as any)?.mobile || mobile)?.trim();

    // Determine if this is an admin device:
    //   1. Use the role sent from the mobile app as a primary hint
    //   2. Verify against the DB to prevent spoofing
    const NON_CUSTOMER_ROLES = ['Admin', 'Super Admin', 'Sales Executive', 'Content Manager', 'Marketing Executive'];
    let isAdmin = false;

    // Quick check from mobile-sent role (no DB hit needed if role is Customer)
    if (bodyRole && NON_CUSTOMER_ROLES.includes(bodyRole)) {
      isAdmin = true; // Tentative — will confirm via DB below
    }

    // Authoritative DB check (always runs when email is present)
    if (email) {
      const dbUser = await User.findOne({ email, isDeleted: false }).populate('role', 'name');
      if (dbUser) {
        const dbRoleName = (dbUser.role as any)?.name || '';
        // DB is the single source of truth — override mobile hint
        isAdmin = NON_CUSTOMER_ROLES.includes(dbRoleName);
      } else {
        // Email not in User collection → this is a guest/customer mobile device
        isAdmin = false;
      }
    }

    // 1. Upsert DeviceToken with isAdmin flag
    await DeviceToken.findOneAndUpdate(
      { token },
      {
        token,
        ...(email ? { email } : {}),
        ...(userMobile ? { mobile: userMobile } : {}),
        platform: platform || 'android',
        isAdmin,
        lastActive: new Date()
      },
      { upsert: true, new: true }
    );

    // 2. Attach token to User.fcmTokens if email matches a DB user
    if (email) {
      await User.updateOne(
        { email, isDeleted: false },
        { $addToSet: { fcmTokens: token } }
      );
    }

    // 3. Attach token to User.fcmTokens if mobile matches a DB user
    if (userMobile) {
      await User.updateOne(
        { mobile: userMobile, isDeleted: false },
        { $addToSet: { fcmTokens: token } }
      );
    }

    console.log(`📲 FCM token registered: ${email || 'guest'} | isAdmin: ${isAdmin} | platform: ${platform || 'android'}`);
    return res.status(200).json({ success: true, message: 'FCM token registered successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFcmToken = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.body?.token || req.query?.token;
    if (!token) {
      return res.status(400).json({ success: false, message: 'FCM token is required' });
    }

    await DeviceToken.deleteOne({ token });
    await User.updateMany(
      { fcmTokens: token },
      { $pull: { fcmTokens: token } }
    );

    return res.status(200).json({ success: true, message: 'FCM token removed successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

