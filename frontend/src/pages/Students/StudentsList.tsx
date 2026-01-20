 import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import StudentAttendanceDetails from "../../components/students/StudentAttendanceDetails";
import { getStudents, Student } from "../../services/studentService";

export default function StudentsListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("none");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  const years = ["none", "all", "EY", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13"];

  useEffect(() => {
    const fetchStudents = async () => {
      // Don't fetch if no search criteria
      if (!searchTerm && selectedYear === "none") {
        setStudents([]);
        return;
      }

      // Fetch all students when "all" is selected
      if (!searchTerm && selectedYear === "all") {
        setLoading(true);
        try {
          const response = await getStudents({});
          setStudents(response.data);
        } catch (err) {
          console.error('Error fetching students:', err);
        } finally {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const params: any = {};
        if (searchTerm) params.name = searchTerm;
        if (selectedYear !== "all" && selectedYear !== "none") params.year = selectedYear;

        const response = await getStudents(params);
        setStudents(response.data);
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedYear]);

  const filteredStudents = students;

  const handleStudentClick = (studentId: string) => {
    setSelectedStudent(studentId);
  };

  const selectedStudentData = students.find(s => s._id === selectedStudent);

  return (
    <>
      <PageMeta
        title="Students | Attendance Management System"
        description="View all students"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Students
                </h3>
                <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                  View all students in the system
                </p>
              </div>
              
              {/* Search and Filter Controls */}
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by student name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:w-48">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year === "none" ? "Select a year" : year === "all" ? "All Years" : year}
                      </option>
                    ))}
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
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        Loading students...
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        {!searchTerm && selectedYear === "all" 
                          ? "Enter search criteria to view students"
                          : "No students found"
                        }
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
                          <button
                            onClick={() => handleStudentClick(student._id)}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            {student.name}
                          </button>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 sm:px-6 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {!searchTerm && selectedYear === "all" 
                    ? "Enter search criteria to view students"
                    : `Showing ${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Student Attendance Details Modal */}
        {selectedStudent && selectedStudentData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <StudentAttendanceDetails
                student={selectedStudentData}
                onClose={() => setSelectedStudent(null)}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
