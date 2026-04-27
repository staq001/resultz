import type { AuthUserProfile } from "../types/app.types";

type LoginResponse = {
  data?: {
    token?: string;
  };
  message?: string;
  error?: string;
};

type SignupResponse = {
  data?: {
    user?: AuthUserProfile;
  };
  message?: string;
  error?: string;
};

type ProfileResponse = {
  data?: {
    user?: AuthUserProfile;
  };
  message?: string;
  error?: string;
};

export async function loginUser(
  apiBaseUrl: string,
  incomingPayload: {
    password: string;
    email?: string;
    matricNo?: string;
  },
): Promise<{ token: string }> {
  const email = incomingPayload.email?.trim();
  const matricNo = incomingPayload.matricNo?.trim();

  if (!email && !matricNo) {
    throw new Error("Provide email or matric number to log in.");
  }

  const response = await fetch(`${apiBaseUrl}/users/login`, {
    method: "POST",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...(email ? { email } : {}),
      ...(matricNo ? { matricNo } : {}),
      password: incomingPayload.password,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as LoginResponse;
  if (!response.ok) {
    throw new Error(
      payload.error ?? payload.message ?? "Unable to login at this time.",
    );
  }

  const token = payload.data?.token;
  if (!token) {
    throw new Error("Invalid login response from server.");
  }

  return { token };
}

export async function signupUser(
  apiBaseUrl: string,
  payload: {
    name: string;
    email: string;
    password: string;
    matricNo?: string;
    department?: string;
  },
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/users/signup`, {
    method: "POST",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: payload.name.trim(),
      email: payload.email.trim(),
      password: payload.password,
      ...(payload.matricNo ? { matricNo: payload.matricNo.trim() } : {}),
      ...(payload.department
        ? { department: payload.department.trim() }
        : {}),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as SignupResponse;
  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Unable to create account.");
  }
}

export async function fetchUserProfile(
  apiBaseUrl: string,
  token: string,
): Promise<AuthUserProfile> {
  const response = await fetch(`${apiBaseUrl}/users/profile`, {
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as ProfileResponse;
  if (!response.ok) {
    throw new Error(
      payload.error ?? payload.message ?? "Unable to fetch profile.",
    );
  }

  const user = payload.data?.user;
  if (!user) {
    throw new Error("Profile response is missing user data.");
  }

  return user;
}

export async function logoutUser(
  apiBaseUrl: string,
  token: string,
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/users/logout`, {
    method: "POST",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    throw new Error(payload.error ?? payload.message ?? "Unable to logout.");
  }
}
