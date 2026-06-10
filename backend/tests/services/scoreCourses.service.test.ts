import { describe, it, expect, vi, beforeEach } from "bun:test";
import { dbMock } from "../helpers/dbMock";

vi.mock("../../src/db/mysql", () => ({ db: dbMock }));

import { Scores } from "../../src/services/scoreCourses.service";
import { NotFound } from "../../src/utils/error";

describe("Scores service", () => {
  beforeEach(() => dbMock.__clear());

  it("getUserComprehensiveReport aggregates rows into semesters and summary", async () => {
    const svc = new Scores();

    const rows = [
      {
        scoreId: "s1",
        testScore: 10,
        examScore: 60,
        grade: "A",
        scoredAt: new Date().toISOString(),
        courseCode: "CSC101",
        courseTitle: "Intro",
        units: 3,
        semesterTerm: "Harmattan",
        semesterId: "sem1",
        sessionName: "2022/2023 Harmattan",
        studentId: "u1",
        name: "John",
        matricNo: "M001",
        department: "CS",
        entryYear: 2020,
        isRusticated: false,
        isGraduated: false,
        faculty: "Science",
      },
    ];

    vi.spyOn(
      Scores.prototype as any,
      "getComprehensiveReport",
    ).mockResolvedValue(rows);

    const report = await svc.getUserComprehensiveReport("u1");
    expect(report.student.id).toBe("u1");
    expect(report.semesters.length).toBeGreaterThan(0);
    expect(report.summary).toBeDefined();
  });

  it("getAllScoredCoursesBySemsester throws NotFound when empty", async () => {
    const svc = new Scores();
    dbMock.__pushSelectResult([]);
    await expect(
      (svc as any).getAllScoredCoursesBySemsester("s1", "u1"),
    ).rejects.toThrow(NotFound);
  });

  it("scoreCourse - success and error paths", async () => {
    const svc = new Scores();

    // registered course exists
    dbMock.__setQueryResult("courseRegistrations", {
      id: "reg1",
      userId: "u1",
      semester: "sem1",
    });
    // no existing score
    dbMock.__setQueryResult("scoreCourses", undefined);
    // after insert, created row
    dbMock.__setQueryResult("scoreCourses", { id: "sc1" });

    const id = await svc.scoreCourse(60, 10, "reg1", "sem1");
    expect(id).toBe("sc1");

    // missing registered course
    dbMock.__setQueryResult("courseRegistrations", undefined);
    await expect(svc.scoreCourse(60, 10, "bad", "sem1")).rejects.toThrow(
      NotFound,
    );
  });

  it("updateCourseScore - success and NotFound", async () => {
    const svc = new Scores();
    // user exists
    dbMock.__setQueryResult("users", { id: "u1" });
    // courseScore exists
    dbMock.__setQueryResult("scoreCourses", {
      id: "sc1",
      userId: "u1",
      registeredCourseId: "reg1",
      semester: "sem1",
      examScore: 10,
      testScore: 5,
      grade: "C",
    });

    const updated = await svc.updateCourseScore(70, 10, "M001", "reg1", "sem1");
    expect(updated.grade).toBeDefined();

    // user not found
    dbMock.__setQueryResult("users", undefined);
    await expect(
      svc.updateCourseScore(70, 10, "M002", "reg1", "sem1"),
    ).rejects.toThrow(NotFound);
  });

  it("fetchCourseScore and getScoresForCourse and getAllRegisteredCoursesByASpecificUser success paths", async () => {
    const svc = new Scores();

    dbMock.__pushSelectResult([
      {
        id: "sc1",
        registeredCourseId: "reg1",
        registrationId: "reg1",
        userId: "u1",
        name: "A",
        matricNo: "M001",
        email: "a@b",
        courseCode: "CSC1",
        courseTitle: "Intro",
        semester: "sem1",
        testScore: 10,
        examScore: 60,
        grade: "A",
        scoredAt: new Date(),
      },
    ]);
    const sc = await svc.fetchCourseScore("sc1");
    expect(sc.id).toBe("sc1");

    // getScoresForCourse - course not found
    dbMock.__setQueryResult("courses", undefined);
    await expect(svc.getScoresForCourse("NOPE", "sem1")).rejects.toThrow(
      NotFound,
    );

    // getScoresForCourse, success
    dbMock.__setQueryResult("courses", {
      id: "c1",
      courseCode: "CSC1",
      title: "Intro",
      units: 3,
      semester: "Rain",
      level: 100,
    });
    dbMock.__pushSelectResult([{ scoreId: "s1" }]);
    const scores = await svc.getScoresForCourse("CSC1", "sem1");
    expect(scores.scores.length).toBeGreaterThan(0);

    // getAllRegisteredCoursesByASpecificUser, success
    dbMock.__pushSelectResult([{ id: "r1" }]);
    const regs = await svc.getAllRegisteredCoursesByASpecificUser("u1", "sem1");
    expect(regs.length).toBeGreaterThan(0);
  });
});
