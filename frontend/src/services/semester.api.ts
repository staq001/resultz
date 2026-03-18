const parseSemesterMessage = async (response: Response): Promise<string> => {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
  }

  return "Semester request failed.";
};

const parseSemesterPayload = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getSemesterError = (payload: unknown): string => {
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
  }
  return "Semester request failed.";
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

  if (!response.ok) {
    throw new Error(await parseSemesterMessage(response));
  }

  return parseSemesterMessage(response);
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

  if (!response.ok) {
    throw new Error(await parseSemesterMessage(response));
  }

  return parseSemesterMessage(response);
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

  if (!response.ok) {
    throw new Error(await parseSemesterMessage(response));
  }

  return parseSemesterMessage(response);
}

export async function fetchCurrentSemester(
  apiBaseUrl: string,
  token: string,
): Promise<string | null> {
  const response = await fetch(`${apiBaseUrl}/sessions/current`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await parseSemesterPayload(response);
  if (!response.ok) {
    throw new Error(getSemesterError(payload));
  }

  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (typeof record.data === "string") {
      return record.data;
    }
  }

  return null;
}

export async function fetchSemesters(
  apiBaseUrl: string,
  token: string,
): Promise<string[]> {
  const response = await fetch(`${apiBaseUrl}/sessions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await parseSemesterPayload(response);
  if (!response.ok) {
    throw new Error(getSemesterError(payload));
  }

  if (typeof payload !== "object" || payload === null) return [];
  const record = payload as Record<string, unknown>;
  const data = record.data;

  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null) {
        const entry = item as Record<string, unknown>;
        if (typeof entry.schoolSession === "string") return entry.schoolSession;
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));
}
