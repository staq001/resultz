import { useState } from "react";
import { useToast } from "../components/ToastProvider";
import type { Course } from "../types/app.types";

type StudentRegistrationPageProps = {
  currentSemester: string;
  courses: Course[];
  registeredCourseCodes: string[];
  onRegisterCourse: (code: string) => Promise<void>;
};

export function StudentRegistrationPage({
  currentSemester,
  courses,
  registeredCourseCodes,
  onRegisterCourse,
}: StudentRegistrationPageProps) {
  const [savingCourseCode, setSavingCourseCode] = useState<string | null>(null);
  const toast = useToast();
  const maxRegistrationCount = 12;
  const registeredCourses = courses.filter((course) =>
    registeredCourseCodes.includes(course.code),
  );
  const totalUnits = registeredCourses.reduce(
    (sum, course) => sum + course.unit,
    0,
  );
  const hasReachedRegistrationLimit =
    registeredCourseCodes.length >= maxRegistrationCount;

  const submitCourseRegistration = (courseCode: string) => {
    setSavingCourseCode(courseCode);
    void onRegisterCourse(courseCode)
      .then(() => {
        toast.success(`${courseCode} registered successfully.`);
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to register course.",
        );
      })
      .finally(() => {
        setSavingCourseCode(null);
      });
  };

  return (
    <main className="dashboard-wrap page-stack">
      <section className="hero-banner compact">
        <div>
          <p className="eyebrow">Course Registration</p>
          <h2>Build a clean semester course load.</h2>
          <p className="sub">
            Register approved courses, keep an eye on total units, and review
            your selected courses before submission.
          </p>
        </div>
        <div className="hero-badge">
          <span className="status-pill">Registered</span>
          <strong>
            {registeredCourses.length} course
            {registeredCourses.length === 1 ? "" : "s"}
          </strong>
        </div>
      </section>

      <section className="stats-grid stats-grid-3">
        <article className="stat-card">
          <span>Selected courses</span>
          <strong>{registeredCourses.length}</strong>
          <p>Your current semester load before final submission.</p>
        </article>
        <article className="stat-card">
          <span>Registration limit</span>
          <strong>{maxRegistrationCount}</strong>
          <p>Maximum number of courses allowed for one semester.</p>
        </article>
        <article className="stat-card">
          <span>Total units</span>
          <strong>{totalUnits}</strong>
          <p>Total credit units across selected courses.</p>
        </article>
      </section>

      <section className="content-grid content-grid-2">
        <article className="panel feature-panel">
          <div className="section-title">
            <h3>Registration Guide</h3>
            <span className="status-pill subtle">Checklist</span>
          </div>
          <ul className="feature-list">
            <li>Only courses for your course of study and current level are shown.</li>
            <li>Only courses in the active semester term are available here.</li>
            <li>You can register up to 12 courses in one semester.</li>
          </ul>
        </article>

        <article className="panel feature-panel">
          <div className="section-title">
            <h3>Selected Courses</h3>
            <span className="status-pill subtle">Preview</span>
          </div>
          {registeredCourses.length > 0 ? (
            <div className="chip-list">
              {registeredCourses.map((course) => (
                <span key={course.code} className="course-chip">
                  {course.code} | {course.unit} unit
                  {course.unit === 1 ? "" : "s"}
                </span>
              ))}
            </div>
          ) : (
            <p className="sub">
              No courses registered yet. Use the table below to start your
              registration.
            </p>
          )}
        </article>
      </section>

      <section className="panel">
        <div className="section-title">
          <h3>Eligible Courses</h3>
          <span className="status-pill subtle">Interactive</span>
        </div>
        <p className="sub">Active semester: {currentSemester || "Not set"}</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Title</th>
                <th>Department</th>
                <th>Unit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const isRegistered = registeredCourseCodes.includes(course.code);
                const isSaving = savingCourseCode === course.code;
                const disableRegister =
                  isRegistered || isSaving || hasReachedRegistrationLimit;
                return (
                  <tr key={course.code}>
                    <td>{course.code}</td>
                    <td>{course.title}</td>
                    <td>{course.department}</td>
                    <td>{course.unit}</td>
                    <td>
                      <button
                        type="button"
                        className={isRegistered ? "secondary small" : "primary small"}
                        onClick={() => submitCourseRegistration(course.code)}
                        disabled={disableRegister}
                      >
                        {isSaving
                          ? "Registering..."
                          : isRegistered
                            ? "Registered"
                            : "Register"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {courses.length === 0 && (
          <p className="sub table-empty">
            No eligible courses are available for your course of study in the
            active semester yet.
          </p>
        )}
        {hasReachedRegistrationLimit && (
          <p className="sub table-empty">
            You have reached the maximum of 12 course registrations for this
            semester.
          </p>
        )}
      </section>
    </main>
  );
}
