import { describe, it, expect, beforeEach, vi } from "bun:test";
import { dbMock } from "../helpers/dbMock";

vi.mock("../../src/db/mysql", () => ({ db: dbMock }));

import { CourseService } from "../../src/services/course.service";
import { NotFound, BadRequest } from "../../src/utils/error";

describe("CourseService", () => {
  beforeEach(() => {
    dbMock.__clear();
  });

  it("addCourse - success when course code absent", async () => {
    const svc = new CourseService();
    dbMock.__pushSelectResult([]); // findCourseByCourseCode returns nothing
    const courseValues = {
      courseCode: "CSC101",
      title: "Intro",
      units: 3,
      semester: "Rain",
      level: 100,
      departmentId: "d1",
    } as any;

    const res = await svc.addCourse(courseValues);
    // insertWithContext will use db.insert and return affectedRows=1 & method returns values
    expect(res).toEqual(courseValues);
  });

  it("findSpecificCourse - returns course when exists", async () => {
    const svc = new CourseService();
    dbMock.__pushSelectResult([
      {
        id: "c1",
        title: "Intro",
        courseCode: "CSC101",
        departmentId: "d1",
        units: 3,
        semester: "Rain",
        level: 100,
      },
    ]);

    const course = await svc.findSpecificCourse("c1");
    expect(course.title).toBe("Intro");
  });

  it("findSpecificCourse - throws NotFound when missing", async () => {
    const svc = new CourseService();
    dbMock.__pushSelectResult([]);
    await expect(svc.findSpecificCourse("nope")).rejects.toThrow(NotFound);
  });

  it("getAvailableCoursesForStudent - happy path returns assembled object", async () => {
    const svc = new CourseService();

    // user
    dbMock.__pushSelectResult([
      { id: "u1", department: "CS", matricNo: "M001", entryYear: 2020 },
    ]);
    // activeSessionName currentSession
    dbMock.__pushSelectResult([{ currentSession: "2022/2023 Harmattan" }]);
    // activeSession
    dbMock.__pushSelectResult([
      { id: "sem1", schoolSession: "2022/2023 Harmattan" },
    ]);
    // department
    dbMock.__pushSelectResult([{ id: "d1", name: "CS" }]);
    // available courses
    dbMock.__pushSelectResult([
      {
        id: "c1",
        title: "Intro",
        courseCode: "CSC101",
        units: 3,
        semester: "Harmattan",
        level: 200,
        departmentId: "d1",
      },
    ]);

    const res = await svc.getAvailableCoursesForStudent("u1");
    expect(res.department).toBeDefined();
    expect(res.courses.length).toBe(1);
  });

  it("getAllCourses throws NotFound when no courses", async () => {
    const svc = new CourseService();
    dbMock.__pushSelectResult([{ count: 0 }]);
    await expect(svc.getAllCourses("d1", 10, 1, "Rain")).rejects.toThrow(
      NotFound,
    );
  });

  it("deleteCourse and updateCourse do not throw", async () => {
    const svc = new CourseService();
    await expect(svc.deleteCourse("c1")).resolves.toBeUndefined();
    await expect(
      svc.updateCourse("c1", { title: "New" }),
    ).resolves.toBeUndefined();
  });

  it("getAllCourses returns paged result when courses exist", async () => {
    const svc = new CourseService();
    dbMock.__pushSelectResult([{ count: 2 }]);
    dbMock.__pushSelectResult([
      {
        id: "c1",
        title: "A",
        courseCode: "CSC1",
        departmentId: "d1",
        units: 3,
        semester: "Rain",
        level: 200,
      },
      {
        id: "c2",
        title: "B",
        courseCode: "CSC2",
        departmentId: "d1",
        units: 3,
        semester: "Rain",
        level: 200,
      },
    ]);

    const result = await svc.getAllCourses("d1", 10, 1, "Rain", 200);
    expect(result.courses.length).toBe(2);
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });

  it("private helpers: normalize/convert years and infer level", () => {
    const svc = new CourseService();
    // normalizeAcademicYear
    expect((svc as any).normalizeAcademicYear(21)).toBe(2021);
    expect((svc as any).normalizeAcademicYear(2021)).toBe(2021);
    expect(() => (svc as any).normalizeAcademicYear(NaN)).toThrow(BadRequest);

    // extractSessionStartYear
    expect((svc as any).extractSessionStartYear("2020/2021")).toBe(2020);
    expect(() => (svc as any).extractSessionStartYear("nosession")).toThrow(
      BadRequest,
    );

    // inferStudentLevel
    expect(
      (svc as any).inferStudentLevel(2020, "2022/2023"),
    ).toBeGreaterThanOrEqual(100);
  });
});
