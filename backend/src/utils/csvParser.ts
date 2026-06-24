import csv from "fast-csv";
import { db } from "../db/mysql";
import { logger } from "./logger";
import type {
  CsvRow,
  CsvRowType,
  ImportStats,
  NewCourse,
  NewDepartment,
  NewScore,
  parserOptions,
  ScoreImportContext,
} from "@/types";
import {
  courseRegistrations,
  courses,
  departments,
  scoreCourses,
  users,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { grading } from ".";
import { NotFound } from "./error";

export async function parser(
  file: { createReadStream: () => NodeJS.ReadableStream },
  type: CsvRowType,
  options?: parserOptions,
): Promise<ImportStats> {
  const csvParser = csv.parse<CsvRow, CsvRow>({
    headers: true,
    trim: true,
  });

  file.createReadStream().pipe(csvParser);

  const departmentBatch: NewDepartment[] = [];
  const courseBatch: NewCourse[] = [];
  const scoreBatch: NewScore[] = [];

  const stats: ImportStats = {
    processed: 0,
    skipped: 0,
    inserted: {
      courses: 0,
      departments: 0,
      scores: 0,
    },
  };

  const scoreContext =
    type === "scores" && options?.courseCode && options.semesterId
      ? await buildScoreImportContext(options.courseCode, options.semesterId)
      : null;
  const departmentKeys = new Set<string>();
  const courseCodes = new Set<string>();
  const scoreKeys = new Set<string>();

  for await (const row of csvParser) {
    stats.processed++;

    switch (type) {
      case "departments": {
        const department = await transformDepartment(row);

        if (!department) {
          stats.skipped++;
          break;
        }

        const departmentKey = buildDepartmentKey(department);
        if (departmentKeys.has(departmentKey)) {
          stats.skipped++;
          break;
        }

        departmentKeys.add(departmentKey);
        departmentBatch.push(department);

        break;
      }

      case "courses": {
        if (!options?.createdBy) {
          stats.skipped++;
          break;
        }

        const course = await transformCourse(
          row,
          row.department,
          options.createdBy,
        );

        if (!course) {
          stats.skipped++;
          break;
        }

        if (courseCodes.has(course.courseCode)) {
          stats.skipped++;
          break;
        }

        courseCodes.add(course.courseCode);
        courseBatch.push(course);

        break;
      }

      case "scores": {
        if (!scoreContext) {
          stats.skipped++;
          break;
        }

        const score = await transformScore(row, scoreContext);

        if (!score) {
          stats.skipped++;
          break;
        }

        const scoreKey = buildScoreKey(score.registeredCourseId, score.userId);
        if (scoreKeys.has(scoreKey)) {
          stats.skipped++;
          break;
        }

        scoreKeys.add(scoreKey);
        scoreContext.existingScoreSet.add(scoreKey);
        scoreBatch.push(score);

        break;
      }

      default:
        stats.skipped++;
        break;
    }
  }

  stats.inserted = await persistImport({
    departments: departmentBatch,
    courses: courseBatch,
    scores: scoreBatch,
  });

  return stats;
}

async function buildScoreImportContext(
  courseCode: string,
  semesterId: string,
): Promise<ScoreImportContext> {
  const course = await db.query.courses.findFirst({
    where: eq(courses.courseCode, courseCode),
  });

  if (!course) {
    throw new NotFound("Course not found");
  }

  const registrations = await db
    .select({
      registrationId: courseRegistrations.id,
      userId: users.id,
      matricNo: users.matricNo,
      semester: courseRegistrations.semester,
    })
    .from(courseRegistrations)
    .innerJoin(users, eq(courseRegistrations.userId, users.id))
    .where(
      and(
        eq(courseRegistrations.courseId, course.id),
        eq(courseRegistrations.semester, semesterId),
      ),
    );

  const existingScores = await db
    .select({
      registeredCourseId: scoreCourses.registeredCourseId,
      userId: scoreCourses.userId,
    })
    .from(scoreCourses)
    .where(eq(scoreCourses.semester, semesterId));

  return {
    courseId: course.id,
    semesterId,
    registrationMap: new Map(
      registrations
        .filter((registration) => registration.matricNo)
        .map((registration) => [registration.matricNo as string, registration]),
    ),
    existingScoreSet: new Set(
      existingScores.map((score) =>
        buildScoreKey(score.registeredCourseId, score.userId),
      ),
    ),
  };
}

async function persistImport(batch: {
  departments: NewDepartment[];
  courses: NewCourse[];
  scores: NewScore[];
}): Promise<ImportStats["inserted"]> {
  const inserted = {
    departments: batch.departments.length,
    courses: batch.courses.length,
    scores: batch.scores.length,
  };

  try {
    await db.transaction(async (tx) => {
      if (batch.departments.length > 0) {
        await tx.insert(departments).values(batch.departments);
      }

      if (batch.courses.length > 0) {
        await tx.insert(courses).values(batch.courses);
      }

      if (batch.scores.length > 0) {
        await tx.insert(scoreCourses).values(batch.scores);
      }
    });

    return inserted;
  } catch (e: any) {
    logger.error(`Error persisting CSV import transaction: ${e.message}`);
    throw e;
  }
}

async function transformDepartment(row: CsvRow): Promise<NewDepartment | null> {
  const { name, faculty } = row;

  if (!name || !faculty) {
    return null;
  }

  const [dept] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(and(eq(departments.name, name), eq(departments.faculty, faculty)));

  if (dept) {
    return null;
  }

  return { name, faculty };
}

function buildDepartmentKey(department: NewDepartment) {
  return `${department.name.trim().toLowerCase()}:${department.faculty.trim().toLowerCase()}`;
}

async function transformCourse(
  row: CsvRow,
  departmentName: string | undefined,
  createdBy: string,
): Promise<NewCourse | null> {
  const { courseCode, semester, units, title, level } = row;

  if (
    !courseCode ||
    !units ||
    !title ||
    !semester ||
    !level ||
    !departmentName
  ) {
    return null;
  }

  const parsedUnits = Number(units);
  const parsedLevel = Number(level);

  if (Number.isNaN(parsedUnits) || Number.isNaN(parsedLevel)) {
    return null;
  }

  if (semester !== "Rain" && semester !== "Harmattan") {
    return null;
  }

  const [dept] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.name, departmentName));

  if (!dept) {
    return null;
  }

  const [existing] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.courseCode, courseCode));

  if (existing) {
    return null;
  }

  return {
    courseCode,
    semester,
    units: parsedUnits,
    title,
    departmentId: dept.id,
    level: parsedLevel,
    createdBy,
  };
}

async function transformScore(
  row: CsvRow,
  context: ScoreImportContext,
): Promise<NewScore | null> {
  const { matric_no, testScore, examScore } = row;

  if (!matric_no || !testScore || !examScore) {
    return null;
  }

  const test = Number(testScore);
  const exam = Number(examScore);

  if (Number.isNaN(test) || Number.isNaN(exam)) {
    return null;
  }

  const registeredUser = context.registrationMap.get(matric_no);

  if (!registeredUser) {
    return null;
  }

  const scoreKey = buildScoreKey(
    registeredUser.registrationId,
    registeredUser.userId,
  );

  if (context.existingScoreSet.has(scoreKey)) {
    return null;
  }

  return {
    registeredCourseId: registeredUser.registrationId,
    testScore: test,
    examScore: exam,
    grade: grading(exam, test),
    semester: registeredUser.semester,
    userId: registeredUser.userId,
  };
}

function buildScoreKey(registeredCourseId: string, userId: string) {
  return `${registeredCourseId}:${userId}`;
}
