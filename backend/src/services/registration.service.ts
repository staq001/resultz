import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/mysql";
import { courseRegistrations, courses, users } from "@/db/schema";
import { departments } from "@/db/schema/department";
import { scoreCourses } from "@/db/schema/score-courses";
import { session } from "@/db/schema/session";
import { BadRequest, InternalServerError, NotFound } from "@/utils/error";
import type { CheckRegisteredCourses, RegisterCourse } from "../types";
import { logger } from "@/utils/logger";

export class Registration {
  private getSessionTerm(sessionName: string) {
    const normalized = sessionName.trim();
    if (normalized.endsWith("Rain")) return "Rain";
    if (normalized.endsWith("Harmattan")) return "Harmattan";
    throw new BadRequest("Current session term is invalid");
  }

  async registerCourse(params: RegisterCourse) {
    try {
      return await db.transaction(async (tx) => {
        const { userId, courseCode, semesterId } = params;

        const user = await tx.query.users.findFirst({
          where: eq(users.id, userId),
        });
        if (!user) throw new NotFound("User not found");

        const courseDetails = await this.findCourseByCourseCode(courseCode);
        if (!courseDetails) throw new NotFound("Course not found");

        const activeSession = await tx.query.session.findFirst({
          where: eq(session.id, semesterId),
        });
        if (!activeSession) throw new NotFound("Selected semester not found");
        if (activeSession.registration_status === "Locked") {
          throw new BadRequest(
            "Registration for the selected semester is currently locked",
          );
        }

        const activeTerm = this.getSessionTerm(activeSession.schoolSession);
        if (courseDetails.semester !== activeTerm) {
          throw new BadRequest(
            `Only ${activeTerm} courses can be registered for the active semester`,
          );
        }

        const checkNoOfRegisteredCourses =
          await this.checkNumberOfRegisteredCourses({
            userId,
            semesterId,
          });

        if (checkNoOfRegisteredCourses)
          throw new BadRequest(
            "User cannot register more than 12 courses in a semester",
          );

        const existing = await tx.query.courseRegistrations.findFirst({
          where: and(
            eq(courseRegistrations.userId, userId),
            eq(courseRegistrations.courseId, courseDetails.id),
            eq(courseRegistrations.semester, semesterId),
          ),
        });
        if (existing)
          throw new BadRequest("User already registered for this course");

        await tx.insert(courseRegistrations).values({
          userId,
          courseId: courseDetails.id,
          semester: semesterId,
        });

        return { course: courseDetails.courseCode };
      });
    } catch (e) {
      logger.error(`Unable to register course , ${e}`);
      if (e instanceof BadRequest) throw e;
      if (e instanceof NotFound) throw e;
      if (this.isDuplicateEntryError(e)) {
        throw new BadRequest(
          "User already registered for this course in the selected semester",
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
      if (e instanceof BadRequest) throw e;
      throw new InternalServerError("Unable to fetch registered course");
    }
  }

  async findRegisteredCoursesBySemester(userId: string, semesterId: string) {
    try {
      return this._findRegisteredCoursesBySemester(userId, semesterId);
    } catch (e) {
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Error fetching all courses");
    }
  }

  private async _findRegisteredCoursesBySemester(
    userId: string,
    semesterId: string,
  ) {
    try {
      const allCourses = await db
        .select({
          id: courseRegistrations.id,
          userId: courseRegistrations.userId,
          courseId: courseRegistrations.courseId,
          semester: courseRegistrations.semester,
          registeredAt: courseRegistrations.registeredAt,
          courseCode: courses.courseCode,
          title: courses.title,
          units: courses.units,
          courseSemester: courses.semester,
          level: courses.level,
          departmentName: departments.name,
        })
        .from(courseRegistrations)
        .innerJoin(courses, eq(courseRegistrations.courseId, courses.id))
        .innerJoin(departments, eq(courses.departmentId, departments.id))
        .where(
          and(
            eq(courseRegistrations.semester, semesterId),
            eq(courseRegistrations.userId, userId),
          ),
        )
        .orderBy(courses.courseCode);

      if (!allCourses || allCourses.length === 0)
        throw new NotFound("No courses found");

      return allCourses;
    } catch (e) {
      throw e;
    }
  }

  private async checkNumberOfRegisteredCourses(params: CheckRegisteredCourses) {
    const { userId, semesterId } = params;

    return await db.transaction(async (tx) => {
      const [total] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(courseRegistrations)
        .where(
          and(
            eq(courseRegistrations.userId, userId),
            eq(courseRegistrations.semester, semesterId),
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

  async dropRegisteredCourse(registeredCourseId: string, userId: string) {
    try {
      const registeredCourse = await db.query.courseRegistrations.findFirst({
        where: and(
          eq(courseRegistrations.id, registeredCourseId),
          eq(courseRegistrations.userId, userId),
        ),
      });
      if (!registeredCourse) throw new NotFound("Registered course not found");

      const sessionDetails = await db.query.session.findFirst({
        where: eq(session.schoolSession, registeredCourse.semester),
      });
      if (!sessionDetails) throw new NotFound("Session details not found");
      if (sessionDetails.registration_status === "Locked") {
        throw new BadRequest(
          "Cannot drop course because registration for the semester is locked",
        );
      }

      await db
        .delete(courseRegistrations)
        .where(
          and(
            eq(courseRegistrations.id, registeredCourseId),
            eq(courseRegistrations.userId, userId),
          ),
        );
    } catch (e) {
      logger.error(`Unable to drop registered course, ${e}`);
      if (e instanceof NotFound) throw e;
      if (e instanceof BadRequest) throw e;
      throw new InternalServerError("Unable to drop registered course");
    }
  }

  async findCourseByCourseCode(courseCode: string, semesterTerm?: string) {
    try {
      const [course] = await db
        .select({
          id: courses.id,
          courseCode: courses.courseCode,
          title: courses.title,
          units: courses.units,
          semester: courses.semester,
          level: courses.level,
          departmentId: courses.departmentId,
          departmentName: departments.name,
        })
        .from(courses)
        .innerJoin(departments, eq(courses.departmentId, departments.id))
        .where(
          semesterTerm
            ? and(
                eq(courses.courseCode, courseCode),
                eq(courses.semester, semesterTerm as "Rain" | "Harmattan"),
              )
            : eq(courses.courseCode, courseCode),
        );
      if (!course) throw new NotFound("Course not found");

      const { departmentId, ...rest } = course;
      return rest;
    } catch (e) {
      throw e;
    }
  }

  async fetchRegisteredUsersForCourse(courseCode: string, semesterId: string) {
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
          scoreId: scoreCourses.id,
          testScore: scoreCourses.testScore,
          examScore: scoreCourses.examScore,
        })
        .from(courseRegistrations)
        .innerJoin(users, eq(courseRegistrations.userId, users.id))
        .leftJoin(
          scoreCourses,
          eq(scoreCourses.registeredCourseId, courseRegistrations.id),
        )
        .where(
          and(
            eq(courseRegistrations.courseId, course.id),
            eq(courseRegistrations.semester, semesterId),
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
