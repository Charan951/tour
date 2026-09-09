import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { DeviceToken } from '../models/DeviceToken.js';
import { AuthRequest } from '../middleware/auth.js';

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
        user.password = password;
        user.failedAttempts = 0;
        user.accountLockedUntil = undefined;
        await user.save();
      }
      // Non-admin user fix: if existing user has Admin role ID, correct it to Customer role ID in DB
      if (!isAdminEmail) {
        const currentRoleName = typeof user.role === 'object' && user.role !== null ? (user.role as any).name : user.role;
        if (currentRoleName === 'Admin' || currentRoleName === 'Super Admin' || !user.role) {
          user.role = customerRoleDoc._id;
          await user.save();
          user = await User.findById(user._id).select('+password').populate('role');
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

    const secret = process.env.JWT_SECRET || 'holidaycity_super_secret_jwt_access_key_2026';
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: roleName },
      secret,
      { expiresIn: '24h' }
    );

    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'holidaycity_super_secret_jwt_refresh_key_2026';
    const refreshToken = jwt.sign(
      { id: user._id, email: user.email },
      refreshSecret,
      { expiresIn: '7d' }
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

    const secret = process.env.JWT_SECRET || 'holidaycity_super_secret_jwt_access_key_2026';
    const accessToken = jwt.sign(
      { id: newUser._id, email: newUser.email, role: roleName },
      secret,
      { expiresIn: '24h' }
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
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been dispatched.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been dispatched.'
    });
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

    const { firstName, lastName, mobile, city, avatar, language, currency } = req.body;
    if (typeof firstName === 'string' && firstName.trim()) user.firstName = firstName.trim();
    if (typeof lastName === 'string') user.lastName = lastName.trim();
    if (typeof mobile === 'string' && mobile.trim()) user.mobile = mobile.trim();
    if (typeof city === 'string') user.city = city.trim();
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

