import { log } from '@/lib/log.js';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/excalibur';

export const connectMongoose = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    });

    mongoose.connection.on('error', (error) => {
      log('ERROR', 'Mongoose connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      log('ERROR', 'Mongoose disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      log('INFO', 'Mongoose reconnected');
    });

    log('INFO', 'Mongoose connected successfully');
  } catch (error) {
    log('ERROR', 'Mongoose connection error:', error);
    process.exit(1);
  }
}; 