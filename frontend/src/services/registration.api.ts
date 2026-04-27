type RegisterCoursePayload = {
  courseCode: string;
  semester: string;
};

type RegistrationRow = {
  id: string;
  userId: string;
  courseId: string;
  semester: string;
  registeredAt?: string;
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
      semester: payload.semester.trim(),
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
