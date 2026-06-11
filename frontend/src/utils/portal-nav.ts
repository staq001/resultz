import type {
  AdminSection,
  StaffSection,
  SidebarNavItem,
  StudentSection,
} from "../types/app.types";

export function buildAdminNavItems(
  adminSection: AdminSection,
  goToAdminSection: (section: AdminSection) => void,
): SidebarNavItem[] {
  return [
    {
      label: "Dashboard",
      path: "/admin",
      isActive: adminSection === "overview",
      onClick: () => goToAdminSection("overview"),
    },
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
      label: "Dashboard",
      path: "/student",
      isActive: studentSection === "overview",
      onClick: () => goToStudentSection("overview"),
    },
    {
      label: "Course Registration",
      path: "/student/registration",
      isActive: studentSection === "registration",
      onClick: () => goToStudentSection("registration"),
    },
    {
      label: "Registered Courses",
      path: "/student/registered-courses",
      isActive: studentSection === "registered-courses",
      onClick: () => goToStudentSection("registered-courses"),
    },
    {
      label: "Results",
      path: "/student/results",
      isActive:
        studentSection === "results" ||
        studentSection === "result-sheet" ||
        studentSection === "comprehensive-report",
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

export function buildStaffNavItems(
  staffSection: StaffSection,
  goToStaffSection: (section: StaffSection) => void,
): SidebarNavItem[] {
  return [
    {
      label: "Dashboard",
      path: "/staff",
      isActive: staffSection === "overview",
      onClick: () => goToStaffSection("overview"),
    },
    {
      label: "Grading",
      path: "/staff/grading",
      isActive: staffSection === "grading",
      onClick: () => goToStaffSection("grading"),
    },
    {
      label: "Update Score",
      path: "/staff/scores/update",
      isActive: staffSection === "score-update",
      onClick: () => goToStaffSection("score-update"),
    },
    {
      label: "Course Scores",
      path: "/staff/scores/course",
      isActive: staffSection === "course-scores",
      onClick: () => goToStaffSection("course-scores"),
    },
    {
      label: "Settings",
      path: "/staff/settings",
      isActive: staffSection === "settings",
      onClick: () => goToStaffSection("settings"),
    },
  ];
}
