import type { users } from "./db/schema/user";
import type { MySqlRawQueryResult } from "drizzle-orm/mysql2";

export type JWTPayload = {
  email: string,
  matricNo: number,
  sessionId: string,
}

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

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
}

type avatarUser = {
  user: User;
  newUrl: string;
};

export interface UserService {
  createUser: (payload: userOptions) => Promise<MySqlRawQueryResult>;
  login: (payload: loginOptions) => Promise<tokenizedUser>;
  logout: (payload: any) => Promise<void>;
  updateUserInfo: (
    id: string,
    paylaod: Partial<User>
  ) => Promise<NewUser>;
  updatePassword: (id: string, password: string) => Promise<NewUser>;
  deleteUser: (id: string) => Promise<NewUser>;
  getSpecificUser: (id: string) => Promise<NewUser>;
  uploadAvatar: (
    id: string,
    file: File
  ) => Promise<avatarUser>;
  createOTP: () => Promise<string>;
  verifyOTP: () => Promise<boolean>;
}