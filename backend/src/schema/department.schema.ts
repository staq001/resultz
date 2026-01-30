import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  faculty: z.string().min(1, "Faculty is required"),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required").optional(),
  faculty: z.string().min(1, "Faculty is required").optional(),
});
