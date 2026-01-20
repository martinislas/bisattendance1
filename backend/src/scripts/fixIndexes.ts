import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db?.collection('students');

    if (collection) {
      // Drop all indexes except _id
      await collection.dropIndexes();
      console.log('Dropped all indexes');

      // Create the correct sparse unique index for studentId
      await collection.createIndex({ studentId: 1 }, { unique: true, sparse: true });
      console.log('Created sparse unique index for studentId');

      // Create other indexes
      await collection.createIndex({ name: 1 });
      await collection.createIndex({ year: 1 });
      console.log('Created indexes for name and year');
    }

    await mongoose.connection.close();
    console.log('Indexes fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
};

fixIndexes();
