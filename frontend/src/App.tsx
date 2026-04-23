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
  fetchDepartments,
  updateDepartment as updateDepartmentApi,
  type DepartmentRecord,
} from "./services/departments.api";
import {
  createCourse as createCourseApi,
  fetchCoursesByDepartment,
  updateCourse as updateCourseApi,
  type CourseRecord,
} from "./services/courses.api";
import {
  createSemester as createSemesterApi,
  fetchCurrentSemester as fetchCurrentSemesterApi,
  fetchSemesters as fetchSemestersApi,
  setSemester as setSemesterApi,
  updateSemester as updateSemesterApi,
} from "./services/semester.api";
import {
  createCourseScore,
  fetchRegisteredUsersForCourse as fetchRegisteredUsersForCourseApi,
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
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isBootstrappingAuth, setIsBootstrappingAuth] = useState(true);
  const toast = useToast();
  const [departmentRecords, setDepartmentRecords] = useState<
    DepartmentRecord[]
  >([]);
  const [courseRecords, setCourseRecords] = useState<
    Array<CourseRecord & { departmentName: string }>
  >([]);
  const [currentSemester, setCurrentSemester] = useState("Not set");
  const [managedSemesters, setManagedSemesters] = useState<string[]>([]);
  const [isLoadingSemesterData, setIsLoadingSemesterData] = useState(false);

  const {
    departments,
    courses,
    registeredCourseCodes,
    newCourse,
    semesters,
    activeSemester,
    semesterResults,
    currentGpa,
    currentCgpa,
    setDepartments,
    setCourses,
    setNewCourse,
    setActiveSemester,
    toggleCourseRegistration,
  } = useAcademicData();

  const syncCoursesWithDepartments = (
    allDepartments: DepartmentRecord[],
    allCourses: Array<CourseRecord & { departmentName: string }>,
  ) => {
    setDepartments(allDepartments.map((department) => department.name));
    setCourses(
      allCourses.map((course) => ({
        code: course.courseCode,
        title: course.title,
        unit: course.units,
        department: course.departmentName,
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

  const loadAdminDepartmentsAndCourses = async () => {
    const storedSession = loadAuthSession();
    if (!storedSession?.token) return;

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

    setIsLoadingSemesterData(true);
    try {
      const current = await fetchCurrentSemesterApi(
        apiBaseUrl,
        storedSession.token,
      );

      if (portalRole === "admin") {
        const sessions = await fetchSemestersApi(
          apiBaseUrl,
          storedSession.token,
        );
        setManagedSemesters(sessions);
      } else {
        setManagedSemesters([]);
      }

      setCurrentSemester(current?.trim() ? current : "Not set");
    } finally {
      setIsLoadingSemesterData(false);
    }
  };

  const syncStateWithPath = (pathname: string) => {
    const hasSession = Boolean(loadAuthSession()?.token);

    if (pathname.startsWith("/admin")) {
      if (!hasSession) {
        window.history.replaceState({}, "", LOGIN_PATH);
        setPage("auth");
        setAuthMode("login");
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
        await signupUser(apiBaseUrl, {
          name: userName,
          email: authEmail,
          password: authPassword,
          matricNo: role === "student" ? authMatricNo : undefined,
        });

        setAuthMode("login");
        setAuthPassword("");
        setAuthMatricNo("");
        toast.success("Account created successfully. You can now log in.");
        return;
      }

      const loginPayload =
        role === "student"
          ? { matricNo: authMatricNo, password: authPassword }
          : { email: authEmail, password: authPassword };

      const { token } = await loginUser(apiBaseUrl, loginPayload);
      const profileUser = await fetchUserProfile(apiBaseUrl, token);

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

    const portalRole = page === "admin" ? "admin" : "staff";

    void Promise.all([
      loadAdminDepartmentsAndCourses(),
      loadAdminSemesterData(portalRole),
    ]).catch((error) => {
      const message =
        error instanceof Error ? error.message : "Failed to load admin data.";
      toast.error(message);
    });
  }, [page, currentUser?.isAdmin, currentUser?.isStaff, role, toast]);

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
      setAuthEmail("");
      setAuthPassword("");
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
    });
    await loadAdminDepartmentsAndCourses();
  };

  const handleUpdateCourse = async (courseForm: {
    code: string;
    title: string;
    unit: number;
    department: string;
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
      await updateCourseScore(
        apiBaseUrl,
        storedSession.token,
        params.scoreId,
        params.testScore,
        params.examScore,
      );
      return { nextScoreId: params.scoreId };
    }

    const createdScoreId = await createCourseScore(
      apiBaseUrl,
      storedSession.token,
      params.registrationId,
      params.testScore,
      params.examScore,
    );

    return { nextScoreId: createdScoreId };
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
          email={authEmail}
          password={authPassword}
          isSubmitting={isAuthenticating}
          onSetAuthMode={handleSetAuthMode}
          onSetRole={setRole}
          onSetUserName={setUserName}
          onSetMatricNo={setAuthMatricNo}
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
        >
          <StudentPortalContent
            studentSection={studentSection}
            userName={currentUser?.name ?? userName}
            userEmail={currentUser?.email ?? userEmail}
            matricNo={currentUser?.matricNo ?? authMatricNo}
            currentGpa={currentGpa}
            currentCgpa={currentCgpa}
            registeredCourseCodes={registeredCourseCodes}
            courses={courses}
            semesters={semesters}
            activeSemester={activeSemester}
            semesterResults={semesterResults}
            onGoToSection={goToStudentSection}
            onToggleCourseRegistration={toggleCourseRegistration}
            onChangeSemester={setActiveSemester}
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
            userName={userName}
            userEmail={userEmail}
            avatarUrl={currentUser?.avatar ?? null}
            onGoToSection={goToStaffSection}
            onFetchRegisteredUsers={handleFetchRegisteredUsersForCourse}
            onSaveScore={handleSaveStaffScore}
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
