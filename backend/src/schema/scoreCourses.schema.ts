import { z } from "zod";

export const scoreCourseSchema = z.object({
  examScore: z.number().min(1, "Score is required"),
  testScore: z.number().min(1, "Score is required"),
});
