import type { AuthUserProfile } from "../types/app.types";

type ApiResponse = {
  message?: string;
  error?: string;
};

export async function updateUserName(
  apiBaseUrl: string,
  token: string,
  name: string,
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/users/update/name`, {
    method: "PATCH",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: name.trim() }),
  });

  const payload = (await response.json().catch(() => ({}))) as ApiResponse;
  if (!response.ok) {
    throw new Error(
      payload.error ?? payload.message ?? "Unable to update name.",
    );
  }
}

export async function updateUserPassword(
  apiBaseUrl: string,
  token: string,
  password: string,
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/users/update/password`, {
    method: "PATCH",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  });

  const payload = (await response.json().catch(() => ({}))) as ApiResponse;
  if (!response.ok) {
    throw new Error(
      payload.error ?? payload.message ?? "Unable to update password.",
    );
  }
}

export async function deleteCurrentUser(
  apiBaseUrl: string,
  token: string,
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/users/delete`, {
    method: "POST",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as ApiResponse;
  if (!response.ok) {
    throw new Error(
      payload.error ?? payload.message ?? "Unable to delete user.",
    );
  }
}

export async function refreshProfileAfterSettingsUpdate(
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

  const payload = (await response.json().catch(() => ({}))) as {
    data?: { user?: AuthUserProfile };
    message?: string;
    error?: string;
  };

  if (!response.ok || !payload.data?.user) {
    throw new Error(
      payload.error ?? payload.message ?? "Unable to refresh profile.",
    );
  }

  return payload.data.user;
}

export async function uploadUserAvatar(
  apiBaseUrl: string,
  token: string,
  imageFile: File,
): Promise<string> {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch(`${apiBaseUrl}/users/avatar`, {
    method: "POST",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: { avatarUrl?: string };
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      payload.error ?? payload.message ?? "Unable to upload avatar.",
    );
  }

  const avatarUrl = payload.data?.avatarUrl;
  if (!avatarUrl) {
    throw new Error("Avatar upload response is missing avatar URL.");
  }

  return avatarUrl;
}
