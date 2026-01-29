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
  name: z.string().min(1, "Full name is required"),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const verifyOtpSchema = z.object({
  otp: z.number().min(6, "OTP must be 6 characters"),
});
