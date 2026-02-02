import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/mysql";
import { courseRegistrations, scoreCourses } from "../db/schema";
import { BadRequest, InternalServerError, NotFound } from "../utils/error";
import { logger } from "../utils/logger";
import type { FindCoursesBySemester } from "../types";

export class Scores {
  async scoreCourse(score: number, registeredCourseId: string) {
    try {
      return await db.transaction(async (tx) => {
        const registeredCourse = await tx.query.courseRegistrations.findFirst({
          where: eq(courseRegistrations.id, registeredCourseId),
        });
        if (!registeredCourse)
          throw new NotFound("Invalid ID. Registered course not found");

        const existing = await tx.query.scoreCourses.findFirst({
          where: eq(scoreCourses.registeredCourseId, registeredCourseId),
        });

        if (existing) throw new BadRequest("This course has been scored!");

        const courseScore = await tx
          .insert(scoreCourses)
          .values({
            score,
            registeredCourseId,
            semester: registeredCourse.semester,
            year: registeredCourse.year,
          })
          .$returningId();

        return { courseScore, registeredCourse };
      });
    } catch (e) {
      logger.error(`Unable to score course , ${e}`);
      if (e instanceof BadRequest) throw e;
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Unable to score course");
    }
  }

  async updateCourseScore(score: number, scoredCourseId: string) {
    try {
      return await db.transaction(async (tx) => {
        const [courseScore] = await tx
          .update(scoreCourses)
          .set({ score })
          .where(eq(scoreCourses.id, scoredCourseId));

        if (!courseScore || courseScore.affectedRows === 0)
          throw new NotFound("Invalid ID. Course score doesnt exist.");
      });
    } catch (e: any) {
      logger.error(`Unable to update score, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Unable to update score");
    }
  }

  async fetchCourseScore(scoredCourseId: string) {
    try {
      return await db.transaction(async (tx) => {
        const scoreCourse = await tx.query.scoreCourses.findFirst({
          where: eq(scoreCourses.id, scoredCourseId),
        });

        if (!scoreCourse)
          throw new NotFound("Invalid ID. Course score doesnt exist.");
        return scoreCourse;
      });
    } catch (e) {
      logger.error(`Error fetching score course, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Error fetching course score.");
    }
  }

  async getAllScoredCoursesBySemsester(
    payload: FindCoursesBySemester,
    page: number = 1,
    limit: number = 10,
  ) {
    const { semester, year } = payload;

    page = page || 1;
    limit = limit || 10;

    const skip = (page - 1) * limit;

    try {
      const [total] = await db
        .select({ count: sql<number>`count(*)` })
        .from(scoreCourses)
        .where(
          and(eq(scoreCourses.semester, semester), eq(scoreCourses.year, year)),
        );

      const count = total?.count;
      if (!count || count === 0) throw new NotFound("No scores found");

      const allCourses = await db
        .select()
        .from(scoreCourses)
        .where(
          and(eq(scoreCourses.semester, semester), eq(scoreCourses.year, year)),
        )
        .limit(limit)
        .offset(skip);

      if (!allCourses || allCourses.length === 0)
        throw new NotFound("No scores found");

      return {
        totalPages: Math.ceil(count / limit),
        page,
        courses: allCourses,
      };
    } catch (e) {
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Error fetching scores");
    }
  }

  async getAllScoredCoursesByYear(year: number, limit: number, page: number) {
    page = page || 1;
    limit = limit || 10;

    const skip = (page - 1) * limit;

    try {
      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(scoreCourses)
        .where(and(eq(scoreCourses.year, year)));

      const count = total[0]?.count;
      if (!count || count === 0) throw new NotFound("No scores found");

      const allCourses = await db
        .select()
        .from(scoreCourses)
        .where(and(eq(scoreCourses.year, year)))
        .limit(limit)
        .offset(skip);

      if (!allCourses || allCourses.length === 0)
        throw new NotFound("No scores found");

      return {
        totalPages: Math.ceil(count / limit),
        page,
        courses: allCourses,
      };
    } catch (e) {
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Error fetching scores");
    }
  }
}
