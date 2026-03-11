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
    const registeredCourseId = c.req.param("registeredCourseId");

    try {
      await this.scoreService.scoreCourse(
        examScore,
        testScore,
        registeredCourseId,
      );

      return c.json(
        {
          status: 201,
          message: "Score recorded successfully!",
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
    const scoreId = c.req.param("scoreId");

    try {
      await this.scoreService.updateCourseScore(examScore, testScore, scoreId);

      return c.json(
        { status: 200, message: "Score updated successfully!" },
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

  getAllScoredCoursesBySemsesterorYear = async (c: Context<AppEnv>) => {
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
  getAllScoredCoursesBySemsesterorYearAdmin = async (c: Context<AppEnv>) => {
    const { semester } = c.req.query();
    try {
      if (!semester) throw new BadRequest("Semester is required");
      const scores = await this.scoreService.getScoresBySemesterA(semester);

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
