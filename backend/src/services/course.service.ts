import type {
  NewCourse,
  Values,
  Table,
  CourseService as CS,
  semesterEnum,
} from "../types";
import { courses } from "../db/schema/course";
import { db } from "../db/mysql";
import { BadRequest, InternalServerError, NotFound } from "../utils/error";
import { logger } from "../utils/logger";
import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { users } from "../db/schema/user";
import { departments } from "../db/schema/department";
import { currentSession } from "../db/schema/currentSession";
import { session } from "../db/schema/session";

export class CourseService implements CS {
  async addCourse(courseValues: NewCourse) {
    try {
      if (await this.findCourseByCourseCode(courseValues.courseCode))
        throw new BadRequest("This course code already exists");

      const { values } = await this.insertWithContext(courses, courseValues);

      logger.info("Course created...");
      return values;
    } catch (e) {
      logger.error("Error creating course", e);
      if (e instanceof BadRequest) throw e;
      throw new InternalServerError("Error creating course");
    }
  }

  async deleteCourse(courseId: string) {
    try {
      await db.delete(courses).where(eq(courses.id, courseId));
      logger.info("Course deleted...");
    } catch (e) {
      logger.error("Error deleting course", e);
      throw new InternalServerError("Error deleting course");
    }
  }

  async updateCourse(courseId: string, values: Partial<NewCourse>) {
    try {
      await db
        .update(courses)
        .set({ ...values })
        .where(eq(courses.id, courseId));
    } catch (e) {
      logger.error("Error updating course", e);
      throw new InternalServerError("Error updating course");
    }
  }

  async findSpecificCourse(courseId: string) {
    try {
      const { id, title, courseCode, departmentId, units, semester, level } =
        getTableColumns(courses);

      const [course] = await db
        .select({ id, title, courseCode, departmentId, units, semester, level })
        .from(courses)
        .where(eq(courses.id, courseId));

      if (!course) throw new NotFound("Course doesn't exist");

      return course;
    } catch (e) {
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Error finding course");
    }
  }

  private async findCourseByCourseCode(ccode: string) {
    try {
      const { id, courseCode } = getTableColumns(courses);
      const [course] = await db
        .select({ id, courseCode })
        .from(courses)
        .where(eq(courses.courseCode, ccode));
      return course;
    } catch (e) {
      logger.error("Error finding course by course code", e);
      throw new InternalServerError("Error finding course by course code");
    }
  }

  async getAllCourses(
    department_id: string,
    limit: number,
    page: number,
    semester: semesterEnum,
    level?: number,
  ) {
    page = page || 1;
    limit = limit || 10;

    let allCourses;

    const skip = (page - 1) * limit;

    try {
      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(courses)
        .where(eq(courses.departmentId, department_id));

      const count = total[0]?.count;
      if (!count || count === 0) throw new NotFound("No courses found");

      const { id, title, courseCode, departmentId, units, semester, level } =
        getTableColumns(courses);

      if (level) {
        allCourses = await db
          .select({
            id,
            title,
            courseCode,
            departmentId,
            units,
            semester,
            level,
          })
          .from(courses)
          .where(
            and(
              eq(courses.departmentId, department_id),
              eq(courses.semester, semester),
              eq(courses.level, level),
            ),
          )
          .limit(limit)
          .offset(skip);
      } else {
        allCourses = await db
          .select({
            id,
            title,
            courseCode,
            departmentId,
            units,
            semester,
            level,
          })
          .from(courses)
          .where(
            and(
              eq(courses.departmentId, department_id),
              eq(courses.semester, semester),
            ),
          )
          .limit(limit)
          .offset(skip);
      }

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
  private getSessionTerm(sessionName: string): semesterEnum {
    const normalized = sessionName.trim();
    if (normalized.endsWith("Rain")) return "Rain";
    if (normalized.endsWith("Harmattan")) return "Harmattan";
    throw new BadRequest("Current session term is invalid");
  }

  private normalizeAcademicYear(year: number) {
    const numericYear = Number(year);
    if (!Number.isFinite(numericYear)) {
      throw new BadRequest("Academic year is invalid");
    }

    return numericYear < 100 ? 2000 + numericYear : numericYear;
  }

  private extractSessionStartYear(activeSessionName: string) {
    const match = activeSessionName.match(/\b(\d{2,4})\s*[/.-]\s*\d{2,4}\b/);
    if (!match?.[1]) {
      throw new BadRequest("Academic year could not be determined");
    }

    return this.normalizeAcademicYear(Number(match[1]));
  }

  private inferStudentLevel(entryYear: number, activeSessionName: string) {
    const normalizedEntryYear = this.normalizeAcademicYear(entryYear);
    const activeYear = this.extractSessionStartYear(activeSessionName);

    if (activeYear < normalizedEntryYear) {
      throw new BadRequest(
        "Student entry year cannot be after the active academic year",
      );
    }

    return Math.max(
      100,
      Math.min(900, (activeYear - normalizedEntryYear + 1) * 100),
    );
  }

  async getAvailableCoursesForStudent(userId: string) {
    try {
      const [user] = await db
        .select({
          id: users.id,
          department: users.department,
          matricNo: users.matricNo,
          entryYear: users.entryYear,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) throw new NotFound("User not found");
      if (!user.department)
        throw new BadRequest("Student department is not set");
      if (!user.matricNo)
        throw new BadRequest("Student matric number is not set");
      if (!user.entryYear)
        throw new BadRequest("Student entry year is not set");

      const [activeSessionName] = await db
        .select()
        .from(currentSession)
        .limit(1);
      if (!activeSessionName?.currentSession) {
        throw new NotFound("Current session is not set");
      }

      const [activeSession] = await db
        .select({
          id: session.id,
          schoolSession: session.schoolSession,
        })
        .from(session)
        .where(eq(session.schoolSession, activeSessionName.currentSession));

      if (!activeSession) throw new NotFound("Current session was not found");

      const [department] = await db
        .select({
          id: departments.id,
          name: departments.name,
        })
        .from(departments)
        .where(eq(departments.name, user.department.trim()));

      if (!department) throw new NotFound("Student department was not found");

      const level = this.inferStudentLevel(
        user.entryYear,
        activeSession.schoolSession,
      );
      const semester = this.getSessionTerm(activeSession.schoolSession);

      const availableCourses = await db
        .select({
          id: courses.id,
          title: courses.title,
          courseCode: courses.courseCode,
          departmentId: courses.departmentId,
          units: courses.units,
          semester: courses.semester,
          level: courses.level,
        })
        .from(courses)
        .where(
          and(
            eq(courses.departmentId, department.id),
            eq(courses.semester, semester),
            eq(courses.level, level),
          ),
        )
        .orderBy(courses.courseCode);

      return {
        department,
        currentSession: activeSession,
        level,
        semester,
        courses: availableCourses,
      };
    } catch (e) {
      if (e instanceof BadRequest) throw e;
      if (e instanceof NotFound) throw e;
      logger.error("Error fetching student available courses", e);
      throw new InternalServerError("Error fetching student available courses");
    }
  }

  private async insertWithContext(table: Table, values: Values) {
    try {
      const [result] = await db.insert(table).values(values);

      if (!result || result.affectedRows !== 1)
        throw new InternalServerError("Insert failed: no rows were inserted");

      return { values };
    } catch (err) {
      throw err;
    }
  }
}
