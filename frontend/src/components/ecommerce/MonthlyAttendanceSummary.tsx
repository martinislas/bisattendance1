import { useEffect, useState } from "react";
import { getStudents } from "../../services/studentService";
import { getAttendanceStats } from "../../services/attendanceService";

export default function MonthlyAttendanceSummary() {
  const [summaryData, setSummaryData] = useState({
    present: 0,
    late: 0,
    excused: 0,
    unexcused: 0,
    totalSlots: 0,
    schoolDays: 0,
  });
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get start of current month and today (not future dates)
        const startDate = new Date(currentYear, currentDate.getMonth(), 1).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        const endDate = today; // Only go up to today, not end of month

        // Fetch students count
        const studentsResponse = await getStudents({});
        const totalStudents = studentsResponse.data.length;

        // Fetch attendance stats for the month
        const statsResponse = await getAttendanceStats(startDate, endDate);
        const stats = statsResponse.data;

        // School days come from backend (distinct dates with attendance)
        const schoolDays = stats.schoolDays || 0;

        setSummaryData({
          present: stats.present || 0,
          late: stats.late || 0,
          excused: stats.excused || 0,
          unexcused: stats.absent || 0,
          totalSlots: totalStudents * schoolDays,
          schoolDays,
        });
      } catch (err) {
        console.error('Error fetching monthly summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const attendanceData = [
    {
      label: "Present",
      count: summaryData.present,
      color: "bg-green-500",
      lightColor: "bg-green-100",
      textColor: "text-green-700",
    },
    {
      label: "Late",
      count: summaryData.late,
      color: "bg-yellow-500",
      lightColor: "bg-yellow-100",
      textColor: "text-yellow-700",
    },
    {
      label: "Excused Absent",
      count: summaryData.excused,
      color: "bg-blue-500",
      lightColor: "bg-blue-100",
      textColor: "text-blue-700",
    },
    {
      label: "Unexcused Absent",
      count: summaryData.unexcused,
      color: "bg-red-500",
      lightColor: "bg-red-100",
      textColor: "text-red-700",
    },
  ];

  const calculatePercentage = (count: number) => {
    if (summaryData.totalSlots === 0) return "0.0";
    return ((count / summaryData.totalSlots) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading summary...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {currentMonth} {currentYear} Summary
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          {summaryData.schoolDays} school days
        </p>
      </div>

      <div className="space-y-5">
        {attendanceData.map((item) => {
          const percentage = calculatePercentage(item.count);
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {item.count.toLocaleString()}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${item.lightColor} ${item.textColor}`}
                  >
                    {percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 dark:bg-gray-800">
                <div
                  className={`h-3 rounded-full ${item.color} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Attendance Records
          </span>
          <span className="text-lg font-bold text-gray-800 dark:text-white/90">
            {summaryData.totalSlots.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
