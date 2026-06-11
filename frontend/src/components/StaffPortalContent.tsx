import { AdminSettingsPage } from "../pages/AdminSettingsPage";
import { StaffOverviewPage } from "../pages/StaffOverviewPage";
import { StaffGradingPage } from "../pages/StaffGradingPage";
import { StaffUpdateScorePage } from "../pages/StaffUpdateScorePage";
import { StaffCourseScoresPage } from "../pages/StaffCourseScoresPage";
import type {
  CourseScoreRow,
  RegisteredCourseUserRow,
} from "../services/grading.api";
import type { Course, StaffSection } from "../types/app.types";

type StaffPortalContentProps = {
  staffSection: StaffSection;
  departments: string[];
  courses: Course[];
  currentSemester: string;
  currentSemesterId: string;
  isLoading: boolean;
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
  onFindScore: (params: {
    matricNo: string;
    courseCode: string;
  }) => Promise<CourseScoreRow>;
  onUpdateScore: (params: {
    matricNo: string;
    registrationId: string;
    testScore: number;
    examScore: number;
  }) => Promise<void>;
  onFetchCourseScores: (
    courseCode: string,
    semesterId: string,
  ) => Promise<{
    course: {
      id?: string;
      courseCode?: string;
      title?: string;
      units?: number;
      semester?: string;
      level?: number;
    };
    scores: CourseScoreRow[];
  }>;
  onUpdateName: (name: string) => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
};

export function StaffPortalContent({
  staffSection,
  departments,
  courses,
  currentSemester,
  currentSemesterId,
  isLoading,
  userName,
  userEmail,
  avatarUrl,
  onGoToSection,
  onFetchRegisteredUsers,
  onSaveScore,
  onFindScore,
  onUpdateScore,
  onFetchCourseScores,
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
        isLoading={isLoading}
      />
    );
  }

  if (staffSection === "grading") {
    return (
      <StaffGradingPage
        currentSemester={currentSemester}
        currentSemesterId={currentSemesterId}
        onFetchRegisteredUsers={onFetchRegisteredUsers}
        onSaveScore={onSaveScore}
        onBack={() => onGoToSection("overview")}
      />
    );
  }

  if (staffSection === "score-update") {
    return (
      <StaffUpdateScorePage
        currentSemester={currentSemester}
        currentSemesterId={currentSemesterId}
        onFindScore={onFindScore}
        onUpdateScore={onUpdateScore}
        onBack={() => onGoToSection("overview")}
      />
    );
  }

  if (staffSection === "course-scores") {
    return (
      <StaffCourseScoresPage
        currentSemester={currentSemester}
        currentSemesterId={currentSemesterId}
        onFetchCourseScores={onFetchCourseScores}
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
