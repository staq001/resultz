import { z } from "zod";

export const addCourseSchema = z.object({
  courseCode: z.string().min(6, "Course code must be at least 6 characters"),
  units: z.number().min(1, "Course unit is required"),
  title: z.string().min(8, "Title of the course is required"),
  semester: z.enum(
    ["Rain", "Harmattan"],
    "Semester is required e.g., Rain, Harmattan",
  ),
  level: z.number().min(1, "Level is req,uired e.g 100, 200, 500"),
});

export const updateCourseSchema = z.object({
  courseCode: z.string().min(6, "Course code must be at least 6 characters"),
  units: z.number().min(1, "Course unit is required").optional(),
  title: z.string().min(8, "Title of the course is required").optional(),
  semester: z.enum(
    ["Rain", "Harmattan"],
    "Semester is required e.g., Rain, Harmattan",
  ),
  level: z.number().min(1, "Level is required e.g 100, 200, 500").optional(),
});
