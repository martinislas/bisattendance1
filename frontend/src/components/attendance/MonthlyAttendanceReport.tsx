import { useState, useEffect } from "react";
import { getStudents, Student } from "../../services/studentService";
import { getAttendanceByStudent, bulkRecordAttendance } from "../../services/attendanceService";

type AttendanceStatus = "unmarked" | "present" | "late" | "excused" | "unexcused";

type StudentAttendance = Student & {
  attendance: Record<number, AttendanceStatus>;
};

export default function MonthlyAttendanceReport() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch students and their attendance when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch students for selected grade
        const params: any = {};
        if (selectedGrade !== "all") params.year = selectedGrade;
        
        const studentsResponse = await getStudents(params);
        const allStudents = studentsResponse.data;

        // Calculate date range for the selected month
        const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
        const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];

        // Fetch attendance for each student
        const studentsWithAttendance: StudentAttendance[] = await Promise.all(
          allStudents.map(async (student) => {
            try {
              const attendanceResponse = await getAttendanceByStudent(student._id, startDate, endDate);
              const attendanceRecords = attendanceResponse.data;

              // Map attendance records to day numbers
              const attendance: Record<number, AttendanceStatus> = {};
              attendanceRecords.forEach(record => {
                const recordDate = new Date(record.date);
                // Make sure we're getting the correct day in the selected month/year
                if (recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear) {
                  const day = recordDate.getDate();
                
                let status: AttendanceStatus = "unmarked";
                switch (record.status) {
                  case "Present":
                    status = "present";
                    break;
                  case "Late":
                    status = "late";
                    break;
                  case "Excused":
                    status = "excused";
                    break;
                  case "Absent":
                    status = "unexcused";
                    break;
                }
                attendance[day] = status;
                }
              });

              return {
                ...student,
                attendance,
              };
            } catch (err) {
              console.error(`Error fetching attendance for student ${student._id}:`, err);
              return {
                ...student,
                attendance: {},
              };
            }
          })
        );

        setStudents(studentsWithAttendance);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear, selectedGrade]);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

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

  const years = Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - 5 + i);

  // Get days in the selected month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getDayOfWeek = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const filteredStudents =
    selectedGrade === "all"
      ? students
      : students.filter((s) => s.year === selectedGrade);

  const cycleStatus = (
    studentId: string,
    day: number,
    currentStatus: AttendanceStatus
  ) => {
    const statusCycle: AttendanceStatus[] = [
      "unmarked",
      "present",
      "late",
      "excused",
      "unexcused",
    ];
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

    setStudents(
      students.map((s) =>
        s._id === studentId
          ? { ...s, attendance: { ...s.attendance, [day]: nextStatus } }
          : s
      )
    );
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      // Collect ALL attendance records including unmarked ones
      const attendanceRecords: any[] = [];
      
      students.forEach(student => {
        Object.entries(student.attendance).forEach(([day, status]) => {
          // Format date properly to avoid timezone issues
          const year = selectedYear;
          const month = String(selectedMonth + 1).padStart(2, '0');
          const dayStr = String(day).padStart(2, '0');
          const dateString = `${year}-${month}-${dayStr}`;
          
          attendanceRecords.push({
            studentId: student._id,
            date: dateString,
            status: status === "unmarked" ? "Unmarked" :
                   status === "present" ? "Present" :
                   status === "late" ? "Late" :
                   status === "excused" ? "Excused" : "Absent",
            notes: "",
          });
        });
      });

      if (attendanceRecords.length > 0) {
        await bulkRecordAttendance(attendanceRecords);
        alert(`Attendance saved successfully for ${attendanceRecords.length} records!`);
        
        // Refresh the data after saving
        const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
        const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
        
        const params: any = {};
        if (selectedGrade !== "all") params.year = selectedGrade;
        const studentsResponse = await getStudents(params);
        const allStudents = studentsResponse.data;

        const studentsWithAttendance: StudentAttendance[] = await Promise.all(
          allStudents.map(async (student) => {
            try {
              const attendanceResponse = await getAttendanceByStudent(student._id, startDate, endDate);
              const attendanceRecords = attendanceResponse.data;

              const attendance: Record<number, AttendanceStatus> = {};
              attendanceRecords.forEach(record => {
                const recordDate = new Date(record.date);
                if (recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear) {
                  const day = recordDate.getDate();
                  
                  let status: AttendanceStatus = "unmarked";
                  switch (record.status) {
                    case "Present":
                      status = "present";
                      break;
                    case "Late":
                      status = "late";
                      break;
                    case "Excused":
                      status = "excused";
                      break;
                    case "Absent":
                      status = "unexcused";
                      break;
                  }
                  attendance[day] = status;
                }
              });

              return {
                ...student,
                attendance,
              };
            } catch (err) {
              console.error(`Error fetching attendance for student ${student._id}:`, err);
              return {
                ...student,
                attendance: {},
              };
            }
          })
        );

        setStudents(studentsWithAttendance);
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

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return "bg-green-500 hover:bg-green-600";
      case "late":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "excused":
        return "bg-blue-500 hover:bg-blue-600";
      case "unexcused":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";
    }
  };

  const getStatusInitial = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return "P";
      case "late":
        return "L";
      case "excused":
        return "E";
      case "unexcused":
        return "U";
      default:
        return "";
    }
  };

  const getStudentSummary = (attendance: Record<number, AttendanceStatus>) => {
    const summary = {
      present: 0,
      late: 0,
      excused: 0,
      unexcused: 0,
      unmarked: 0,
    };

    days.forEach((day) => {
      const status = attendance[day] || "unmarked";
      summary[status]++;
    });

    return summary;
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Monthly Attendance Report
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              View and manage monthly attendance records
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Grade
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

          {/* Legend */}
          <div className="flex flex-wrap gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">
                P
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center text-white text-xs font-bold">
                L
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                E
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Excused Absent
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                U
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Unexcused Absent
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Unmarked</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-5 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 sm:px-6 min-w-[200px]">
                  Student Name
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="px-2 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[50px]"
                  >
                    <div>{day}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {getDayOfWeek(day, selectedMonth, selectedYear)}
                    </div>
                  </th>
                ))}
                <th className="sticky right-0 z-10 bg-gray-50 dark:bg-gray-900/50 px-5 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[150px]">
                  Summary
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={days.length + 2} className="px-5 py-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading students...</p>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={days.length + 2} className="px-5 py-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No students found</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => {
                  const summary = getStudentSummary(student.attendance);
                  
                  return (
                  <tr
                    key={student._id}
                    className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors ${
                      index === filteredStudents.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-5 py-3 sm:px-6 border-r border-gray-200 dark:border-gray-800">
                    <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {student.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {student.year}
                    </div>
                  </td>
                  {days.map((day) => {
                    const status = student.attendance[day] || "unmarked";
                    const dayOfWeek = getDayOfWeek(day, selectedMonth, selectedYear);
                    const isWeekend = dayOfWeek === "Sat" || dayOfWeek === "Sun";
                    
                    return (
                      <td
                        key={day}
                        className={`px-2 py-3 ${
                          isWeekend ? "bg-gray-100 dark:bg-gray-900/50" : ""
                        }`}
                      >
                        <button
                          onClick={() => cycleStatus(student._id, day, status)}
                          className={`w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold transition-colors ${getStatusColor(
                            status
                          )} ${
                            status === "unmarked"
                              ? "text-gray-400 dark:text-gray-500"
                              : ""
                          }`}
                          title={`Click to change status for day ${day}`}
                        >
                          {getStatusInitial(status)}
                        </button>
                      </td>
                    );
                  })}
                  <td className="sticky right-0 z-10 bg-white dark:bg-white/[0.03] hover:bg-gray-50 dark:hover:bg-gray-900/30 px-5 py-3 border-l border-gray-200 dark:border-gray-800">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Present:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {summary.present}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Late:</span>
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                          {summary.late}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Excused:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {summary.excused}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Unexcused:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          {summary.unexcused}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredStudents.length} students for {months[selectedMonth]}{" "}
            {selectedYear}
          </span>
          <div className="flex gap-3">
            <button 
              onClick={handleSaveAttendance}
              disabled={saving || loading}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Attendance"}
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
