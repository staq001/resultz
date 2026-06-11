type StudentScoresResponse = {
  data?: {
    scores?: StudentScoreRecord[];
  };
  message?: string;
  error?: string;
};

type ComprehensiveReportResponse = {
  data?: {
    report?: ComprehensiveReport;
  };
  message?: string;
  error?: string;
};

export type StudentScoreRecord = {
  id?: string;
  scoreId?: string;
  courseCode?: string;
  courseTitle?: string;
  title?: string;
  units?: number;
  unit?: number;
  semester?: string;
  testScore?: number;
  examScore?: number;
  test_score?: number;
  exam_score?: number;
  grade?: string;
};

export type ComprehensiveReportCourse = {
  scoreId: string;
  courseCode: string;
  courseTitle: string;
  units: number;
  testScore: number;
  examScore: number;
  totalScore: number;
  status: string;
  gradePoint: number;
  creditPoint: number;
};

export type ComprehensiveReportSemester = {
  semesterId: string;
  sessionName: string;
  semesterTerm: string;
  semesterLabel: string;
  yearLabel: string;
  courses: ComprehensiveReportCourse[];
  totalUnits: number;
  totalCreditPoints: number;
  gpa: number;
  cumulativeUnits: number;
  cumulativeCreditPoints: number;
  cgpa: number;
};

export type ComprehensiveReport = {
  student: {
    id: string;
    name: string;
    matricNo?: string | null;
    department?: string | null;
    entryYear?: number | null;
    faculty?: string | null;
    isRusticated?: boolean | null;
    isGraduated?: boolean | null;
  };
  semesters: ComprehensiveReportSemester[];
  summary: {
    completedSemesters: number;
    totalUnits: number;
    totalCreditPoints: number;
    cgpa: number;
    outstandingCourses: string;
    absentSemesters: string;
    disciplinaryStatus: string;
    deferments: string;
    senateStatus: string;
    standing: string;
    classOfDegree: string;
  };
  generatedAt: string;
};

function toNumber(value: number | string | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? undefined : numericValue;
  }
  return undefined;
}

function normalizeScore(record: StudentScoreRecord): StudentScoreRecord {
  const units = toNumber(record.units) ?? toNumber(record.unit) ?? 0;
  const testScore =
    toNumber(record.testScore) ?? toNumber(record.test_score) ?? 0;
  const examScore =
    toNumber(record.examScore) ?? toNumber(record.exam_score) ?? 0;

  return {
    ...record,
    courseTitle: record.courseTitle ?? record.title ?? "Not available",
    units,
    testScore,
    examScore,
    grade: record.grade ?? "-",
  };
}

export async function fetchStudentScoresBySemester(
  apiBaseUrl: string,
  token: string,
  semesterId: string,
): Promise<StudentScoreRecord[]> {
  const response = await fetch(
    `${apiBaseUrl}/scores/semester?semester=${encodeURIComponent(semesterId)}`,
    {
      cache: "no-store",
      referrerPolicy: "no-referrer",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const payload = (await response
    .json()
    .catch(() => ({}))) as StudentScoresResponse;

  if (!response.ok) {
    const message =
      payload.error ?? payload.message ?? "Unable to fetch student results.";
    if (message.toLowerCase().includes("no scores found")) return [];
    throw new Error(message);
  }

  return payload.data?.scores?.map(normalizeScore) ?? [];
}

export async function fetchStudentComprehensiveReport(
  apiBaseUrl: string,
  token: string,
): Promise<ComprehensiveReport | null> {
  const response = await fetch(`${apiBaseUrl}/scores/comprehensive-report`, {
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response
    .json()
    .catch(() => ({}))) as ComprehensiveReportResponse;

  if (!response.ok) {
    const message =
      payload.error ??
      payload.message ??
      "Unable to fetch comprehensive report.";
    if (message.toLowerCase().includes("no scores found")) return null;
    throw new Error(message);
  }

  return payload.data?.report ?? null;
}
