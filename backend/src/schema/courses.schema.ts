import { z } from "zod";

export const addCourseSchema = z.object({
  courseCode: z.string().min(6, "Course code must be at least 6 characters"),
  units: z.number().min(1, "Course unit is required"),
  title: z.string().min(8, "Title of the course is required"),
});

export const updateCourseSchema = z.object({
  courseCode: z
    .string()
    .min(6, "Course code must be at least 6 characters")
    .optional(),
  units: z.number().min(1, "Course unit is required").optional(),
  title: z.string().min(8, "Title of the course is required").optional(),
});
