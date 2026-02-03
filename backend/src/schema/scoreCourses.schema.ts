import { z } from "zod";

export const scoreCourseSchema = z.object({
  score: z.number().min(1, "Score is required"),
});
