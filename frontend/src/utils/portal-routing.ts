import type {
  AdminSection,
  StaffSection,
  StudentSection,
} from "../types/app.types";

export const LOGIN_PATH = "/login";

export function getAdminSectionFromPath(pathname: string): AdminSection {
  if (pathname.startsWith("/admin/departments")) return "departments";
  if (pathname.startsWith("/admin/courses")) return "courses";
  if (pathname.startsWith("/admin/semesters")) return "semesters";
  if (pathname.startsWith("/admin/settings")) return "settings";
  return "overview";
}

export function getStudentSectionFromPath(pathname: string): StudentSection {
  if (pathname.startsWith("/student/registered-courses")) {
    return "registered-courses";
  }
  if (pathname.startsWith("/student/registration")) return "registration";
  if (pathname.startsWith("/student/results/comprehensive")) {
    return "comprehensive-report";
  }
  if (pathname.startsWith("/student/results/sheet")) return "result-sheet";
  if (pathname.startsWith("/student/results")) return "results";
  if (pathname.startsWith("/student/settings")) return "settings";
  return "overview";
}

export function getStaffSectionFromPath(pathname: string): StaffSection {
  if (pathname.startsWith("/staff/settings")) return "settings";
  if (pathname.startsWith("/staff/scores/update")) return "score-update";
  if (pathname.startsWith("/staff/scores/course")) return "course-scores";
  if (pathname.startsWith("/staff/grading")) return "grading";
  return "overview";
}

export function getAdminPath(section: AdminSection): string {
  if (section === "departments") return "/admin/departments";
  if (section === "courses") return "/admin/courses";
  if (section === "semesters") return "/admin/semesters";
  if (section === "settings") return "/admin/settings";
  return "/admin";
}

export function getStudentPath(section: StudentSection): string {
  if (section === "registered-courses") return "/student/registered-courses";
  if (section === "registration") return "/student/registration";
  if (section === "comprehensive-report") {
    return "/student/results/comprehensive";
  }
  if (section === "result-sheet") return "/student/results/sheet";
  if (section === "results") return "/student/results";
  if (section === "settings") return "/student/settings";
  return "/student";
}

export function getStaffPath(section: StaffSection): string {
  if (section === "overview") return "/staff";
  if (section === "settings") return "/staff/settings";
  if (section === "score-update") return "/staff/scores/update";
  if (section === "course-scores") return "/staff/scores/course";
  return "/staff/grading";
}
