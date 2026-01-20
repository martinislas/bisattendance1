import apiClient from './api';

export interface Student {
  _id: string;
  name: string;
  studentId?: string;
  sex: 'Male' | 'Female';
  year: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentResponse {
  success: boolean;
  count: number;
  data: Student[];
}

export interface SingleStudentResponse {
  success: boolean;
  data: Student;
}

// Get all students with optional filters
export const getStudents = async (params?: {
  name?: string;
  year?: string;
  studentId?: string;
}): Promise<StudentResponse> => {
  const response = await apiClient.get('/students', { params });
  return response.data;
};

// Get single student by ID
export const getStudentById = async (id: string): Promise<SingleStudentResponse> => {
  const response = await apiClient.get(`/students/${id}`);
  return response.data;
};

// Create new student
export const createStudent = async (student: Omit<Student, '_id' | 'createdAt' | 'updatedAt'>): Promise<SingleStudentResponse> => {
  const response = await apiClient.post('/students', student);
  return response.data;
};

// Update student
export const updateStudent = async (id: string, student: Partial<Student>): Promise<SingleStudentResponse> => {
  const response = await apiClient.put(`/students/${id}`, student);
  return response.data;
};

// Delete student
export const deleteStudent = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/students/${id}`);
  return response.data;
};

// Bulk import students
export const bulkImportStudents = async (students: Omit<Student, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<any> => {
  const response = await apiClient.post('/students/bulk-import', { students });
  return response.data;
};
