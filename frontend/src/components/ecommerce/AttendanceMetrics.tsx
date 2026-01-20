import { useEffect, useState } from "react";
import {
  GroupIcon,
  CheckCircleIcon,
  AlertIcon,
  CloseIcon,
  TimeIcon,
} from "../../icons";
import { getStudents } from "../../services/studentService";
import { getAttendanceByDate } from "../../services/attendanceService";

export default function AttendanceMetrics() {
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    present: 0,
    excused: 0,
    unexcused: 0,
    late: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch total students
        const studentsResponse = await getStudents({});
        const totalStudents = studentsResponse.data.length;

        // Fetch today's attendance
        const attendanceResponse = await getAttendanceByDate(today);
        const attendanceRecords = attendanceResponse.data;

        // Count by status
        const present = attendanceRecords.filter(r => r.status === 'Present').length;
        const late = attendanceRecords.filter(r => r.status === 'Late').length;
        const excused = attendanceRecords.filter(r => r.status === 'Excused').length;
        const unexcused = attendanceRecords.filter(r => r.status === 'Absent').length;

        setMetrics({
          totalStudents,
          present,
          excused,
          unexcused,
          late,
        });
      } catch (err) {
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading metrics...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 md:gap-6">
      {/* <!-- Total Students --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl dark:bg-blue-900/20">
          <GroupIcon className="text-blue-600 size-6 dark:text-blue-400" />
        </div>

        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total Students
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {metrics.totalStudents}
          </h4>
        </div>
      </div>

      {/* <!-- Present Today --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-900/20">
          <CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Present Today
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {metrics.present}
          </h4>
        </div>
      </div>

      {/* <!-- Excused Absences Today --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl dark:bg-yellow-900/20">
          <AlertIcon className="text-yellow-600 size-6 dark:text-yellow-400" />
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Excused Absences
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {metrics.excused}
          </h4>
        </div>
      </div>

      {/* <!-- Unexcused Absences Today --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl dark:bg-red-900/20">
          <CloseIcon className="text-red-600 size-6 dark:text-red-400" />
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Unexcused Absences
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {metrics.unexcused}
          </h4>
        </div>
      </div>

      {/* <!-- Late Today --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl dark:bg-orange-900/20">
          <TimeIcon className="text-orange-600 size-6 dark:text-orange-400" />
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Late Today
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {metrics.late}
          </h4>
        </div>
      </div>
    </div>
  );
}
