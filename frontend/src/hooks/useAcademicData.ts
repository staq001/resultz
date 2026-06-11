import { useMemo, useState } from "react";
import type { Course, NewCourseForm, StudentResult } from "../types/app.types";

const pointsByGrade: Record<string, number> = {
  A: 5,
  "A-": 4.7,
  "B+": 4.5,
  B: 4,
  "B-": 3.5,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

const emptyNewCourse: NewCourseForm = {
  code: "",
  title: "",
  unit: 3,
  department: "",
  semester: "Rain",
  level: 100,
};

export function useAcademicData() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [registeredCourseCodes, setRegisteredCourseCodes] = useState<string[]>(
    [],
  );
  const [results] = useState<StudentResult[]>([]);
  const [newCourse, setNewCourse] = useState<NewCourseForm>(emptyNewCourse);

  const semesters = useMemo(
    () => Array.from(new Set(results.map((result) => result.semester))),
    [results],
  );

  const [activeSemester, setActiveSemester] = useState("");

  const semesterResults = useMemo(
    () => results.filter((result) => result.semester === activeSemester),
    [activeSemester, results],
  );

  const currentGpa = useMemo(() => {
    const totalUnits = semesterResults.reduce(
      (sum, result) => sum + result.unit,
      0,
    );
    if (!totalUnits) return 0;

    const weightedScore = semesterResults.reduce(
      (sum, result) => sum + pointsByGrade[result.grade] * result.unit,
      0,
    );
    return weightedScore / totalUnits;
  }, [semesterResults]);

  const currentCgpa = useMemo(() => {
    const totalUnits = results.reduce((sum, result) => sum + result.unit, 0);
    if (!totalUnits) return 0;

    const weightedScore = results.reduce(
      (sum, result) => sum + pointsByGrade[result.grade] * result.unit,
      0,
    );
    return weightedScore / totalUnits;
  }, [results]);

  return {
    departments,
    courses,
    registeredCourseCodes,
    newCourse,
    semesters,
    activeSemester,
    semesterResults,
    currentGpa,
    currentCgpa,
    setDepartments,
    setCourses,
    setRegisteredCourseCodes,
    setNewCourse,
    setActiveSemester,
  };
}
