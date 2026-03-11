import type { ResultSetHeader } from "mysql2";
import type { users, departments, otps, courses, emails } from "@/db/schema";
import type { Context, Env } from "hono";
import type z from "zod";
import type {
  loginSchema,
  signupSchema,
  updatePasswordSchema,
  updateSchema,
  verifyOtpSchema,
} from "@/schema/user.schema";
import type {
  addCourseSchema,
  updateCourseSchema,
} from "@/schema/courses.schema";
import type {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "@/schema/department.schema";
import type { registerCourseSchema } from "@/schema/registration.schema";
import type { scoreCourseSchema } from "@/schema/scoreCourses.schema";
import type { addSessionSchema } from "./schema/session.schema";

export interface RateLimiterConfig {
  identifier: string;
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimiterResult {
  allowed: boolean;
  current: number;
  limit: number;
  resetIn: number;
  remaining: number;
}

export interface reqUser {
  id: string;
  name: string;
  matricNo: string;
  email: string;
  avatar: string | null;
  isAdmin: boolean;
}

export interface safeUser {
  id: string;
  name: string;
  matricNo: string;
  email: string;
  avatar: string | null;
}

export interface AppEnv extends Env {
  Variables: {
    user: reqUser;
  };
}

type SignupSchema = z.infer<typeof signupSchema>;
type LoginSchema = z.infer<typeof loginSchema>;
type UpdateSchema = z.infer<typeof updateSchema>;
type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;
type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>;
type AddSessionSchema = z.infer<typeof addSessionSchema>;

export type SignupContext = Context<
  Env,
  any,
  { in: { json: SignupSchema }; out: { json: SignupSchema } }
>;
export type SessionContext = Context<
  Env,
  any,
  { in: { json: AddSessionSchema }; out: { json: AddSessionSchema } }
>;

export type GetUserContext = Context<AppEnv, any>;

export type LoginContext = Context<
  Env,
  any,
  { in: { json: LoginSchema }; out: { json: LoginSchema } }
>;

export type UpdateContext = Context<
  AppEnv,
  any,
  { in: { json: UpdateSchema }; out: { json: UpdateSchema } }
>;

export type UpdatePasswordContext = Context<
  AppEnv,
  any,
  { in: { json: UpdatePasswordSchema }; out: { json: UpdatePasswordSchema } }
>;

export type VerifyOTPContext = Context<
  AppEnv,
  any,
  { in: { json: VerifyOtpSchema }; out: { json: VerifyOtpSchema } }
>;

export type JWTPayload = {
  email: string;
  id: string;
  sessionId: string;
};

export type UserType = "user" | "admin";

type table =
  | typeof users
  | typeof otps
  | typeof courses
  | typeof departments
  | typeof emails;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type NewOtp = typeof otps.$inferInsert;

export type loginOptions = {
  email: string;
  password: string;
};

export type userOptions = {
  name: string;
  email: string;
  matricNo?: string;
  password: string;
};

type avatarUser = {
  newUrl: string;
};

export type Table = table;
export type Values = NewUser | NewOtp | NewCourse | NewDepartment | NewEmail;

export interface UserService {
  createUser: (payload: userOptions) => Promise<Partial<NewUser>>;
  login: (
    payload: loginOptions,
  ) => Promise<{ user: Partial<User>; token: string }>;
  logout: (payload: any) => Promise<void>;
  updateUserName: (id: string, name: string) => Promise<ResultSetHeader>;
  updatePassword: (id: string, password: string) => Promise<ResultSetHeader>;
  deleteUser: (id: string) => Promise<ResultSetHeader>;
  uploadAvatar: (id: string, file: File) => Promise<avatarUser>;
  sendOTP: (userId: string) => Promise<void>;
  verifyOTP: (userId: string, otp: number) => Promise<boolean>;
}

/************************* COURSES */

type AddCourseSchema = z.infer<typeof addCourseSchema>;
type UpdateCourseSchema = z.infer<typeof updateCourseSchema>;

export type CourseContext = Context<
  AppEnv,
  any,
  { in: { json: AddCourseSchema }; out: { json: AddCourseSchema } }
>;

export type UpdateCourseContext = Context<
  AppEnv,
  any,
  { in: { json: UpdateCourseSchema }; out: { json: UpdateCourseSchema } }
>;

export type NewCourse = typeof courses.$inferInsert;
export type Course = typeof courses.$inferSelect;

export type FindCoursesBySemester = {
  semester: string;
};

export interface CourseService {
  addCourse: (course: NewCourse, userId: string) => Promise<Partial<NewUser>>;
  deleteCourse: (courseId: string) => Promise<void>;
  updateCourse: (courseId: string, values: NewCourse) => Promise<void>;
  findSpecificCourse: (courseId: string) => Promise<Partial<Course>>;
  getAllCourses: (
    department: string,
    limit: number,
    page: number,
  ) => Promise<{
    page: number;
    totalPages: number;
    courses: Partial<Course>[];
  }>;
}

/** DEPARTMENT */

type CreateDepartmentSchema = z.infer<typeof createDepartmentSchema>;
type UpdateDepartmentSchema = z.infer<typeof updateDepartmentSchema>;

export type CreateDepartmentContext = Context<
  Env,
  any,
  {
    in: { json: CreateDepartmentSchema };
    out: { json: CreateDepartmentSchema };
  }
>;

export type UpdateDepartmentContext = Context<
  Env,
  any,
  {
    in: { json: UpdateDepartmentSchema };
    out: { json: UpdateDepartmentSchema };
  }
>;

export type NewDepartment = typeof departments.$inferInsert;
export type Department = typeof departments.$inferInsert;

export interface DepartmentService {
  createDepartment: (payload: NewDepartment) => Promise<Values>;
  updateDepartmentName: (
    values: {
      name: string;
      faculty: string;
    },
    departmentId: string,
  ) => Promise<void>;
  getDepartmentById: (
    departmentId: string,
    faculty: string,
  ) => Promise<Department>;
  getAllDepartments: (
    page: number,
    limit: number,
    faculty?: string,
  ) => Promise<{ page: number; totalPages: number; departments: Department[] }>;
  deleteDepartment: (departmentId: string) => Promise<void>;
}

/** EMAILS */

export type NewEmail = typeof emails.$inferInsert;
export type Email = typeof emails.$inferSelect;

export interface EmailQueuePayload {
  templateId: string;
  recipient: string;
  variables?: Record<string, any>;
}
export type EmailPayload = {
  from: string;
  toEmail: string;
  subject: string;
  html: string;
};

/** REGISTRATION */
type RegisterCourseSchema = z.infer<typeof registerCourseSchema>;

export type RegisterCourseContext = Context<
  AppEnv,
  any,
  { in: { json: RegisterCourseSchema }; out: { json: RegisterCourseSchema } }
>;

export type RegisterCourse = {
  userId: string;
  courseCode: string;
  semester: string;
};

export type CheckRegisteredCourses = {
  userId: string;
  semester: string;
};

/** SCORES */
type ScoreCoursesSchema = z.infer<typeof scoreCourseSchema>;

export type ScoreCourseContext = Context<
  Env,
  any,
  { in: { json: ScoreCoursesSchema }; out: { json: ScoreCoursesSchema } }
>;
