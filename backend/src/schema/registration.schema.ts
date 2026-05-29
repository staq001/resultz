import { z } from "zod";

export const registerCourseSchema = z.object({
  courseCode: z
    .string()
    .min(2, "Course Code must not be less than 7 characters"),
  semesterId: z.string(),
});

export const updateRegisteredCourseSchema = z.object({
  courseCode: z
    .string()
    .min(2, "Course Code must not be less than 7 characters"),
  semester: z.string().optional(),
});
