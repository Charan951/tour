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

    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false })
      .select('+password')
      .populate('role');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ success: false, message: `Account is ${user.status}. Please contact administrator.` });
    }

    // Check account lockout status matching security.md Section 3.3
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const remainingMs = user.accountLockedUntil.getTime() - new Date().getTime();
      const remainingMins = Math.ceil(remainingMs / (60 * 1000));
      return res.status(429).json({
        success: false,
        message: `Account is temporarily locked due to 5 failed login attempts. Please try again in ${remainingMins} minute(s).`
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.failedAttempts = 0;
    user.accountLockedUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const roleName = typeof user.role === 'object' && user.role !== null ? (user.role as any).name : 'Customer';

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
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile,
          role: roleName,
          department: user.department,
          avatar: user.avatar
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, mobile, password } = req.body;

    if (!firstName || !lastName || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided' });
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
        user: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          mobile: newUser.mobile,
          role: 'Customer'
        }
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

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const user = await User.findById(req.user.id).populate('role');
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

