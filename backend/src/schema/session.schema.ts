import { z } from "zod";

export const addSessionSchema = z.object({
  sessionName: z.string().min(6, "Session name must be at least 6 characters"),
  newSessionName: z
    .string()
    .min(6, "Session name must be at least 6 characters")
    .optional(),
});

export const lockSessionSchema = z.object({
  sessionName: z.string().min(6, "Session name must be at least 6 characters"),
});
