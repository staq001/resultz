import { describe, it, expect, beforeEach, vi } from "bun:test";
import { dbMock } from "../helpers/dbMock";

vi.mock("../../src/db/mysql", () => ({ db: dbMock }));

import { Registration } from "../../src/services/registration.service";
import { NotFound } from "../../src/utils/error";

describe("RegistrationService", () => {
  beforeEach(() => dbMock.__clear());

  it("getSessionTerm returns correct term names", () => {
    const svc = new Registration();
    const term = (svc as any).getSessionTerm("2022/2023 Rain");
    expect(term).toBe("Rain");
    const term2 = (svc as any).getSessionTerm("2022/2023 Harmattan");
    expect(term2).toBe("Harmattan");
  });

  it("registerCourse - throws when user not found", async () => {
    const svc = new Registration();
    dbMock.__pushSelectResult([]); // users.findFirst, undefined
    await expect(
      svc.registerCourse({
        userId: "u1",
        courseCode: "CSC101",
        semesterId: "s1",
      } as any),
    ).rejects.toThrow(NotFound);
  });

  it("registerCourse - throws when course not found", async () => {
    const svc = new Registration();
    dbMock.__pushSelectResult([{ id: "u1" }]); // user exists
    // findCourseByCourseCode will call db.select, returns empty
    dbMock.__pushSelectResult([]);
    await expect(
      svc.registerCourse({
        userId: "u1",
        courseCode: "CSC101",
        semesterId: "s1",
      } as any),
    ).rejects.toThrow(NotFound);
  });

  it("_findRegisteredCoursesBySemester throws NotFound when empty", async () => {
    const svc = new Registration();
    dbMock.__pushSelectResult([]);
    await expect(
      (svc as any)._findRegisteredCoursesBySemester("u1", "s1"),
    ).rejects.toThrow(NotFound);
  });

  it("checkNumberOfRegisteredCourses returns true when count >=12", async () => {
    const svc = new Registration();
    dbMock.__pushSelectResult([{ count: 12 }]);
    const res = await (svc as any).checkNumberOfRegisteredCourses({
      userId: "u1",
      semesterId: "s1",
    });
    expect(res).toBe(true);
  });

  it("registerCourse - success path registers and returns code", async () => {
    const svc = new Registration();

    dbMock.__setQueryResult("users", { id: "u1" });

    //  findCourseByCourseCode to return course details
    vi.spyOn(
      Registration.prototype as any,
      "findCourseByCourseCode",
    ).mockResolvedValue({ id: "c1", courseCode: "CSC101", semester: "Rain" });

    dbMock.__setQueryResult("session", {
      id: "sem1",
      schoolSession: "2022/2023 Rain",
      registration_status: "Open",
    });

    // checkNumberOfRegisteredCourses should return false
    vi.spyOn(
      Registration.prototype as any,
      "checkNumberOfRegisteredCourses",
    ).mockResolvedValue(false);

    // ensure no existing registration
    dbMock.__setQueryResult("courseRegistrations", undefined);

    const res = await svc.registerCourse({
      userId: "u1",
      courseCode: "CSC101",
      semesterId: "sem1",
    } as any);
    expect(res.course).toBe("CSC101");
  });

  it("fetchRegisteredCourse, findRegisteredCoursesBySemester, dropRegisteredCourse, findCourseByCourseCode and fetchRegisteredUsersForCourse - success paths", async () => {
    const svc = new Registration();

    // fetchRegisteredCourse success
    dbMock.__setQueryResult("courseRegistrations", { id: "r1", userId: "u1" });
    const reg = await svc.fetchRegisteredCourse("r1", "u1");
    expect(reg.id).toBe("r1");

    // findRegisteredCoursesBySemester, delegate 2 private _findRegisteredCoursesBySemester
    dbMock.__pushSelectResult([{ id: "r1", courseCode: "CSC101" }]);
    const list = await svc.findRegisteredCoursesBySemester("u1", "s1");
    expect(list.length).toBeGreaterThan(0);

    // dropRegisteredCourse success
    dbMock.__setQueryResult("courseRegistrations", {
      id: "r1",
      userId: "u1",
      semester: "s1",
    });
    dbMock.__setQueryResult("session", {
      id: "s1",
      registration_status: "Open",
    });
    await expect(svc.dropRegisteredCourse("r1", "u1")).resolves.toBeUndefined();

    // findCourseByCourseCode success
    dbMock.__pushSelectResult([
      {
        id: "c1",
        courseCode: "CSC101",
        title: "Intro",
        units: 3,
        semester: "Rain",
        level: 100,
        departmentId: "d1",
        departmentName: "CS",
      },
    ]);
    const course = await (svc as any).findCourseByCourseCode("CSC101");
    expect(course.courseCode).toBe("CSC101");

    // fetchRegisteredUsersForCourse success
    dbMock.__setQueryResult("courses", {
      id: "c1",
      courseCode: "CSC101",
      title: "Intro",
    });
    dbMock.__pushSelectResult([
      { registrationId: "r1", userId: "u1", name: "A" },
    ]);
    const users = await svc.fetchRegisteredUsersForCourse("CSC101", "s1");
    expect(users.registeredUsers.length).toBeGreaterThan(0);
  });
});
