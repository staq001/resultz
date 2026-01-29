import type { Context } from "hono";
import type { CourseContext, UpdateCourseContext } from "../types";
import { CourseService } from "../services/course.service";

export class CourseController {
  private courseService;

  constructor() {
    this.courseService = new CourseService();
  }

  addCourse = async (c: CourseContext) => {
    const body = c.req.valid("json");
    const departmentId = c.req.param("departmentId");
    try {
      const { id } = c.get("user");

      const course = await this.courseService.addCourse({
        ...body,
        departmentId,
        createdBy: id,
      });

      return c.json({
        status: 201,
        message: "Course created successfully",
        data: { course },
      });
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  deleteCourse = async (c: Context) => {
    const courseId = c.req.param("courseId");

    try {
      await this.courseService.deleteCourse(courseId);

      return c.json({
        status: 200,
        message: "Course deleted successfully",
      });
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  updateCourse = async (c: UpdateCourseContext) => {
    const data = c.req.valid("json");
    const courseId = c.req.param("courseId");

    try {
      await this.courseService.updateCourse(courseId, data);

      return c.json({
        status: 200,
        message: "Course updated successfully",
      });
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };

  findSpecificCourse = async (c: Context) => {
    const courseId = c.req.param("courseId");
    try {
      const course = await this.courseService.findSpecificCourse(courseId);
      return c.json({
        status: 200,
        message: "Courses fetched successfully!",
        data: { course },
      });
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };
  getAllCourses = async (c: Context) => {
    const { limit, page } = c.req.query();
    const departmentId = c.req.param("departmentId");

    try {
      const courses = await this.courseService.getAllCourses(
        departmentId,
        Number(limit),
        Number(page),
      );

      return c.json({
        status: 200,
        message: "Courses fetched successfully!",
        data: { courses },
      });
    } catch (e: any) {
      return c.json(
        { message: e.message || "Internal Server Error" },
        e.status || 500,
      );
    }
  };
}
