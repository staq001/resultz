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
