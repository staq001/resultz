import { useState } from "react";
import { useToast } from "../components/ToastProvider";

type AdminSemestersPageProps = {
  currentSemester: string;
  semesters: string[];
  isLoadingSemesterData: boolean;
  onCreateSemester: (name: string) => Promise<void>;
  onSetSemester: (name: string) => Promise<void>;
  onUpdateSemester: (currentName: string, newName: string) => Promise<void>;
  onBack: () => void;
};

export function AdminSemestersPage({
  currentSemester,
  semesters,
  isLoadingSemesterData,
  onCreateSemester,
  onSetSemester,
  onUpdateSemester,
  onBack,
}: AdminSemestersPageProps) {
  const [newSemesterName, setNewSemesterName] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [renamingSemester, setRenamingSemester] = useState("");
  const [replacementSemester, setReplacementSemester] = useState("");
  const [isEditingCreate, setIsEditingCreate] = useState(false);
  const [isEditingSet, setIsEditingSet] = useState(false);
  const [isEditingUpdate, setIsEditingUpdate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSetting, setIsSetting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  const cancelCreateEdit = () => {
    setNewSemesterName("");
    setIsEditingCreate(false);
  };

  const cancelSetEdit = () => {
    setSelectedSemester("");
    setIsEditingSet(false);
  };

  const cancelUpdateEdit = () => {
    setRenamingSemester("");
    setReplacementSemester("");
    setIsEditingUpdate(false);
  };

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = newSemesterName.trim();
    if (!trimmed) {
      toast.error("Semester name is required.");
      return;
    }

    setIsCreating(true);
    try {
      await onCreateSemester(trimmed);
      setNewSemesterName("");
      if (!selectedSemester) setSelectedSemester(trimmed);
      if (!renamingSemester) setRenamingSemester(trimmed);
      setIsEditingCreate(false);
      toast.success("Semester added successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not add semester.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const submitSet = async (event: React.FormEvent) => {
    event.preventDefault();
    const targetSemester = selectedSemester.trim();
    if (!targetSemester) {
      toast.error("Select or enter a semester to set.");
      return;
    }

    setIsSetting(true);
    try {
      await onSetSemester(targetSemester);
      setIsEditingSet(false);
      toast.success(`Current semester set to ${targetSemester}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not set semester.",
      );
    } finally {
      setIsSetting(false);
    }
  };

  const submitUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    const sourceSemester = renamingSemester.trim();
    const targetSemester = replacementSemester.trim();

    if (!sourceSemester) {
      toast.error("Select a semester to rename.");
      return;
    }

    if (!targetSemester) {
      toast.error("Enter the new semester name.");
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateSemester(sourceSemester, targetSemester);
      setRenamingSemester("");
      setReplacementSemester("");
      setIsEditingUpdate(false);
      toast.success(`Semester renamed to ${targetSemester}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not rename semester.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main className="dashboard-wrap">
      <section className="dashboard-head">
        <h2>Semesters</h2>
        <div className="admin-head-actions">
          <button type="button" className="secondary" onClick={onBack}>
            Back to Admin Home
          </button>
        </div>
      </section>

      <section className="panel settings-inline-panel semesters-inline-panel">
        <h3>Semester Controls</h3>

        {isLoadingSemesterData && (
          <div className="loading-inline">
            <span className="inline-spinner" aria-hidden="true" />
            <p className="sub">Loading sessions...</p>
          </div>
        )}

        <div className="settings-inline-row">
          <div className="settings-inline-meta">
            <strong>Add Semester</strong>
          </div>
          <div className="settings-inline-control">
            {isEditingCreate ? (
              <form
                className="settings-inline-edit-stack"
                onSubmit={submitCreate}
              >
                <input
                  value={newSemesterName}
                  onChange={(event) => setNewSemesterName(event.target.value)}
                  placeholder="2025/2026 Harmattan"
                />
                <div className="settings-inline-actions-row">
                  <button
                    type="button"
                    className="secondary"
                    onClick={cancelCreateEdit}
                    disabled={isCreating || isLoadingSemesterData}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary"
                    disabled={isCreating || isLoadingSemesterData}
                  >
                    {isCreating ? (
                      <span className="button-with-spinner">
                        <span className="inline-spinner" aria-hidden="true" />
                        Adding...
                      </span>
                    ) : (
                      "Save changes"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="settings-inline-view-stack">
                <input value="Create a new semester" readOnly />
                <div className="settings-inline-actions-row">
                  <button
                    type="button"
                    className="ghost settings-inline-link"
                    onClick={() => setIsEditingCreate(true)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="settings-inline-row">
          <div className="settings-inline-meta">
            <strong>Set Current Semester</strong>
          </div>
          <div className="settings-inline-control">
            {isEditingSet ? (
              <form className="settings-inline-edit-stack" onSubmit={submitSet}>
                <select
                  value={selectedSemester}
                  onChange={(event) => setSelectedSemester(event.target.value)}
                >
                  <option value="">Select semester</option>
                  {semesters.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
                <div className="settings-inline-actions-row">
                  <button
                    type="button"
                    className="secondary"
                    onClick={cancelSetEdit}
                    disabled={isSetting || isLoadingSemesterData}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary"
                    disabled={isSetting || isLoadingSemesterData}
                  >
                    {isSetting ? (
                      <span className="button-with-spinner">
                        <span className="inline-spinner" aria-hidden="true" />
                        Setting...
                      </span>
                    ) : (
                      "Save changes"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="settings-inline-view-stack">
                <input value={currentSemester || "Not set"} readOnly />
                <div className="settings-inline-actions-row">
                  <button
                    type="button"
                    className="ghost settings-inline-link"
                    onClick={() => setIsEditingSet(true)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="settings-inline-row">
          <div className="settings-inline-meta">
            <strong>Update Semester</strong>
          </div>
          <div className="settings-inline-control">
            {isEditingUpdate ? (
              <form
                className="settings-inline-edit-stack"
                onSubmit={submitUpdate}
              >
                <select
                  value={renamingSemester}
                  onChange={(event) => setRenamingSemester(event.target.value)}
                >
                  <option value="">Select semester to rename</option>
                  {semesters.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
                <input
                  value={replacementSemester}
                  onChange={(event) =>
                    setReplacementSemester(event.target.value)
                  }
                  placeholder="New semester name"
                />
                <div className="settings-inline-actions-row">
                  <button
                    type="button"
                    className="secondary"
                    onClick={cancelUpdateEdit}
                    disabled={isUpdating || isLoadingSemesterData}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary"
                    disabled={isUpdating || isLoadingSemesterData}
                  >
                    {isUpdating ? (
                      <span className="button-with-spinner">
                        <span className="inline-spinner" aria-hidden="true" />
                        Updating...
                      </span>
                    ) : (
                      "Save changes"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="settings-inline-view-stack">
                <input value="Rename an existing semester" readOnly />
                <div className="settings-inline-actions-row">
                  <button
                    type="button"
                    className="ghost settings-inline-link"
                    onClick={() => setIsEditingUpdate(true)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
