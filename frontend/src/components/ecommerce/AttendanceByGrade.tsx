import { useEffect, useState } from "react";
import { getStudents } from "../../services/studentService";
import { getAttendanceByDate } from "../../services/attendanceService";

export default function AttendanceByGrade() {
  const [gradeData, setGradeData] = useState<Array<{ grade: string; totalStudents: number; present: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch all students
        const studentsResponse = await getStudents({});
        const allStudents = studentsResponse.data;

        // Fetch today's attendance
        const attendanceResponse = await getAttendanceByDate(today);
        const attendanceRecords = attendanceResponse.data;

        // Create a map of present students using the student reference _id
        const presentStudentIds = new Set(
          attendanceRecords
            .filter(r => r.status === 'Present' || r.status === 'Late')
            .map(r => {
              const studentId = r.student?._id || r.student;
              return studentId ? studentId.toString() : null;
            })
            .filter(id => id !== null)
        );

        // Group by grade
        const grades = ['EY', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13'];
        const data = grades.map(grade => {
          const gradeStudents = allStudents.filter(s => s.year === grade);
          const presentCount = gradeStudents.filter(s => presentStudentIds.has(s._id)).length;
          
          return {
            grade,
            totalStudents: gradeStudents.length,
            present: presentCount,
          };
        }).filter(item => item.totalStudents > 0); // Only show grades with students

        setGradeData(data);
      } catch (err) {
        console.error('Error fetching grade data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculatePercentage = (present: number, total: number) => {
    if (total === 0) return "0.0";
    return ((present / total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading grade data...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Attendance by Grade
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Today's attendance across all grade levels
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {gradeData.map((item) => {
          const percentage = calculatePercentage(item.present, item.totalStudents);
          const percentageNum = parseFloat(percentage);
          
          return (
            <div
              key={item.grade}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/50"
            >
              <h4 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-2">
                {item.grade}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {item.totalStudents} students
              </p>
              <div className="w-full bg-gray-100 rounded-full h-3 dark:bg-gray-800 mb-2">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    percentageNum >= 95
                      ? "bg-green-500"
                      : percentageNum >= 90
                      ? "bg-yellow-500"
                      : percentageNum >= 80
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {item.present} present
                </span>
                <span className="text-sm font-bold text-gray-800 dark:text-white/90">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
