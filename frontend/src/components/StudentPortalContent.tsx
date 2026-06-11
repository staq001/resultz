import { StudentOverviewPage } from "../pages/StudentOverviewPage";
import { StudentRegisteredCoursesPage } from "../pages/StudentRegisteredCoursesPage";
import { StudentRegistrationPage } from "../pages/StudentRegistrationPage";
import { StudentResultsPage } from "../pages/StudentResultsPage";
import { StudentSettingsPage } from "../pages/StudentSettingsPage";
import type { RegistrationRow } from "../services/registration.api";
import type {
  ComprehensiveReport,
  StudentScoreRecord,
} from "../services/results.api";
import type { Course, StudentSection } from "../types/app.types";

type StudentPortalContentProps = {
  studentSection: StudentSection;
  userName: string;
  userEmail: string;
  matricNo: string;
  department?: string | null;
  entryYear?: number | null;
  isGraduated?: boolean | null;
  currentLevel: number | null;
  avatarUrl?: string | null;
  registeredCourseCodes: string[];
  registeredCourses: RegistrationRow[];
  courses: Course[];
  currentSemester: string;
  studentResults: StudentScoreRecord[];
  comprehensiveReport: ComprehensiveReport | null;
  isLoadingCourses: boolean;
  isLoadingResults: boolean;
  isLoadingComprehensiveReport: boolean;
  onGoToSection: (section: StudentSection) => void;
  onRegisterCourse: (code: string) => Promise<void>;
  onDropRegisteredCourse: (registeredCourseId: string) => Promise<void>;
  onSearchCourse: (code: string) => Promise<Course>;
  onUpdateName: (name: string) => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
};

export function StudentPortalContent({
  studentSection,
  userName,
  userEmail,
  matricNo,
  department,
  entryYear,
  isGraduated,
  currentLevel,
  avatarUrl,
  registeredCourseCodes,
  registeredCourses,
  courses,
  currentSemester,
  studentResults,
  comprehensiveReport,
  isLoadingCourses,
  isLoadingResults,
  isLoadingComprehensiveReport,
  onGoToSection,
  onRegisterCourse,
  onDropRegisteredCourse,
  onSearchCourse,
  onUpdateName,
  onUpdatePassword,
  onUploadAvatar,
}: StudentPortalContentProps) {
  if (studentSection === "overview") {
    const isLoadingOverview =
      isLoadingCourses || isLoadingResults || isLoadingComprehensiveReport;

    return (
      <StudentOverviewPage
        userName={userName}
        matricNo={matricNo}
        department={department}
        entryYear={entryYear}
        isGraduated={isGraduated}
        currentLevel={currentLevel}
        currentSemester={currentSemester}
        registeredCount={registeredCourses.length}
        registeredCourseCodes={registeredCourseCodes}
        studentResults={studentResults}
        comprehensiveReport={comprehensiveReport}
        isLoading={isLoadingOverview}
      />
    );
  }

  if (studentSection === "registration") {
    return (
      <StudentRegistrationPage
        courses={courses}
        currentSemester={currentSemester}
        currentLevel={currentLevel}
        registeredCourseCodes={registeredCourseCodes}
        isLoadingCourses={isLoadingCourses}
        onRegisterCourse={onRegisterCourse}
        onSearchCourse={onSearchCourse}
      />
    );
  }

  if (studentSection === "registered-courses") {
    return (
      <StudentRegisteredCoursesPage
        currentSemester={currentSemester}
        registeredCourses={registeredCourses}
        isLoadingCourses={isLoadingCourses}
        onDropRegisteredCourse={onDropRegisteredCourse}
      />
    );
  }

  if (studentSection === "results") {
    return (
      <StudentResultsPage
        view="profile"
        userName={userName}
        matricNo={matricNo}
        department={department}
        entryYear={entryYear}
        currentLevel={currentLevel}
        currentSemester={currentSemester}
        results={studentResults}
        registeredCourses={registeredCourses}
        availableCourses={courses}
        comprehensiveReport={comprehensiveReport}
        isLoadingResults={isLoadingResults}
        isLoadingComprehensiveReport={isLoadingComprehensiveReport}
        onViewSheet={() => onGoToSection("result-sheet")}
        onViewComprehensiveReport={() => onGoToSection("comprehensive-report")}
      />
    );
  }

  if (studentSection === "result-sheet") {
    return (
      <StudentResultsPage
        view="sheet"
        userName={userName}
        matricNo={matricNo}
        department={department}
        entryYear={entryYear}
        currentLevel={currentLevel}
        currentSemester={currentSemester}
        results={studentResults}
        registeredCourses={registeredCourses}
        availableCourses={courses}
        comprehensiveReport={comprehensiveReport}
        isLoadingResults={isLoadingResults}
        isLoadingComprehensiveReport={isLoadingComprehensiveReport}
        onBackToProfile={() => onGoToSection("results")}
        onViewComprehensiveReport={() => onGoToSection("comprehensive-report")}
      />
    );
  }

  if (studentSection === "comprehensive-report") {
    return (
      <StudentResultsPage
        view="comprehensive"
        userName={userName}
        matricNo={matricNo}
        department={department}
        entryYear={entryYear}
        currentLevel={currentLevel}
        currentSemester={currentSemester}
        results={studentResults}
        registeredCourses={registeredCourses}
        availableCourses={courses}
        comprehensiveReport={comprehensiveReport}
        isLoadingResults={isLoadingResults}
        isLoadingComprehensiveReport={isLoadingComprehensiveReport}
        onBackToProfile={() => onGoToSection("results")}
        onViewSheet={() => onGoToSection("result-sheet")}
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
