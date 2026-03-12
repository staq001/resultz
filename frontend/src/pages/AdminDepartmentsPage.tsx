import { useEffect, useMemo, useState } from "react";
import type { Course, FormSubmitHandler } from "../types/app.types";
import { useToast } from "../components/ToastProvider";

type AdminDepartmentsPageProps = {
  departments: string[];
  courses: Course[];
  onCreateDepartment: (name: string, faculty: string) => Promise<void>;
  onUpdateDepartment: (
    currentName: string,
    newName: string,
    faculty?: string,
  ) => Promise<void>;
  onFindDepartmentsByFaculty: (faculty: string) => Promise<string[]>;
  onBack: () => void;
};

export function AdminDepartmentsPage({
  departments,
  courses,
  onCreateDepartment,
  onUpdateDepartment,
  onFindDepartmentsByFaculty,
  onBack,
}: AdminDepartmentsPageProps) {
  const [newDepartment, setNewDepartment] = useState("");
  const [currentName, setCurrentName] = useState(departments[0] ?? "");
  const [updatedName, setUpdatedName] = useState("");
  const [newDepartmentFaculty, setNewDepartmentFaculty] = useState("");
  const [updatedFaculty, setUpdatedFaculty] = useState("");
  const [fetchName, setFetchName] = useState("");
  const [facultyQuery, setFacultyQuery] = useState("");
  const [facultyDepartments, setFacultyDepartments] = useState<string[]>([]);
  const [facultySearchMessage, setFacultySearchMessage] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (!departments.length) {
      setCurrentName("");
      return;
    }

    if (!departments.includes(currentName)) {
      setCurrentName(departments[0]);
    }
  }, [departments, currentName]);

  const fetchedDepartment = useMemo(
    () => departments.find((department) => department === fetchName.trim()),
    [departments, fetchName],
  );

  const assignedCourses = useMemo(
    () =>
      courses.filter(
        (course) =>
          course.department === fetchedDepartment ||
          course.department === fetchName.trim(),
      ),
    [courses, fetchedDepartment, fetchName],
  );

  const submitCreate: FormSubmitHandler = (event) => {
    event.preventDefault();
    void onCreateDepartment(newDepartment, newDepartmentFaculty)
      .then(() => {
        setNewDepartment("");
        setNewDepartmentFaculty("");
        toast.success("Department created successfully.");
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not create department.",
        );
      });
  };

  const submitUpdate: FormSubmitHandler = (event) => {
    event.preventDefault();
    void onUpdateDepartment(currentName, updatedName, updatedFaculty)
      .then(() => {
        setUpdatedName("");
        setUpdatedFaculty("");
        toast.success("Department updated successfully.");
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not update department.",
        );
      });
  };

  const submitFacultyLookup: FormSubmitHandler = (event) => {
    event.preventDefault();
    const trimmedFacultyQuery = facultyQuery.trim();

    // Reset current result area before loading the next query result.
    setFacultyDepartments([]);
    setFacultySearchMessage("");

    void onFindDepartmentsByFaculty(facultyQuery)
      .then((results) => {
        setFacultyDepartments(results);
        if (!results.length) {
          setFacultySearchMessage(
            trimmedFacultyQuery
              ? `No department found for faculty: ${trimmedFacultyQuery}.`
              : "No department found.",
          );
        }
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Could not fetch departments by faculty.";
        setFacultySearchMessage(message);
        setFacultyDepartments([]);
      });
  };

  return (
    <main className="dashboard-wrap">
      <section className="dashboard-head">
        <h2>Departments</h2>
        <div className="admin-head-actions">
          <button type="button" className="secondary" onClick={onBack}>
            Back to Admin Home
          </button>
        </div>
      </section>

      <section className="grid-3">
        <form className="panel" onSubmit={submitCreate}>
          <h3>Create Department</h3>
          <label>
            Department Name
            <input
              placeholder="e.g. Statistics"
              value={newDepartment}
              onChange={(event) => setNewDepartment(event.target.value)}
            />
          </label>
          <label>
            Faculty
            <input
              placeholder="e.g. Science"
              value={newDepartmentFaculty}
              onChange={(event) => setNewDepartmentFaculty(event.target.value)}
            />
          </label>
          <button type="submit" className="primary stretch">
            Add Department
          </button>
        </form>

        <form className="panel" onSubmit={submitUpdate}>
          <h3>Update Department</h3>
          <label>
            Existing Department
            <select
              value={currentName}
              onChange={(event) => setCurrentName(event.target.value)}
            >
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>
          <label>
            New Department Name
            <input
              placeholder="e.g. Data Science"
              value={updatedName}
              onChange={(event) => setUpdatedName(event.target.value)}
            />
          </label>
          <label>
            Faculty (Optional)
            <input
              placeholder="e.g. Science"
              value={updatedFaculty}
              onChange={(event) => setUpdatedFaculty(event.target.value)}
            />
          </label>
          <button type="submit" className="primary stretch">
            Save Update
          </button>
        </form>

        <article className="panel">
          <h3>Search Department</h3>
          <label>
            Department Name
            <input
              placeholder="Type exact department name"
              value={fetchName}
              onChange={(event) => setFetchName(event.target.value)}
            />
          </label>
          {fetchedDepartment && (
            <ul className="simple-list">
              <li>
                <strong>Department Name:</strong> {fetchedDepartment}
              </li>
              <li>
                <strong>Course Count:</strong> {assignedCourses.length}
              </li>
              <li>
                <strong>Courses:</strong>{" "}
                {assignedCourses.length
                  ? assignedCourses.map((course) => course.code).join(", ")
                  : "No courses assigned yet"}
              </li>
            </ul>
          )}
          {!fetchedDepartment && fetchName.trim() && (
            <p className="sub">No department found for the current name.</p>
          )}
        </article>
      </section>

      <section className="panel">
        <h3>Search Departments by Faculty</h3>
        <form className="search-department-form" onSubmit={submitFacultyLookup}>
          <label className="search-department-label">
            Faculty Name
            <input
              placeholder="e.g. Science"
              value={facultyQuery}
              onChange={(event) => setFacultyQuery(event.target.value)}
            />
          </label>
          <button type="submit" className="primary">
            Search Departments
          </button>
        </form>

        {!!facultyDepartments.length && (
          <ul className="simple-list">
            {facultyDepartments.map((department) => (
              <li key={department}>{department}</li>
            ))}
          </ul>
        )}

        {facultySearchMessage && <p className="sub">{facultySearchMessage}</p>}
      </section>
    </main>
  );
}
