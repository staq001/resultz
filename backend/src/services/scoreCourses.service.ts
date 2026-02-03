import { and, eq } from "drizzle-orm";
import { db } from "@/db/mysql";
import { courseRegistrations, scoreCourses } from "@/db/schema";
import { BadRequest, InternalServerError, NotFound } from "@/utils/error";
import { logger } from "@/utils/logger";
import type { FindCoursesBySemester } from "@/types";

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

        const courseScoreId = await tx
          .insert(scoreCourses)
          .values({
            userId: registeredCourse.userId,
            score,
            registeredCourseId,
            semester: registeredCourse.semester,
            year: registeredCourse.year,
          })
          .$returningId();

        return { courseScoreId, registeredCourse };
      });
    } catch (e) {
      logger.error(`Unable to score course , ${e}`);
      if (e instanceof BadRequest) throw e;
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Unable to score course");
    }
  }

  async updateCourseScore(score: number, courseScoreId: string) {
    try {
      return await db.transaction(async (tx) => {
        const [courseScore] = await tx
          .update(scoreCourses)
          .set({ score })
          .where(eq(scoreCourses.id, courseScoreId));

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
        const scoredCourse = await tx.query.scoreCourses.findFirst({
          where: eq(scoreCourses.id, scoredCourseId),
        });

        if (!scoredCourse)
          throw new NotFound("Invalid ID. Course score doesnt exist.");
        return scoredCourse;
      });
    } catch (e) {
      logger.error(`Error fetching score course, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Error fetching course score.");
    }
  }

  async getScoresBySemesterOrYear(
    userId: string,
    year: number,
    semester?: number,
  ) {
    try {
      if (semester && year) {
        return this.getAllScoredCoursesBySemsester({ semester, year }, userId);
      }
      return this.getAllScoredCoursesByYear(userId, year);
    } catch (e) {
      logger.error(`Couldnt fetch scores, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Couldnt fetch scores");
    }
  }

  private async getAllScoredCoursesBySemsester(
    payload: FindCoursesBySemester,
    userId: string,
  ) {
    const { semester, year } = payload;

    try {
      const allCourses = await db
        .select()
        .from(scoreCourses)
        .where(
          and(
            eq(scoreCourses.semester, semester),
            eq(scoreCourses.year, year),
            eq(scoreCourses.userId, userId),
          ),
        );

      if (!allCourses || allCourses.length === 0)
        throw new NotFound("No scores found");

      return allCourses;
    } catch (e) {
      throw e;
    }
  }

  private async getAllScoredCoursesByYear(userId: string, year: number) {
    try {
      const allCourses = await db
        .select()
        .from(scoreCourses)
        .where(
          and(eq(scoreCourses.userId, userId), eq(scoreCourses.year, year)),
        );

      if (!allCourses || allCourses.length === 0)
        throw new NotFound("No scores found");

      return allCourses;
    } catch (e) {
      throw e;
    }
  }
}
