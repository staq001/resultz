type RegisteredCourseUserResponse = {
  data?: {
    course?: {
      id?: string;
      courseCode?: string;
      title?: string;
    };
    registeredUsers?: Array<{
      registrationId: string;
      userId: string;
      name: string;
      matricNo: string;
      email: string;
      semester: string;
      scoreId?: string | null;
      testScore?: number | null;
      examScore?: number | null;
    }>;
  };
  message?: string;
  error?: string;
};

type ScoreResponse = {
  data?: {
    scoreId?: string;
  };
  message?: string;
  error?: string;
};

export type RegisteredCourseUserRow = {
  registrationId: string;
  userId: string;
  name: string;
  matricNo: string;
  email: string;
  semester: string;
  scoreId?: string;
  testScore?: number;
  examScore?: number;
};

export async function fetchRegisteredUsersForCourse(
  apiBaseUrl: string,
  token: string,
  courseCode: string,
  semester: string,
): Promise<{
  course: { id?: string; courseCode?: string; title?: string };
  registeredUsers: RegisteredCourseUserRow[];
}> {
  const response = await fetch(
    `${apiBaseUrl}/courses-registrations/course/${encodeURIComponent(
      courseCode,
    )}/users?semester=${encodeURIComponent(semester)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const payload = (await response
    .json()
    .catch(() => ({}))) as RegisteredCourseUserResponse;

  if (!response.ok) {
    throw new Error(
      payload.error ??
        payload.message ??
        "Unable to fetch registered users for this course.",
    );
  }

  return {
    course: payload.data?.course ?? {},
    registeredUsers:
      payload.data?.registeredUsers?.map((row) => ({
        registrationId: row.registrationId,
        userId: row.userId,
        name: row.name,
        matricNo: row.matricNo,
        email: row.email,
        semester: row.semester,
        ...(row.scoreId ? { scoreId: row.scoreId } : {}),
        ...(typeof row.testScore === "number"
          ? { testScore: row.testScore }
          : {}),
        ...(typeof row.examScore === "number"
          ? { examScore: row.examScore }
          : {}),
      })) ?? [],
  };
}

async function submitScoreRequest(
  url: string,
  token: string,
  testScore: number,
  examScore: number,
  method: "POST" | "PATCH",
): Promise<string | undefined> {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ testScore, examScore }),
  });

  const payload = (await response.json().catch(() => ({}))) as ScoreResponse;
  if (!response.ok) {
    throw new Error(
      payload.error ?? payload.message ?? "Unable to save score.",
    );
  }

  return payload.data?.scoreId;
}

export async function createCourseScore(
  apiBaseUrl: string,
  token: string,
  registeredCourseId: string,
  testScore: number,
  examScore: number,
): Promise<string | undefined> {
  return submitScoreRequest(
    `${apiBaseUrl}/scores/input/${registeredCourseId}`,
    token,
    testScore,
    examScore,
    "POST",
  );
}

export async function updateCourseScore(
  apiBaseUrl: string,
  token: string,
  scoreId: string,
  testScore: number,
  examScore: number,
): Promise<void> {
  await submitScoreRequest(
    `${apiBaseUrl}/scores/update/${scoreId}`,
    token,
    testScore,
    examScore,
    "PATCH",
  );
}
