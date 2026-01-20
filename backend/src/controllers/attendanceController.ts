import { Request, Response } from 'express';
import Attendance, { IAttendance } from '../models/Attendance';
import Student from '../models/Student';

// Record attendance
export const recordAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId, date, status, reason, notes } = req.body;
    
    // Find student by studentId
    const student = await Student.findOne({ studentId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }
    
    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      student: student._id,
      date: new Date(date),
    });
    
    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.reason = reason;
      existingAttendance.notes = notes;
      await existingAttendance.save();
      
      return res.status(200).json({
        success: true,
        message: 'Attendance updated successfully',
        data: existingAttendance,
      });
    }
    
    // Create new attendance record
    const attendance = await Attendance.create({
      studentId,
      student: student._id,
      date,
      status,
      reason,
      notes,
    });
    
    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: attendance,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error recording attendance',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get attendance by date
export const getAttendanceByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const { year } = req.query;
    
    const dateString = Array.isArray(date) ? date[0] : date;
    const startDate = new Date(dateString);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateString);
    endDate.setHours(23, 59, 59, 999);
    
    let attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    }).populate('student');
    
    // Filter by year if provided
    if (year) {
      attendance = attendance.filter((record: any) => 
        record.student && record.student.year === year
      );
    }
    
    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get attendance by student
export const getAttendanceByStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Find student by MongoDB _id
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }
    
    let query: any = { student: student._id };
    
    if (startDate && endDate) {
      // Parse dates and set to start/end of day to capture full day range
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: start,
        $lte: end,
      };
    }
    
    const attendance = await Attendance.find(query)
      .populate('student')
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get attendance statistics
export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, year } = req.query;
    
    let matchStage: any = {};
    
    if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }
    
    const stats = await Attendance.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      { $unwind: '$studentInfo' },
      ...(year ? [{ $match: { 'studentInfo.year': year } }] : []),
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Get distinct school days (unique dates with attendance)
    const distinctDates = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        },
      },
      { $count: 'schoolDays' },
    ]);
    
    const schoolDays = distinctDates.length > 0 ? distinctDates[0].schoolDays : 0;
    
    // Transform aggregated stats into a more usable format
    const formattedStats = {
      present: 0,
      late: 0,
      excused: 0,
      absent: 0,
      totalRecords: 0,
      schoolDays,
    };
    
    stats.forEach((stat: any) => {
      const statusKey = stat._id.toLowerCase();
      formattedStats[statusKey as keyof typeof formattedStats] = stat.count;
      formattedStats.totalRecords += stat.count;
    });
    
    res.status(200).json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Bulk record attendance
export const bulkRecordAttendance = async (req: Request, res: Response) => {
  try {
    const { attendanceRecords } = req.body;
    
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance data. Expected an array of records.',
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const record of attendanceRecords) {
      try {
        // Find student by MongoDB _id
        const student = await Student.findById(record.studentId);
        
        if (!student) {
          errors.push({ studentId: record.studentId, error: 'Student not found' });
          continue;
        }
        
        const dateObj = new Date(record.date);
        
        // If status is "Unmarked", delete the record
        if (record.status === 'Unmarked') {
          await Attendance.findOneAndDelete({
            student: student._id,
            date: dateObj
          });
          results.push({ studentId: record.studentId, date: record.date, action: 'deleted' });
        } else {
          // Otherwise, create or update the record
          const attendance = await Attendance.findOneAndUpdate(
            { student: student._id, date: dateObj },
            {
              studentId: student.studentId || '',
              student: student._id,
              date: dateObj,
              status: record.status,
              reason: record.reason || '',
              notes: record.notes || '',
            },
            { upsert: true, new: true }
          );
          
          results.push(attendance);
        }
      } catch (error) {
        errors.push({
          studentId: record.studentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: `${results.length} attendance records processed`,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error recording bulk attendance',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
