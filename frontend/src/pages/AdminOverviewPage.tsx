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
    <main className="dashboard-wrap">
      <section className="metrics">
        <article>
          <h4>Departments</h4>
          <p>{departmentsCount}</p>
        </article>
        <article>
          <h4>Courses</h4>
          <p>{coursesCount}</p>
        </article>
        <article>
          <h4>Current Semester</h4>
          <p>{currentSemester || "Not set"}</p>
        </article>
      </section>
    </main>
  );
}
