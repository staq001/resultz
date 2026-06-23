import csv from "fast-csv";
import { db } from "../db/mysql";
import { logger } from "./logger";
import type {
  CsvRow,
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

const BATCH_SIZE = 500;

export async function parser(
  file: { createReadStream: () => NodeJS.ReadableStream },
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
    options && options.courseCode && options.semesterId
      ? await buildScoreImportContext(options.courseCode, options.semesterId)
      : null;

  for await (const row of csvParser) {
    stats.processed++;

    switch (row.type) {
      case "departments": {
        const department = await transformDepartment(row);

        if (!department) {
          stats.skipped++;
          break;
        }

        departmentBatch.push(department);

        if (departmentBatch.length >= BATCH_SIZE) {
          stats.inserted.departments += await flushDepartments(departmentBatch);
        }

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

        courseBatch.push(course);

        if (courseBatch.length >= BATCH_SIZE) {
          stats.inserted.courses += await flushCourses(courseBatch);
        }

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

        scoreBatch.push(score);

        if (scoreBatch.length >= BATCH_SIZE) {
          stats.inserted.scores += await flushScores(scoreBatch);
        }

        break;
      }

      default:
        stats.skipped++;
        break;
    }
  }

  stats.inserted.departments += await flushDepartments(departmentBatch);
  stats.inserted.courses += await flushCourses(courseBatch);
  stats.inserted.scores += await flushScores(scoreBatch);

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

  return {
    courseId: course.id,
    semesterId,
  };
}

async function flushDepartments(batch: NewDepartment[]) {
  if (batch.length === 0) {
    return 0;
  }

  const count = batch.length;

  try {
    await db.insert(departments).values(batch);
    batch.length = 0;
    return count;
  } catch (e: any) {
    logger.error(
      `Error inserting departments batch into database: ${e.message}`,
    );
    throw e;
  }
}

async function flushCourses(batch: NewCourse[]) {
  if (batch.length === 0) {
    return 0;
  }

  const count = batch.length;

  try {
    await db.insert(courses).values(batch);
    batch.length = 0;
    return count;
  } catch (e: any) {
    logger.error(`Error inserting courses batch into database: ${e.message}`);
    throw e;
  }
}

async function flushScores(batch: NewScore[]) {
  if (batch.length === 0) {
    return 0;
  }

  const count = batch.length;

  try {
    await db.insert(scoreCourses).values(batch);
    batch.length = 0;
    return count;
  } catch (e: any) {
    logger.error(`Error inserting scores batch into database: ${e.message}`);
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

  const [registeredUser] = await db
    .select({
      registrationId: courseRegistrations.id,
      userId: users.id,
      semester: courseRegistrations.semester,
    })
    .from(courseRegistrations)
    .innerJoin(users, eq(courseRegistrations.userId, users.id))
    .where(
      and(
        eq(courseRegistrations.courseId, context.courseId),
        eq(courseRegistrations.semester, context.semesterId),
        eq(users.matricNo, matric_no),
      ),
    );

  if (!registeredUser) {
    return null;
  }

  const [existing] = await db
    .select({ id: scoreCourses.id })
    .from(scoreCourses)
    .where(
      and(
        eq(scoreCourses.registeredCourseId, registeredUser.registrationId),
        eq(scoreCourses.semester, context.semesterId),
        eq(scoreCourses.userId, registeredUser.userId),
      ),
    );

  if (existing) {
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
