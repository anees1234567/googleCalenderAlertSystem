import mongoose from 'mongoose';
import { DB_URL } from '.';



const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(DB_URL as string);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

export default connectDB;