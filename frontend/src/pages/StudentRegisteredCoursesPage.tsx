import { useState } from "react";
import { useToast } from "../components/ToastProvider";
import type { RegistrationRow } from "../services/registration.api";

type StudentRegisteredCoursesPageProps = {
  currentSemester: string;
  registeredCourses: RegistrationRow[];
  isLoadingCourses: boolean;
  onDropRegisteredCourse: (registeredCourseId: string) => Promise<void>;
};

export function StudentRegisteredCoursesPage({
  currentSemester,
  registeredCourses,
  isLoadingCourses,
  onDropRegisteredCourse,
}: StudentRegisteredCoursesPageProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  const submitDrop = (course: RegistrationRow) => {
    const label = course.courseCode ?? "this course";
    const shouldDrop = window.confirm(`Drop ${label} from your registrations?`);
    if (!shouldDrop) return;

    setBusyId(course.id);
    void onDropRegisteredCourse(course.id)
      .then(() => {
        toast.success(`${label} dropped.`);
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to drop registered course.",
        );
      })
      .finally(() => setBusyId(null));
  };

  const totalUnits = registeredCourses.reduce(
    (sum, course) => sum + (course.units ?? 0),
    0,
  );

  return (
    <main className="dashboard-wrap page-stack">
      <section className="hero-banner compact">
        <div>
          <p className="eyebrow">Registered Courses</p>
          <h2>Manage your submitted semester courses.</h2>
          <p className="sub">Active semester: {currentSemester || "Not set"}</p>
        </div>
        <div className="hero-badge">
          <span className="status-pill">Current load</span>
          <strong>
            {registeredCourses.length} courses / {totalUnits} units
          </strong>
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <h3>Course List</h3>
          <span className="status-pill subtle">
            {isLoadingCourses ? "Refreshing" : "Registered"}
          </span>
        </div>
        {isLoadingCourses && (
          <p className="sub table-empty">Loading registered courses...</p>
        )}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Title</th>
                <th>Department</th>
                <th>Unit</th>
                <th>Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
            {registeredCourses.map((course) => {
                const isBusy = busyId === course.id;

                return (
                  <tr key={course.id}>
                    <td>{course.courseCode ?? course.courseId}</td>
                    <td>{course.title ?? "Not available"}</td>
                    <td>{course.departmentName ?? "Not available"}</td>
                    <td>{course.units ?? "N/A"}</td>
                    <td>{course.level ?? "N/A"}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="danger small"
                          onClick={() => submitDrop(course)}
                          disabled={isBusy}
                        >
                          {isBusy ? "Working..." : "Drop"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {registeredCourses.length === 0 && !isLoadingCourses && (
          <p className="sub table-empty">
            You have not registered any course for this active semester yet.
          </p>
        )}
      </section>
    </main>
  );
}
