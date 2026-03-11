import { z } from "zod";

export const registerCourseSchema = z.object({
  courseCode: z
    .string()
    .min(7, "Course Code must not be less than 7 characters"),
  semester: z.string(),
});
