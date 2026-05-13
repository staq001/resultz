import { Scores } from "@/services/scoreCourses.service";
import type { AppEnv, ScoreCourseContext } from "@/types";
import { BadRequest } from "@/utils/error";
import type { Context } from "hono";

export class ScoreController {
  private scoreService: Scores;

  constructor() {
    this.scoreService = new Scores();
  }

  scoreCourse = async (c: ScoreCourseContext) => {
    const { examScore, testScore } = c.req.valid("json");
    const { registeredCourseId, semesterId } = c.req.param();

    try {
      const scoreId = await this.scoreService.scoreCourse(
        examScore,
        testScore,
        registeredCourseId as string,
        semesterId as string,
      );

      return c.json(
        {
          status: 201,
          message: "Score recorded successfully!",
          data: { scoreId },
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

  updateScore = async (c: ScoreCourseContext) => {
    const { examScore, testScore } = c.req.valid("json");
    const { semesterId, registeredCourseId } = c.req.param();
    const matricNo = c.req.query("matricNo");

    try {
      if (!matricNo) throw new BadRequest("Matric number is required");

      const scoredCourse = await this.scoreService.updateCourseScore(
        examScore,
        testScore,
        matricNo as string,
        registeredCourseId as string,
        semesterId as string,
      );

      return c.json(
        {
          status: 200,
          message: "Score updated successfully!",
          data: { scoredCourse },
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

  fetchCourseScore = async (c: Context) => {
    const scoreId = c.req.param("scoreId");

    try {
      const scoredCourse = await this.scoreService.fetchCourseScore(scoreId);

      return c.json(
        {
          status: 200,
          message: "Score fetched successfully!",
          data: { scoredCourse },
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

  getAllScoredCoursesBySemsester = async (c: Context<AppEnv>) => {
    const user = c.get("user");
    const { semester } = c.req.query();
    try {
      if (!semester)
        throw new BadRequest("Valid semester query params is required");

      const scores = await this.scoreService.getScoresBySemester(
        user.id,
        semester,
      );

      return c.json(
        {
          status: 200,
          message: "Scores fetched successfully!",
          data: { scores },
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

  getScoresForCourse = async (c: Context<AppEnv>) => {
    const { courseCode } = c.req.param();
    const { semester } = c.req.query();

    try {
      if (!courseCode) throw new BadRequest("Course code is required");
      if (!semester) throw new BadRequest("Semester is required");

      const payload = await this.scoreService.getScoresForCourse(
        courseCode.toUpperCase(),
        semester,
      );

      return c.json(
        {
          status: 200,
          message: "Course scores fetched successfully!",
          data: payload,
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

  getAllRegisteredCoursesBySpecificUser = async (c: Context<AppEnv>) => {
    const { userId } = c.req.param();
    const { semester } = c.req.query();

    if (!semester) throw new BadRequest("Semester is required");

    try {
      const registeredCourses =
        await this.scoreService.getAllRegisteredCoursesByASpecificUser(
          userId as string,
          semester,
        );

      return c.json(
        {
          status: 200,
          message: "Registered courses fetched successfully!",
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
