export type DepartmentRecord = {
  id: string;
  name: string;
  faculty: string;
};

type DepartmentsEnvelope = {
  page?: number;
  totalPages?: number;
  departments?: DepartmentRecord[];
};

type ApiResponse = {
  data?: {
    department?: DepartmentRecord;
    departments?: DepartmentsEnvelope;
  };
  message?: string;
  error?: string;
};

function getErrorMessage(payload: ApiResponse, fallback: string): string {
  return payload.error ?? payload.message ?? fallback;
}

export async function fetchDepartmentNames(
  apiBaseUrl: string,
): Promise<string[]> {
  const response = await fetch(`${apiBaseUrl}/departments/names`, {
    cache: "no-store",
    referrerPolicy: "no-referrer",
  });

  if (!response.ok) {
    throw new Error("Unable to fetch department names.");
  }

  const payload: unknown = await response.json().catch(() => null);

  const normalizeArray = (arr: unknown[]): string[] =>
    arr.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        if ("name" in obj && typeof obj.name === "string") return obj.name;
        if ("department" in obj && typeof obj.department === "string")
          return obj.department;
        if ("departmentName" in obj && typeof obj.departmentName === "string")
          return obj.departmentName;
        // fallback: return first string property
        for (const k of Object.keys(obj)) {
          const v = obj[k];
          if (typeof v === "string") return v;
        }
        return JSON.stringify(obj);
      }
      return String(item);
    });

  if (Array.isArray(payload)) return normalizeArray(payload as unknown[]);

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;

    // common envelope: { data: { departmentNames: [...] } }
    if ("data" in obj && obj.data) {
      const data = obj.data as unknown;
      if (Array.isArray(data)) return normalizeArray(data as unknown[]);
      if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        if ("departmentNames" in d && Array.isArray(d.departmentNames))
          return normalizeArray(d.departmentNames as unknown[]);
        if ("names" in d && Array.isArray(d.names))
          return normalizeArray(d.names as unknown[]);
        if ("departments" in d && Array.isArray(d.departments))
          return normalizeArray(d.departments as unknown[]);
      }
    }

    // top-level variations
    if ("departmentNames" in obj && Array.isArray(obj.departmentNames))
      return normalizeArray(obj.departmentNames as unknown[]);
    if ("names" in obj && Array.isArray(obj.names))
      return normalizeArray(obj.names as unknown[]);
    if ("departments" in obj && Array.isArray(obj.departments))
      return normalizeArray(obj.departments as unknown[]);
  }

  return [];
}

export async function fetchDepartments(
  apiBaseUrl: string,
  token: string,
  faculty?: string,
): Promise<DepartmentRecord[]> {
  const params = new URLSearchParams({ limit: "100", page: "1" });
  if (faculty?.trim()) {
    params.set("faculty", faculty.trim());
  }

  const response = await fetch(
    `${apiBaseUrl}/departments?${params.toString()}`,
    {
      cache: "no-store",
      referrerPolicy: "no-referrer",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const payload = (await response.json().catch(() => ({}))) as ApiResponse;
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Unable to fetch departments."));
  }

  return payload.data?.departments?.departments ?? [];
}

export async function createDepartment(
  apiBaseUrl: string,
  token: string,
  payload: { name: string; faculty: string },
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/departments/create`, {
    method: "POST",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: payload.name.trim(),
      faculty: payload.faculty.trim(),
    }),
  });

  const body = (await response.json().catch(() => ({}))) as ApiResponse;
  if (!response.ok) {
    throw new Error(getErrorMessage(body, "Unable to create department."));
  }
}

export async function updateDepartment(
  apiBaseUrl: string,
  token: string,
  departmentId: string,
  payload: { name: string; faculty?: string },
): Promise<void> {
  const response = await fetch(
    `${apiBaseUrl}/departments/update/${departmentId}`,
    {
      method: "PUT",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: payload.name.trim(),
        ...(payload.faculty?.trim() ? { faculty: payload.faculty.trim() } : {}),
      }),
    },
  );

  const body = (await response.json().catch(() => ({}))) as ApiResponse;
  if (!response.ok) {
    throw new Error(getErrorMessage(body, "Unable to update department."));
  }
}
