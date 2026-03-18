import { useEffect, useMemo, useState } from "react";
import type {
  Course,
  FormSubmitHandler,
  NewCourseForm,
} from "../types/app.types";
import { useToast } from "../components/ToastProvider";

type AdminCoursesPageProps = {
  title?: string;
  backButtonLabel?: string;
  departments: string[];
  courses: Course[];
  newCourse: NewCourseForm;
  onSetNewCourse: (value: NewCourseForm) => void;
  onCreateCourse: (value: NewCourseForm) => Promise<void>;
  onUpdateCourse: (value: NewCourseForm) => Promise<void>;
  onBack?: () => void;
};

export function AdminCoursesPage({
  title = "Courses",
  backButtonLabel = "Back to Admin Home",
  departments,
  courses,
  newCourse,
  onSetNewCourse,
  onCreateCourse,
  onUpdateCourse,
  onBack,
}: AdminCoursesPageProps) {
  const [fetchCode, setFetchCode] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(
    departments[0] ?? "",
  );
  const [activeDepartmentQuery, setActiveDepartmentQuery] = useState("");
  const toast = useToast();
  const [courseUpdate, setCourseUpdate] = useState<NewCourseForm>({
    code: courses[0]?.code ?? "",
    title: courses[0]?.title ?? "",
    unit: courses[0]?.unit ?? 3,
    department: courses[0]?.department ?? departments[0] ?? "",
  });

  useEffect(() => {
    if (!departments.length) {
      setSelectedDepartment("");
      return;
    }

    if (!departments.includes(selectedDepartment)) {
      setSelectedDepartment(departments[0]);
    }
  }, [departments, selectedDepartment]);

  useEffect(() => {
    if (!courses.length) {
      setCourseUpdate({
        code: "",
        title: "",
        unit: 3,
        department: departments[0] ?? "",
      });
      return;
    }

    if (!courses.find((course) => course.code === courseUpdate.code)) {
      const firstCourse = courses[0];
      setCourseUpdate({
        code: firstCourse.code,
        title: firstCourse.title,
        unit: firstCourse.unit,
        department: firstCourse.department,
      });
    }
  }, [courses, courseUpdate.code, departments]);

  const fetchedCourse = useMemo(
    () =>
      courses.find(
        (course) =>
          course.code.toLowerCase() === fetchCode.trim().toLowerCase(),
      ),
    [courses, fetchCode],
  );

  const departmentCourses = useMemo(() => {
    if (!activeDepartmentQuery) return [];

    return courses.filter(
      (course) =>
        course.department.toLowerCase() ===
        activeDepartmentQuery.trim().toLowerCase(),
    );
  }, [activeDepartmentQuery, courses]);

  const hasDepartmentSearch = activeDepartmentQuery.trim().length > 0;

  const submitUpdate: FormSubmitHandler = (event) => {
    event.preventDefault();
    void onUpdateCourse(courseUpdate)
      .then(() => {
        toast.success("Course updated successfully.");
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Could not update course.",
        );
      });
  };

  const submitCreate: FormSubmitHandler = (event) => {
    event.preventDefault();
    void onCreateCourse(newCourse)
      .then(() => {
        toast.success("Course created successfully.");
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Could not create course.",
        );
      });
  };

  const submitDepartmentSearch: FormSubmitHandler = (event) => {
    event.preventDefault();
    setActiveDepartmentQuery(selectedDepartment);
  };

  return (
    <main className="dashboard-wrap">
      <section className="dashboard-head">
        <h2>{title}</h2>
        {onBack && (
          <div className="admin-head-actions">
            <button type="button" className="secondary" onClick={onBack}>
              {backButtonLabel}
            </button>
          </div>
        )}
      </section>

      <section className="grid-3">
        <form className="panel" onSubmit={submitCreate}>
          <h3>Create Course</h3>
          <label>
            Course Code
            <input
              placeholder="e.g. STA210"
              value={newCourse.code}
              onChange={(event) =>
                onSetNewCourse({ ...newCourse, code: event.target.value })
              }
            />
          </label>
          <label>
            Course Title
            <input
              placeholder="e.g. Probability Theory"
              value={newCourse.title}
              onChange={(event) =>
                onSetNewCourse({ ...newCourse, title: event.target.value })
              }
            />
          </label>
          <label>
            Unit
            <input
              type="number"
              min={1}
              max={6}
              value={newCourse.unit}
              onChange={(event) =>
                onSetNewCourse({
                  ...newCourse,
                  unit: Number(event.target.value) || 1,
                })
              }
            />
          </label>
          <label>
            Department
            <select
              value={newCourse.department}
              onChange={(event) =>
                onSetNewCourse({ ...newCourse, department: event.target.value })
              }
            >
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="primary stretch">
            Add Course
          </button>
        </form>

        <form className="panel" onSubmit={submitUpdate}>
          <h3>Update Course</h3>
          <label>
            Course to Edit
            <select
              value={courseUpdate.code}
              onChange={(event) => {
                const selected = courses.find(
                  (course) => course.code === event.target.value,
                );
                if (!selected) return;

                setCourseUpdate({
                  code: selected.code,
                  title: selected.title,
                  unit: selected.unit,
                  department: selected.department,
                });
              }}
            >
              {courses.map((course) => (
                <option key={course.code} value={course.code}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            New Course Title
            <input
              value={courseUpdate.title}
              onChange={(event) =>
                setCourseUpdate({ ...courseUpdate, title: event.target.value })
              }
            />
          </label>
          <label>
            New Unit
            <input
              type="number"
              min={1}
              max={6}
              value={courseUpdate.unit}
              onChange={(event) =>
                setCourseUpdate({
                  ...courseUpdate,
                  unit: Number(event.target.value) || 1,
                })
              }
            />
          </label>
          <label>
            Department
            <select
              value={courseUpdate.department}
              onChange={(event) =>
                setCourseUpdate({
                  ...courseUpdate,
                  department: event.target.value,
                })
              }
            >
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="primary stretch">
            Save Course Update
          </button>
        </form>

        <article className="panel">
          <h3>Search Course</h3>
          <label>
            Course Code
            <input
              placeholder="e.g. CSC301"
              value={fetchCode}
              onChange={(event) => setFetchCode(event.target.value)}
            />
          </label>
          {fetchedCourse && (
            <ul className="simple-list">
              <li>
                <strong>Course Name:</strong> {fetchedCourse.code}
              </li>
              <li>
                <strong>Course Title:</strong> {fetchedCourse.title}
              </li>
              <li>
                <strong>Units:</strong> {fetchedCourse.unit}
              </li>
              <li>
                <strong>Department:</strong> {fetchedCourse.department}
              </li>
            </ul>
          )}
          {!fetchedCourse && fetchCode.trim() && (
            <p className="sub">No course found for the current code.</p>
          )}
        </article>
      </section>

      <section className="panel">
        <h3>Search Courses by Department</h3>
        <form
          className="search-department-form"
          onSubmit={submitDepartmentSearch}
        >
          <label className="search-department-label">
            Department
            <select
              value={selectedDepartment}
              onChange={(event) => setSelectedDepartment(event.target.value)}
            >
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="primary">
            Search Department Courses
          </button>
        </form>

        {hasDepartmentSearch && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Unit</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                {departmentCourses.map((course) => (
                  <tr key={course.code}>
                    <td>{course.code}</td>
                    <td>{course.title}</td>
                    <td>{course.unit}</td>
                    <td>{course.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!hasDepartmentSearch && (
          <p className="sub">
            No logs displayed yet. Search by department to view matching
            courses.
          </p>
        )}

        {hasDepartmentSearch && departmentCourses.length === 0 && (
          <p className="sub">No courses found in the selected department.</p>
        )}
      </section>
    </main>
  );
}
