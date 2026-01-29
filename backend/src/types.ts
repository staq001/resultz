import type { ResultSetHeader } from "mysql2";
import type { users } from "./db/schema/user";
import type { otps } from "./db/schema/otp";
import type { courses } from "./db/schema/course";
import { departments } from "./db/schema/department";
import { emails } from "./db/schema/email";
import type { Context, Env } from "hono";
import type z from "zod";
import type {
  deleteSchema,
  loginSchema,
  signupSchema,
  updatePasswordSchema,
  updateSchema,
  verifyOtpSchema,
} from "./schema/user.schema";

type SignupSchema = z.infer<typeof signupSchema>;
type LoginSchema = z.infer<typeof loginSchema>;
type UpdateSchema = z.infer<typeof updateSchema>;
type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;
type DeleteSchema = z.infer<typeof deleteSchema>;
type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>;

export type SignupContext = Context<
  Env,
  "/signup",
  { in: { json: SignupSchema }; out: { json: SignupSchema } }
>;

export type LoginContext = Context<
  Env,
  "/login",
  { in: { json: LoginSchema }; out: { json: LoginSchema } }
>;

export type UpdateContext = Context<
  Env,
  "/update/name",
  { in: { json: UpdateSchema }; out: { json: UpdateSchema } }
>;

export type UpdatePasswordContext = Context<
  Env,
  "/update/password",
  { in: { json: UpdatePasswordSchema }; out: { json: UpdatePasswordSchema } }
>;

export type DeleteUserContext = Context<
  Env,
  "/delete",
  { in: { json: DeleteSchema }; out: { json: DeleteSchema } }
>;

export type UploadAvatarContext = Context<
  Env,
  "/upload/avatar",
  { in: { json: DeleteSchema }; out: { json: DeleteSchema } }
>;

export type CreateOTPContext = Context<
  Env,
  "/otp/create",
  { in: { json: DeleteSchema }; out: { json: DeleteSchema } }
>;

export type VerifyOTPContext = Context<
  Env,
  "/otp/verify",
  { in: { json: VerifyOtpSchema }; out: { json: VerifyOtpSchema } }
>;

export type JWTPayload = {
  email: string;
  matricNo: number;
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
  matricNo: number;
  password: string;
};

type tokenizedUser = {
  user: User;
  token: string;
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

export type NewCourse = typeof courses.$inferInsert;
export type Course = typeof courses.$inferSelect;

export type FindCoursesBySemester = {
  semester: number;
  year: number;
};

export interface CourseService {
  addCourse: (course: NewCourse, userId: string) => Promise<Partial<NewUser>>;
  deleteCourse: (courseId: string) => Promise<void>;
  updateCourse: (courseId: string, values: NewCourse) => Promise<void>;
  findSpecificCourse: (courseId: string) => Promise<Course>;
  getAllCourses: (
    department: string,
    limit: number,
    page: number,
  ) => Promise<{ page: number; totalPages: number; courses: Course[] }>;
}

/** DEPARTMENT */

export type NewDepartment = typeof departments.$inferInsert;
export type Department = typeof departments.$inferInsert;

export interface DepartmentService {
  createDepartment: (payload: NewDepartment) => Promise<Values>;
  updateDepartmentName: (name: string, faculty: string) => Promise<void>;
  getDepartmentById: (
    departmentId: string,
    faculty: string,
  ) => Promise<Department>;
  getAllDepartments: (
    faculty: string,
    page: number,
    limit: number,
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
export type RegisterCourse = {
  userId: string;
  courseId: string;
  semester: number;
  year: number;
};

export type CheckRegisteredCourses = {
  userId: string;
  semester: number;
  year: number;
};
