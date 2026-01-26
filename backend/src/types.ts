import type { ResultSetHeader } from "mysql2";
import type { users } from "./db/schema/user";
import type { otps } from "./db/schema/otp";
import type { courses } from "./db/schema/course";
import { departments } from "./db/schema/department";

export type JWTPayload = {
  email: string;
  matricNo: number;
  sessionId: string;
};

type table = typeof users | typeof otps | typeof courses | typeof departments;

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
  user: ResultSetHeader;
  newUrl: string;
};

export type Table = table;
export type Values = NewUser | NewOtp | NewCourse | NewDepartment;

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
  createOTP: (userId: string) => Promise<number>;
  verifyOTP: (userId: string, otp: number) => Promise<boolean>;
}

/************************* COURSES */

export type NewCourse = typeof courses.$inferInsert;
export type Course = typeof courses.$inferSelect;

export type FindCoursesBySemester = {
  department: string;
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
  findCoursesBySemester: (
    payload: FindCoursesBySemester,
    page: number,
    limit: number,
  ) => Promise<{ page: number; totalPages: number; courses: Course[] }>;
  findCoursesByYear: (
    department: string,
    year: number,
    page: number,
    limit: number,
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
