import { useState } from "react";
import { useToast } from "../components/ToastProvider";

type AdminSemestersPageProps = {
  currentSemester: string;
  semesters: string[];
  isLoadingSemesterData: boolean;
  onCreateSemester: (name: string) => Promise<void>;
  onSetSemester: (name: string) => Promise<void>;
  onUpdateSemester: (currentName: string, newName: string) => Promise<void>;
  onLockSemester: (name: string) => Promise<void>;
  onUnlockSemester: (name: string) => Promise<void>;
  onBack: () => void;
};

type SemesterAction = "create" | "set" | "update" | "lock" | "unlock";

const initialBusyState: Record<SemesterAction, boolean> = {
  create: false,
  set: false,
  update: false,
  lock: false,
  unlock: false,
};

export function AdminSemestersPage({
  currentSemester,
  semesters,
  isLoadingSemesterData,
  onCreateSemester,
  onSetSemester,
  onUpdateSemester,
  onLockSemester,
  onUnlockSemester,
  onBack,
}: AdminSemestersPageProps) {
  const [newSemesterName, setNewSemesterName] = useState("");
  const [semesterToSet, setSemesterToSet] = useState("");
  const [semesterToUpdate, setSemesterToUpdate] = useState("");
  const [updatedSemesterName, setUpdatedSemesterName] = useState("");
  const [semesterForRegistrationStatus, setSemesterForRegistrationStatus] =
    useState("");
  const [busy, setBusy] = useState(initialBusyState);
  const toast = useToast();

  const runSemesterAction = async (
    action: SemesterAction,
    task: () => Promise<void>,
    successMessage: string,
  ) => {
    setBusy((current) => ({ ...current, [action]: true }));
    try {
      await task();
      toast.success(successMessage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Semester request failed.",
      );
    } finally {
      setBusy((current) => ({ ...current, [action]: false }));
    }
  };

  const submitCreate = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = newSemesterName.trim();
    if (!trimmed) {
      toast.error("Semester name is required.");
      return;
    }

    void runSemesterAction(
      "create",
      async () => {
        await onCreateSemester(trimmed);
        setNewSemesterName("");
      },
      "Semester created successfully.",
    );
  };

  const submitSet = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = semesterToSet.trim();
    if (!trimmed) {
      toast.error("Select a semester to set.");
      return;
    }

    void runSemesterAction(
      "set",
      () => onSetSemester(trimmed),
      `Current semester set to ${trimmed}.`,
    );
  };

  const submitUpdate = (event: React.FormEvent) => {
    event.preventDefault();
    const currentName = semesterToUpdate.trim();
    const nextName = updatedSemesterName.trim();

    if (!currentName) {
      toast.error("Select a semester to update.");
      return;
    }

    if (!nextName) {
      toast.error("Enter the replacement semester name.");
      return;
    }

    void runSemesterAction(
      "update",
      async () => {
        await onUpdateSemester(currentName, nextName);
        setSemesterToUpdate("");
        setUpdatedSemesterName("");
      },
      "Semester updated successfully.",
    );
  };

  const submitLock = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = semesterForRegistrationStatus.trim();
    if (!trimmed) {
      toast.error("Select a semester.");
      return;
    }

    void runSemesterAction(
      "lock",
      () => onLockSemester(trimmed),
      `Registration locked for ${trimmed}.`,
    );
  };

  const submitUnlock = () => {
    const trimmed = semesterForRegistrationStatus.trim();
    if (!trimmed) {
      toast.error("Select a semester.");
      return;
    }

    void runSemesterAction(
      "unlock",
      () => onUnlockSemester(trimmed),
      `Registration unlocked for ${trimmed}.`,
    );
  };

  const isBusy = Object.values(busy).some(Boolean) || isLoadingSemesterData;

  return (
    <main className="dashboard-wrap page-stack">
      <section className="dashboard-head">
        <div>
          <h2>Semesters</h2>
          <p className="sub">
            Create, update, set, and lock academic sessions.
          </p>
        </div>
        <div className="admin-head-actions">
          <button type="button" className="secondary" onClick={onBack}>
            Back to Admin Home
          </button>
        </div>
      </section>

      <section className="semester-action-grid">
        <form className="panel semester-action-card" onSubmit={submitCreate}>
          <h3>Create Semester</h3>
          <label>
            Semester name
            <input
              value={newSemesterName}
              onChange={(event) => setNewSemesterName(event.target.value)}
              placeholder="2025/2026 Rain"
            />
          </label>
          <button className="primary" type="submit" disabled={isBusy}>
            {busy.create ? "Creating..." : "Create Semester"}
          </button>
        </form>

        <form className="panel semester-action-card" onSubmit={submitSet}>
          <h3>Set Current Semester</h3>
          <label>
            Semester
            <select
              value={semesterToSet}
              onChange={(event) => setSemesterToSet(event.target.value)}
            >
              <option value="">Select semester</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </label>
          <button className="primary" type="submit" disabled={isBusy}>
            {busy.set ? "Setting..." : "Set Current"}
          </button>
        </form>

        <form className="panel semester-action-card" onSubmit={submitUpdate}>
          <h3>Update Semester</h3>
          <label>
            Existing semester
            <select
              value={semesterToUpdate}
              onChange={(event) => setSemesterToUpdate(event.target.value)}
            >
              <option value="">Select semester</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </label>
          <label>
            New semester name
            <input
              value={updatedSemesterName}
              onChange={(event) => setUpdatedSemesterName(event.target.value)}
              placeholder="2025/2026 Harmattan"
            />
          </label>
          <button className="primary" type="submit" disabled={isBusy}>
            {busy.update ? "Updating..." : "Update Semester"}
          </button>
        </form>

        <form className="panel semester-action-card" onSubmit={submitLock}>
          <h3>Registration Status</h3>
          <label>
            Semester
            <select
              value={semesterForRegistrationStatus}
              onChange={(event) =>
                setSemesterForRegistrationStatus(event.target.value)
              }
            >
              <option value="">Select semester</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </label>
          <div className="semester-status-actions">
            <button className="danger" type="submit" disabled={isBusy}>
              {busy.lock ? "Locking..." : "Lock Registration"}
            </button>
            <button
              className="secondary"
              type="button"
              disabled={isBusy}
              onClick={submitUnlock}
            >
              {busy.unlock ? "Unlocking..." : "Unlock Registration"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
