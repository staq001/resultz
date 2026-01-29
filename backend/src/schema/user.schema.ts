import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  matricNo: z.number().min(10, "Matric No must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateSchema = z.object({
  userId: z.string().min(36, "Invalid ID"),
  name: z.string().min(1, "Full name is required"),
});

export const updatePasswordSchema = z.object({
  userId: z.string().min(36, "Invalid ID"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const deleteSchema = z.object({
  userId: z.string().min(36, "Invalid ID"),
});

export const verifyOtpSchema = z.object({
  userId: z.string().min(36, "Invalid ID"),
  otp: z.number().min(6, "OTP must be 6 characters"),
});
