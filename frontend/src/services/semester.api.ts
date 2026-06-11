const parseJson = async <T>(response: Response): Promise<T | null> => {
  try {
    return await response.json() as T;
  } catch {
    return null;
  }
};

const extractErrorMessage = (payload: unknown, fallback: string): string => {
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
  }
  return fallback;
};

export type SemesterRecord = {
  id: string;
  schoolSession: string;
  registrationStatus?: string;
  lockedBy?: string | null;
  lockedAt?: string | null;
};

type ApiEnvelope = {
  data?: unknown;
  message?: string;
  error?: string;
};

export async function createSemester(
  apiBaseUrl: string,
  token: string,
  sessionName: string,
): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/sessions/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionName }),
  });

  const payload = await parseJson<ApiEnvelope>(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Failed to create semester."));
  }

  return payload?.message ?? "Semester created successfully.";
}

export async function setSemester(
  apiBaseUrl: string,
  token: string,
  sessionName: string,
): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/sessions/set`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionName }),
  });

  const payload = await parseJson<ApiEnvelope>(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Failed to set semester."));
  }

  return payload?.message ?? "Semester set successfully.";
}

export async function updateSemester(
  apiBaseUrl: string,
  token: string,
  sessionName: string,
  newSessionName: string,
): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/sessions/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionName, newSessionName }),
  });

  const payload = await parseJson<ApiEnvelope>(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Failed to update semester."));
  }

  return payload?.message ?? "Semester updated successfully.";
}

export async function lockSemester(
  apiBaseUrl: string,
  token: string,
  sessionName: string,
): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/sessions/lock`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionName }),
  });

  const payload = await parseJson<ApiEnvelope>(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Failed to lock semester."));
  }

  return payload?.message ?? "Semester locked successfully.";
}

export async function unlockSemester(
  apiBaseUrl: string,
  token: string,
  sessionName: string,
): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/sessions/unlock`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionName }),
  });

  const payload = await parseJson<ApiEnvelope>(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Failed to unlock semester."));
  }

  return payload?.message ?? "Semester unlocked successfully.";
}

export async function fetchCurrentSemester(
  apiBaseUrl: string,
  token: string,
): Promise<string | null> {
  const record = await fetchCurrentSemesterRecord(apiBaseUrl, token);
  return record?.schoolSession ?? null;
}

export async function fetchCurrentSemesterRecord(
  apiBaseUrl: string,
  token: string,
): Promise<SemesterRecord | null> {
  const response = await fetch(`${apiBaseUrl}/sessions/current`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = await parseJson<ApiEnvelope>(response);

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(
      extractErrorMessage(payload, "Failed to fetch current semester."),
    );
  }

  if (typeof payload !== "object" || payload === null) return null;

  const { data } = payload;
  if (data == null) return null;

  if (typeof data === "object") {
    const entry = data as Record<string, unknown>;
    const id = typeof entry.id === "string" ? entry.id : "";
    const schoolSession =
      typeof entry.schoolSession === "string"
        ? entry.schoolSession
        : typeof entry.currentSession === "string"
          ? entry.currentSession
          : "";

    if (schoolSession.trim()) {
      return { id, schoolSession };
    }
  }

  return null;
}

export async function fetchSemesters(
  apiBaseUrl: string,
  token: string,
): Promise<string[]> {
  const response = await fetch(`${apiBaseUrl}/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = await parseJson<ApiEnvelope>(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Failed to fetch semesters."));
  }

  if (typeof payload !== "object" || payload === null) return [];

  const { data } = payload;
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null) {
        const entry = item as Record<string, unknown>;
        if (typeof entry.schoolSession === "string") return entry.schoolSession;
        if (typeof entry.currentSession === "string") return entry.currentSession;
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));
}
