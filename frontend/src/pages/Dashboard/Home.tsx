import AttendanceMetrics from "../../components/ecommerce/AttendanceMetrics";
import AttendanceTrendsChart from "../../components/ecommerce/AttendanceTrendsChart";
import MonthlyAttendanceSummary from "../../components/ecommerce/MonthlyAttendanceSummary";
import RecentAttendanceTrend from "../../components/ecommerce/RecentAttendanceTrend";
import AttendanceByGrade from "../../components/ecommerce/AttendanceByGrade";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {

  return (
    <>
      <PageMeta
        title="Dashboard | BIS Attendance Management System"
        description="View attendance metrics, trends, and analytics for BIS Norodom"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <AttendanceMetrics />
        </div>

        <div className="col-span-12">
          <AttendanceTrendsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyAttendanceSummary />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentAttendanceTrend />
        </div>

        <div className="col-span-12">
          <AttendanceByGrade />
        </div>
      </div>
    </>
  );
}
