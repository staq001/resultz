import { and, eq } from "drizzle-orm";
import { db } from "@/db/mysql";
import { courseRegistrations, courses, scoreCourses, users } from "@/db/schema";
import { BadRequest, InternalServerError, NotFound } from "@/utils/error";
import { logger } from "@/utils/logger";
import { grading } from "@/utils";

export class Scores {
  async scoreCourse(
    examScore: number,
    testScore: number,
    registeredCourseId: string,
    semesterId: string,
  ) {
    try {
      return await db.transaction(async (tx) => {
        const registeredCourse = await tx.query.courseRegistrations.findFirst({
          where: eq(courseRegistrations.id, registeredCourseId),
        });
        if (!registeredCourse)
          throw new NotFound("Invalid ID. Registered course not found");

        if (registeredCourse.semester !== semesterId) {
          throw new BadRequest("Registered course does not belong to semester");
        }

        const existing = await tx.query.scoreCourses.findFirst({
          where: and(
            eq(scoreCourses.registeredCourseId, registeredCourseId),
            eq(scoreCourses.semester, semesterId),
            eq(scoreCourses.userId, registeredCourse.userId),
          ),
        });

        if (existing) throw new BadRequest("This course has been scored!");

        const userGrade = grading(examScore, testScore);

        await tx.insert(scoreCourses).values({
          userId: registeredCourse.userId,
          examScore,
          testScore,
          grade: userGrade,
          registeredCourseId,
          semester: semesterId,
        });

        const created = await tx.query.scoreCourses.findFirst({
          where: and(
            eq(scoreCourses.registeredCourseId, registeredCourseId),
            eq(scoreCourses.semester, semesterId),
            eq(scoreCourses.userId, registeredCourse.userId),
          ),
        });

        return created?.id;
      });
    } catch (e) {
      logger.error(`Unable to score course , ${e}`);
      if (e instanceof BadRequest) throw e;
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Unable to score course");
    }
  }

  async updateCourseScore(
    examScore: number,
    testScore: number,
    userMatricNo: string,
    registeredCourseId: string,
    semesterId: string,
  ) {
    try {
      return await db.transaction(async (tx) => {
        const user = await tx.query.users.findFirst({
          where: eq(users.matricNo, userMatricNo),
        });

        if (!user) throw new NotFound("User not found");

        const courseScore = await tx.query.scoreCourses.findFirst({
          where: and(
            eq(scoreCourses.userId, user.id),
            eq(scoreCourses.registeredCourseId, registeredCourseId),
            eq(scoreCourses.semester, semesterId),
          ),
        });

        if (!courseScore)
          throw new NotFound("Invalid ID. Course score doesnt exist.");

        const userGrade = grading(examScore, testScore);

        await tx
          .update(scoreCourses)
          .set({ examScore, testScore, grade: userGrade })
          .where(
            and(
              eq(scoreCourses.registeredCourseId, registeredCourseId),
              eq(scoreCourses.userId, user.id),
              eq(scoreCourses.semester, semesterId),
            ),
          );

        return {
          ...courseScore,
          examScore,
          testScore,
          grade: userGrade,
        };
      });
    } catch (e: any) {
      logger.error(`Unable to update score, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Unable to update score");
    }
  }

  async fetchCourseScore(scoredCourseId: string) {
    try {
      const [scoredCourse] = await db
        .select({
          id: scoreCourses.id,
          registeredCourseId: scoreCourses.registeredCourseId,
          registrationId: courseRegistrations.id,
          userId: users.id,
          name: users.name,
          matricNo: users.matricNo,
          email: users.email,
          courseCode: courses.courseCode,
          courseTitle: courses.title,
          semester: scoreCourses.semester,
          testScore: scoreCourses.testScore,
          examScore: scoreCourses.examScore,
          grade: scoreCourses.grade,
          scoredAt: scoreCourses.scoredAt,
        })
        .from(scoreCourses)
        .innerJoin(
          courseRegistrations,
          eq(scoreCourses.registeredCourseId, courseRegistrations.id),
        )
        .innerJoin(courses, eq(courseRegistrations.courseId, courses.id))
        .innerJoin(users, eq(scoreCourses.userId, users.id))
        .where(eq(scoreCourses.id, scoredCourseId));

      if (!scoredCourse)
        throw new NotFound("Invalid ID. Course score doesnt exist.");
      return scoredCourse;
    } catch (e) {
      logger.error(`Error fetching score course, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Error fetching course score.");
    }
  }

  async getScoresBySemester(userId: string, semester: string) {
    try {
      return this.getAllScoredCoursesBySemsester(semester, userId);
    } catch (e) {
      logger.error(`Couldnt fetch scores, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Couldnt fetch scores");
    }
  }

  async getScoresForCourse(courseCode: string, semesterId: string) {
    try {
      const course = await db.query.courses.findFirst({
        where: eq(courses.courseCode, courseCode),
      });

      if (!course) throw new NotFound("Course not found");

      const scores = await db
        .select({
          scoreId: scoreCourses.id,
          registrationId: courseRegistrations.id,
          userId: users.id,
          name: users.name,
          matricNo: users.matricNo,
          email: users.email,
          courseCode: courses.courseCode,
          courseTitle: courses.title,
          semester: scoreCourses.semester,
          testScore: scoreCourses.testScore,
          examScore: scoreCourses.examScore,
          grade: scoreCourses.grade,
          scoredAt: scoreCourses.scoredAt,
        })
        .from(scoreCourses)
        .innerJoin(
          courseRegistrations,
          eq(scoreCourses.registeredCourseId, courseRegistrations.id),
        )
        .innerJoin(courses, eq(courseRegistrations.courseId, courses.id))
        .innerJoin(users, eq(scoreCourses.userId, users.id))
        .where(
          and(
            eq(courses.courseCode, courseCode),
            eq(scoreCourses.semester, semesterId),
          ),
        );

      if (!scores || scores.length === 0) throw new NotFound("No scores found");

      return {
        course: {
          id: course.id,
          courseCode: course.courseCode,
          title: course.title,
          units: course.units,
          semester: course.semester,
          level: course.level,
        },
        scores,
      };
    } catch (e) {
      logger.error(`Couldnt fetch course scores, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Couldnt fetch course scores");
    }
  }

  // select exam_score, test_score, grade, matric_no, title, course_code, units from course_score inner join users on course_score.user_id=users.id inner join course_registrations on course_score.registered_course_id=course_registrations.id inner join courses on course_registrations.course_id =courses.id;

  private async getAllScoredCoursesBySemsester(
    semesterId: string,
    userId: string,
  ) {
    try {
      const allCourses = await db
        .select({
          exam_score: scoreCourses.examScore,
          test_score: scoreCourses.testScore,
          grade: scoreCourses.grade,
          courseTitle: courses.title,
          courseCode: courses.courseCode,
          units: courses.units,
        })
        .from(scoreCourses)
        .innerJoin(
          courseRegistrations,
          eq(scoreCourses.registeredCourseId, courseRegistrations.id),
        )
        .innerJoin(courses, eq(courseRegistrations.courseId, courses.id))
        .where(
          and(
            eq(scoreCourses.semester, semesterId),

            eq(scoreCourses.userId, userId),
          ),
        );

      if (!allCourses || allCourses.length === 0)
        throw new NotFound("No scores found");

      return allCourses;
    } catch (e) {
      throw e;
    }
  }

  async getAllRegisteredCoursesByASpecificUser(
    userId: string,
    semester: string,
  ) {
    try {
      const allCourses = await db
        .select()
        .from(courseRegistrations)
        .where(
          and(
            eq(courseRegistrations.userId, userId),
            eq(courseRegistrations.semester, semester),
          ),
        );

      if (!allCourses || allCourses.length === 0)
        throw new NotFound("No registered courses found");
      return allCourses;
    } catch (e) {
      logger.error(`Couldnt fetch scores, ${e}`);
      if (e instanceof NotFound) throw e;
      throw new InternalServerError("Couldnt fetch scores");
    }
  }
}
