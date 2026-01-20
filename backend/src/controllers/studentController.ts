import { Request, Response } from 'express';
import Student, { IStudent } from '../models/Student';

// Get all students
export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const { name, year, studentId } = req.query;
    
    let query: any = {};
    
    if (name) {
      query.$or = [
        { name: { $regex: name, $options: 'i' } },
        { studentId: { $regex: name, $options: 'i' } },
      ];
    }
    
    if (year) {
      query.year = year;
    }
    
    if (studentId) {
      query.studentId = { $regex: studentId, $options: 'i' };
    }

    const students = await Student.find(query).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get single student by ID
export const getStudentById = async (req: Request, res: Response) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Create new student
export const createStudent = async (req: Request, res: Response) => {
  try {
    // Remove empty string fields to prevent duplicate index errors
    const studentData = { ...req.body };
    if (studentData.studentId === '' || !studentData.studentId) {
      delete studentData.studentId;
    }
    if (studentData.email === '' || !studentData.email) {
      delete studentData.email;
    }
    if (studentData.phone === '' || !studentData.phone) {
      delete studentData.phone;
    }
    if (studentData.address === '' || !studentData.address) {
      delete studentData.address;
    }
    if (studentData.dateOfBirth === '' || !studentData.dateOfBirth) {
      delete studentData.dateOfBirth;
    }
    
    const student = await Student.create(studentData);
    
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Student ID already exists',
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Error creating student',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update student
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating student',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete student
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting student',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Bulk import students
export const bulkImportStudents = async (req: Request, res: Response) => {
  try {
    const students = req.body.students;
    
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid students data. Expected an array of students.',
      });
    }
    
    // Validate and clean up students
    const cleanedStudents: any[] = [];
    const validationErrors: string[] = [];
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const studentNum = i + 1;
      
      // Validate required fields
      if (!student.name || typeof student.name !== 'string' || !student.name.trim()) {
        validationErrors.push(`Student ${studentNum}: Name is required`);
        continue;
      }
      if (!student.sex || !['Male', 'Female'].includes(student.sex)) {
        validationErrors.push(`Student ${studentNum} (${student.name}): Sex must be either 'Male' or 'Female'`);
        continue;
      }
      if (!student.year || typeof student.year !== 'string' || !student.year.trim()) {
        validationErrors.push(`Student ${studentNum} (${student.name}): Year is required`);
        continue;
      }
      
      // Create cleaned student object
      const cleaned: any = {
        name: student.name.trim(),
        sex: student.sex,
        year: student.year.trim(),
      };
      
      // Add optional fields only if they have valid values
      if (student.studentId && typeof student.studentId === 'string' && student.studentId.trim()) {
        cleaned.studentId = student.studentId.trim();
      }
      if (student.email && typeof student.email === 'string' && student.email.trim()) {
        cleaned.email = student.email.trim();
      }
      if (student.phone && typeof student.phone === 'string' && student.phone.trim()) {
        cleaned.phone = student.phone.trim();
      }
      if (student.address && typeof student.address === 'string' && student.address.trim()) {
        cleaned.address = student.address.trim();
      }
      if (student.dateOfBirth && student.dateOfBirth.trim()) {
        cleaned.dateOfBirth = student.dateOfBirth.trim();
      }
      
      cleanedStudents.push(cleaned);
    }
    
    // If no valid students after validation
    if (cleanedStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid students to import',
        errors: validationErrors,
      });
    }
    
    // Try to insert students (ordered: false allows partial success)
    let insertedCount = 0;
    let failedCount = 0;
    const duplicateErrors: string[] = [];
    
    try {
      const result = await Student.insertMany(cleanedStudents, { ordered: false });
      insertedCount = result.length;
      
      res.status(201).json({
        success: true,
        message: `Successfully imported ${insertedCount} student${insertedCount !== 1 ? 's' : ''}`,
        data: {
          inserted: insertedCount,
          failed: validationErrors.length,
          validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
        },
      });
    } catch (error: any) {
      // Handle partial success/failure
      if (error.writeErrors) {
        insertedCount = cleanedStudents.length - error.writeErrors.length;
        failedCount = error.writeErrors.length;
        
        // Extract duplicate key errors
        error.writeErrors.forEach((err: any, index: number) => {
          if (err.err.code === 11000) {
            const student = cleanedStudents[err.index];
            duplicateErrors.push(`${student.name} - Student ID already exists`);
          }
        });
        
        return res.status(207).json({ // 207 Multi-Status
          success: true,
          message: `Imported ${insertedCount} student${insertedCount !== 1 ? 's' : ''}. ${failedCount} failed due to duplicates.`,
          data: {
            inserted: insertedCount,
            failed: failedCount,
            duplicateErrors: duplicateErrors,
            validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
          },
        });
      }
      
      throw error; // Re-throw if it's not a writeErrors issue
    }
  } catch (error: any) {
    console.error('Bulk import error:', error);
    res.status(400).json({
      success: false,
      message: 'Error importing students',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
