import { z } from "zod";

export const registerCourseSchema = z.object({
  courseId: z.string().min(36, "Course ID must not be less than 36 characters"),
  semester: z.number().min(1, "Semester is required"),
  year: z.number().min(1, "Year is required"),
});
