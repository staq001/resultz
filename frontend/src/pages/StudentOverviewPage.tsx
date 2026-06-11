import { LoadingSpinner } from "../components/LoadingSpinner";
import type {
  ComprehensiveReport,
  StudentScoreRecord,
} from "../services/results.api";

type StudentOverviewPageProps = {
  userName: string;
  matricNo: string;
  currentLevel: number | null;
  comprehensiveReport: ComprehensiveReport | null;
  isGraduated?: boolean | null;
  department?: string | null;
  entryYear?: number | null;
  currentSemester?: string;
  registeredCount?: number;
  registeredCourseCodes?: string[];
  studentResults?: StudentScoreRecord[];
  isLoading: boolean;
};

export function StudentOverviewPage({
  userName,
  matricNo,
  currentLevel,
  comprehensiveReport,
  isGraduated,
  isLoading,
}: StudentOverviewPageProps) {
  const semesters = comprehensiveReport?.semesters ?? [];
  const currentGpa =
    semesters.length > 0 ? semesters[semesters.length - 1].gpa : 0;

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading student data..." />;
  }

  return (
    <main className="dashboard-wrap page-stack">
      <section className="hero-banner">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h2>Register courses and follow your performance from one place.</h2>
          <p className="sub">
            Keep your semester load organised, monitor GPA movement, and check
            released results as soon as they are available.
          </p>
        </div>
        <div className="hero-badge">
          <span className="status-pill">Student record</span>
          <strong>{matricNo || "N/A"}</strong>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card purple">
          <span>Name</span>
          <strong>{userName || "Student"}</strong>
        </article>
        <article className="stat-card blue">
          <span>Current level</span>
          <strong>{currentLevel ? `${currentLevel} Level` : "N/A"}</strong>
        </article>
        <article className="stat-card green">
          <span>Current GPA</span>
          <strong>{currentGpa.toFixed(2)}</strong>
        </article>
        <article className={`stat-card ${isGraduated ? "gold" : "muted"}`}>
          <span>Graduated</span>
          <strong>{isGraduated ? "Yes" : "No"}</strong>
        </article>
      </section>
    </main>
  );
}
