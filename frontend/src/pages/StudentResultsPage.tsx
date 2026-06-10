import type { RegistrationRow } from "../services/registration.api";
import type {
  ComprehensiveReport,
  StudentScoreRecord,
} from "../services/results.api";
import type { Course } from "../types/app.types";

type StudentResultsPageProps = {
  view: "profile" | "sheet" | "comprehensive";
  userName: string;
  matricNo: string;
  department?: string | null;
  entryYear?: number | null;
  currentLevel: number | null;
  currentSemester: string;
  results: StudentScoreRecord[];
  registeredCourses: RegistrationRow[];
  availableCourses: Course[];
  comprehensiveReport: ComprehensiveReport | null;
  isLoadingResults: boolean;
  isLoadingComprehensiveReport: boolean;
  onViewSheet?: () => void;
  onViewComprehensiveReport?: () => void;
  onBackToProfile?: () => void;
};

const pointsByGrade: Record<string, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

const gradeLabels: Array<{
  point: number;
  grades: string[];
  accent: "blue" | "teal" | "purple" | "muted" | "navy";
}> = [
  { point: 5, grades: ["A"], accent: "blue" },
  { point: 4, grades: ["B"], accent: "teal" },
  { point: 3, grades: ["C"], accent: "purple" },
  { point: 2, grades: ["D"], accent: "muted" },
  { point: 1, grades: ["E"], accent: "navy" },
  { point: 0, grades: ["F"], accent: "muted" },
] as const;

function getTotalUnits(results: StudentScoreRecord[]) {
  return results.reduce((sum, result) => sum + (result.units ?? 0), 0);
}

function getPassedCourses(results: StudentScoreRecord[]) {
  return results.filter((result) => {
    const grade = result.grade?.toUpperCase() ?? "F";
    return grade !== "F" && grade !== "-";
  }).length;
}

function getFacultyName(department?: string | null) {
  const normalizedDepartment = department?.trim();
  if (!normalizedDepartment) return "Science";
  if (
    /computer|science|math|physics|chemistry|biology/i.test(
      normalizedDepartment,
    )
  ) {
    return "Science";
  }
  return normalizedDepartment;
}

function getAcademicSession(currentSemester: string) {
  const match = currentSemester.match(/\d{4}\s*\/\s*\d{4}/);
  return match?.[0].replace(/\s/g, "") ?? "Current Session";
}

function getSemesterName(currentSemester: string) {
  if (/harmattan/i.test(currentSemester)) return "First Semester";
  if (/rain/i.test(currentSemester)) return "Second Semester";
  return currentSemester && currentSemester !== "Not set"
    ? currentSemester
    : "Current Semester";
}

function ResultProfile({
  department,
  entryYear,
  currentSemester,
  results,
  isLoadingResults,
  comprehensiveReport,
  isLoadingComprehensiveReport,
  onViewSheet,
}: StudentResultsPageProps) {
  const today = new Date();
  const reportCourses =
    comprehensiveReport?.semesters.flatMap((semester) => semester.courses) ??
    [];
  const latestSemester =
    comprehensiveReport?.semesters[comprehensiveReport.semesters.length - 1];
  const totalUnits =
    comprehensiveReport?.summary.totalUnits ?? getTotalUnits(results);
  const passedCourses =
    reportCourses.length > 0
      ? reportCourses.filter((course) => course.status.toUpperCase() !== "F")
          .length
      : getPassedCourses(results);
  // Prefer the authoritative current semester (from sessions/current) when available
  const normalizedCurrentSemester =
    currentSemester && currentSemester.trim() && currentSemester !== "Not set"
      ? currentSemester
      : null;

  const academicSession = normalizedCurrentSemester
    ? getAcademicSession(normalizedCurrentSemester)
    : latestSemester?.sessionName
      ? getAcademicSession(latestSemester.sessionName)
      : getAcademicSession(currentSemester);

  const semesterName = normalizedCurrentSemester
    ? getSemesterName(normalizedCurrentSemester)
    : (latestSemester?.semesterLabel ?? getSemesterName(currentSemester));
  const student = comprehensiveReport?.student;
  const courseCount = reportCourses.length || results.length;
  const safeResultsCount = Math.max(courseCount, 1);
  const gradeRows = gradeLabels.map(({ point, grades, accent }) => {
    const count =
      reportCourses.length > 0
        ? reportCourses.filter((course) =>
            grades.includes(course.status.toUpperCase()),
          ).length
        : results.filter((result) =>
            grades.includes(result.grade?.toUpperCase() ?? "F"),
          ).length;

    return {
      point,
      count,
      accent,
      percent: Math.round((count / safeResultsCount) * 100),
    };
  });

  return (
    <main className="dashboard-wrap page-stack">
      <section className="result-profile-grid">
        <div className="result-portal-card">
          <div className="result-hero-copy">
            <h2>Student Result Portal</h2>
            <p>
              Giving students accurate insight into their academic performance,
              thereby bringing down the chances of errors.
            </p>
          </div>

          <div className="result-hero-art" aria-hidden="true">
            <span className="graduate one" />
            <span className="graduate two" />
            <span className="graduate three" />
          </div>
        </div>

        <aside className="result-side-panel">
          <button
            className="primary result-sheet-button"
            type="button"
            onClick={onViewSheet}
          >
            Result Profile
          </button>

          <div className="result-date-grid">
            <div>
              <span>Current Day</span>
              <strong>{today.getDate()}</strong>
            </div>
            <div>
              <span>Current Month</span>
              <strong>{today.toLocaleString("en", { month: "long" })}</strong>
            </div>
          </div>

          <article className="result-mini-card">
            <span className="result-icon teal">OK</span>
            <div>
              <strong>None</strong>
              <p>Withdrawn/Blacklist Record</p>
            </div>
          </article>
        </aside>
      </section>

      <section className="result-dashboard-columns">
        <div className="result-column">
          <h3>Academic Session</h3>
          <ResultInfoCard
            icon="SM"
            tone="gold"
            title={semesterName}
            detail="Recent Semester"
          />
          <ResultInfoCard
            icon="YR"
            tone="pink"
            title={academicSession}
            detail="Recent Session"
          />
          <ResultInfoCard
            icon="DF"
            tone="muted"
            title="None"
            detail="Deferments"
          />
          <ResultInfoCard
            icon="EN"
            tone="teal"
            title={
              comprehensiveReport?.student.entryYear || entryYear
                ? `${comprehensiveReport?.student.entryYear ?? entryYear}/${
                    (comprehensiveReport?.student.entryYear ?? entryYear ?? 0) +
                    1
                  }`
                : "N/A"
            }
            detail="Year of Entry"
          />
        </div>

        <div className="result-column result-analysis-column">
          <article className="panel result-analysis-card">
            <div className="section-title">
              <h3>Grade Point Analysis</h3>
              <button className="ghost small" onClick={onViewSheet}>
                View All
              </button>
            </div>

            <div className="grade-analysis-list">
              {gradeRows.map((row) => (
                <div className="grade-analysis-row" key={row.point}>
                  <div className="grade-bar-track">
                    <span
                      className={`grade-bar grade-bar-${row.accent}`}
                      style={{
                        width: `${Math.max(row.percent, row.count > 0 ? 8 : 0)}%`,
                      }}
                    />
                  </div>
                  <span>{row.percent}%</span>
                  <strong>{row.count}</strong>
                  <p>Grade Point {row.point}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="result-column">
          <h3>Profile Statistics</h3>
          <article className="result-wide-stat">
            <span className="result-soft-icon">BK</span>
            <div>
              <strong>
                {isLoadingResults || isLoadingComprehensiveReport
                  ? "..."
                  : courseCount}
              </strong>
              <p>Number of Courses Recorded</p>
            </div>
          </article>
          <ResultInfoCard
            icon="PC"
            tone="teal"
            title={String(passedCourses)}
            detail="Courses Passed"
          />
          <ResultInfoCard
            icon="TU"
            tone="gold"
            title={String(totalUnits)}
            detail="Recorded Units"
          />
        </div>

        <div className="result-column result-discipline-column">
          <h3>Discipline</h3>
          <div className="result-discipline-grid">
            <ResultInfoCard
              icon="FC"
              tone="purple"
              title={
                comprehensiveReport?.student.faculty ||
                getFacultyName(department)
              }
              detail="Faculty"
            />
            <ResultInfoCard
              icon="DP"
              tone="blue"
              title={
                comprehensiveReport?.student.department ||
                department ||
                "Computer Science"
              }
              detail="Department"
            />
            <ResultInfoCard
              icon="C"
              tone="teal"
              title={String(passedCourses)}
              detail="Compulsory Course Passed"
            />
            <ResultInfoCard
              icon="R"
              tone="gold"
              title={String(totalUnits)}
              detail="Required Course Passed"
            />
            <ResultInfoCard
              icon="MS"
              tone="muted"
              title="None"
              detail="Noted Misconduct"
            />
            <ResultInfoCard
              icon="GR"
              tone="gold"
              title={student?.isGraduated ? "Yes" : "No"}
              detail="Graduated?"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function ResultInfoCard({
  icon,
  tone,
  title,
  detail,
}: {
  icon: string;
  tone: "blue" | "gold" | "muted" | "pink" | "purple" | "teal";
  title: string;
  detail: string;
}) {
  return (
    <article className="result-info-card">
      <span className={`result-icon ${tone}`}>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function ResultSheet({
  currentSemester,
  results,
  isLoadingResults,
  onViewComprehensiveReport,
}: StudentResultsPageProps) {
  const totalUnits = getTotalUnits(results);
  const totalCreditPoints = results.reduce(
    (sum, result) =>
      sum + (result.units ?? 0) * (pointsByGrade[result.grade ?? "F"] ?? 0),
    0,
  );
  const gpa = totalUnits > 0 ? totalCreditPoints / totalUnits : 0;

  return (
    <main className="dashboard-wrap page-stack">
      <section className="panel result-sheet-only">
        <div className="result-sheet-head">
          <span className="result-lasu-ribbon">LASU</span>
          <button
            className="primary result-comprehensive-button"
            onClick={onViewComprehensiveReport}
          >
            Comprehensive Report
          </button>
        </div>

        <div className="result-sheet-title">
          <h3>Most Recent Results</h3>
          <p className="sub">{currentSemester || "Current semester"}</p>
        </div>

        {isLoadingResults && (
          <div className="loading-inline table-empty">
            <span className="inline-spinner" aria-hidden="true" />
            <p className="sub">Loading results...</p>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Unit</th>
                <th>Test</th>
                <th>Exam</th>
                <th>Total</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => {
                const testScore = result.testScore ?? 0;
                const examScore = result.examScore ?? 0;

                return (
                  <tr key={`${result.courseCode ?? "course"}-${index}`}>
                    <td>{result.courseCode ?? "N/A"}</td>
                    <td>{result.courseTitle ?? "Not available"}</td>
                    <td>{result.units ?? 0}</td>
                    <td>{testScore}</td>
                    <td>{examScore}</td>
                    <td>{testScore + examScore}</td>
                    <td>
                      <span className="result-grade">
                        {result.grade ?? "-"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="result-sheet-totals">
          <strong>TNU: {totalUnits}</strong>
          <strong>TCP: {totalCreditPoints}</strong>
          <strong>GP: {gpa.toFixed(2)}</strong>
        </div>

        {results.length === 0 && !isLoadingResults && (
          <p className="sub table-empty">
            No released results are available for this semester yet.
          </p>
        )}
      </section>
    </main>
  );
}

function ComprehensiveReportView({
  userName,
  matricNo,
  department,
  entryYear,
  comprehensiveReport,
  isLoadingComprehensiveReport,
  onBackToProfile,
  onViewSheet,
}: StudentResultsPageProps) {
  const student = comprehensiveReport?.student;
  const summary = comprehensiveReport?.summary;
  const semesterGroups =
    comprehensiveReport?.semesters.reduce<
      Array<{
        key: string;
        sessionName: string;
        yearLabel: string;
        semesters: ComprehensiveReport["semesters"];
      }>
    >((groups, semester, index) => {
      const key = `${semester.sessionName}-${semester.yearLabel || index}`;
      const existingGroup = groups.find((group) => group.key === key);

      if (existingGroup) {
        existingGroup.semesters.push(semester);
        return groups;
      }

      groups.push({
        key,
        sessionName: semester.sessionName,
        yearLabel: semester.yearLabel || `Year${groups.length + 1}`,
        semesters: [semester],
      });

      return groups;
    }, []) ?? [];
  const generatedAt = comprehensiveReport?.generatedAt
    ? new Date(comprehensiveReport.generatedAt)
    : new Date();
  const generatedDate = generatedAt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const generatedTime = generatedAt.toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const reportTitle = "LASU Student Results";

  const handleDownloadPdf = () => {
    window.print();
  };

  return (
    <main className="comprehensive-pdf-viewer">
      <header className="pdf-viewer-toolbar">
        <div className="pdf-toolbar-left">
          <button
            className="pdf-icon-button"
            type="button"
            onClick={onBackToProfile}
            title="Back to result profile"
            aria-label="Back to result profile"
          >
            <span aria-hidden="true">☰</span>
          </button>
          <strong>{reportTitle}</strong>
        </div>
        <div className="pdf-toolbar-center" aria-label="PDF controls">
          <span className="pdf-page-input">1</span>
          <span>/ 1</span>
          <span className="pdf-divider" />
          <button
            className="pdf-icon-button"
            type="button"
            aria-label="Zoom out"
          >
            −
          </button>
          <strong className="pdf-zoom">80%</strong>
          <button
            className="pdf-icon-button"
            type="button"
            aria-label="Zoom in"
          >
            +
          </button>
          <span className="pdf-divider" />
          <button
            className="pdf-icon-button"
            type="button"
            onClick={onViewSheet}
            title="Most recent result sheet"
            aria-label="Most recent result sheet"
          >
            ↻
          </button>
        </div>
        <div className="pdf-toolbar-actions">
          <button
            className="pdf-icon-button"
            type="button"
            onClick={handleDownloadPdf}
            disabled={!comprehensiveReport || isLoadingComprehensiveReport}
            title="Download comprehensive result report as PDF"
            aria-label="Download comprehensive result report as PDF"
          >
            ⇩
          </button>
          <button
            className="pdf-icon-button"
            type="button"
            onClick={handleDownloadPdf}
            disabled={!comprehensiveReport || isLoadingComprehensiveReport}
            title="Print comprehensive result report"
            aria-label="Print comprehensive result report"
          >
            ⎙
          </button>
        </div>
      </header>

      <section className="pdf-viewer-body">
        <aside className="pdf-thumbnail-rail" aria-label="PDF thumbnails">
          <div className="pdf-thumbnail active" aria-hidden="true">
            <span className="thumb-report-head" />
            <span className="thumb-report-strip" />
            <span className="thumb-report-grid" />
            <span className="thumb-report-summary" />
          </div>
          <strong>1</strong>
        </aside>

        <section className="pdf-page-stage">
          <article className="comprehensive-report-page">
            <div className="report-watermark" aria-hidden="true">
              LASU Student Results
            </div>

            <header className="report-head">
              <img
                src="/lasu-logo.png"
                alt="LASU logo"
                className="report-logo"
              />
              <div>
                <h2>LAGOS STATE UNIVERSITY, OJO</h2>
                <strong>{student?.faculty || "FACULTY OF SCIENCE"}</strong>
                <span>
                  DEPARTMENT OF{" "}
                  {(
                    student?.department ||
                    department ||
                    "COMPUTER SCIENCE"
                  ).toUpperCase()}
                </span>
              </div>
              <div className="report-qr" aria-hidden="true" />
            </header>

            <section className="report-student-strip">
              <strong>{student?.name || userName || "Student"}</strong>
              <span>
                Discipline:{" "}
                {student?.department || department || "Computer Science"}
              </span>
              <span>
                Year of Entry: {student?.entryYear || entryYear || "N/A"}
              </span>
              <span>
                Printed: {generatedDate}, {generatedTime}
              </span>
              <span>
                Degree Type: {summary?.classOfDegree ? "Undergraduate" : "N/A"}
              </span>
              <span>Graduated: {student?.isGraduated ? "Yes" : "No"}</span>
              <span>Matric No: {student?.matricNo || matricNo || "N/A"}</span>
            </section>

            {isLoadingComprehensiveReport && (
              <div className="loading-inline table-empty">
                <span className="inline-spinner" aria-hidden="true" />
                <p className="sub">Loading comprehensive report...</p>
              </div>
            )}

            {!isLoadingComprehensiveReport && !comprehensiveReport && (
              <p className="sub table-empty">
                No comprehensive report is available yet.
              </p>
            )}

            {comprehensiveReport && (
              <>
                <section className="report-year-grid">
                  {semesterGroups.map((group, groupIndex) => (
                    <div className="report-year-column" key={group.key}>
                      <h3>
                        {group.sessionName}{" "}
                        {group.yearLabel || `Year${groupIndex + 1}`}
                      </h3>
                      {group.semesters.map((semester) => (
                        <article
                          className="report-semester-card"
                          key={`${semester.semesterId}-${semester.semesterTerm}`}
                        >
                          <h4>{semester.semesterLabel}</h4>
                          <table>
                            <thead>
                              <tr>
                                <th>Course</th>
                                <th>Unit</th>
                                <th>Status</th>
                                <th>GP</th>
                                <th>CP</th>
                              </tr>
                            </thead>
                            <tbody>
                              {semester.courses.map((course) => (
                                <tr key={course.scoreId}>
                                  <td>{course.courseCode}</td>
                                  <td>{course.units}</td>
                                  <td>{course.status}</td>
                                  <td>{course.gradePoint}</td>
                                  <td>{course.creditPoint}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p>
                            TNU: {semester.totalUnits} TCP:{" "}
                            {semester.totalCreditPoints} GP:{" "}
                            {semester.gpa.toFixed(2)}
                          </p>
                          <p>
                            CTNUP: {semester.cumulativeUnits} CGPA:{" "}
                            {semester.cgpa.toFixed(2)}
                          </p>
                          <p>Stand</p>
                        </article>
                      ))}
                    </div>
                  ))}
                </section>

                <section className="report-summary-strip">
                  <p>Completed Semesters: {summary?.completedSemesters ?? 0}</p>
                  <p>Absent Semesters: {summary?.absentSemesters ?? "None"}</p>
                  <p>
                    Outstanding Courses: {summary?.outstandingCourses ?? "NONE"}
                  </p>
                  <p>
                    Disciplinary Status: {summary?.disciplinaryStatus ?? "None"}
                  </p>
                  <p>Deferments: {summary?.deferments ?? "None"}</p>
                  <p>
                    Senate Status: {summary?.senateStatus ?? "Yet to Graduate"}
                  </p>
                  <p className="summary-wide">
                    Overall Academic Performance Evaluation: CTNUP:{" "}
                    {summary?.totalUnits ?? 0} CTCP:{" "}
                    {summary?.totalCreditPoints ?? 0} CGPA:{" "}
                    {(summary?.cgpa ?? 0).toFixed(2)}
                  </p>
                  <p>
                    Present Class of Degree: {summary?.classOfDegree ?? "N/A"}
                  </p>
                  <p>Status: {summary?.standing ?? "N/A"}</p>
                </section>
              </>
            )}
          </article>
        </section>
      </section>
    </main>
  );
}

export function StudentResultsPage(props: StudentResultsPageProps) {
  if (props.view === "comprehensive") {
    return <ComprehensiveReportView {...props} />;
  }

  if (props.view === "sheet") {
    return <ResultSheet {...props} />;
  }

  return <ResultProfile {...props} />;
}
