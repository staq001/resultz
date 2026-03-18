import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  matricNo: z
    .string()
    .min(10, "Matric No must be at least 8 characters")
    .optional(),
});

export const loginSchema = z
  .object({
    email: z.email("Invalid email address").optional(),
    matricNo: z.string().min(1, "Matric number is required").optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((value) => Boolean(value.email || value.matricNo), {
    message: "Provide email or matric number to log in",
    path: ["email"],
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
