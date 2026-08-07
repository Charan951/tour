import mongoose from 'mongoose';
import dns from 'dns';

// Fix Node.js DNS resolution issues on Windows/ISPs for MongoDB SRV records
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

export const connectDB = async (): Promise<typeof mongoose> => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/holidaycity';
    const conn = await mongoose.connect(connStr, {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`[MongoDB Atlas] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Error] Connection failed:`, error);
    process.exit(1);
  }
};
