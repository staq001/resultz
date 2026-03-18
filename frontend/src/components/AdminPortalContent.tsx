import { AdminCoursesPage } from "../pages/AdminCoursesPage";
import { AdminDepartmentsPage } from "../pages/AdminDepartmentsPage";
import { AdminOverviewPage } from "../pages/AdminOverviewPage";
import { AdminSemestersPage } from "../pages/AdminSemestersPage";
import { AdminSettingsPage } from "../pages/AdminSettingsPage";
import type { AdminSection, Course, NewCourseForm } from "../types/app.types";

type AdminPortalContentProps = {
  adminSection: AdminSection;
  departments: string[];
  courses: Course[];
  currentSemester: string;
  semesters: string[];
  isLoadingSemesterData: boolean;
  newCourse: NewCourseForm;
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
  onGoToSection: (section: AdminSection) => void;
  onSetNewCourse: (value: NewCourseForm) => void;
  onCreateDepartment: (name: string, faculty: string) => Promise<void>;
  onUpdateDepartment: (
    currentName: string,
    newName: string,
    faculty?: string,
  ) => Promise<void>;
  onFindDepartmentsByFaculty: (faculty: string) => Promise<string[]>;
  onCreateCourse: (value: NewCourseForm) => Promise<void>;
  onUpdateCourse: (value: NewCourseForm) => Promise<void>;
  onCreateSemester: (name: string) => Promise<void>;
  onSetSemester: (name: string) => Promise<void>;
  onUpdateSemester: (currentName: string, newName: string) => Promise<void>;
  onUpdateName: (name: string) => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
};

export function AdminPortalContent({
  adminSection,
  departments,
  courses,
  currentSemester,
  semesters,
  isLoadingSemesterData,
  newCourse,
  userName,
  userEmail,
  avatarUrl,
  onGoToSection,
  onSetNewCourse,
  onCreateDepartment,
  onUpdateDepartment,
  onFindDepartmentsByFaculty,
  onCreateCourse,
  onUpdateCourse,
  onCreateSemester,
  onSetSemester,
  onUpdateSemester,
  onUpdateName,
  onUpdatePassword,
  onUploadAvatar,
}: AdminPortalContentProps) {
  if (adminSection === "overview") {
    return (
      <AdminOverviewPage
        departmentsCount={departments.length}
        coursesCount={courses.length}
        currentSemester={currentSemester}
      />
    );
  }

  if (adminSection === "departments") {
    return (
      <AdminDepartmentsPage
        departments={departments}
        courses={courses}
        onCreateDepartment={onCreateDepartment}
        onUpdateDepartment={onUpdateDepartment}
        onFindDepartmentsByFaculty={onFindDepartmentsByFaculty}
        onBack={() => onGoToSection("overview")}
      />
    );
  }

  if (adminSection === "courses") {
    return (
      <AdminCoursesPage
        departments={departments}
        courses={courses}
        newCourse={newCourse}
        onSetNewCourse={onSetNewCourse}
        onCreateCourse={onCreateCourse}
        onUpdateCourse={onUpdateCourse}
        onBack={() => onGoToSection("overview")}
      />
    );
  }

  if (adminSection === "semesters") {
    return (
      <AdminSemestersPage
        currentSemester={currentSemester}
        semesters={semesters}
        isLoadingSemesterData={isLoadingSemesterData}
        onCreateSemester={onCreateSemester}
        onSetSemester={onSetSemester}
        onUpdateSemester={onUpdateSemester}
        onBack={() => onGoToSection("overview")}
      />
    );
  }

  return (
    <AdminSettingsPage
      userName={userName}
      userEmail={userEmail}
      avatarUrl={avatarUrl}
      onUpdateName={onUpdateName}
      onUpdatePassword={onUpdatePassword}
      onUploadAvatar={onUploadAvatar}
      onBack={() => onGoToSection("overview")}
    />
  );
}
