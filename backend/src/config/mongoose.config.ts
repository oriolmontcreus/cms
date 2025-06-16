import mongoose from 'mongoose';

//TODO: what the helly is this URI?
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/froggy';

export const connectMongoose = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    });

    mongoose.connection.on('error', (error) => {
      console.error('Mongoose connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('Mongoose reconnected');
    });

    console.log('Mongoose connected successfully');
  } catch (error) {
    console.error('Mongoose connection error:', error);
    process.exit(1);
  }
}; 