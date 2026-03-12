type LandingPageProps = {
  onGetStarted: () => void;
};

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <main className="landing">
      <section className="hero-card">
        <p className="kicker">UNIVERSITY RESULTS PROCESSING PLATFORM</p>
        <h1>Track courses, grades, and academic growth in one clear portal.</h1>
        <p>
          Register courses, compute GPA/CGPA instantly, and let faculty grade
          and manage departments from a focused dashboard.
        </p>
        <div className="cta-row">
          <button type="button" className="primary" onClick={onGetStarted}>
            Get Started
          </button>
        </div>
      </section>

      <section className="feature-grid">
        <article>
          <h3>Course Registration</h3>
          <p>
            Select available courses and submit your semester load in seconds.
          </p>
        </article>
        <article>
          <h3>Results Analytics</h3>
          <p>
            Get mock GPA/CGPA calculations with semester breakdowns out of the
            box.
          </p>
        </article>
        <article>
          <h3>AI Recommendations</h3>
          <p>
            Get smart course load and study-priority suggestions based on your
            current results and target GPA.
          </p>
        </article>
      </section>
    </main>
  );
}
