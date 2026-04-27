type StaffOverviewPageProps = {
  departmentsCount: number;
  coursesCount: number;
  currentSemester: string;
};

const gradingChecklist = [
  "Load a course roster for the active semester.",
  "Record test scores out of 40 and exam scores out of 60.",
  "Review totals before publishing final marks.",
];

export function StaffOverviewPage({
  departmentsCount,
  coursesCount,
  currentSemester,
}: StaffOverviewPageProps) {
  return (
    <main className="dashboard-wrap page-stack">
      <section className="hero-banner">
        <div>
          <p className="eyebrow">Staff Portal</p>
          <h2>Grade courses and keep assessment records in sync.</h2>
          <p className="sub">
            Work from the current semester, load registered students per
            course, and update scores from one focused grading space.
          </p>
        </div>
        <div className="hero-badge">
          <span className="status-pill">Active semester</span>
          <strong>{currentSemester || "Not set"}</strong>
        </div>
      </section>

      <section className="stats-grid stats-grid-3">
        <article className="stat-card">
          <span>Departments</span>
          <strong>{departmentsCount}</strong>
          <p>Academic units currently configured for result processing.</p>
        </article>
        <article className="stat-card">
          <span>Courses</span>
          <strong>{coursesCount}</strong>
          <p>Courses available for roster lookup and score entry.</p>
        </article>
        <article className="stat-card">
          <span>Priority</span>
          <strong>Submit grades</strong>
          <p>Keep continuous assessment and exam scores up to date.</p>
        </article>
      </section>

      <section className="content-grid content-grid-2">
        <article className="panel feature-panel">
          <div className="section-title">
            <h3>Grading Workflow</h3>
            <span className="status-pill subtle">Staff actions</span>
          </div>
          <ul className="feature-list">
            {gradingChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="panel feature-panel">
          <div className="section-title">
            <h3>Semester Readiness</h3>
            <span className="status-pill subtle">Live data</span>
          </div>
          <div className="mini-metrics">
            <div>
              <span>Current semester</span>
              <strong>{currentSemester || "Not set"}</strong>
            </div>
            <div>
              <span>Departments covered</span>
              <strong>{departmentsCount}</strong>
            </div>
            <div>
              <span>Courses loaded</span>
              <strong>{coursesCount}</strong>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
