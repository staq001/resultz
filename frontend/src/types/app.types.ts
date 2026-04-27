import type { ComponentProps } from "react";

export type Page = "landing" | "auth" | "student" | "admin" | "staff";

export type Role = "student" | "admin" | "staff";

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

export type StaffSection = "overview" | "grading" | "settings";

export type SidebarNavItem = {
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
};

export type Course = {
  id?: string;
  code: string;
  title: string;
  unit: number;
  department: string;
  semester: "Rain" | "Harmattan";
  level: number;
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
  semester: "Rain" | "Harmattan";
  level: number;
};

export type AuthUserProfile = {
  id: string;
  name: string;
  email: string;
  matricNo?: string | null;
  department?: string | null;
  avatar?: string | null;
  isAdmin: boolean;
  isStaff: boolean;
};

export type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>;
