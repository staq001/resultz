export type CourseRecord = {
  id: string;
  title: string;
  courseCode: string;
  departmentId: string;
  units: number;
  semester: "Rain" | "Harmattan";
  level: number;
};

type CoursesEnvelope = {
  page?: number;
  totalPages?: number;
  courses?: CourseRecord[];
};

type ApiResponse = {
  data?: {
    course?: CourseRecord;
    courses?: CoursesEnvelope;
  };
  message?: string;
  error?: string;
};

function getErrorMessage(payload: ApiResponse, fallback: string): string {
  return payload.error ?? payload.message ?? fallback;
}

export async function fetchCoursesByDepartment(
  apiBaseUrl: string,
  token: string,
  departmentId: string,
  options?: {
    semester?: "Rain" | "Harmattan";
    level?: number;
  },
): Promise<CourseRecord[]> {
  const params = new URLSearchParams({ limit: "100", page: "1" });
  if (options?.semester) {
    params.set("semester", options.semester);
  }
  if (typeof options?.level === "number" && !Number.isNaN(options.level)) {
    params.set("level", String(options.level));
  }

  const response = await fetch(
    `${apiBaseUrl}/courses/department/${departmentId}?${params.toString()}`,
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
    throw new Error(getErrorMessage(payload, "Unable to fetch courses."));
  }

  return payload.data?.courses?.courses ?? [];
}

export async function createCourse(
  apiBaseUrl: string,
  token: string,
  departmentId: string,
  payload: {
    courseCode: string;
    title: string;
    units: number;
    semester: "Rain" | "Harmattan";
    level: number;
  },
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/courses/create/${departmentId}`, {
    method: "POST",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      courseCode: payload.courseCode.trim().toUpperCase(),
      title: payload.title.trim(),
      units: payload.units,
      semester: payload.semester,
      level: payload.level,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as ApiResponse;
  if (!response.ok) {
    throw new Error(getErrorMessage(body, "Unable to create course."));
  }
}

export async function updateCourse(
  apiBaseUrl: string,
  token: string,
  courseId: string,
  payload: {
    courseCode: string;
    title: string;
    units: number;
    semester: "Rain" | "Harmattan";
    level: number;
  },
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/courses/update/${courseId}`, {
    method: "PATCH",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      courseCode: payload.courseCode.trim().toUpperCase(),
      title: payload.title.trim(),
      units: payload.units,
      semester: payload.semester,
      level: payload.level,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as ApiResponse;
  if (!response.ok) {
    throw new Error(getErrorMessage(body, "Unable to update course."));
  }
}
