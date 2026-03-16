import type { AuthMode, FormSubmitHandler, Role } from "../types/app.types";

type AuthPageProps = {
  authMode: AuthMode;
  role: Role;
  userName: string;
  matricNo: string;
  email: string;
  password: string;
  isSubmitting: boolean;
  onSetAuthMode: (mode: AuthMode) => void;
  onSetRole: (role: Role) => void;
  onSetUserName: (name: string) => void;
  onSetMatricNo: (matricNo: string) => void;
  onSetEmail: (email: string) => void;
  onSetPassword: (password: string) => void;
  onSubmit: FormSubmitHandler;
};

export function AuthPage({
  authMode,
  role,
  userName,
  matricNo,
  email,
  password,
  isSubmitting,
  onSetAuthMode,
  onSetRole,
  onSetUserName,
  onSetMatricNo,
  onSetEmail,
  onSetPassword,
  onSubmit,
}: AuthPageProps) {
  return (
    <main className="auth-wrap">
      <form className="panel" onSubmit={onSubmit}>
        <h2>{authMode === "login" ? "Login to Portal" : "Create Account"}</h2>
        <p className="sub">
          {authMode === "login"
            ? "Log in to your account"
            : "Create a new account"}
        </p>

        <div className="segmented">
          <button
            type="button"
            className={authMode === "login" ? "active" : ""}
            onClick={() => onSetAuthMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={authMode === "signup" ? "active" : ""}
            onClick={() => onSetAuthMode("signup")}
          >
            Sign Up
          </button>
        </div>

        {authMode === "login" && (
          <label>
            Role
            <select
              value={role}
              onChange={(event) => onSetRole(event.target.value as Role)}
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        )}

        {authMode === "signup" && (
          <>
            <label>
              Account Type
              <select
                value={role}
                onChange={(event) => onSetRole(event.target.value as Role)}
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Full Name
              <input
                placeholder="e.g. Chidera Okafor"
                value={userName}
                onChange={(event) => onSetUserName(event.target.value)}
                required
              />
            </label>
            {role === "student" && (
              <label>
                Matric Number
                <input
                  placeholder="e.g. FCP/CSC/24/0001"
                  value={matricNo}
                  onChange={(event) => onSetMatricNo(event.target.value)}
                  required
                />
              </label>
            )}
          </>
        )}

        <label>
          Email
          <input
            type="email"
            placeholder="name@school.edu"
            value={email}
            onChange={(event) => onSetEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(event) => onSetPassword(event.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          className="primary stretch"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="button-with-spinner">
              <span className="inline-spinner" aria-hidden="true" />
              Signing in...
            </span>
          ) : authMode === "login" ? (
            "Continue"
          ) : (
            "Create Account"
          )}
        </button>
      </form>
    </main>
  );
}
