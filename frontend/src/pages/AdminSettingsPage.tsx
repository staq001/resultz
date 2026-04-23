import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useToast } from "../components/ToastProvider";

type AdminSettingsPageProps = {
  title?: string;
  backButtonLabel?: string;
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
  onUpdateName: (name: string) => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
  onBack?: () => void;
};

export function AdminSettingsPage({
  title = "Admin Settings",
  backButtonLabel = "Back to Admin Home",
  userName,
  userEmail,
  avatarUrl,
  onUpdateName,
  onUpdatePassword,
  onUploadAvatar,
  onBack,
}: AdminSettingsPageProps) {
  const [nameInput, setNameInput] = useState(userName);
  const [passwordInput, setPasswordInput] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null,
  );
  const toast = useToast();

  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const avatarPreviewUrl = useMemo(() => {
    if (!selectedAvatarFile) return null;
    return URL.createObjectURL(selectedAvatarFile);
  }, [selectedAvatarFile]);

  useEffect(() => {
    setNameInput(userName);
  }, [userName]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const cancelNameEdit = () => {
    setNameInput(userName);
    setIsEditingName(false);
  };

  const cancelPasswordEdit = () => {
    setPasswordInput("");
    setIsEditingPassword(false);
  };

  const cancelAvatarEdit = () => {
    setSelectedAvatarFile(null);
    setIsEditingAvatar(false);
  };

  const handleAvatarSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedAvatarFile(file);
  };

  const submitName = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!nameInput.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setIsSavingName(true);
    try {
      await onUpdateName(nameInput);
      setIsEditingName(false);
      toast.success("Name updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Name update failed.",
      );
    } finally {
      setIsSavingName(false);
    }
  };

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (passwordInput.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsSavingPassword(true);
    try {
      await onUpdatePassword(passwordInput);
      setPasswordInput("");
      setIsEditingPassword(false);
      toast.success("Password updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Password update failed.",
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  const submitAvatar = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedAvatarFile) {
      toast.error("Choose an image file first.");
      return;
    }

    setIsSavingAvatar(true);
    try {
      await onUploadAvatar(selectedAvatarFile);
      setSelectedAvatarFile(null);
      setIsEditingAvatar(false);
      toast.success("Avatar updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Avatar update failed.",
      );
    } finally {
      setIsSavingAvatar(false);
    }
  };

  return (
    <main className="dashboard-wrap">
      <section className="dashboard-head">
        <h2>{title}</h2>
        {onBack && (
          <div className="admin-head-actions">
            <button type="button" className="secondary" onClick={onBack}>
              {backButtonLabel}
            </button>
          </div>
        )}
      </section>

      <section className="panel settings-inline-panel">
        <h3>General</h3>

        <div className="settings-inline-row">
          <div className="settings-inline-meta">
            <strong>Name</strong>
          </div>
          <div className="settings-inline-control">
            {isEditingName ? (
              <form
                className="settings-inline-edit-stack"
                onSubmit={submitName}
              >
                <input
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  placeholder="Enter new name"
                />
                <div className="settings-inline-actions-row">
                  <button
                    type="button"
                    className="secondary"
                    onClick={cancelNameEdit}
                    disabled={isSavingName}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary"
                    disabled={isSavingName}
                  >
                    {isSavingName ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="settings-inline-view-stack">
                <input value={nameInput} readOnly />
                <div className="settings-inline-actions-row">
                  <button
                    type="button"
                    className="ghost settings-inline-link"
                    onClick={() => setIsEditingName(true)}
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
            <strong>Email</strong>
            <p className="sub">Email address for workspace updates.</p>
          </div>
          <div className="settings-inline-control">
            <div className="settings-inline-view-stack">
              <input value={userEmail || "N/A"} readOnly />
            </div>
          </div>
        </div>

        <div className="settings-inline-row">
          <div className="settings-inline-meta">
            <strong>Avatar</strong>
          </div>
          <div className="settings-inline-control">
            <div className="settings-avatar-row">
              {avatarPreviewUrl || avatarUrl ? (
                <img
                  src={avatarPreviewUrl ?? avatarUrl ?? undefined}
                  alt="Avatar preview"
                  className="settings-avatar-preview"
                />
              ) : (
                <div className="settings-avatar-preview settings-avatar-fallback">
                  {(userName || "U").slice(0, 1).toUpperCase()}
                </div>
              )}

              {isEditingAvatar ? (
                <form
                  className="settings-inline-edit-stack"
                  onSubmit={submitAvatar}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelection}
                  />
                  <div className="settings-inline-actions-row">
                    <button
                      type="button"
                      className="secondary"
                      onClick={cancelAvatarEdit}
                      disabled={isSavingAvatar}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="primary"
                      disabled={isSavingAvatar}
                    >
                      {isSavingAvatar ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="settings-inline-actions-row settings-inline-actions-start">
                  <button
                    type="button"
                    className="ghost settings-inline-link"
                    onClick={() => setIsEditingAvatar(true)}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="settings-inline-row">
          <div className="settings-inline-meta">
            <strong>Password</strong>
          </div>
          <div className="settings-inline-control">
            {isEditingPassword ? (
              <form
                className="settings-inline-edit-stack"
                onSubmit={submitPassword}
              >
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
                  placeholder="Minimum 8 characters"
                />
                <div className="settings-inline-actions-row">
                  <button
                    type="button"
                    className="secondary"
                    onClick={cancelPasswordEdit}
                    disabled={isSavingPassword}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary"
                    disabled={isSavingPassword}
                  >
                    {isSavingPassword ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="settings-inline-view-stack">
                <input value="********" readOnly />
                <div className="settings-inline-actions-row">
                  <button
                    type="button"
                    className="ghost settings-inline-link"
                    onClick={() => setIsEditingPassword(true)}
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
