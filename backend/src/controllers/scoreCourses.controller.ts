import { Scores } from "@/services/scoreCourses.service";
import type { AppEnv, ScoreCourseContext } from "@/types";
import type { Context } from "hono";

export class ScoreController {
  private scoreService: Scores;

  constructor() {
    this.scoreService = new Scores();
  }

  scoreCourse = async (c: ScoreCourseContext) => {
    const { score } = c.req.valid("json");
    const registeredCourseId = c.req.param("registeredCourseId");

    try {
      const { courseScoreId, registeredCourse } =
        await this.scoreService.scoreCourse(score, registeredCourseId);

      return c.json(
        {
          status: 201,
          message: "Score recorded successfully!",
          data: { courseScoreId, registeredCourse },
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
    const { score } = c.req.valid("json");
    const scoreId = c.req.param("scoreId");

    try {
      await this.scoreService.updateCourseScore(score, scoreId);

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

  getAllScoredCoursesBySemsester = async (c: Context<AppEnv>) => {
    const user = c.get("user");
    const { semester, year } = c.req.query();
    try {
      const sem = Number(semester) || 1;
      const yr = Number(year) || new Date().getUTCFullYear();

      const scores = await this.scoreService.getScoresBySemesterOrYear(
        user.id,
        yr,
        sem,
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
}
