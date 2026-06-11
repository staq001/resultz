import { useEffect, useState } from "react";
import "./App.css";
import { TopNav } from "./components/TopNav";
import { PortalShell } from "./components/PortalShell";
import { useToast } from "./components/ToastProvider";
import {
  fetchUserProfile,
  loginUser,
  logoutUser,
  signupUser,
} from "./services/auth.api";
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from "./services/auth.session";
import {
  refreshProfileAfterSettingsUpdate,
  updateUserName,
  updateUserPassword,
  uploadUserAvatar,
} from "./services/user.api";
import {
  createDepartment as createDepartmentApi,
  fetchDepartmentNames,
  fetchDepartments,
  updateDepartment as updateDepartmentApi,
  type DepartmentRecord,
} from "./services/departments.api";
import {
  createCourse as createCourseApi,
  fetchAvailableCoursesForStudent,
  fetchCoursesByDepartment,
  searchCourseByCode,
  updateCourse as updateCourseApi,
  type CourseRecord,
} from "./services/courses.api";
import {
  dropRegisteredCourse as dropRegisteredCourseApi,
  fetchRegisteredCoursesBySemester as fetchRegisteredCoursesBySemesterApi,
  registerStudentCourse as registerStudentCourseApi,
  type RegistrationRow,
} from "./services/registration.api";
import {
  fetchStudentComprehensiveReport,
  fetchStudentScoresBySemester,
  type ComprehensiveReport,
  type StudentScoreRecord,
} from "./services/results.api";
import {
  createSemester as createSemesterApi,
  fetchCurrentSemesterRecord as fetchCurrentSemesterRecordApi,
  fetchSemesters as fetchSemestersApi,
  lockSemester as lockSemesterApi,
  setSemester as setSemesterApi,
  unlockSemester as unlockSemesterApi,
  updateSemester as updateSemesterApi,
} from "./services/semester.api";
import {
  createCourseScore,
  fetchRegisteredUsersForCourse as fetchRegisteredUsersForCourseApi,
  fetchScoresForCourse as fetchScoresForCourseApi,
  updateCourseScore,
} from "./services/grading.api";
import { AuthPage } from "./pages/AuthPage";
import { LandingPage } from "./pages/LandingPage";
import { AdminPortalContent } from "./components/AdminPortalContent";
import { StaffPortalContent } from "./components/StaffPortalContent";
import { StudentPortalContent } from "./components/StudentPortalContent";
import {
  getAdminPath,
  getAdminSectionFromPath,
  getStaffPath,
  getStaffSectionFromPath,
  getStudentPath,
  getStudentSectionFromPath,
  LOGIN_PATH,
} from "./utils/portal-routing";
import {
  buildAdminNavItems,
  buildStaffNavItems,
  buildStudentNavItems,
} from "./utils/portal-nav";
import { useAcademicData } from "./hooks/useAcademicData";
import type {
  AuthMode,
  AuthUserProfile,
  FormSubmitHandler,
  Page,
  Role,
  StaffSection,
  StudentSection,
  AdminSection,
} from "./types/app.types";

function App() {
  const apiBaseUrl =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    "http://localhost:4400/api/v1";

  const [page, setPage] = useState<Page>("landing");
  const [adminSection, setAdminSection] = useState<AdminSection>("overview");
  const [staffSection, setStaffSection] = useState<StaffSection>("overview");
  const [studentSection, setStudentSection] =
    useState<StudentSection>("overview");
  const [role, setRole] = useState<Role>("student");
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [authMatricNo, setAuthMatricNo] = useState("");
  const [authDepartment, setAuthDepartment] = useState("");
  const [authEntryYear, setAuthEntryYear] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isBootstrappingAuth, setIsBootstrappingAuth] = useState(true);
  const [signupDepartments, setSignupDepartments] = useState<string[]>([]);
  const toast = useToast();
  const [departmentRecords, setDepartmentRecords] = useState<
    DepartmentRecord[]
  >([]);
  const [courseRecords, setCourseRecords] = useState<
    Array<CourseRecord & { departmentName: string }>
  >([]);
  const [currentSemester, setCurrentSemester] = useState("Not set");
  const [currentSemesterId, setCurrentSemesterId] = useState("");
  const [currentSemesterTerm, setCurrentSemesterTerm] = useState<
    "Rain" | "Harmattan" | null
  >(null);
  const [registeredCourses, setRegisteredCourses] = useState<RegistrationRow[]>(
    [],
  );
  const [studentResults, setStudentResults] = useState<StudentScoreRecord[]>(
    [],
  );
  const [studentComprehensiveReport, setStudentComprehensiveReport] =
    useState<ComprehensiveReport | null>(null);
  const [currentStudentLevel, setCurrentStudentLevel] = useState<number | null>(
    null,
  );
  const [managedSemesters, setManagedSemesters] = useState<string[]>([]);
  const [isLoadingAdminData, setIsLoadingAdminData] = useState(true);
  const [isLoadingSemesterData, setIsLoadingSemesterData] = useState(false);
  const [isLoadingStudentCourses, setIsLoadingStudentCourses] = useState(false);
  const [isLoadingStudentResults, setIsLoadingStudentResults] = useState(false);
  const [isLoadingComprehensiveReport, setIsLoadingComprehensiveReport] =
    useState(false);

  const {
    departments,
    courses,
    registeredCourseCodes,
    newCourse,
    semesters,
    setDepartments,
    setCourses,
    setRegisteredCourseCodes,
    setNewCourse,
  } = useAcademicData();

  const syncCoursesWithDepartments = (
    allDepartments: DepartmentRecord[],
    allCourses: Array<CourseRecord & { departmentName: string }>,
  ) => {
    setDepartments(allDepartments.map((department) => department.name));
    setCourses(
      allCourses.map((course) => ({
        id: course.id,
        code: course.courseCode,
        title: course.title,
        unit: course.units,
        department: course.departmentName,
        semester: course.semester,
        level: course.level,
      })),
    );

    if (allDepartments.length > 0) {
      setNewCourse((current) => ({
        ...current,
        department: allDepartments.some(
          (department) => department.name === current.department,
        )
          ? current.department
          : allDepartments[0].name,
      }));
    }
  };

  const getDefaultPathForRole = (nextRole: Role) => {
    if (nextRole === "admin") return getAdminPath("overview");
    if (nextRole === "staff") return getStaffPath("overview");
    return getStudentPath("overview");
  };

  const getRoleFromSession = () => {
    const storedSession = loadAuthSession();
    if (!storedSession) return null;

    if (storedSession.user.isAdmin) return "admin" as const;
    if (storedSession.user.isStaff) return "staff" as const;
    return "student" as const;
  };

  const getSemesterTerm = (
    semesterName: string,
  ): "Rain" | "Harmattan" | null => {
    const normalized = semesterName.trim();
    if (normalized.endsWith("Rain")) return "Rain";
    if (normalized.endsWith("Harmattan")) return "Harmattan";
    return null;
  };

  const loadAdminDepartmentsAndCourses = async () => {
    const storedSession = loadAuthSession();
    if (!storedSession?.token) return;
    if (!storedSession.user.isAdmin && !storedSession.user.isStaff) return;

    let allDepartments: DepartmentRecord[] = [];
    try {
      allDepartments = await fetchDepartments(apiBaseUrl, storedSession.token);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.toLowerCase().includes("no departments found")) {
        throw error;
      }
    }

    const settledCourses = await Promise.all(
      allDepartments.map(async (department) => {
        try {
          const departmentCourses = await fetchCoursesByDepartment(
            apiBaseUrl,
            storedSession.token,
            department.id,
          );

          return departmentCourses.map((course) => ({
            ...course,
            departmentName: department.name,
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (message.toLowerCase().includes("no courses found")) {
            return [];
          }
          throw error;
        }
      }),
    );

    const allCourses = settledCourses.flat();
    setDepartmentRecords(allDepartments);
    setCourseRecords(allCourses);
    syncCoursesWithDepartments(allDepartments, allCourses);
  };

  const loadAdminSemesterData = async (portalRole: "admin" | "staff") => {
    const storedSession = loadAuthSession();
    if (!storedSession?.token) return;
    if (
      (portalRole === "admin" && !storedSession.user.isAdmin) ||
      (portalRole === "staff" &&
        !storedSession.user.isStaff &&
        !storedSession.user.isAdmin)
    ) {
      return;
    }

    setIsLoadingSemesterData(true);
    try {
      const currentRecordPromise = fetchCurrentSemesterRecordApi(
        apiBaseUrl,
        storedSession.token,
      ).catch(() => null);
      const sessionsPromise =
        portalRole === "admin"
          ? fetchSemestersApi(apiBaseUrl, storedSession.token).catch(() => [])
          : Promise.resolve([]);

      const [currentRecord, sessions] = await Promise.all([
        currentRecordPromise,
        sessionsPromise,
      ]);

      setManagedSemesters(portalRole === "admin" ? sessions : []);

      setCurrentSemester(
        currentRecord?.schoolSession?.trim()
          ? currentRecord.schoolSession
          : "Not set",
      );
      setCurrentSemesterId(currentRecord?.id?.trim() ?? "");
      setCurrentSemesterTerm(
        currentRecord?.schoolSession
          ? getSemesterTerm(currentRecord.schoolSession)
          : null,
      );
    } catch {
      setCurrentSemester("Not set");
      setCurrentSemesterId("");
      setCurrentSemesterTerm(null);
      if (portalRole === "admin") setManagedSemesters([]);
    } finally {
      setIsLoadingSemesterData(false);
    }
  };

  const loadStudentRegistrationData = async () => {
    const storedSession = loadAuthSession();
    if (!storedSession?.token) return;
    if (storedSession.user.isAdmin || storedSession.user.isStaff) return;

    setIsLoadingStudentCourses(true);

    try {
      const [currentRecord, availableCourseData] = await Promise.all([
        fetchCurrentSemesterRecordApi(apiBaseUrl, storedSession.token),
        fetchAvailableCoursesForStudent(apiBaseUrl, storedSession.token),
      ]);
      const normalizedSemester = currentRecord?.schoolSession?.trim() ?? "";
      const normalizedSemesterId = currentRecord?.id?.trim() ?? "";

      setCurrentSemester(normalizedSemester || "Not set");
      setCurrentSemesterId(normalizedSemesterId);
      setCurrentSemesterTerm(getSemesterTerm(normalizedSemester));

      if (!normalizedSemesterId) {
        setCourses([]);
        setRegisteredCourses([]);
        setRegisteredCourseCodes([]);
        setStudentResults([]);
        setCurrentStudentLevel(null);
        return;
      }

      const resolvedSemesterName =
        availableCourseData.currentSessionName.trim() || normalizedSemester;
      const resolvedSemesterId =
        availableCourseData.currentSessionId.trim() || normalizedSemesterId;

      setCurrentSemester(resolvedSemesterName || "Not set");
      setCurrentSemesterId(resolvedSemesterId);
      setCurrentSemesterTerm(availableCourseData.semester);
      setCurrentStudentLevel(
        availableCourseData.level > 0 ? availableCourseData.level : null,
      );
      setCourses(
        availableCourseData.courses.map((course) => ({
          id: course.id,
          code: course.courseCode,
          title: course.title,
          unit: course.units,
          department: course.departmentName,
          semester: course.semester,
          level: course.level,
        })),
      );

      setIsLoadingStudentResults(true);
      setIsLoadingComprehensiveReport(true);
      const [registeredCourses, scores, report] = await Promise.all([
        fetchRegisteredCoursesBySemesterApi(
          apiBaseUrl,
          storedSession.token,
          resolvedSemesterId,
        ),
        fetchStudentScoresBySemester(
          apiBaseUrl,
          storedSession.token,
          resolvedSemesterId,
        ).finally(() => {
          setIsLoadingStudentResults(false);
        }),
        fetchStudentComprehensiveReport(
          apiBaseUrl,
          storedSession.token,
        ).finally(() => {
          setIsLoadingComprehensiveReport(false);
        }),
      ]);

      setRegisteredCourses(registeredCourses);
      setRegisteredCourseCodes(() => {
        if (registeredCourses.length === 0) return [];

        const registeredCodes = registeredCourses
          .map((course) => course.courseCode?.trim().toUpperCase())
          .filter((code): code is string => Boolean(code));

        if (registeredCodes.length > 0) {
          return Array.from(new Set(registeredCodes));
        }

        const availableCourseById = new Map(
          availableCourseData.courses.map((course) => [
            course.id,
            course.courseCode,
          ]),
        );

        return registeredCourses
          .map((course) => availableCourseById.get(course.courseId))
          .map((code) => code?.trim().toUpperCase())
          .filter((code): code is string => Boolean(code));
      });
      setStudentResults(scores);
      setStudentComprehensiveReport(report);
    } finally {
      setIsLoadingStudentCourses(false);
    }
  };

  const syncStateWithPath = (pathname: string) => {
    const storedSession = loadAuthSession();
    const hasSession = Boolean(storedSession?.token);
    const sessionRole = getRoleFromSession();

    if (pathname.startsWith("/admin")) {
      if (!hasSession) {
        window.history.replaceState({}, "", LOGIN_PATH);
        setPage("auth");
        setAuthMode("login");
        return;
      }
      if (sessionRole !== "admin") {
        const redirectPath = getDefaultPathForRole(sessionRole ?? "student");
        window.history.replaceState({}, "", redirectPath);
        syncStateWithPath(redirectPath);
        return;
      }
      setPage("admin");
      setAdminSection(getAdminSectionFromPath(pathname));
      return;
    }

    if (pathname.startsWith("/student")) {
      if (!hasSession) {
        window.history.replaceState({}, "", LOGIN_PATH);
        setPage("auth");
        setAuthMode("login");
        return;
      }
      if (sessionRole !== "student") {
        const redirectPath = getDefaultPathForRole(sessionRole ?? "student");
        window.history.replaceState({}, "", redirectPath);
        syncStateWithPath(redirectPath);
        return;
      }
      setPage("student");
      setStudentSection(getStudentSectionFromPath(pathname));
      return;
    }

    if (pathname.startsWith("/staff")) {
      if (!hasSession) {
        window.history.replaceState({}, "", LOGIN_PATH);
        setPage("auth");
        setAuthMode("login");
        return;
      }
      if (sessionRole !== "staff") {
        const redirectPath = getDefaultPathForRole(sessionRole ?? "student");
        window.history.replaceState({}, "", redirectPath);
        syncStateWithPath(redirectPath);
        return;
      }
      setPage("staff");
      setStaffSection(getStaffSectionFromPath(pathname));
      return;
    }

    if (pathname.startsWith("/login")) {
      setPage("auth");
      return;
    }

    if (pathname.startsWith("/auth")) {
      window.history.replaceState({}, "", LOGIN_PATH);
      setPage("auth");
      return;
    }

    setPage("landing");
  };

  const navigateTo = (pathname: string) => {
    if (window.location.pathname !== pathname) {
      window.history.pushState({}, "", pathname);
    }
    syncStateWithPath(pathname);
  };

  const handleSetAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
  };

  const goToAdminSection = (section: AdminSection) => {
    setAdminSection(section);
    setRole("admin");
    navigateTo(getAdminPath(section));
  };

  const goToStudentSection = (section: StudentSection) => {
    setStudentSection(section);
    setRole("student");
    navigateTo(getStudentPath(section));
  };

  const goToStaffSection = (section: StaffSection) => {
    setStaffSection(section);
    setRole("staff");
    navigateTo(getStaffPath(section));
  };

  const handleAuthSubmit: FormSubmitHandler = async (event) => {
    event.preventDefault();

    setIsAuthenticating(true);

    try {
      if (authMode === "signup") {
        if (role === "student") {
          let availableDepartments = signupDepartments;
          if (availableDepartments.length === 0) {
            try {
              availableDepartments = await fetchDepartmentNames(apiBaseUrl);
              setSignupDepartments(availableDepartments);
            } catch (err) {
              console.error("fetchDepartmentNames failed on submit:", err);
            }
          }

          const validDepartment = availableDepartments.some(
            (d) =>
              d.toLowerCase() === (authDepartment ?? "").trim().toLowerCase(),
          );

          if (!validDepartment) {
            toast.error("Please select a valid department from the dropdown.");
            setIsAuthenticating(false);
            return;
          }
        }

        await signupUser(apiBaseUrl, {
          name: userName,
          email: authEmail,
          password: authPassword,
          matricNo: role === "student" ? authMatricNo : undefined,
          department: role === "student" ? authDepartment : undefined,
          entryYear:
            role === "student" ? Number(authEntryYear) || undefined : undefined,
        });

        setAuthMode("login");
        setAuthPassword("");
        setAuthMatricNo("");
        setAuthDepartment("");
        setAuthEntryYear("");
        toast.success("Account created successfully. You can now log in.");
        return;
      }

      const loginPayload =
        role === "student"
          ? {
              matricNo: authMatricNo,
              password: authPassword,
              loginType: "user" as const,
            }
          : {
              email: authEmail,
              password: authPassword,
              loginType: role,
            };

      const { token, user: profileUser } = await loginUser(
        apiBaseUrl,
        loginPayload,
      );

      setCurrentUser(profileUser);
      setUserName(profileUser.name ?? "");
      setUserEmail(profileUser.email ?? "");

      if (role === "admin" && !profileUser.isAdmin) {
        toast.error("This account is not an admin account.");
        return;
      }

      if (role === "staff" && !profileUser.isStaff) {
        toast.error("This account is not a staff account.");
        return;
      }

      const targetRole: Role =
        role === "admin" ? "admin" : role === "staff" ? "staff" : "student";
      saveAuthSession(token, profileUser, targetRole);

      if (targetRole === "admin") {
        goToAdminSection(getAdminSectionFromPath(window.location.pathname));
      } else if (targetRole === "staff") {
        goToStaffSection(getStaffSectionFromPath(window.location.pathname));
      } else {
        goToStudentSection(getStudentSectionFromPath(window.location.pathname));
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not connect to backend auth service.";
      toast.error(message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    const onPopState = () => syncStateWithPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    syncStateWithPath(window.location.pathname);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    const storedSession = loadAuthSession();
    if (!storedSession) {
      setIsBootstrappingAuth(false);
      return;
    }

    let cancelled = false;

    const hydrateSession = async () => {
      setIsAuthenticating(true);

      try {
        const profileUser = await fetchUserProfile(
          apiBaseUrl,
          storedSession.token,
        );
        if (cancelled) return;

        const nextRole: Role =
          storedSession.role === "admin" && profileUser.isAdmin
            ? "admin"
            : storedSession.role === "staff" && profileUser.isStaff
              ? "staff"
              : "student";

        saveAuthSession(storedSession.token, profileUser, nextRole);
        setCurrentUser(profileUser);
        setRole(nextRole);
        setUserName(profileUser.name ?? "");
        setUserEmail(profileUser.email ?? "");
        if (nextRole === "student") {
          await loadStudentRegistrationData();
        }

        if (window.location.pathname.startsWith("/admin")) {
          goToAdminSection(getAdminSectionFromPath(window.location.pathname));
        } else if (window.location.pathname.startsWith("/staff")) {
          goToStaffSection(getStaffSectionFromPath(window.location.pathname));
        } else if (window.location.pathname.startsWith("/student")) {
          goToStudentSection(
            getStudentSectionFromPath(window.location.pathname),
          );
        } else if (nextRole === "admin") {
          goToAdminSection("overview");
        } else if (nextRole === "staff") {
          goToStaffSection("overview");
        } else {
          goToStudentSection("overview");
        }
      } catch {
        if (!cancelled) {
          clearAuthSession();
          setCurrentUser(null);
          navigateTo(LOGIN_PATH);
        }
      } finally {
        if (!cancelled) {
          setIsAuthenticating(false);
          setIsBootstrappingAuth(false);
        }
      }
    };

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  useEffect(() => {
    const shouldLoadPortalData =
      (page === "admin" && (currentUser?.isAdmin || role === "admin")) ||
      (page === "staff" && (currentUser?.isStaff || role === "staff"));
    if (!shouldLoadPortalData) return;

    setIsLoadingAdminData(true);

    const portalRole = page === "admin" ? "admin" : "staff";

    void Promise.all([
      loadAdminDepartmentsAndCourses(),
      loadAdminSemesterData(portalRole),
    ])
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Failed to load admin data.";
        toast.error(message);
      })
      .finally(() => {
        setIsLoadingAdminData(false);
      });
  }, [page, currentUser?.isAdmin, currentUser?.isStaff, role, toast]);

  useEffect(() => {
    const shouldLoadStudentData =
      page === "student" && (currentUser !== null || role === "student");
    if (!shouldLoadStudentData) return;

    void loadStudentRegistrationData().catch((error) => {
      const message =
        error instanceof Error ? error.message : "Failed to load student data.";
      toast.error(message);
    });
  }, [page, currentUser, role, apiBaseUrl, toast]);

  useEffect(() => {
    if (page !== "auth" || authMode !== "signup") return;
    if (signupDepartments.length > 0) return;

    let cancelled = false;

    void fetchDepartmentNames(apiBaseUrl)
      .then((names) => {
        if (!cancelled) setSignupDepartments(names);
      })
      .catch((err) => console.error("fetchDepartmentNames failed:", err));

    return () => {
      cancelled = true;
    };
  }, [page, authMode, apiBaseUrl, signupDepartments.length]);

  const signOut = async () => {
    const storedSession = loadAuthSession();

    try {
      if (storedSession?.token) {
        await logoutUser(apiBaseUrl, storedSession.token);
      }
    } catch {
      toast.error(
        "Could not complete server logout, but local session was cleared.",
      );
    } finally {
      setPage("landing");
      setAuthMode("login");
      setRole("student");
      setAdminSection("overview");
      setStaffSection("overview");
      setStudentSection("overview");
      setCurrentUser(null);
      setUserName("");
      setUserEmail("");
      setAuthMatricNo("");
      setAuthDepartment("");
      setAuthEntryYear("");
      setAuthEmail("");
      setAuthPassword("");
      setStudentComprehensiveReport(null);
      clearAuthSession();
      navigateTo("/");
      toast.info("Logged out successfully.");
    }
  };

  const handleUpdateUserName = async (name: string) => {
    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    await updateUserName(apiBaseUrl, storedSession.token, name);
    const refreshedUser = await refreshProfileAfterSettingsUpdate(
      apiBaseUrl,
      storedSession.token,
    );

    const activeRole: Role =
      role === "admin" && refreshedUser.isAdmin
        ? "admin"
        : role === "staff" && refreshedUser.isStaff
          ? "staff"
          : "student";
    saveAuthSession(storedSession.token, refreshedUser, activeRole);
    setCurrentUser(refreshedUser);
    setUserName(refreshedUser.name);
    setUserEmail(refreshedUser.email);
  };

  const handleCreateDepartment = async (name: string, faculty: string) => {
    const trimmedName = name.trim();
    const trimmedFaculty = faculty.trim();
    if (!trimmedName) throw new Error("Department name is required.");
    if (!trimmedFaculty) throw new Error("Faculty is required.");

    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    await createDepartmentApi(apiBaseUrl, storedSession.token, {
      name: trimmedName,
      faculty: trimmedFaculty,
    });
    await loadAdminDepartmentsAndCourses();
  };

  const handleUpdateDepartment = async (
    currentName: string,
    newName: string,
    faculty?: string,
  ) => {
    const existingDepartment = departmentRecords.find(
      (department) => department.name === currentName,
    );
    if (!existingDepartment) {
      throw new Error("Selected department was not found.");
    }

    const trimmedNewName = newName.trim();
    if (!trimmedNewName) throw new Error("New department name is required.");

    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    await updateDepartmentApi(
      apiBaseUrl,
      storedSession.token,
      existingDepartment.id,
      {
        name: trimmedNewName,
        faculty,
      },
    );
    await loadAdminDepartmentsAndCourses();
  };

  const handleFindDepartmentsByFaculty = async (faculty: string) => {
    const trimmedFaculty = faculty.trim();
    if (!trimmedFaculty) throw new Error("Faculty is required.");

    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    const records = await fetchDepartments(
      apiBaseUrl,
      storedSession.token,
      trimmedFaculty,
    );
    return records.map((record) => record.name);
  };

  const handleCreateCourse = async (courseForm: {
    code: string;
    title: string;
    unit: number;
    department: string;
    semester: "Rain" | "Harmattan";
    level: number;
  }) => {
    const department = departmentRecords.find(
      (record) => record.name === courseForm.department,
    );
    if (!department) throw new Error("Select a valid department.");

    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    await createCourseApi(apiBaseUrl, storedSession.token, department.id, {
      courseCode: courseForm.code,
      title: courseForm.title,
      units: courseForm.unit,
      semester: courseForm.semester,
      level: courseForm.level,
    });
    await loadAdminDepartmentsAndCourses();
  };

  const handleUpdateCourse = async (courseForm: {
    code: string;
    title: string;
    unit: number;
    department: string;
    semester: "Rain" | "Harmattan";
    level: number;
  }) => {
    const existingCourse = courseRecords.find(
      (course) => course.courseCode === courseForm.code,
    );
    if (!existingCourse) throw new Error("Selected course was not found.");

    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    await updateCourseApi(apiBaseUrl, storedSession.token, existingCourse.id, {
      courseCode: courseForm.code,
      title: courseForm.title,
      units: courseForm.unit,
      semester: courseForm.semester,
      level: courseForm.level,
    });
    await loadAdminDepartmentsAndCourses();
  };

  const handleFetchRegisteredUsersForCourse = async (
    courseCode: string,
    semester: string,
  ) => {
    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    return fetchRegisteredUsersForCourseApi(
      apiBaseUrl,
      storedSession.token,
      courseCode,
      semester,
    );
  };

  const handleSaveStaffScore = async (params: {
    registrationId: string;
    scoreId?: string;
    testScore: number;
    examScore: number;
  }): Promise<{ nextScoreId?: string }> => {
    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    if (params.scoreId) {
      throw new Error("Score already submitted. Use the Update Score page.");
    }

    const createdScoreId = await createCourseScore(
      apiBaseUrl,
      storedSession.token,
      params.registrationId,
      currentSemesterId,
      params.testScore,
      params.examScore,
    );

    return { nextScoreId: createdScoreId };
  };

  const handleFindStaffScore = async (params: {
    matricNo: string;
    courseCode: string;
  }) => {
    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");
    if (!currentSemesterId.trim()) {
      throw new Error("Current semester ID is not available.");
    }

    const payload = await fetchRegisteredUsersForCourseApi(
      apiBaseUrl,
      storedSession.token,
      params.courseCode,
      currentSemesterId,
    );

    const normalizedMatricNo = params.matricNo.trim().toUpperCase();
    const matchedStudent = payload.registeredUsers.find(
      (row) => row.matricNo.trim().toUpperCase() === normalizedMatricNo,
    );

    if (!matchedStudent) {
      throw new Error("No registered student found for that matric number.");
    }

    if (!matchedStudent.scoreId) {
      throw new Error("This student has not been graded for the course yet.");
    }

    return {
      scoreId: matchedStudent.scoreId,
      registrationId: matchedStudent.registrationId,
      userId: matchedStudent.userId,
      name: matchedStudent.name,
      matricNo: matchedStudent.matricNo,
      email: matchedStudent.email,
      courseCode: payload.course.courseCode ?? params.courseCode,
      courseTitle: payload.course.title,
      semester: matchedStudent.semester,
      testScore: matchedStudent.testScore ?? 0,
      examScore: matchedStudent.examScore ?? 0,
      grade: "-",
    };
  };

  const handleUpdateStaffScore = async (params: {
    matricNo: string;
    registrationId: string;
    testScore: number;
    examScore: number;
  }) => {
    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");
    if (!currentSemesterId.trim()) {
      throw new Error("Current semester ID is not available.");
    }

    await updateCourseScore(
      apiBaseUrl,
      storedSession.token,
      params.matricNo,
      params.registrationId,
      currentSemesterId,
      params.testScore,
      params.examScore,
    );
  };

  const handleFetchCourseScores = async (
    courseCode: string,
    semesterId: string,
  ) => {
    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    return fetchScoresForCourseApi(
      apiBaseUrl,
      storedSession.token,
      courseCode,
      semesterId,
    );
  };

  const handleUpdateUserPassword = async (password: string) => {
    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    await updateUserPassword(apiBaseUrl, storedSession.token, password);
  };

  const handleCreateSemester = async (semesterName: string) => {
    const trimmedSemester = semesterName.trim();
    if (!trimmedSemester) throw new Error("Semester name is required.");

    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    await createSemesterApi(apiBaseUrl, storedSession.token, trimmedSemester);
    await loadAdminSemesterData("admin");
  };

  const handleSetSemester = async (semesterName: string) => {
    const trimmedSemester = semesterName.trim();
    if (!trimmedSemester) throw new Error("Semester name is required.");

    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    await setSemesterApi(apiBaseUrl, storedSession.token, trimmedSemester);
    await loadAdminSemesterData("admin");
  };

  const handleUpdateSemester = async (
    currentSemesterName: string,
    newSemesterName: string,
  ) => {
    const fromName = currentSemesterName.trim();
    const toName = newSemesterName.trim();

    if (!fromName) throw new Error("Current semester is required.");
    if (!toName) throw new Error("New semester name is required.");

    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    await updateSemesterApi(apiBaseUrl, storedSession.token, fromName, toName);
    await loadAdminSemesterData("admin");
  };

  const handleLockSemester = async (semesterName: string) => {
    const trimmedSemester = semesterName.trim();
    if (!trimmedSemester) throw new Error("Semester name is required.");

    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    await lockSemesterApi(apiBaseUrl, storedSession.token, trimmedSemester);
    await loadAdminSemesterData("admin");
  };

  const handleUnlockSemester = async (semesterName: string) => {
    const trimmedSemester = semesterName.trim();
    if (!trimmedSemester) throw new Error("Semester name is required.");

    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    await unlockSemesterApi(apiBaseUrl, storedSession.token, trimmedSemester);
    await loadAdminSemesterData("admin");
  };

  const handleUploadAvatar = async (file: File) => {
    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    await uploadUserAvatar(apiBaseUrl, storedSession.token, file);
    const refreshedUser = await refreshProfileAfterSettingsUpdate(
      apiBaseUrl,
      storedSession.token,
    );

    const activeRole: Role =
      role === "admin" && refreshedUser.isAdmin
        ? "admin"
        : role === "staff" && refreshedUser.isStaff
          ? "staff"
          : "student";
    saveAuthSession(storedSession.token, refreshedUser, activeRole);
    setCurrentUser(refreshedUser);
    setUserName(refreshedUser.name);
    setUserEmail(refreshedUser.email);
  };

  const handleRegisterStudentCourse = async (courseCode: string) => {
    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    const normalizedCourseCode = courseCode.trim().toUpperCase();
    if (!normalizedCourseCode) throw new Error("Course code is required.");

    const activeSemesterId = currentSemesterId.trim();
    if (!currentSemester.trim() || currentSemester.trim() === "Not set") {
      throw new Error("Active semester is not available.");
    }
    if (!activeSemesterId) {
      throw new Error(
        "Active semester ID is not available from the current session response.",
      );
    }

    if (registeredCourseCodes.includes(normalizedCourseCode)) {
      throw new Error("Course already registered.");
    }

    if (registeredCourseCodes.length >= 12) {
      throw new Error(
        "You cannot register more than 12 courses in a semester.",
      );
    }

    await registerStudentCourseApi(apiBaseUrl, storedSession.token, {
      courseCode: normalizedCourseCode,
      semesterId: activeSemesterId,
    });

    await loadStudentRegistrationData();
  };

  const handleDropRegisteredCourse = async (registeredCourseId: string) => {
    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");

    await dropRegisteredCourseApi(
      apiBaseUrl,
      storedSession.token,
      registeredCourseId,
    );

    await loadStudentRegistrationData();
  };

  const handleSearchStudentCourse = async (courseCode: string) => {
    const storedSession = loadAuthSession();
    if (!storedSession?.token) throw new Error("Please login again.");
    if (!currentSemesterTerm) {
      throw new Error("Active semester term is not available.");
    }

    const course = await searchCourseByCode(
      apiBaseUrl,
      storedSession.token,
      courseCode,
      currentSemesterTerm,
    );

    return {
      id: course.id,
      code: course.courseCode,
      title: course.title,
      unit: course.units,
      department: course.departmentName ?? "Unknown",
      semester: course.semester,
      level: course.level,
    };
  };

  const adminNavItems = buildAdminNavItems(adminSection, goToAdminSection);
  const staffNavItems = buildStaffNavItems(staffSection, goToStaffSection);
  const studentNavItems = buildStudentNavItems(
    studentSection,
    goToStudentSection,
  );

  if (isBootstrappingAuth) {
    return (
      <div className="app-shell">
        <main className="auth-wrap">
          <section className="panel">
            <div className="loading-inline">
              <span className="inline-spinner" aria-hidden="true" />
              <p className="sub">Restoring session...</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {page === "landing" && (
        <TopNav
          onHome={() => navigateTo("/")}
          onLogin={() => {
            handleSetAuthMode("login");
            navigateTo(LOGIN_PATH);
          }}
          onSignup={() => {
            handleSetAuthMode("signup");
            navigateTo(LOGIN_PATH);
          }}
        />
      )}

      {page === "landing" && (
        <LandingPage
          onGetStarted={() => {
            handleSetAuthMode("login");
            setRole("student");
            navigateTo(LOGIN_PATH);
          }}
        />
      )}

      {page === "auth" && (
        <AuthPage
          authMode={authMode}
          role={role}
          userName={userName}
          matricNo={authMatricNo}
          department={authDepartment}
          entryYear={authEntryYear}
          email={authEmail}
          password={authPassword}
          isSubmitting={isAuthenticating}
          departments={signupDepartments}
          onSetAuthMode={handleSetAuthMode}
          onSetRole={setRole}
          onSetUserName={setUserName}
          onSetMatricNo={setAuthMatricNo}
          onSetDepartment={setAuthDepartment}
          onSetEntryYear={setAuthEntryYear}
          onSetEmail={setAuthEmail}
          onSetPassword={setAuthPassword}
          onSubmit={handleAuthSubmit}
        />
      )}

      {page === "admin" && (
        <PortalShell
          userName={currentUser?.name ?? userName}
          avatarUrl={currentUser?.avatar ?? null}
          navItems={adminNavItems}
          onSignOut={signOut}
        >
          <AdminPortalContent
            adminSection={adminSection}
            departments={departments}
            courses={courses}
            currentSemester={currentSemester}
            semesters={
              managedSemesters.length > 0 ? managedSemesters : semesters
            }
            newCourse={newCourse}
            userName={userName}
            userEmail={userEmail}
            avatarUrl={currentUser?.avatar ?? null}
            onGoToSection={goToAdminSection}
            onSetNewCourse={setNewCourse}
            onCreateDepartment={handleCreateDepartment}
            onUpdateDepartment={handleUpdateDepartment}
            onFindDepartmentsByFaculty={handleFindDepartmentsByFaculty}
            onCreateCourse={handleCreateCourse}
            onUpdateCourse={handleUpdateCourse}
            onCreateSemester={handleCreateSemester}
            onSetSemester={handleSetSemester}
            onUpdateSemester={handleUpdateSemester}
            onLockSemester={handleLockSemester}
            onUnlockSemester={handleUnlockSemester}
            isLoading={isLoadingAdminData}
            isLoadingSemesterData={isLoadingSemesterData}
            onUpdateName={handleUpdateUserName}
            onUpdatePassword={handleUpdateUserPassword}
            onUploadAvatar={handleUploadAvatar}
          />
        </PortalShell>
      )}

      {page === "student" && (
        <PortalShell
          userName={currentUser?.name ?? userName}
          avatarUrl={currentUser?.avatar ?? null}
          navItems={studentNavItems}
          onSignOut={signOut}
          hideSidebar={studentSection === "comprehensive-report"}
        >
          <StudentPortalContent
            studentSection={studentSection}
            userName={currentUser?.name ?? userName}
            userEmail={currentUser?.email ?? userEmail}
            matricNo={currentUser?.matricNo ?? authMatricNo}
            department={currentUser?.department ?? authDepartment}
            entryYear={
              currentUser?.entryYear ?? (Number(authEntryYear) || null)
            }
            isGraduated={currentUser?.isGraduated ?? null}
            currentLevel={currentStudentLevel}
            avatarUrl={currentUser?.avatar ?? null}
            registeredCourseCodes={registeredCourseCodes}
            registeredCourses={registeredCourses}
            courses={courses}
            currentSemester={currentSemester}
            studentResults={studentResults}
            comprehensiveReport={studentComprehensiveReport}
            isLoadingCourses={isLoadingStudentCourses}
            isLoadingResults={isLoadingStudentResults}
            isLoadingComprehensiveReport={isLoadingComprehensiveReport}
            onGoToSection={goToStudentSection}
            onRegisterCourse={handleRegisterStudentCourse}
            onDropRegisteredCourse={handleDropRegisteredCourse}
            onSearchCourse={handleSearchStudentCourse}
            onUpdateName={handleUpdateUserName}
            onUpdatePassword={handleUpdateUserPassword}
            onUploadAvatar={handleUploadAvatar}
          />
        </PortalShell>
      )}

      {page === "staff" && (
        <PortalShell
          userName={currentUser?.name ?? userName}
          avatarUrl={currentUser?.avatar ?? null}
          navItems={staffNavItems}
          onSignOut={signOut}
        >
          <StaffPortalContent
            staffSection={staffSection}
            departments={departments}
            courses={courses}
            currentSemester={currentSemester}
            currentSemesterId={currentSemesterId}
            isLoading={isLoadingAdminData}
            userName={userName}
            userEmail={userEmail}
            avatarUrl={currentUser?.avatar ?? null}
            onGoToSection={goToStaffSection}
            onFetchRegisteredUsers={handleFetchRegisteredUsersForCourse}
            onSaveScore={handleSaveStaffScore}
            onFindScore={handleFindStaffScore}
            onUpdateScore={handleUpdateStaffScore}
            onFetchCourseScores={handleFetchCourseScores}
            onUpdateName={handleUpdateUserName}
            onUpdatePassword={handleUpdateUserPassword}
            onUploadAvatar={handleUploadAvatar}
          />
        </PortalShell>
      )}
    </div>
  );
}

export default App;
