import { useMemo, useState } from "react";
import { useToast } from "../components/ToastProvider";
import type { CourseScoreRow } from "../services/grading.api";
import type { FormSubmitHandler } from "../types/app.types";

type StaffCourseScoresPageProps = {
  currentSemester: string;
  currentSemesterId: string;
  onBack?: () => void;
  onFetchCourseScores: (
    courseCode: string,
    semesterId: string,
  ) => Promise<{
    course: {
      id?: string;
      courseCode?: string;
      title?: string;
      units?: number;
      semester?: string;
      level?: number;
    };
    scores: CourseScoreRow[];
  }>;
};

export function StaffCourseScoresPage({
  currentSemester,
  currentSemesterId,
  onBack,
  onFetchCourseScores,
}: StaffCourseScoresPageProps) {
  const [courseCode, setCourseCode] = useState("");
  const [course, setCourse] = useState<{
    id?: string;
    courseCode?: string;
    title?: string;
    units?: number;
    semester?: string;
    level?: number;
  } | null>(null);
  const [scores, setScores] = useState<CourseScoreRow[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const toast = useToast();

  const averageScore = useMemo(() => {
    if (scores.length === 0) return null;
    const total = scores.reduce(
      (sum, row) => sum + row.testScore + row.examScore,
      0,
    );
    return total / scores.length;
  }, [scores]);

  const fetchScores: FormSubmitHandler = (event) => {
    event.preventDefault();

    const normalizedCourseCode = courseCode.trim().toUpperCase();
    if (!normalizedCourseCode) {
      toast.error("Course code is required.");
      return;
    }
    if (!currentSemesterId.trim()) {
      toast.error("Current semester ID is not available.");
      return;
    }

    setIsFetching(true);
    void onFetchCourseScores(normalizedCourseCode, currentSemesterId)
      .then((payload) => {
        setCourse(payload.course);
        setScores(payload.scores);
      })
      .catch((error) => {
        setCourse(null);
        setScores([]);
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to fetch course scores.",
        );
      })
      .finally(() => {
        setIsFetching(false);
      });
  };

  return (
    <main className="dashboard-wrap page-stack">
      <section className="hero-banner compact">
        <div>
          <p className="eyebrow">Course Scores</p>
          <h2>Review submitted scores for a course.</h2>
          <p className="sub">
            Fetch the active-semester score list for a course and use score IDs
            when a record needs correction.
          </p>
        </div>
        <div className="hero-badge">
          <span className="status-pill">Current semester</span>
          <strong>{currentSemester || "Not set"}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <h3>Fetch Course Scores</h3>
          <span className="status-pill subtle">Active semester</span>
        </div>
        <form className="search-department-form" onSubmit={fetchScores}>
          <label className="search-department-label">
            Course Code
            <input
              placeholder="e.g. CSC301"
              value={courseCode}
              onChange={(event) => setCourseCode(event.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            className="primary"
            disabled={isFetching || !courseCode.trim()}
          >
            {isFetching ? "Loading..." : "Fetch Scores"}
          </button>
        </form>

        {course && (
          <ul className="simple-list">
            <li>
              <strong>Course:</strong> {course.courseCode ?? "N/A"}
            </li>
            <li>
              <strong>Title:</strong> {course.title ?? "N/A"}
            </li>
            <li>
              <strong>Submitted scores:</strong> {scores.length}
            </li>
            <li>
              <strong>Average:</strong>{" "}
              {averageScore === null ? "-" : averageScore.toFixed(1)}
            </li>
          </ul>
        )}
      </section>

      {scores.length > 0 && (
        <section className="panel grade-sheet-wrap">
          <div className="section-title">
            <h3>Score List</h3>
            <span className="status-pill subtle">{scores.length} records</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Score ID</th>
                  <th>Name</th>
                  <th>Matric No</th>
                  <th>Test</th>
                  <th>Exam</th>
                  <th>Total</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((row) => (
                  <tr key={row.scoreId}>
                    <td>{row.scoreId}</td>
                    <td>{row.name ?? "N/A"}</td>
                    <td>{row.matricNo ?? "N/A"}</td>
                    <td>{row.testScore}</td>
                    <td>{row.examScore}</td>
                    <td>{row.testScore + row.examScore}</td>
                    <td>
                      <span className="result-grade">{row.grade}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
