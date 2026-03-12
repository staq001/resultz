import type {
  AdminSection,
  SidebarNavItem,
  StudentSection,
} from "../types/app.types";

export function buildAdminNavItems(
  adminSection: AdminSection,
  goToAdminSection: (section: AdminSection) => void,
): SidebarNavItem[] {
  return [
    {
      label: "Departments",
      path: "/admin/departments",
      isActive: adminSection === "departments",
      onClick: () => goToAdminSection("departments"),
    },
    {
      label: "Courses",
      path: "/admin/courses",
      isActive: adminSection === "courses",
      onClick: () => goToAdminSection("courses"),
    },
    {
      label: "Semesters",
      path: "/admin/semesters",
      isActive: adminSection === "semesters",
      onClick: () => goToAdminSection("semesters"),
    },
    {
      label: "Settings",
      path: "/admin/settings",
      isActive: adminSection === "settings",
      onClick: () => goToAdminSection("settings"),
    },
  ];
}

export function buildStudentNavItems(
  studentSection: StudentSection,
  goToStudentSection: (section: StudentSection) => void,
): SidebarNavItem[] {
  return [
    {
      label: "Course Registration",
      path: "/student/registration",
      isActive: studentSection === "registration",
      onClick: () => goToStudentSection("registration"),
    },
    {
      label: "Results",
      path: "/student/results",
      isActive: studentSection === "results",
      onClick: () => goToStudentSection("results"),
    },
    {
      label: "Settings",
      path: "/student/settings",
      isActive: studentSection === "settings",
      onClick: () => goToStudentSection("settings"),
    },
  ];
}
