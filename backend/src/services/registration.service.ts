import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "@/db/mysql";
import { courseRegistrations, courses, users } from "@/db/schema";
import { BadRequest, InternalServerError, NotFound } from "@/utils/error";
import type {
  CheckRegisteredCourses,
  FindCoursesBySemester,
  RegisterCourse,
} from "../types";
import { logger } from "@/utils/logger";

export class Registration {
  async registerCourse(params: RegisterCourse) {
    try {
      return await db.transaction(async (tx) => {
        const { userId, courseCode, semester, year } = params;

        const user = await tx.query.users.findFirst({
          where: eq(users.id, userId),
        });
        if (!user) throw new NotFound("User not found");

        const courseDetails = await this.findCourseByCourseCode(courseCode);
        if (!courseDetails) throw new NotFound("Course not found");

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
            eq(courseRegistrations.courseId, courseDetails.id),
            eq(courseRegistrations.semester, semester),
            eq(courseRegistrations.year, year),
          ),
        });
        if (existing)
          throw new BadRequest("User already registered for this course");

        await tx.insert(courseRegistrations).values({
          userId,
          courseId: courseDetails.id,
          semester,
          year,
        });

        return { course: courseDetails.courseCode };
      });
    } catch (e) {
      logger.error(`Unable to register course , ${e}`);
      if (e instanceof BadRequest) throw e;
      if (e instanceof NotFound) throw e;
      if (this.isDuplicateEntryError(e)) {
        throw new BadRequest(
          "User already registered for this course in the selected semester and year",
        );
      }
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

  async findRegisteredCoursesBySemesterOrYear(
    userId: string,
    year: number,
    semester?: number,
  ) {
    try {
      if (semester)
        return this.findRegisteredCoursesBySemester(userId, { semester, year });

      return this.findRegisteredCoursesByYear(userId, year);
    } catch (e) {
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Error fetching all courses");
    }
  }

  private async findRegisteredCoursesBySemester(
    userId: string,
    payload: FindCoursesBySemester,
  ) {
    const { semester, year } = payload;

    try {
      const allCourses = await db
        .select()
        .from(courseRegistrations)
        .where(
          and(
            eq(courseRegistrations.semester, semester),
            eq(courseRegistrations.userId, userId),
            eq(courseRegistrations.year, year),
          ),
        );

      if (!allCourses || allCourses.length === 0)
        throw new NotFound("No courses found");

      return allCourses;
    } catch (e) {
      throw e;
    }
  }

  private async findRegisteredCoursesByYear(userId: string, year: number) {
    try {
      const allCourses = await db
        .select()
        .from(courseRegistrations)
        .where(
          and(
            eq(courseRegistrations.userId, userId),
            eq(courseRegistrations.year, year),
          ),
        );

      if (!allCourses || allCourses.length === 0)
        throw new NotFound("No courses found");

      return allCourses;
    } catch (e) {
      throw e;
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

  private isDuplicateEntryError(error: unknown) {
    if (!error || typeof error !== "object") return false;

    const mysqlError = error as {
      code?: string;
      errno?: number;
      message?: string;
    };
    return (
      mysqlError.code === "ER_DUP_ENTRY" ||
      mysqlError.errno === 1062 ||
      Boolean(mysqlError.message?.includes("Duplicate entry"))
    );
  }

  async findCourseByCourseCode(courseCode: string) {
    try {
      const course = await db.query.courses.findFirst({
        where: eq(courses.courseCode, courseCode),
      });
      if (!course) throw new NotFound("Course not found");

      return this.formatCourseData(course);
    } catch (e) {
      throw e;
    }
  }

  async fetchRegisteredUsersForCourse(
    courseCode: string,
    semester: number,
    year: number,
  ) {
    try {
      const course = await db.query.courses.findFirst({
        where: eq(courses.courseCode, courseCode),
      });

      if (!course) throw new NotFound("Course not found");

      const registeredUsers = await db
        .select({
          registrationId: courseRegistrations.id,
          userId: users.id,
          name: users.name,
          matricNo: users.matricNo,
          email: users.email,
          semester: courseRegistrations.semester,
          year: courseRegistrations.year,
        })
        .from(courseRegistrations)
        .innerJoin(users, eq(courseRegistrations.userId, users.id))
        .where(
          and(
            eq(courseRegistrations.courseId, course.id),
            eq(courseRegistrations.semester, semester),
            eq(courseRegistrations.year, year),
          ),
        );

      if (!registeredUsers || registeredUsers.length === 0)
        throw new NotFound("No users registered for this course");

      return {
        course: this.formatCourseData(course),
        registeredUsers,
      };
    } catch (e) {
      logger.error(`Unable to fetch registered users for course, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Unable to fetch registered users");
    }
  }

  private formatCourseData(course: any) {
    const { createdBy, createdAt, departmentId, ...rest } = course;
    return rest;
  }
}
