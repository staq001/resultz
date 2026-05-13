import { z } from "zod";

export const scoreCourseSchema = z.object({
  examScore: z
    .number()
    .min(0, "Exam score cannot be less than 0")
    .max(70, "Exam score cannot be greater than 60"),
  testScore: z
    .number()
    .min(0, "Test score cannot be less than 0")
    .max(30, "Test score cannot be greater than 40"),
});
