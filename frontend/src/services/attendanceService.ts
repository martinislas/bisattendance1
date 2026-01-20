import apiClient from './api';

export interface AttendanceRecord {
  _id: string;
  studentId: string;
  student: any;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceResponse {
  success: boolean;
  count: number;
  data: AttendanceRecord[];
}

// Record attendance
export const recordAttendance = async (attendance: {
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  reason?: string;
  notes?: string;
}): Promise<any> => {
  const response = await apiClient.post('/attendance', attendance);
  return response.data;
};

// Bulk record attendance
export const bulkRecordAttendance = async (attendanceRecords: any[]): Promise<any> => {
  const response = await apiClient.post('/attendance/bulk', { attendanceRecords });
  return response.data;
};

// Get attendance by date
export const getAttendanceByDate = async (date: string, year?: string): Promise<AttendanceResponse> => {
  const params = year ? { year } : {};
  const response = await apiClient.get(`/attendance/date/${date}`, { params });
  return response.data;
};

// Get attendance by student
export const getAttendanceByStudent = async (studentId: string, startDate?: string, endDate?: string): Promise<AttendanceResponse> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await apiClient.get(`/attendance/student/${studentId}`, { params });
  return response.data;
};

// Get attendance statistics
export const getAttendanceStats = async (startDate?: string, endDate?: string, year?: string): Promise<any> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (year) params.year = year;
  const response = await apiClient.get('/attendance/stats', { params });
  return response.data;
};
