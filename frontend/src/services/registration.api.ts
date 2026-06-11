type RegisterCoursePayload = {
  courseCode: string;
  semesterId: string;
};

export type RegistrationRow = {
  id: string;
  userId: string;
  courseId: string;
  semester: string;
  registeredAt?: string;
  courseCode?: string;
  title?: string;
  units?: number;
  courseSemester?: "Rain" | "Harmattan";
  level?: number;
  departmentName?: string;
};

type RegistrationResponse = {
  data?: {
    registeredCourses?: RegistrationRow[];
  };
  message?: string;
  error?: string;
};

function getRegistrationErrorMessage(
  payload: RegistrationResponse,
  fallback: string,
) {
  return payload.error ?? payload.message ?? fallback;
}

export async function registerStudentCourse(
  apiBaseUrl: string,
  token: string,
  payload: RegisterCoursePayload,
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/courses-registrations/register`, {
    method: "POST",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      courseCode: payload.courseCode.trim().toUpperCase(),
      semesterId: payload.semesterId.trim(),
    }),
  });

  const body = (await response.json().catch(() => ({}))) as RegistrationResponse;
  if (!response.ok) {
    throw new Error(
      getRegistrationErrorMessage(body, "Unable to register course."),
    );
  }
}

export async function fetchRegisteredCoursesBySemester(
  apiBaseUrl: string,
  token: string,
  semester: string,
): Promise<RegistrationRow[]> {
  const response = await fetch(
    `${apiBaseUrl}/courses-registrations/semester?semester=${encodeURIComponent(
      semester,
    )}`,
    {
      cache: "no-store",
      referrerPolicy: "no-referrer",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const payload = (await response.json().catch(() => ({}))) as RegistrationResponse;
  if (!response.ok) {
    const message = getRegistrationErrorMessage(
      payload,
      "Unable to fetch registered courses.",
    );
    if (message.toLowerCase().includes("no courses found")) {
      return [];
    }
    throw new Error(message);
  }

  return payload.data?.registeredCourses ?? [];
}

export async function updateRegisteredCourse(
  apiBaseUrl: string,
  token: string,
  registeredCourseId: string,
  payload: RegisterCoursePayload,
): Promise<void> {
  const response = await fetch(
    `${apiBaseUrl}/courses-registrations/${registeredCourseId}`,
    {
      method: "PATCH",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        courseCode: payload.courseCode.trim().toUpperCase(),
        semester: payload.semesterId.trim(),
      }),
    },
  );

  const body = (await response.json().catch(() => ({}))) as RegistrationResponse;
  if (!response.ok) {
    throw new Error(
      getRegistrationErrorMessage(body, "Unable to update registered course."),
    );
  }
}

export async function dropRegisteredCourse(
  apiBaseUrl: string,
  token: string,
  registeredCourseId: string,
): Promise<void> {
  const response = await fetch(
    `${apiBaseUrl}/courses-registrations/${registeredCourseId}`,
    {
      method: "DELETE",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const body = (await response.json().catch(() => ({}))) as RegistrationResponse;
  if (!response.ok) {
    throw new Error(
      getRegistrationErrorMessage(body, "Unable to drop registered course."),
    );
  }
}
