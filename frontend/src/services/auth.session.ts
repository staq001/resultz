import type { AuthUserProfile, Role } from "../types/app.types";

const AUTH_TOKEN_KEY = "authToken";
const AUTH_USER_KEY = "authUser";
const AUTH_ROLE_KEY = "authPortalRole";

type StoredAuthSession = {
  token: string;
  user: AuthUserProfile;
  role: Role;
};

function isLikelyJwt(token: string): boolean {
  return token.split(".").length === 3;
}

function isValidUserProfile(user: unknown): user is AuthUserProfile {
  if (!user || typeof user !== "object") return false;

  const candidate = user as Partial<AuthUserProfile>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string" &&
    (typeof candidate.matricNo === "string" ||
      typeof candidate.matricNo === "undefined" ||
      candidate.matricNo === null) &&
    (typeof candidate.department === "string" ||
      typeof candidate.department === "undefined" ||
      candidate.department === null) &&
    typeof candidate.isAdmin === "boolean" &&
    typeof candidate.isStaff === "boolean"
  );
}

export function saveAuthSession(
  token: string,
  user: AuthUserProfile,
  role: Role,
): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_ROLE_KEY, role);
}

export function loadAuthSession(): StoredAuthSession | null {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const serializedUser = localStorage.getItem(AUTH_USER_KEY);
  const role = localStorage.getItem(AUTH_ROLE_KEY);

  if (
    !token ||
    !serializedUser ||
    (role !== "student" && role !== "admin" && role !== "staff") ||
    !isLikelyJwt(token)
  ) {
    clearAuthSession();
    return null;
  }

  try {
    const parsed = JSON.parse(serializedUser) as unknown;
    if (!isValidUserProfile(parsed)) {
      clearAuthSession();
      return null;
    }

    const user = parsed;
    return { token, user, role };
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
}
