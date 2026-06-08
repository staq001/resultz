import { useState } from "react";
import { useToast } from "../components/ToastProvider";
import type { CourseScoreRow } from "../services/grading.api";
import type { FormSubmitHandler } from "../types/app.types";

type StaffUpdateScorePageProps = {
  currentSemester: string;
  currentSemesterId: string;
  onBack?: () => void;
  onFindScore: (params: {
    matricNo: string;
    courseCode: string;
  }) => Promise<CourseScoreRow>;
  onUpdateScore: (params: {
    matricNo: string;
    registrationId: string;
    testScore: number;
    examScore: number;
  }) => Promise<void>;
};

function computeGrade(total: number | null) {
  if (total === null) return "-";
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  if (total >= 40) return "E";
  return "F";
}

export function StaffUpdateScorePage({
  currentSemester,
  currentSemesterId,
  onBack,
  onFindScore,
  onUpdateScore,
}: StaffUpdateScorePageProps) {
  const [matricNo, setMatricNo] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [loadedScore, setLoadedScore] = useState<CourseScoreRow | null>(null);
  const [testScore, setTestScore] = useState("");
  const [examScore, setExamScore] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const total =
    testScore.trim() !== "" && examScore.trim() !== ""
      ? Number(testScore) + Number(examScore)
      : null;

  const fetchScore: FormSubmitHandler = (event) => {
    event.preventDefault();
    const normalizedMatricNo = matricNo.trim().toUpperCase();
    const normalizedCourseCode = courseCode.trim().toUpperCase();

    if (!normalizedMatricNo) {
      toast.error("Matric number is required.");
      return;
    }
    if (!normalizedCourseCode) {
      toast.error("Course code is required.");
      return;
    }
    if (!currentSemesterId.trim()) {
      toast.error("Current semester ID is not available.");
      return;
    }

    setIsFetching(true);
    void onFindScore({
      matricNo: normalizedMatricNo,
      courseCode: normalizedCourseCode,
    })
      .then((score) => {
        setLoadedScore(score);
        setTestScore(String(score.testScore));
        setExamScore(String(score.examScore));
      })
      .catch((error) => {
        setLoadedScore(null);
        setTestScore("");
        setExamScore("");
        toast.error(
          error instanceof Error ? error.message : "Unable to fetch score.",
        );
      })
      .finally(() => {
        setIsFetching(false);
      });
  };

  const saveScore: FormSubmitHandler = (event) => {
    event.preventDefault();
    if (!loadedScore?.registrationId || !loadedScore.matricNo) {
      toast.error("Find a student's score before updating.");
      return;
    }

    const nextTestScore = Number(testScore);
    const nextExamScore = Number(examScore);

    if (
      Number.isNaN(nextTestScore) ||
      nextTestScore < 0 ||
      nextTestScore > 40
    ) {
      toast.error("Test score must be between 0 and 40.");
      return;
    }

    if (
      Number.isNaN(nextExamScore) ||
      nextExamScore < 0 ||
      nextExamScore > 60
    ) {
      toast.error("Exam score must be between 0 and 60.");
      return;
    }

    setIsSaving(true);
    void onUpdateScore({
      matricNo: loadedScore.matricNo,
      registrationId: loadedScore.registrationId,
      testScore: nextTestScore,
      examScore: nextExamScore,
    })
      .then(() => {
        setLoadedScore((current) =>
          current
            ? {
                ...current,
                testScore: nextTestScore,
                examScore: nextExamScore,
                grade: computeGrade(nextTestScore + nextExamScore),
              }
            : current,
        );
        toast.success("Score updated successfully.");
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Unable to update score.",
        );
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <main className="dashboard-wrap page-stack">
      <section className="hero-banner compact">
        <div>
          <p className="eyebrow">Score Update</p>
          <h2>Find a student by matric number and course.</h2>
          <p className="sub">
            Load the current score with details staff already know, then revise
            test and exam marks with the same marking limits.
          </p>
        </div>
        <div className="hero-badge">
          <span className="status-pill">Current semester</span>
          <strong>{currentSemester || "Not set"}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <h3>Find Student Score</h3>
          <span className="status-pill subtle">Matric and course</span>
        </div>
        <form
          className="search-department-form search-inline"
          onSubmit={fetchScore}
        >
          <label className="search-department-label">
            Matric No
            <input
              placeholder="e.g. CSC/2022/001"
              value={matricNo}
              onChange={(event) => setMatricNo(event.target.value)}
              required
            />
          </label>
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
            disabled={isFetching || !matricNo.trim() || !courseCode.trim()}
          >
            {isFetching ? "Finding..." : "Find Score"}
          </button>
        </form>
      </section>

      {loadedScore && (
        <section className="panel">
          <div className="section-title">
            <h3>Update Score</h3>
            <span className="status-pill subtle">
              Grade {computeGrade(total)}
            </span>
          </div>
          <ul className="simple-list">
            <li>
              <strong>Course:</strong> {loadedScore.courseCode ?? courseCode}
            </li>
            <li>
              <strong>Student:</strong> {loadedScore.name ?? "N/A"}
            </li>
            <li>
              <strong>Matric No:</strong> {loadedScore.matricNo ?? "N/A"}
            </li>
          </ul>

          <form className="grid-2 score-update-form" onSubmit={saveScore}>
            <label>
              Test Score (40)
              <input
                type="number"
                min={0}
                max={40}
                value={testScore}
                onChange={(event) => setTestScore(event.target.value)}
              />
            </label>
            <label>
              Exam Score (60)
              <input
                type="number"
                min={0}
                max={60}
                value={examScore}
                onChange={(event) => setExamScore(event.target.value)}
              />
            </label>
            <div className="score-summary">
              <span>Total</span>
              <strong>
                {total !== null && !Number.isNaN(total) ? total : "-"}
              </strong>
            </div>
            <button type="submit" className="primary" disabled={isSaving}>
              {isSaving ? "Updating..." : "Update Score"}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
