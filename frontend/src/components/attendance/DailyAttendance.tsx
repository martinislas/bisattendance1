import { useState, useRef, useEffect } from "react";
import { CheckCircleIcon, TimeIcon, AlertIcon, CloseIcon, CalenderIcon } from "../../icons";
import flatpickr from "flatpickr";
import { getStudents, Student } from "../../services/studentService";
import { getAttendanceByDate, bulkRecordAttendance, AttendanceRecord } from "../../services/attendanceService";

type AttendanceStatus = "unmarked" | "present" | "late" | "excused" | "unexcused";

type StudentWithAttendance = Student & {
  attendanceStatus: AttendanceStatus;
  attendanceId?: string;
};

export default function DailyAttendance() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedGrade, setSelectedGrade] = useState("all");
  const datePickerRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch students and their attendance for selected date and grade
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch students for selected grade
        const params: any = {};
        if (selectedGrade !== "all") params.year = selectedGrade;
        
        const studentsResponse = await getStudents(params);
        const allStudents = studentsResponse.data;

        // Fetch attendance records for the selected date
        const attendanceResponse = await getAttendanceByDate(selectedDate);
        const attendanceRecords = attendanceResponse.data;

        // Map attendance records to students using the student reference _id
        const attendanceMap = new Map<string, AttendanceRecord>();
        attendanceRecords.forEach(record => {
          // Use the student ObjectId from the populated student field or student reference
          const studentId = record.student?._id || record.student;
          if (studentId) {
            attendanceMap.set(studentId.toString(), record);
          }
        });

        // Combine students with their attendance status
        const studentsWithAttendance: StudentWithAttendance[] = allStudents.map(student => {
          const attendance = attendanceMap.get(student._id);
          let attendanceStatus: AttendanceStatus = "unmarked";
          
          if (attendance) {
            switch (attendance.status) {
              case "Present":
                attendanceStatus = "present";
                break;
              case "Late":
                attendanceStatus = "late";
                break;
              case "Excused":
                attendanceStatus = "excused";
                break;
              case "Absent":
                attendanceStatus = "unexcused";
                break;
            }
          }

          return {
            ...student,
            attendanceStatus,
            attendanceId: attendance?._id,
          };
        });

        setStudents(studentsWithAttendance);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, selectedGrade]);

  useEffect(() => {
    if (!datePickerRef.current) return;

    const fp = flatpickr(datePickerRef.current, {
      dateFormat: "Y-m-d",
      defaultDate: selectedDate,
      onChange: (selectedDates) => {
        if (selectedDates[0]) {
          setSelectedDate(selectedDates[0].toISOString().split("T")[0]);
        }
      },
      prevArrow:
        '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 15L7.5 10L12.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      nextArrow:
        '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 15L12.5 10L7.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    });

    return () => {
      if (!Array.isArray(fp)) {
        fp.destroy();
      }
    };
  }, []);

  const grades = [
    "all",
    "EY",
    "Year 1",
    "Year 2",
    "Year 3",
    "Year 4",
    "Year 5",
    "Year 6",
    "Year 7",
    "Year 8",
    "Year 9",
    "Year 10",
    "Year 11",
    "Year 12",
    "Year 13",
  ];

  const filteredStudents = students;

  const counts = {
    present: filteredStudents.filter((s) => s.attendanceStatus === "present").length,
    late: filteredStudents.filter((s) => s.attendanceStatus === "late").length,
    excused: filteredStudents.filter((s) => s.attendanceStatus === "excused").length,
    unexcused: filteredStudents.filter((s) => s.attendanceStatus === "unexcused").length,
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(
      students.map((s) => (s._id === studentId ? { ...s, attendanceStatus: status } : s))
    );
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const attendanceRecords = students
        .filter(s => s.attendanceStatus !== "unmarked")
        .map(student => ({
          studentId: student._id,
          date: selectedDate,
          status: student.attendanceStatus === "present" ? "Present" :
                 student.attendanceStatus === "late" ? "Late" :
                 student.attendanceStatus === "excused" ? "Excused" : "Absent",
          notes: "",
        }));

      if (attendanceRecords.length > 0) {
        await bulkRecordAttendance(attendanceRecords);
        alert(`Attendance saved successfully for ${attendanceRecords.length} students!`);
      } else {
        alert("No attendance to save. Please mark at least one student.");
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert("Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            Present
          </span>
        );
      case "late":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            Late
          </span>
        );
      case "excused":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            Excused Absent
          </span>
        );
      case "unexcused":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            Unexcused Absent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400">
            Unmarked
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Daily Attendance
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Mark attendance for students
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <div className="relative">
                <CalenderIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-500 dark:text-gray-400 pointer-events-none z-10" />
                <input
                  ref={datePickerRef}
                  type="text"
                  value={selectedDate}
                  readOnly
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  placeholder="Select date"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Grade
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade === "all" ? "All Grades" : grade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-green-50 dark:bg-green-900/10 p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                  Present
                </span>
              </div>
              <p className="text-xl font-bold text-green-700 dark:text-green-400">
                {counts.present}
              </p>
            </div>
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/10 p-3">
              <div className="flex items-center gap-2 mb-1">
                <TimeIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                  Late
                </span>
              </div>
              <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
                {counts.late}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                  Excused
                </span>
              </div>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                {counts.excused}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-3">
              <div className="flex items-center gap-2 mb-1">
                <CloseIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-xs font-medium text-red-700 dark:text-red-400">
                  Unexcused
                </span>
              </div>
              <p className="text-xl font-bold text-red-700 dark:text-red-400">
                {counts.unexcused}
              </p>
            </div>
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
                Student ID
              </th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Year
              </th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Status
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading students...</p>
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No students found</p>
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
                      {student.studentId || 'N/A'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {student.year}
                    </span>
                  </td>
                  <td className="px-5 py-4">{getStatusBadge(student.attendanceStatus)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleStatusChange(student._id, "present")}
                        className="p-1.5 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="Mark Present"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(student._id, "late")}
                        className="p-1.5 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20 rounded transition-colors"
                        title="Mark Late"
                      >
                        <TimeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(student._id, "excused")}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Mark Excused Absent"
                      >
                        <AlertIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(student._id, "unexcused")}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Mark Unexcused Absent"
                      >
                        <CloseIcon className="w-4 h-4" />
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
            Showing {filteredStudents.length} students
          </span>
          <button 
            onClick={handleSaveAttendance}
            disabled={saving || loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
}
