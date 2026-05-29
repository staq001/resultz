import type { Context } from "hono";
import { Registration } from "../services/registration.service";
import type {
  AppEnv,
  RegisterCourseContext,
  UpdateRegisteredCourseContext,
} from "../types";
import { BadRequest } from "@/utils/error";

export class RegistrationController {
  private registration;

  constructor() {
    this.registration = new Registration();
  }

  registerCourse = async (c: RegisterCourseContext) => {
    const data = c.req.valid("json");
    const { id } = c.get("user");

    try {
      const userCourseData = await this.registration.registerCourse({
        userId: id,
        ...data,
      });

      return c.json(
        {
          status: 201,
          message: `You have successfully registered for ${userCourseData.course}!`,
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
    const { id } = c.get("user");
    const registeredCourseId = c.req.param("registeredCourseId");
    try {
      const registeredCourse = await this.registration.fetchRegisteredCourse(
        registeredCourseId,
        id,
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

  dropRegisteredCourse = async (c: Context<AppEnv>) => {
    const { id } = c.get("user");
    const registeredCourseId = c.req.param("registeredCourseId");

    try {
      await this.registration.dropRegisteredCourse(registeredCourseId, id);

      return c.json(
        {
          status: 200,
          message: "Registered course dropped successfully!",
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
    const { semester } = c.req.query();
    const { id } = c.get("user");

    try {
      if (!semester)
        throw new BadRequest("Valid semester query params is required");

      const registeredCourses =
        await this.registration.findRegisteredCoursesBySemester(id, semester);

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

  findCourseByCourseCode = async (c: Context<AppEnv>) => {
    const { courseCode, semester } = c.req.query();
    try {
      if (!courseCode) throw new BadRequest("Course code is required");
      if (semester && semester !== "Rain" && semester !== "Harmattan") {
        throw new BadRequest("Semester must be Rain or Harmattan");
      }

      const course = await this.registration.findCourseByCourseCode(
        courseCode as string,
        semester,
      );
      return c.json(
        {
          status: 200,

          message: "Course fetched successfully!",
          data: { course },
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

  fetchRegisteredUsersForCourse = async (c: Context<AppEnv>) => {
    const { courseCode } = c.req.param();
    const { semester } = c.req.query();

    try {
      if (!semester)
        throw new BadRequest("Valid semester query params is required");

      const data = await this.registration.fetchRegisteredUsersForCourse(
        courseCode as string,
        semester,
      );

      return c.json(
        {
          status: 200,
          message: "Registered users fetched successfully!",
          data,
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
