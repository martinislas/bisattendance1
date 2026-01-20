import PageMeta from "../../components/common/PageMeta";
import DailyAttendance from "../../components/attendance/DailyAttendance";

export default function DailyAttendancePage() {
  return (
    <>
      <PageMeta
        title="Daily Attendance | Attendance Management System"
        description="Mark daily attendance for students"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <DailyAttendance />
        </div>
      </div>
    </>
  );
}
