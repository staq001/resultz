import { AdminSettingsPage } from "../pages/AdminSettingsPage";
import { StaffOverviewPage } from "../pages/StaffOverviewPage";
import { StaffGradingPage } from "../pages/StaffGradingPage";
import type { RegisteredCourseUserRow } from "../services/grading.api";
import type { Course, StaffSection } from "../types/app.types";

type StaffPortalContentProps = {
  staffSection: StaffSection;
  departments: string[];
  courses: Course[];
  currentSemester: string;
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
  onGoToSection: (section: StaffSection) => void;
  onFetchRegisteredUsers: (
    courseCode: string,
    semester: string,
  ) => Promise<{
    course: { id?: string; courseCode?: string; title?: string };
    registeredUsers: RegisteredCourseUserRow[];
  }>;
  onSaveScore: (params: {
    registrationId: string;
    scoreId?: string;
    testScore: number;
    examScore: number;
  }) => Promise<{ nextScoreId?: string }>;
  onUpdateName: (name: string) => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
};

export function StaffPortalContent({
  staffSection,
  departments,
  courses,
  currentSemester,
  userName,
  userEmail,
  avatarUrl,
  onGoToSection,
  onFetchRegisteredUsers,
  onSaveScore,
  onUpdateName,
  onUpdatePassword,
  onUploadAvatar,
}: StaffPortalContentProps) {
  if (staffSection === "overview") {
    return (
      <StaffOverviewPage
        departmentsCount={departments.length}
        coursesCount={courses.length}
        currentSemester={currentSemester}
      />
    );
  }

  if (staffSection === "grading") {
    return (
      <StaffGradingPage
        currentSemester={currentSemester}
        onFetchRegisteredUsers={onFetchRegisteredUsers}
        onSaveScore={onSaveScore}
        onBack={() => onGoToSection("overview")}
      />
    );
  }

  return (
    <AdminSettingsPage
      title="Staff Settings"
      backButtonLabel="Back to Staff Home"
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
