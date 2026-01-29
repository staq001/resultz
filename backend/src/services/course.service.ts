import type { NewCourse, Values, Table, CourseService as CS } from "../types";
import { courses } from "../db/schema/course";
import { db } from "../db/mysql";
import { InternalServerError, NotFound } from "../utils/error";
import { logger } from "../utils/logger";
import { eq, getTableColumns, sql } from "drizzle-orm";

export class CourseService implements CS {
  async addCourse(courseValues: NewCourse) {
    try {
      const { values } = await this.insertWithContext(courses, courseValues);
      logger.info("Course created...");
      return values;
    } catch (e) {
      logger.error("Error creating course", e);
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
      const { id, title, courseCode, departmentId, units } =
        getTableColumns(courses);

      const [course] = await db
        .select({ id, title, courseCode, departmentId, units })
        .from(courses)
        .where(eq(courses.id, courseId));

      if (!course) throw new NotFound("Course doesn't exist");

      return course;
    } catch (e) {
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Error finding course");
    }
  }

  async getAllCourses(department_id: string, limit: number, page: number) {
    page = page || 1;
    limit = limit || 10;

    const skip = (page - 1) * limit;

    try {
      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(courses)
        .where(eq(courses.departmentId, department_id));

      const count = total[0]?.count;
      if (!count || count === 0) throw new NotFound("No courses found");

      const { id, title, courseCode, departmentId, units } =
        getTableColumns(courses);
      const allCourses = await db
        .select({ id, title, courseCode, departmentId, units })
        .from(courses)
        .where(eq(courses.departmentId, department_id))
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
