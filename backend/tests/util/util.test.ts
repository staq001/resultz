import { describe, expect, test } from "bun:test";
import {
  grading,
  gradePoints,
  classOfDegree,
  getSemesterLabel,
  getSessionStartYear,
  getSemesterOrder,
  generateOTP,
  createHash,
  verifyHash,
} from "@/utils";

describe("utils/index", () => {
  test("grading should return correct grades", () => {
    expect(grading(70, 0)).toBe("A");
    expect(grading(60, 0)).toBe("B");
    expect(grading(50, 0)).toBe("C");
    expect(grading(45, 0)).toBe("D");
    expect(grading(40, 0)).toBe("E");
    expect(grading(0, 0)).toBe("F");
  });

  test("gradePoints has expected values", () => {
    expect(gradePoints.A).toBe(5);
    expect(gradePoints.F).toBe(0);
  });

  test("classOfDegree returns expected classification", () => {
    expect(classOfDegree(4.6)).toBe("FIRST CLASS");
    expect(classOfDegree(3.6)).toContain("SECOND CLASS");
    expect(classOfDegree(2.5)).toContain("SECOND CLASS");
    expect(classOfDegree(1.6)).toBe("THIRD CLASS");
    expect(classOfDegree(1.0)).toBe("PASS");
  });

  test("semester and session helpers", () => {
    expect(getSemesterLabel("Harmattan")).toBe("First Semester");
    expect(getSemesterLabel("Rain")).toBe("Second Semester");
    expect(getSessionStartYear("2020/2021")).toBe(2020);
    expect(getSemesterOrder("Harmattan")).toBe(1);
    expect(getSemesterOrder("Rain")).toBe(2);
  });

  test("OTP and hashing helpers", () => {
    const otp = generateOTP();
    expect(typeof otp).toBe("number");

    const { hash, salt } = createHash("123456");
    expect(typeof hash).toBe("string");
    expect(typeof salt).toBe("string");
    expect(verifyHash("123456", salt, hash)).toBe(true);
    expect(verifyHash("000000", salt, hash)).toBe(false);
  });
});
