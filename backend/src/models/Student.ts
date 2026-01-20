import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  name: string;
  studentId: string;
  sex: 'Male' | 'Female';
  year: string;
  dateOfBirth?: Date;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    studentId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    sex: {
      type: String,
      required: [true, 'Sex is required'],
      enum: ['Male', 'Female'],
    },
    year: {
      type: String,
      required: [true, 'Year is required'],
      enum: ['EY', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13'],
    },
    dateOfBirth: {
      type: Date,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster searches
StudentSchema.index({ name: 1 });
StudentSchema.index({ year: 1 });

export default mongoose.model<IStudent>('Student', StudentSchema);
