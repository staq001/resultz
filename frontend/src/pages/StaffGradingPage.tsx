import { useMemo, useState } from "react";
import { useToast } from "../components/ToastProvider";
import type { FormSubmitHandler } from "../types/app.types";
import type { RegisteredCourseUserRow } from "../services/grading.api";

type StaffGradingPageProps = {
  currentSemester: string;
  onBack?: () => void;
  onFetchRegisteredUsers: (
    courseCode: string,
    semester: string,
  ) => Promise<{
    course: { id?: string; courseCode?: string; title?: string };
    registeredUsers: RegisteredCourseUserRow[];
  }>;
  onSaveScore: (params: {
    registrationId: string;
    scoreId?: string;
    testScore: number;
    examScore: number;
  }) => Promise<{ nextScoreId?: string }>;
};

type ScoreDraft = {
  scoreId?: string;
  testScore: string;
  examScore: string;
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

export function StaffGradingPage({
  currentSemester,
  onBack,
  onFetchRegisteredUsers,
  onSaveScore,
}: StaffGradingPageProps) {
  const [courseCode, setCourseCode] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [activeCourse, setActiveCourse] = useState<{
    id?: string;
    courseCode?: string;
    title?: string;
  } | null>(null);
  const [rows, setRows] = useState<RegisteredCourseUserRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ScoreDraft>>({});
  const [submittedRows, setSubmittedRows] = useState<Record<string, boolean>>(
    {},
  );
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const toast = useToast();

  const hasRows = rows.length > 0;

  const fetchRoster: FormSubmitHandler = (event) => {
    event.preventDefault();

    const normalizedCourseCode = courseCode.trim().toUpperCase();
    if (!normalizedCourseCode) {
      toast.error("Course code is required.");
      return;
    }

    if (!currentSemester || currentSemester === "Not set") {
      toast.error("Current semester is not set.");
      return;
    }

    setIsFetching(true);
    void onFetchRegisteredUsers(normalizedCourseCode, currentSemester)
      .then((payload) => {
        setActiveCourse(payload.course);
        setRows(payload.registeredUsers);

        const nextDrafts: Record<string, ScoreDraft> = {};
        payload.registeredUsers.forEach((row) => {
          nextDrafts[row.registrationId] = {
            ...(row.scoreId ? { scoreId: row.scoreId } : {}),
            testScore:
              typeof row.testScore === "number" ? String(row.testScore) : "",
            examScore:
              typeof row.examScore === "number" ? String(row.examScore) : "",
          };
        });
        setDrafts(nextDrafts);
        setSubmittedRows({});
      })
      .catch((error) => {
        setRows([]);
        setActiveCourse(null);
        setDrafts({});
        setSubmittedRows({});
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to fetch course roster.",
        );
      })
      .finally(() => {
        setIsFetching(false);
      });
  };

  const totalRegistered = useMemo(() => rows.length, [rows]);

  const updateDraft = (
    registrationId: string,
    field: "testScore" | "examScore",
    value: string,
  ) => {
    setSubmittedRows((current) => ({
      ...current,
      [registrationId]: false,
    }));
    setDrafts((current) => ({
      ...current,
      [registrationId]: {
        ...current[registrationId],
        [field]: value,
      },
    }));
  };

  const saveRow = (row: RegisteredCourseUserRow) => {
    const draft = drafts[row.registrationId];
    const testScore = Number(draft?.testScore);
    const examScore = Number(draft?.examScore);

    if (Number.isNaN(testScore) || testScore < 0 || testScore > 40) {
      toast.error("Test score must be between 0 and 40.");
      return;
    }

    if (Number.isNaN(examScore) || examScore < 0 || examScore > 60) {
      toast.error("Exam score must be between 0 and 60.");
      return;
    }

    setSavingRow(row.registrationId);
    void onSaveScore({
      registrationId: row.registrationId,
      scoreId: draft?.scoreId,
      testScore,
      examScore,
    })
      .then((result) => {
        const nextScoreId = result.nextScoreId ?? draft?.scoreId;

        setSubmittedRows((current) => ({
          ...current,
          [row.registrationId]: true,
        }));
        setDrafts((current) => ({
          ...current,
          [row.registrationId]: {
            ...current[row.registrationId],
            ...(nextScoreId ? { scoreId: nextScoreId } : {}),
          },
        }));

        setRows((current) =>
          current.map((entry) =>
            entry.registrationId === row.registrationId
              ? {
                  ...entry,
                  scoreId: nextScoreId,
                  testScore,
                  examScore,
                }
              : entry,
          ),
        );

        toast.success("Score saved successfully.");
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Unable to save score.",
        );
      })
      .finally(() => {
        setSavingRow(null);
      });
  };

  return (
    <main className="dashboard-wrap page-stack">
      <section className="hero-banner compact">
        <div>
          <p className="eyebrow">Grading Workspace</p>
          <h2>Load course rosters and submit scores accurately.</h2>
          <p className="sub">
            Enter test and exam scores for students registered in the current
            semester and update them when necessary.
          </p>
        </div>
        <div className="hero-badge">
          <span className="status-pill">Current semester</span>
          <strong>{currentSemester || "Not set"}</strong>
        </div>
      </section>

      <section className="dashboard-head">
        {onBack && (
          <div className="admin-head-actions">
            <button type="button" className="secondary" onClick={onBack}>
              Back to Staff Home
            </button>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-title">
          <h3>Load Registered Students by Course</h3>
          <span className="status-pill subtle">Score entry</span>
        </div>
        <form className="search-department-form" onSubmit={fetchRoster}>
          <label className="search-department-label">
            Course Code
            <input
              placeholder="e.g. CSC301"
              value={courseCode}
              onChange={(event) => setCourseCode(event.target.value)}
            />
          </label>
          <button type="submit" className="primary" disabled={isFetching}>
            {isFetching ? "Loading..." : "Fetch Students"}
          </button>
        </form>

        {activeCourse && (
          <ul className="simple-list">
            <li>
              <strong>Course:</strong> {activeCourse.courseCode ?? "N/A"}
            </li>
            <li>
              <strong>Title:</strong> {activeCourse.title ?? "N/A"}
            </li>
            <li>
              <strong>Total Registered:</strong> {totalRegistered}
            </li>
          </ul>
        )}
      </section>

      {hasRows && (
        <section className="panel grade-sheet-wrap">
          <div className="section-title">
            <h3>Course Roster</h3>
            <span className="status-pill subtle">{totalRegistered} students</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Matric No</th>
                  <th>Course Code</th>
                  <th>Test (40)</th>
                  <th>Exam (60)</th>
                  <th>Total</th>
                  <th>Grade</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const draft = drafts[row.registrationId] ?? {
                    testScore: "",
                    examScore: "",
                  };
                  const testValue = Number(draft.testScore);
                  const examValue = Number(draft.examScore);
                  const total =
                    !Number.isNaN(testValue) && !Number.isNaN(examValue)
                      ? testValue + examValue
                      : null;
                  const grade = computeGrade(total);
                  const isSubmitted = submittedRows[row.registrationId];

                  return (
                    <tr key={row.registrationId}>
                      <td>{row.name}</td>
                      <td>{row.matricNo}</td>
                      <td>{activeCourse?.courseCode ?? courseCode.trim().toUpperCase()}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={40}
                          value={draft.testScore}
                          onChange={(event) =>
                            updateDraft(
                              row.registrationId,
                              "testScore",
                              event.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={60}
                          value={draft.examScore}
                          onChange={(event) =>
                            updateDraft(
                              row.registrationId,
                              "examScore",
                              event.target.value,
                            )
                          }
                        />
                      </td>
                      <td>{total !== null ? total : "-"}</td>
                      <td>{grade}</td>
                      <td>
                        <button
                          type="button"
                          className={isSubmitted ? "secondary small" : "primary small"}
                          onClick={() => saveRow(row)}
                          disabled={
                            savingRow === row.registrationId ||
                            Boolean(isSubmitted)
                          }
                        >
                          {savingRow === row.registrationId
                            ? "Saving..."
                            : isSubmitted
                              ? "Submitted"
                              : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
