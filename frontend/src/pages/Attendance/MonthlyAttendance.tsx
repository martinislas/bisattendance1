import PageMeta from "../../components/common/PageMeta";
import MonthlyAttendanceReport from "../../components/attendance/MonthlyAttendanceReport";

export default function MonthlyAttendancePage() {
  return (
    <>
      <PageMeta
        title="Monthly Attendance | Attendance Management System"
        description="View and manage monthly attendance records"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <MonthlyAttendanceReport />
        </div>
      </div>
    </>
  );
}
