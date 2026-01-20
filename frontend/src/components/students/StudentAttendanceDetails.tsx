import { useState, useEffect } from "react";
import { getAttendanceByStudent } from "../../services/attendanceService";

interface Student {
  _id: string;
  name: string;
  sex: string;
  studentId?: string;
  year: string;
}

interface StudentAttendanceDetailsProps {
  student: Student;
  onClose: () => void;
}

type Period = "month" | "3months" | "term" | "semester";
type ViewMode = "period" | "today" | "customDate";

interface AttendanceData {
  totalDays: number;
  present: number;
  late: number;
  excused: number;
  unexcused: number;
}

export default function StudentAttendanceDetails({
  student,
  onClose,
}: StudentAttendanceDetailsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("period");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("month");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [data, setData] = useState<AttendanceData>({
    totalDays: 0,
    present: 0,
    late: 0,
    excused: 0,
    unexcused: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate date range based on period
  const getDateRange = (period: Period) => {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "3months":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "term":
        // Assuming a term is ~4 months
        startDate.setMonth(startDate.getMonth() - 4);
        break;
      case "semester":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  // Fetch attendance data from API
  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      setError(null);
      try {
        let startDate: string;
        let endDate: string;

        if (viewMode === "period") {
          const range = getDateRange(selectedPeriod);
          startDate = range.startDate;
          endDate = range.endDate;
        } else {
          // For today or custom date, fetch just that day
          startDate = selectedDate;
          endDate = selectedDate;
        }

        console.log(`Fetching attendance for student ${student._id} from ${startDate} to ${endDate}`);

        const response = await getAttendanceByStudent(student._id, startDate, endDate);
        
        console.log('Attendance response:', response);
        
        // Process the attendance records
        const records = response.data || [];
        const stats: AttendanceData = {
          totalDays: records.length,
          present: 0,
          late: 0,
          excused: 0,
          unexcused: 0,
        };

        records.forEach((record: any) => {
          console.log('Processing record:', record);
          switch (record.status) {
            case "Present":
              stats.present++;
              break;
            case "Late":
              stats.late++;
              break;
            case "Excused":
              stats.excused++;
              break;
            case "Absent":
              stats.unexcused++;
              break;
          }
        });

        console.log('Final stats:', stats);
        setData(stats);
      } catch (err) {
        console.error("Error fetching attendance:", err);
        setError("Failed to load attendance data");
        setData({
          totalDays: 0,
          present: 0,
          late: 0,
          excused: 0,
          unexcused: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [student._id, viewMode, selectedPeriod, selectedDate]);

  const getPercentage = (value: number) => {
    if (data.totalDays === 0) return "0.0";
    return ((value / data.totalDays) * 100).toFixed(1);
  };

  const periods: { value: Period; label: string }[] = [
    { value: "month", label: "This Month" },
    { value: "3months", label: "3 Months" },
    { value: "term", label: "This Term" },
    { value: "semester", label: "This Semester" },
  ];

  const handlePeriodChange = (period: Period) => {
    setViewMode("period");
    setSelectedPeriod(period);
  };

  const handleTodayClick = () => {
    setViewMode("today");
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  const handleDateChange = (date: string) => {
    setViewMode("customDate");
    setSelectedDate(date);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Attendance Details: {student.name}
            </h3>
            <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
              Student ID: {student.studentId} | Year: {student.year}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Period Selector */}
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {/* Today Button */}
            <button
              onClick={handleTodayClick}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "today"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              Today
            </button>

            {/* Period Buttons */}
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => handlePeriodChange(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "period" && selectedPeriod === period.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                viewMode === "customDate"
                  ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900/50"
                  : "border-gray-300 dark:border-gray-700"
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading attendance data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        ) : data.totalDays === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No attendance records found for this period
              </p>
            </div>
          </div>
        ) : (
          <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Days
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.totalDays}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <div className="text-sm text-green-700 dark:text-green-400 mb-1">
              Present
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {data.present}
            </div>
            <div className="text-xs text-green-600 dark:text-green-500 mt-1">
              {getPercentage(data.present)}%
            </div>
          </div>

          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <div className="text-sm text-yellow-700 dark:text-yellow-400 mb-1">
              Late
            </div>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
              {data.late}
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
              {getPercentage(data.late)}%
            </div>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="text-sm text-blue-700 dark:text-blue-400 mb-1">
              Excused
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {data.excused}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-500 mt-1">
              {getPercentage(data.excused)}%
            </div>
          </div>

          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="text-sm text-red-700 dark:text-red-400 mb-1">
              Unexcused
            </div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {data.unexcused}
            </div>
            <div className="text-xs text-red-600 dark:text-red-500 mt-1">
              {getPercentage(data.unexcused)}%
            </div>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">
              Overall Attendance Rate
            </h4>
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {getPercentage(data.present + data.late)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{
                width: `${getPercentage(data.present + data.late)}%`,
              }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            {data.present + data.late} out of {data.totalDays} days attended (including late arrivals)
          </p>
        </div>

        {/* Breakdown Table */}
        <div className="mt-6">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Detailed Breakdown
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Count
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Percentage
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="inline-flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Present
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                    {data.present}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                    {getPercentage(data.present)}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${getPercentage(data.present)}%` }}
                      />
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="inline-flex items-center">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                      Late
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                    {data.late}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                    {getPercentage(data.late)}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-full bg-yellow-500 rounded-full"
                        style={{ width: `${getPercentage(data.late)}%` }}
                      />
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="inline-flex items-center">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                      Excused Absence
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                    {data.excused}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                    {getPercentage(data.excused)}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${getPercentage(data.excused)}%` }}
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="inline-flex items-center">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      Unexcused Absence
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                    {data.unexcused}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                    {getPercentage(data.unexcused)}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${getPercentage(data.unexcused)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
