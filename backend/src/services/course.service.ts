import type { NewCourse, Values, Table } from "../types";
import { courses } from "../db/schema/course";
import { db } from "../db/mysql";
import { InternalServerError } from "../utils/error";
import { logger } from "../utils/logger";
import { eq } from "drizzle-orm";

export class CourseService {
  async addCourse(courseValues: NewCourse, userId: string) {
    try {
      const { values } = await this.insertWithContext(courses, {
        ...courseValues,
        createdBy: userId,
      });
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

  async updateCourse(courseId: string, values: NewCourse) {
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

  async findSpecificCourse() {}

  async getAllCourses(department: string, limit: number, page: number) {}

  async findCoursesBySemester(
    department: string,
    semester: number,
    year: number,
    limit: number,
    page: number,
  ) {}

  async findCoursesByYear(department: string, year: number, limit: number) {}

  private async insertWithContext(table: Table, values: Values) {
    try {
      const result = await db.insert(table).values(values);
      return { result, values };
    } catch (err) {
      throw err;
    }
  }
}
