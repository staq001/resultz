import type { StudentResult } from "../types/app.types";

type StudentResultsPageProps = {
  semesters: string[];
  activeSemester: string;
  semesterResults: StudentResult[];
  onChangeSemester: (semester: string) => void;
};

export function StudentResultsPage({
  semesters,
  activeSemester,
  semesterResults,
  onChangeSemester,
}: StudentResultsPageProps) {
  const totalUnits = semesterResults.reduce((sum, result) => sum + result.unit, 0);
  const passedCourses = semesterResults.filter((result) => result.grade !== "F").length;

  return (
    <main className="dashboard-wrap page-stack">
      <section className="hero-banner compact">
        <div>
          <p className="eyebrow">Results</p>
          <h2>Review released scores and grades by semester.</h2>
          <p className="sub">
            Switch between semesters to see your score sheet, passed courses,
            and total registered units.
          </p>
        </div>
        <div className="hero-badge">
          <span className="status-pill">Selected semester</span>
          <strong>{activeSemester || "No semester selected"}</strong>
        </div>
      </section>

      <section className="stats-grid stats-grid-3">
        <article className="stat-card">
          <span>Result entries</span>
          <strong>{semesterResults.length}</strong>
          <p>Courses with recorded results in the selected semester.</p>
        </article>
        <article className="stat-card">
          <span>Passed courses</span>
          <strong>{passedCourses}</strong>
          <p>Courses with grades above a fail for this semester.</p>
        </article>
        <article className="stat-card">
          <span>Total units</span>
          <strong>{totalUnits}</strong>
          <p>Combined units for the results currently being viewed.</p>
        </article>
      </section>

      <section className="panel">
        <div className="section-title">
          <h3>Semester Result Sheet</h3>
          <span className="status-pill subtle">Academic record</span>
        </div>
        <label>
          Semester
          <select
            value={activeSemester}
            onChange={(event) => onChangeSemester(event.target.value)}
          >
            {semesters.length === 0 && (
              <option value="">No semester available</option>
            )}
            {semesters.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </label>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Title</th>
                <th>Unit</th>
                <th>Score</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {semesterResults.map((result) => (
                <tr key={`${result.courseCode}-${result.semester}`}>
                  <td>{result.courseCode}</td>
                  <td>{result.courseTitle}</td>
                  <td>{result.unit}</td>
                  <td>{result.score}</td>
                  <td>
                    <span className="result-grade">{result.grade}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {semesterResults.length === 0 && (
          <p className="sub table-empty">
            No results are available for this semester yet.
          </p>
        )}
      </section>
    </main>
  );
}
