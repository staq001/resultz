export type CourseRecord = {
  id: string;
  title: string;
  courseCode: string;
  departmentId: string;
  units: number;
  semester: "Rain" | "Harmattan";
  level: number;
};

export type CourseSearchRecord = CourseRecord & {
  departmentName?: string;
};

type AvailableCoursesPayload = {
  department?: {
    id?: string;
    name?: string;
  };
  currentSession?: {
    id?: string;
    schoolSession?: string;
  };
  level?: number;
  semester?: "Rain" | "Harmattan";
  courses?: CourseRecord[];
};

type CoursesEnvelope = {
  page?: number;
  totalPages?: number;
  courses?: CourseRecord[];
};

type ApiResponse = {
  data?: {
    course?: CourseSearchRecord;
    courses?: CoursesEnvelope | CourseRecord[];
    department?: AvailableCoursesPayload["department"];
    currentSession?: AvailableCoursesPayload["currentSession"];
    level?: number;
    semester?: "Rain" | "Harmattan";
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

  const coursesPayload = payload.data?.courses;
  if (!coursesPayload || Array.isArray(coursesPayload)) return [];

  return coursesPayload.courses ?? [];
}

export async function fetchAvailableCoursesForStudent(
  apiBaseUrl: string,
  token: string,
): Promise<{
  departmentName: string;
  currentSessionId: string;
  currentSessionName: string;
  level: number;
  semester: "Rain" | "Harmattan";
  courses: Array<CourseRecord & { departmentName: string }>;
}> {
  const response = await fetch(`${apiBaseUrl}/courses/available`, {
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as ApiResponse;
  if (!response.ok) {
    throw new Error(
      getErrorMessage(payload, "Unable to fetch available courses."),
    );
  }

  const departmentName = payload.data?.department?.name ?? "";
  const currentSessionId = payload.data?.currentSession?.id ?? "";
  const currentSessionName = payload.data?.currentSession?.schoolSession ?? "";
  const level = payload.data?.level ?? 0;
  const semester = payload.data?.semester ?? "Rain";
  const coursesPayload = payload.data?.courses;
  const courses = (Array.isArray(coursesPayload) ? coursesPayload : []).map(
    (course) => ({
    ...course,
    departmentName,
    }),
  );

  return {
    departmentName,
    currentSessionId,
    currentSessionName,
    level,
    semester,
    courses,
  };
}

export async function searchCourseByCode(
  apiBaseUrl: string,
  token: string,
  courseCode: string,
  semester?: "Rain" | "Harmattan",
): Promise<CourseSearchRecord> {
  const params = new URLSearchParams({
    courseCode: courseCode.trim().toUpperCase(),
  });
  if (semester) params.set("semester", semester);

  const response = await fetch(
    `${apiBaseUrl}/courses-registrations/course?${params.toString()}`,
    {
      cache: "no-store",
      referrerPolicy: "no-referrer",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const payload = (await response.json().catch(() => ({}))) as ApiResponse;
  if (!response.ok || !payload.data?.course) {
    throw new Error(getErrorMessage(payload, "Course not found."));
  }

  return payload.data.course;
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
