import { useEffect, useState } from "react";
import { getAttendanceByDate } from "../../services/attendanceService";
import { getStudents } from "../../services/studentService";

export default function RecentAttendanceTrend() {
  const [recentDays, setRecentDays] = useState<Array<{
    date: string;
    present: number;
    late: number;
    absent: number;
    rate: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get total students for rate calculation
        const studentsResponse = await getStudents({});
        const totalStudents = studentsResponse.data.length;

        // Get last 5 days
        const days = [];
        for (let i = 0; i < 5; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          // Skip weekends
          if (date.getDay() === 0 || date.getDay() === 6) {
            continue;
          }
          
          days.push(date);
          if (days.length === 5) break;
        }

        // Fetch attendance for each day
        const dayData = await Promise.all(
          days.map(async (date) => {
            const dateStr = date.toISOString().split('T')[0];
            try {
              const response = await getAttendanceByDate(dateStr);
              const records = response.data;

              const present = records.filter(r => r.status === 'Present').length;
              const late = records.filter(r => r.status === 'Late').length;
              const absent = records.filter(r => r.status === 'Absent' || r.status === 'Excused').length;
              const rate = totalStudents > 0 ? ((present + late) / totalStudents * 100) : 0;

              return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                present,
                late,
                absent,
                rate: parseFloat(rate.toFixed(1)),
              };
            } catch (err) {
              return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                present: 0,
                late: 0,
                absent: 0,
                rate: 0,
              };
            }
          })
        );

        setRecentDays(dayData);
      } catch (err) {
        console.error('Error fetching recent trend:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading recent attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Recent Attendance Trend
        </h3>
        <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Last 5 school days
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 sm:px-6">
                Date
              </th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Present
              </th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Late
              </th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Absent
              </th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Attendance Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {recentDays.map((day, index) => (
              <tr
                key={day.date}
                className={`border-b border-gray-200 dark:border-gray-800 ${
                  index === recentDays.length - 1 ? "border-b-0" : ""
                }`}
              >
                <td className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90 sm:px-6">
                  {day.date}
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    {day.present}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                    {day.late}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    {day.absent}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 dark:bg-gray-800">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          day.rate >= 95
                            ? "bg-green-500"
                            : day.rate >= 90
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${day.rate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90 min-w-[45px]">
                      {day.rate}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
