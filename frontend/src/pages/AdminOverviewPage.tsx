type AdminOverviewPageProps = {
  departmentsCount: number;
  coursesCount: number;
  currentSemester: string;
};

export function AdminOverviewPage({
  departmentsCount,
  coursesCount,
  currentSemester,
}: AdminOverviewPageProps) {
  return (
    <main className="dashboard-wrap page-stack">
      <section className="hero-banner">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h2>Manage the academic structure behind result processing.</h2>
          <p className="sub">
            Create departments, maintain courses, and control the active
            semester used across staff grading and student result views.
          </p>
        </div>
        <div className="hero-badge">
          <span className="status-pill">Current semester</span>
          <strong>{currentSemester || "Not set"}</strong>
        </div>
      </section>

      <section className="stats-grid stats-grid-3">
        <article className="stat-card">
          <span>Departments</span>
          <strong>{departmentsCount}</strong>
          <p>Programme groups and faculties available in the system.</p>
        </article>
        <article className="stat-card">
          <span>Courses</span>
          <strong>{coursesCount}</strong>
          <p>Course records already mapped for registration and grading.</p>
        </article>
        <article className="stat-card">
          <span>Semester status</span>
          <strong>{currentSemester || "Not set"}</strong>
          <p>The live academic session visible to staff and students.</p>
        </article>
      </section>

      <section className="content-grid content-grid-2">
        <article className="panel feature-panel">
          <div className="section-title">
            <h3>Core Admin Actions</h3>
            <span className="status-pill subtle">Setup</span>
          </div>
          <ul className="feature-list">
            <li>Create departments before assigning courses.</li>
            <li>Update course titles, codes, and units as curriculum changes.</li>
            <li>Set the current semester before grading starts.</li>
          </ul>
        </article>

        <article className="panel feature-panel">
          <div className="section-title">
            <h3>Platform Readiness</h3>
            <span className="status-pill subtle">Snapshot</span>
          </div>
          <div className="mini-metrics">
            <div>
              <span>Department setup</span>
              <strong>{departmentsCount > 0 ? "Ready" : "Pending"}</strong>
            </div>
            <div>
              <span>Course catalogue</span>
              <strong>{coursesCount > 0 ? "Loaded" : "Empty"}</strong>
            </div>
            <div>
              <span>Semester control</span>
              <strong>{currentSemester || "Not set"}</strong>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
