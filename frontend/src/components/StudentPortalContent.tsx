import { StudentOverviewPage } from "../pages/StudentOverviewPage";
import { StudentRegistrationPage } from "../pages/StudentRegistrationPage";
import { StudentResultsPage } from "../pages/StudentResultsPage";
import { StudentSettingsPage } from "../pages/StudentSettingsPage";
import type { Course, StudentResult, StudentSection } from "../types/app.types";

type StudentPortalContentProps = {
  studentSection: StudentSection;
  userName: string;
  userEmail: string;
  matricNo: string;
  avatarUrl?: string | null;
  currentGpa: number;
  currentCgpa: number;
  registeredCourseCodes: string[];
  courses: Course[];
  currentSemester: string;
  semesters: string[];
  activeSemester: string;
  semesterResults: StudentResult[];
  onGoToSection: (section: StudentSection) => void;
  onRegisterCourse: (code: string) => Promise<void>;
  onChangeSemester: (semester: string) => void;
  onUpdateName: (name: string) => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
};

export function StudentPortalContent({
  studentSection,
  userName,
  userEmail,
  matricNo,
  avatarUrl,
  currentGpa,
  currentCgpa,
  registeredCourseCodes,
  courses,
  currentSemester,
  semesters,
  activeSemester,
  semesterResults,
  onGoToSection,
  onRegisterCourse,
  onChangeSemester,
  onUpdateName,
  onUpdatePassword,
  onUploadAvatar,
}: StudentPortalContentProps) {
  if (studentSection === "overview") {
    return (
      <StudentOverviewPage
        userName={userName}
        matricNo={matricNo}
        currentGpa={currentGpa}
        currentCgpa={currentCgpa}
        registeredCount={registeredCourseCodes.length}
      />
    );
  }

  if (studentSection === "registration") {
    return (
      <StudentRegistrationPage
        courses={courses}
        currentSemester={currentSemester}
        registeredCourseCodes={registeredCourseCodes}
        onRegisterCourse={onRegisterCourse}
      />
    );
  }

  if (studentSection === "results") {
    return (
      <StudentResultsPage
        semesters={semesters}
        activeSemester={activeSemester}
        semesterResults={semesterResults}
        onChangeSemester={onChangeSemester}
      />
    );
  }

  return (
    <StudentSettingsPage
      userName={userName}
      userEmail={userEmail}
      matricNo={matricNo}
      avatarUrl={avatarUrl}
      onUpdateName={onUpdateName}
      onUpdatePassword={onUpdatePassword}
      onUploadAvatar={onUploadAvatar}
      onBack={() => onGoToSection("overview")}
    />
  );
}
