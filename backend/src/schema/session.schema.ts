import { z } from "zod";

export const addSessionSchema = z.object({
  sessionName: z.string().min(10, "Session name must be at least 6 characters"),
  newSessionName: z
    .string()
    .min(10, "Session name must be at least 6 characters")
    .optional(),
});
