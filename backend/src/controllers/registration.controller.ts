import type { Context } from "hono";
import { Registration } from "../services/registration.service";
import type { AppEnv, RegisterCourseContext } from "../types";

export class RegistrationController {
  private registration;

  constructor() {
    this.registration = new Registration();
  }

  registerCourse = async (c: RegisterCourseContext) => {
    const data = c.req.valid("json");
    const userId = c.get("user");

    try {
      const userCourseData = await this.registration.registerCourse({
        userId: userId.id,
        ...data,
      });

      return c.json(
        {
          status: 201,
          message: "Course Registered Successfully!",
          data: userCourseData,
        },
        201,
      );
    } catch (e: any) {
      return c.json(
        {
          status: e.status || 500,
          message: e.message || "Internal Server Error",
        },
        e.status || 500,
      );
    }
  };

  fetchRegisteredCourse = async (c: Context<AppEnv>) => {
    const user = c.get("user");
    const registeredCourseId = c.req.param("registeredCourseId");
    try {
      const registeredCourse = await this.registration.fetchRegisteredCourse(
        registeredCourseId,
        user.id,
      );

      return c.json(
        {
          status: 200,
          message: "Course fetched successfully!",
          data: { registeredCourse },
        },
        200,
      );
    } catch (e: any) {
      return c.json(
        {
          status: e.status || 500,
          message: e.message || "Internal Server Error",
        },
        e.status || 500,
      );
    }
  };

  fetchRegisteredCoursesBySemester = async (c: Context<AppEnv>) => {
    const { page, limit, semester, year } = c.req.query();
    const user = c.get("user");

    try {
      const sem = Number(semester) || 1;
      const yr = Number(year) || new Date().getUTCFullYear();

      const registeredCourses =
        await this.registration.findRegisteredCoursesBySemester(
          user.id,
          { semester: sem, year: yr },
          Number(page),
          Number(limit),
        );

      return c.json(
        {
          status: 200,
          message: "Courses fetched successfully!",
          data: { registeredCourses },
        },
        200,
      );
    } catch (e: any) {
      return c.json(
        {
          status: e.status || 500,
          message: e.message || "Internal Server Error",
        },
        e.status || 500,
      );
    }
  };

  findRegisteredCoursesByYear = async (c: Context) => {
    const { page, limit, year } = c.req.query();
    const user = c.get("user");
    try {
      const yr = Number(year) || new Date().getUTCFullYear();

      const registeredCourses =
        await this.registration.findRegisteredCoursesByYear(
          user.id,
          yr,
          Number(page),
          Number(limit),
        );

      return c.json(
        {
          status: 200,
          message: "Courses fetched successfully!",
          data: { registeredCourses },
        },
        200,
      );
    } catch (e: any) {
      return c.json(
        {
          status: e.status || 500,
          message: e.message || "Internal Server Error",
        },
        e.status || 500,
      );
    }
  };
}
