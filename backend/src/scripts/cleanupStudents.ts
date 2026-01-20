import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/Student';

dotenv.config();

const cleanupStudents = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to MongoDB');

    // Update all students with empty studentId to remove that field
    const result = await Student.updateMany(
      { studentId: '' },
      { $unset: { studentId: '' } }
    );

    console.log(`Updated ${result.modifiedCount} students with empty studentId`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

cleanupStudents();
