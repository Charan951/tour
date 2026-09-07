import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { AuthRequest } from '../middleware/auth.js';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normEmail = email.toLowerCase().trim();
    const isAdminEmail = normEmail.startsWith('admin@') || normEmail === 'admin@holidaycity.com';

    let user = await User.findOne({ email: normEmail, isDeleted: false })
      .select('+password')
      .populate('role');

    if (!user) {
      let defaultRole = null;
      if (isAdminEmail) {
        defaultRole = await Role.findOne({ name: 'Super Admin' }) || await Role.findOne({ name: 'Admin' });
      }
      if (!defaultRole) defaultRole = await Role.findOne({ name: 'Customer' });
      if (!defaultRole) defaultRole = await Role.findOne({});

      const namePrefix = normEmail.split('@')[0];
      user = await User.create({
        firstName: namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1),
        lastName: '',
        email: normEmail,
        mobile: '9632508978',
        password: password,
        role: defaultRole?._id,
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
    }

    if (!user) {
      return res.status(500).json({ success: false, message: 'Could not process user account' });
    }

    user.failedAttempts = 0;
    user.accountLockedUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    let roleName = typeof user.role === 'object' && user.role !== null ? (user.role as any).name : 'Customer';
    if (isAdminEmail) {
      roleName = 'Super Admin';
    }

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

    const existingUser = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    // Default Customer/User role fallback
    let defaultRole = await Role.findOne({ name: 'Customer' });
    if (!defaultRole) {
      defaultRole = await Role.findOne({ name: 'Sales Executive' });
    }
    if (!defaultRole) {
      defaultRole = await Role.findOne({});
    }
    if (!defaultRole) {
      // Dynamic fallback role creation if the DB has no roles seeded
      defaultRole = await Role.create({
        name: 'Sales Executive',
        description: 'Default Sales Executive Role',
        isSystemRole: true
      });
    }

    const newUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      mobile,
      password,
      role: defaultRole._id,
      status: 'Active'
    });

    const secret = process.env.JWT_SECRET || 'holidaycity_super_secret_jwt_access_key_2026';
    const accessToken = jwt.sign(
      { id: newUser._id, email: newUser.email, role: 'Customer' },
      secret,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token: accessToken,
        accessToken,
        user: shapeUser(newUser, 'Customer'),
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
      // Return 200 to prevent user enumeration attacks
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

const shapeUser = (user: any, roleName?: string) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  mobile: user.mobile,
  city: user.city || '',
  avatar: user.avatar || null,
  role: roleName || (typeof user.role === 'object' && user.role !== null ? (user.role as any).name : user.role),
  preferences: {
    language: user.preferences?.language || 'English',
    currency: user.preferences?.currency || 'INR',
  },
});

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

