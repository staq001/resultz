import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/mysql";
import { courseRegistrations, courses, users } from "../db/schema";
import { BadRequest, InternalServerError, NotFound } from "../utils/error";
import type {
  CheckRegisteredCourses,
  FindCoursesBySemester,
  RegisterCourse,
} from "../types";
import { logger } from "../utils/logger";

export class Registration {
  async registerCourse(params: RegisterCourse) {
    try {
      return await db.transaction(async (tx) => {
        const { userId, courseId, semester, year } = params;

        const user = await tx.query.users.findFirst({
          where: eq(users.id, userId),
        });

        if (!user) throw new NotFound("User not found");

        const course = await tx.query.courses.findFirst({
          where: eq(courses.id, courseId),
        });

        if (!course) throw new NotFound("Course not found");

        const checkNoOfRegisteredCourses =
          await this.checkNumberOfRegisteredCourses({
            userId,
            semester,
            year,
          });
        if (checkNoOfRegisteredCourses)
          throw new BadRequest(
            "User cannot register more than 12 courses in a semester",
          );

        const existing = await tx.query.courseRegistrations.findFirst({
          where: and(
            eq(courseRegistrations.userId, userId),
            eq(courseRegistrations.courseId, courseId),
            eq(courseRegistrations.semester, semester),
            eq(courseRegistrations.year, year),
          ),
        });
        if (existing)
          throw new BadRequest("User already registered for this course");

        await tx.insert(courseRegistrations).values({
          userId,
          courseId,
          semester,
          year,
        });
      });
    } catch (e) {
      logger.error(`Unable to register course , ${e}`);
      if (e instanceof BadRequest) throw e;
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Unable to register course");
    }
  }

  async fetchRegisteredCourse(registeredCourseId: string, userId: string) {
    try {
      const registeredCourse = await db.query.courseRegistrations.findFirst({
        where: and(
          eq(courseRegistrations.userId, userId),
          eq(courseRegistrations.id, registeredCourseId),
        ),
      });
      if (!registeredCourse) throw new NotFound("Registered course not found");
      return registeredCourse;
    } catch (e) {
      logger.error(`Unable to fetch registered course, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Unable to fetch registered course");
    }
  }

  async findRegisteredCoursesBySemester(
    userId: string,
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
        .from(courseRegistrations)
        .where(
          and(
            eq(courseRegistrations.semester, semester),
            eq(courseRegistrations.userId, userId),
            eq(courseRegistrations.year, year),
          ),
        );

      const count = total?.count;
      if (!count || count === 0) throw new NotFound("No courses found");

      const allCourses = await db
        .select()
        .from(courseRegistrations)
        .where(
          and(
            eq(courseRegistrations.semester, semester),
            eq(courseRegistrations.year, year),
          ),
        )
        .limit(limit)
        .offset(skip);

      if (!allCourses || allCourses.length === 0)
        throw new NotFound("No courses found");

      return {
        totalPages: Math.ceil(count / limit),
        page,
        courses: allCourses,
      };
    } catch (e) {
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Error fetching all courses");
    }
  }

  async findRegisteredCoursesByYear(
    userId: string,
    year: number,
    limit: number,
    page: number,
  ) {
    page = page || 1;
    limit = limit || 10;

    const skip = (page - 1) * limit;

    try {
      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(courseRegistrations)
        .where(
          and(
            eq(courseRegistrations.userId, userId),
            eq(courseRegistrations.year, year),
          ),
        );

      const count = total[0]?.count;
      if (!count || count === 0) throw new NotFound("No courses found");

      const allCourses = await db
        .select()
        .from(courseRegistrations)
        .where(
          and(
            eq(courseRegistrations.userId, userId),
            eq(courseRegistrations.year, year),
          ),
        )
        .limit(limit)
        .offset(skip);

      if (!allCourses || allCourses.length === 0)
        throw new NotFound("No courses found");

      return {
        totalPages: Math.ceil(count / limit),
        page,
        courses: allCourses,
      };
    } catch (e) {
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Error fetching all courses");
    }
  }

  private async checkNumberOfRegisteredCourses(params: CheckRegisteredCourses) {
    const { userId, semester, year } = params;

    return await db.transaction(async (tx) => {
      const [total] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(courseRegistrations)
        .where(
          and(
            eq(courseRegistrations.userId, userId),
            eq(courseRegistrations.semester, semester),
            eq(courseRegistrations.year, year),
          ),
        );

      const count = total?.count;
      if (count && count >= 12) return true;

      return false;
    });
  }
}
