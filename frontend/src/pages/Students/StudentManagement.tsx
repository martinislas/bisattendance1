import PageMeta from "../../components/common/PageMeta";
import StudentManagement from "../../components/students/StudentManagement";

export default function StudentManagementPage() {
  return (
    <>
      <PageMeta
        title="Student Management | Attendance Management System"
        description="Manage all students in the attendance system"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <StudentManagement />
        </div>
      </div>
    </>
  );
}
