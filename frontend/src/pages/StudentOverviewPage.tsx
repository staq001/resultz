type StudentOverviewPageProps = {
  userName: string;
  matricNo: string;
  currentGpa: number;
  currentCgpa: number;
  registeredCount: number;
};

export function StudentOverviewPage({
  userName,
  matricNo,
  currentGpa,
  currentCgpa,
  registeredCount,
}: StudentOverviewPageProps) {
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
        <article className="stat-card">
          <span>Student</span>
          <strong>{userName || "Student"}</strong>
          <p>Active account currently using the portal.</p>
        </article>
        <article className="stat-card">
          <span>Current GPA</span>
          <strong>{currentGpa.toFixed(2)}</strong>
          <p>Calculated from the selected semester's grade points.</p>
        </article>
        <article className="stat-card">
          <span>Current CGPA</span>
          <strong>{currentCgpa.toFixed(2)}</strong>
          <p>Overall standing across all available semester results.</p>
        </article>
        <article className="stat-card">
          <span>Registered courses</span>
          <strong>{registeredCount}</strong>
          <p>Courses currently selected for the active registration flow.</p>
        </article>
      </section>

      <section className="content-grid content-grid-2">
        <article className="panel feature-panel">
          <div className="section-title">
            <h3>What You Can Do Here</h3>
            <span className="status-pill subtle">Student actions</span>
          </div>
          <ul className="feature-list">
            <li>Register available courses for the semester.</li>
            <li>Review your result sheet once exams are processed.</li>
            <li>Keep your account details and password current.</li>
          </ul>
        </article>

        <article className="panel feature-panel">
          <div className="section-title">
            <h3>Academic Snapshot</h3>
            <span className="status-pill subtle">Live summary</span>
          </div>
          <div className="mini-metrics">
            <div>
              <span>Matric number</span>
              <strong>{matricNo || "N/A"}</strong>
            </div>
            <div>
              <span>Current GPA</span>
              <strong>{currentGpa.toFixed(2)}</strong>
            </div>
            <div>
              <span>Current CGPA</span>
              <strong>{currentCgpa.toFixed(2)}</strong>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
