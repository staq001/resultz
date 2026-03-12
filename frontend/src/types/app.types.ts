import type { ComponentProps } from "react";

export type Page = "landing" | "auth" | "student" | "admin";

export type Role = "student" | "admin";

export type AuthMode = "login" | "signup";

export type AdminSection =
  | "overview"
  | "departments"
  | "courses"
  | "semesters"
  | "settings";

export type StudentSection =
  | "overview"
  | "registration"
  | "results"
  | "settings";

export type SidebarNavItem = {
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
};

export type Course = {
  code: string;
  title: string;
  unit: number;
  department: string;
};

export type StudentResult = {
  courseCode: string;
  courseTitle: string;
  unit: number;
  grade: string;
  score: number;
  semester: string;
};

export type NewCourseForm = {
  code: string;
  title: string;
  unit: number;
  department: string;
};

export type AuthUserProfile = {
  id: string;
  name: string;
  email: string;
  matricNo: string;
  avatar?: string | null;
  isAdmin: boolean;
};

export type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>;
