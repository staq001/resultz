import { useState } from "react";
import { useToast } from "../components/ToastProvider";
import type { Course } from "../types/app.types";

type StudentRegistrationPageProps = {
  currentSemester: string;
  currentLevel: number | null;
  courses: Course[];
  registeredCourseCodes: string[];
  isLoadingCourses: boolean;
  onRegisterCourse: (code: string) => Promise<void>;
  onSearchCourse: (code: string) => Promise<Course>;
};

export function StudentRegistrationPage({
  currentSemester,
  currentLevel,
  courses,
  registeredCourseCodes,
  isLoadingCourses,
  onRegisterCourse,
  onSearchCourse,
}: StudentRegistrationPageProps) {
  const [savingCourseCode, setSavingCourseCode] = useState<string | null>(null);
  const [searchCode, setSearchCode] = useState("");
  const [searchedCourse, setSearchedCourse] = useState<Course | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const toast = useToast();
  const maxRegistrationCount = 12;
  const normalizedRegisteredCourseCodes = new Set(
    registeredCourseCodes.map((code) => code.trim().toUpperCase()),
  );
  const hasReachedRegistrationLimit =
    registeredCourseCodes.length >= maxRegistrationCount;

  const submitCourseRegistration = (courseCode: string) => {
    setSavingCourseCode(courseCode);
    void onRegisterCourse(courseCode)
      .then(() => {
        toast.success(`${courseCode} registered successfully.`);
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Unable to register course.",
        );
      })
      .finally(() => {
        setSavingCourseCode(null);
      });
  };

  const submitCourseSearch = () => {
    const normalizedSearchCode = searchCode.trim().toUpperCase();
    if (!normalizedSearchCode) {
      toast.error("Enter a course code to search.");
      return;
    }

    setIsSearching(true);
    void onSearchCourse(normalizedSearchCode)
      .then((course) => {
        setSearchedCourse(course);
      })
      .catch((error) => {
        setSearchedCourse(null);
        toast.error(
          error instanceof Error ? error.message : "Unable to find course.",
        );
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  return (
    <main className="dashboard-wrap page-stack">
      <section className="panel">
        <div className="section-title">
          <h3>Eligible Courses</h3>
          <span className="status-pill subtle">
            {currentSemester || "Semester not set"}
          </span>
        </div>
        <p className="sub">
          {currentLevel
            ? `${currentLevel} Level default course registration list.`
            : "Default course registration list."}
        </p>

        {isLoadingCourses && (
          <p className="sub table-empty">Loading eligible courses...</p>
        )}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Title</th>
                <th>Department</th>
                <th>Unit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const normalizedCourseCode = course.code.trim().toUpperCase();
                const isRegistered =
                  normalizedRegisteredCourseCodes.has(normalizedCourseCode);
                const isSaving = savingCourseCode === course.code;
                const disableRegister =
                  isRegistered || isSaving || hasReachedRegistrationLimit;
                return (
                  <tr key={course.code}>
                    <td>{course.code}</td>
                    <td>{course.title}</td>
                    <td>{course.department}</td>
                    <td>{course.unit}</td>
                    <td>
                      <button
                        type="button"
                        className={
                          isRegistered ? "secondary small" : "primary small"
                        }
                        onClick={() => submitCourseRegistration(course.code)}
                        disabled={disableRegister}
                      >
                        {isSaving
                          ? "Registering..."
                          : isRegistered
                            ? "Registered"
                            : "Register"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {courses.length === 0 && (
          <p className="sub table-empty">
            No eligible courses are available for your course of study in the
            active semester yet.
          </p>
        )}
        {hasReachedRegistrationLimit && (
          <p className="sub table-empty">
            You have reached the maximum of 12 course registrations for this
            semester.
          </p>
        )}

        <section className="course-search-panel">
          <h4>Search another course</h4>
          <div className="course-search-row">
            <input
              value={searchCode}
              onChange={(event) => setSearchCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitCourseSearch();
                }
              }}
              placeholder="e.g. CSC 301"
              aria-label="Search another course by course code"
            />
            <button
              type="button"
              className="primary"
              onClick={submitCourseSearch}
              disabled={isSearching}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>

          {searchedCourse ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Level</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{searchedCourse.code}</td>
                    <td>{searchedCourse.title}</td>
                    <td>{searchedCourse.department}</td>
                    <td>{searchedCourse.semester}</td>
                    <td>{searchedCourse.level}</td>
                    <td>
                      <button
                        type="button"
                        className={
                          normalizedRegisteredCourseCodes.has(
                            searchedCourse.code.trim().toUpperCase(),
                          )
                            ? "secondary small"
                            : "primary small"
                        }
                        onClick={() =>
                          submitCourseRegistration(searchedCourse.code)
                        }
                        disabled={
                          normalizedRegisteredCourseCodes.has(
                            searchedCourse.code.trim().toUpperCase(),
                          ) ||
                          savingCourseCode === searchedCourse.code ||
                          hasReachedRegistrationLimit
                        }
                      >
                        {savingCourseCode === searchedCourse.code
                          ? "Registering..."
                          : normalizedRegisteredCourseCodes.has(
                                searchedCourse.code.trim().toUpperCase(),
                              )
                            ? "Registered"
                            : "Register"}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="sub">
              Search for any other course you want outside your department.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
