import { useState, useEffect } from "react";
import type { AuthMode, FormSubmitHandler, Role } from "../types/app.types";

type AuthPageProps = {
  authMode: AuthMode;
  role: Role;
  userName: string;
  matricNo: string;
  department: string;
  entryYear: string;
  email: string;
  password: string;
  isSubmitting: boolean;
  departments: string[];
  onSetAuthMode: (mode: AuthMode) => void;
  onSetRole: (role: Role) => void;
  onSetUserName: (name: string) => void;
  onSetMatricNo: (matricNo: string) => void;
  onSetDepartment: (department: string) => void;
  onSetEntryYear: (entryYear: string) => void;
  onSetEmail: (email: string) => void;
  onSetPassword: (password: string) => void;
  onSubmit: FormSubmitHandler;
};

export function AuthPage({
  authMode,
  role,
  userName,
  matricNo,
  department,
  entryYear,
  email,
  password,
  isSubmitting,
  departments,
  onSetAuthMode,
  onSetRole,
  onSetUserName,
  onSetMatricNo,
  onSetDepartment,
  onSetEntryYear,
  onSetEmail,
  onSetPassword,
  onSubmit,
}: AuthPageProps) {
  const [searchQuery, setSearchQuery] = useState(department ?? "");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setSearchQuery(department ?? "");
  }, [department]);

  const isDeptValid =
    !(authMode === "signup" && role === "student") ||
    (department &&
      departments.some(
        (d) => d.toLowerCase() === (department ?? "").trim().toLowerCase(),
      ));

  const filteredDepartments =
    searchQuery.length >= 2
      ? departments.filter((name) =>
          name.toLowerCase().startsWith(searchQuery.toLowerCase()),
        )
      : [];

  const isStudentLogin = authMode === "login" && role === "student";
  const isEmailLogin =
    authMode === "login" && (role === "admin" || role === "staff");

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
              <option value="staff">Staff</option>
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
              <>
                <label>
                  Department
                  <div className="search-wrap">
                    <input
                      placeholder="Enter Department"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                        onSetDepartment("");
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => {
                          setShowDropdown(false);
                          const match = departments.find(
                            (d) =>
                              d.toLowerCase() ===
                              searchQuery.trim().toLowerCase(),
                          );
                          if (match) {
                            setSearchQuery(match);
                            onSetDepartment(match);
                          } else {
                            onSetDepartment("");
                          }
                        }, 200)
                      }
                      required
                    />
                    {showDropdown &&
                      (filteredDepartments.length > 0 ||
                        searchQuery.length >= 2) && (
                        <ul className="search-dropdown">
                          {filteredDepartments.length > 0 ? (
                            filteredDepartments.map((name) => (
                              <li
                                key={name}
                                onMouseDown={() => {
                                  setSearchQuery(name);
                                  onSetDepartment(name);
                                  setShowDropdown(false);
                                }}
                              >
                                {name}
                              </li>
                            ))
                          ) : (
                            <li className="no-results">
                              Department does not exist
                            </li>
                          )}
                        </ul>
                      )}
                  </div>
                  {!isDeptValid &&
                    (searchQuery.length >= 2 ||
                      (department ?? "").trim() !== "") && (
                      <div
                        className="field-error"
                        style={{ color: "#c53030", marginTop: 6 }}
                      >
                        Department does not exist
                      </div>
                    )}
                </label>
                <label>
                  Entry Year
                  <input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    placeholder="e.g. 2024"
                    value={entryYear}
                    onChange={(event) => onSetEntryYear(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Matric Number
                  <input
                    placeholder="e.g. FCP/CSC/24/0001"
                    value={matricNo}
                    onChange={(event) => onSetMatricNo(event.target.value)}
                    required
                  />
                </label>
              </>
            )}
          </>
        )}

        {(authMode === "signup" || isEmailLogin) && (
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
        )}

        {isStudentLogin && (
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
          disabled={isSubmitting || !isDeptValid}
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
