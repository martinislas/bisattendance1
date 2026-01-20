import { useState, useRef, useEffect } from "react";
import { PencilIcon, TrashBinIcon, DownloadIcon } from "../../icons";
import { getStudents, deleteStudent, bulkImportStudents, Student } from "../../services/studentService";
import AddStudentModal from "./AddStudentModal";

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchName, setSearchName] = useState("");
  const [searchYear, setSearchYear] = useState("none"); // Use "none" as initial value
  const [showAllYears, setShowAllYears] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch students based on search criteria
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchStudents = async () => {
      // Fetch if: name search exists, OR a specific year is selected, OR "show all years" is toggled
      const shouldFetch = searchName || (searchYear && searchYear !== 'none') || showAllYears;
      
      if (!shouldFetch) {
        setStudents([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const params: any = {};
        if (searchName) params.name = searchName;
        // Only add year param if it's a specific year (not "none" or "all")
        if (searchYear && searchYear !== 'none' && searchYear !== 'all') {
          params.year = searchYear;
        }
        // If showAllYears is true, we fetch without year filter (gets all)

        const response = await getStudents(params);
        setStudents(response.data);
      } catch (err) {
        setError('Failed to fetch students');
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search
    const timeoutId = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchName, searchYear, showAllYears, refreshTrigger]);

  // Filter students based on search criteria
  const filteredStudents = students;

  const handleAddSuccess = () => {
    // Refresh the student list by triggering a refetch
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEdit = (studentId: string) => {
    console.log("Edit student:", studentId);
    // TODO: Implement edit functionality
  };

  const handleDelete = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      await deleteStudent(studentId);
      // Refresh the list
      setStudents(students.filter(s => s._id !== studentId));
    } catch (err) {
      console.error('Error deleting student:', err);
      alert('Failed to delete student');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Helper function to parse CSV line properly (handles quotes)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('File is empty or has no data rows');
        return;
      }

      // Parse CSV header - expecting columns like: name, sex, year, studentId (optional)
      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      const studentsToImport = [];
      const errors: string[] = [];

      console.log('CSV Headers:', headers);

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const student: any = {};
        let lineErrors: string[] = [];

        console.log(`Parsing line ${i + 1}:`, values);

        headers.forEach((header, index) => {
          let value = values[index]?.trim().replace(/^["']|["']$/g, '') || '';
          
          switch (header) {
            case 'name':
            case 'student name':
            case 'full name':
              if (value) {
                student.name = value;
              } else {
                lineErrors.push('missing name');
              }
              break;
            case 'sex':
            case 'gender':
              const sexValue = value.toUpperCase();
              if (sexValue === 'M' || sexValue === 'MALE' || sexValue === 'BOY') {
                student.sex = 'Male';
              } else if (sexValue === 'F' || sexValue === 'FEMALE' || sexValue === 'GIRL') {
                student.sex = 'Female';
              } else if (value) {
                lineErrors.push(`invalid sex value "${value}"`);
              } else {
                lineErrors.push('missing sex');
              }
              break;
            case 'studentid':
            case 'student id':
            case 'student_id':
            case 'id':
            case 'number':
              if (value) student.studentId = value;
              break;
            case 'year':
            case 'grade':
            case 'class':
            case 'level':
              if (value) {
                // Try to parse as number first
                const numericYear = parseInt(value);
                if (!isNaN(numericYear) && numericYear >= 1 && numericYear <= 13) {
                  student.year = `Year ${numericYear}`;
                } else if (value.toUpperCase() === 'EY' || value.toLowerCase() === 'early years') {
                  student.year = 'EY';
                } else if (value.match(/^year\s*\d+$/i)) {
                  // Already in "Year X" format
                  student.year = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/\s+/g, ' ');
                } else {
                  lineErrors.push(`invalid year value "${value}"`);
                }
              } else {
                lineErrors.push('missing year');
              }
              break;
            case 'email':
            case 'e-mail':
              if (value) student.email = value;
              break;
            case 'phone':
            case 'phone number':
            case 'contact':
              if (value) student.phone = value;
              break;
            case 'address':
              if (value) student.address = value;
              break;
            case 'dob':
            case 'date of birth':
            case 'dateofbirth':
            case 'birth date':
              if (value) student.dateOfBirth = value;
              break;
          }
        });

        console.log('Parsed student:', student);

        // Validate required fields
        if (student.name && student.sex && student.year) {
          studentsToImport.push(student);
        } else {
          const errorMsg = `Line ${i + 1}: ${lineErrors.join(', ')}`;
          errors.push(errorMsg);
          console.log('Student rejected:', errorMsg, student);
        }
      }

      console.log('Students to import:', studentsToImport);
      console.log('Errors:', errors);

      if (studentsToImport.length === 0) {
        alert(`No valid students found in file.\n\nRequired columns: name, sex, year\nOptional columns: studentId, email, phone, address, dateOfBirth\n\nErrors found:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : ''}`);
        return;
      }

      // Show confirmation if there are errors
      if (errors.length > 0) {
        const proceed = confirm(`Found ${studentsToImport.length} valid students and ${errors.length} rows with errors.\n\nDo you want to import the ${studentsToImport.length} valid students?\n\nFirst few errors:\n${errors.slice(0, 3).join('\n')}`);
        if (!proceed) return;
      }

      setLoading(true);
      const response = await bulkImportStudents(studentsToImport);
      
      console.log('Import response:', response);
      
      // Handle response with detailed information
      let message = '';
      if (response.success) {
        message = response.message;
        
        // Add details about validation errors if any
        if (response.data?.validationErrors && response.data.validationErrors.length > 0) {
          message += `\n\nValidation errors:\n${response.data.validationErrors.slice(0, 5).join('\n')}`;
          if (response.data.validationErrors.length > 5) {
            message += `\n... and ${response.data.validationErrors.length - 5} more`;
          }
        }
        
        // Add details about duplicate errors if any
        if (response.data?.duplicateErrors && response.data.duplicateErrors.length > 0) {
          message += `\n\nDuplicate students (already exist):\n${response.data.duplicateErrors.slice(0, 5).join('\n')}`;
          if (response.data.duplicateErrors.length > 5) {
            message += `\n... and ${response.data.duplicateErrors.length - 5} more`;
          }
        }
      } else {
        message = response.message || 'Failed to import students';
      }
      
      alert(message);
      
      // Show all students after import
      setSearchYear("all");
      setShowAllYears(true);
      setRefreshTrigger(prev => prev + 1);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Error importing students:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to import students';
      let fullMessage = `Import failed: ${errorMessage}`;
      
      // Show validation errors if available
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        fullMessage += `\n\nErrors:\n${errors.slice(0, 5).join('\n')}`;
        if (errors.length > 5) {
          fullMessage += `\n... and ${errors.length - 5} more errors`;
        }
      }
      
      fullMessage += '\n\nPlease check the console for more details.';
      alert(fullMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Student Management
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Manage all students in the system
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <DownloadIcon className="w-4 h-4" />
              Import Students
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Student
            </button>
          </div>
        </div>

        {/* Search Filters */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="searchName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search by Name or Student ID
            </label>
            <input
              id="searchName"
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Enter student name or ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label htmlFor="searchYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search by Year
            </label>
            <select
              id="searchYear"
              value={searchYear}
              onChange={(e) => {
                const value = e.target.value;
                setSearchYear(value);
                setShowAllYears(value === "all"); // If "All Years" selected, set flag
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="none">Select a year</option>
              <option value="all">All Years</option>
              <option value="EY">EY</option>
              <option value="Year 1">Year 1</option>
              <option value="Year 2">Year 2</option>
              <option value="Year 3">Year 3</option>
              <option value="Year 4">Year 4</option>
              <option value="Year 5">Year 5</option>
              <option value="Year 6">Year 6</option>
              <option value="Year 7">Year 7</option>
              <option value="Year 8">Year 8</option>
              <option value="Year 9">Year 9</option>
              <option value="Year 10">Year 10</option>
              <option value="Year 11">Year 11</option>
              <option value="Year 12">Year 12</option>
              <option value="Year 13">Year 13</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 sm:px-6">
                Name
              </th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Sex
              </th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Student ID
              </th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Year
              </th>
              <th className="px-5 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    <p className="text-sm font-medium">Loading students...</p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center">
                  <div className="text-red-500 dark:text-red-400">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center">
                  <div className="tesearchYear === 'none' dark:text-gray-400">
                    {!searchName && !searchYear && !showAllYears ? (
                      <div>
                        <p className="text-sm font-medium">No search criteria entered</p>
                        <p className="text-xs mt-1">Enter a name, student ID, or select a year to search for students</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium">No students found</p>
                        <p className="text-xs mt-1">Try adjusting your search criteria</p>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, index) => (
                <tr
                  key={student._id}
                  className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors ${
                    index === filteredStudents.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-5 py-4 sm:px-6">
                    <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {student.name}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {student.sex}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      {student.studentId}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {student.year}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(student._id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit student"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student._id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete student"
                      >
                        <TrashBinIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 sm:px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {!searchName && searchYear === 'none' && !showAllYears
              ? "Enter search criteria to view students"
              : `Showing ${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`
            }
          </span>
        </div>
      </div>
    </div>

    <AddStudentModal
      isOpen={isAddModalOpen}
      onClose={() => setIsAddModalOpen(false)}
      onSuccess={handleAddSuccess}
    />
    </>
  );
}
