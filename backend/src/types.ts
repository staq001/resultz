import type { ResultSetHeader } from "mysql2";
import type { users } from "./db/schema/user";
import type { otps } from "./db/schema/otp";
import type { courses } from "./db/schema/course";

export type JWTPayload = {
  email: string;
  matricNo: number;
  sessionId: string;
};

type table = typeof users | typeof otps | typeof courses;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type NewOtp = typeof otps.$inferInsert;
export type NewCourse = typeof courses.$inferInsert;

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
export type Values = NewUser | NewOtp | NewCourse;

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

export 