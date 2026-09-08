import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';

dotenv.config();

// Fix DNS resolution on Windows/ISPs for SRV records
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const fixRoles = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/holidaycity';
    await mongoose.connect(connStr);
    console.log('[FixRoles] Connected to MongoDB Atlas...');

    // 1. Ensure Admin and Customer roles exist
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'Admin',
        description: 'System & Business Administrator',
        isSystemRole: true
      });
      console.log('[FixRoles] Created Admin role');
    }

    let customerRole = await Role.findOne({ name: 'Customer' });
    if (!customerRole) {
      customerRole = await Role.create({
        name: 'Customer',
        description: 'Standard Customer Account',
        isSystemRole: true
      });
      console.log('[FixRoles] Created Customer role');
    }

    // Delete legacy "Super Admin" role if present
    await Role.deleteMany({ name: 'Super Admin' });
    console.log('[FixRoles] Cleaned up legacy Super Admin roles.');

    // 2. Update Admin users
    const adminResult = await User.updateMany(
      {
        $or: [
          { email: 'admin@holidaycity.com' },
          { email: { $regex: '^admin@', $options: 'i' } }
        ]
      },
      { $set: { role: adminRole._id } }
    );
    console.log(`[FixRoles] Updated ${adminResult.modifiedCount} admin user records.`);

    // 3. Update Non-Admin users (including Nani) to Customer role
    const customerResult = await User.updateMany(
      {
        email: { $not: { $regex: '^admin@', $options: 'i' } },
        $nor: [{ email: 'admin@holidaycity.com' }]
      },
      { $set: { role: customerRole._id } }
    );
    console.log(`[FixRoles] Updated ${customerResult.modifiedCount} customer user records to Customer role.`);

    console.log('[FixRoles] All user roles updated successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[FixRoles] Error updating user roles:', err);
    process.exit(1);
  }
};

fixRoles();
