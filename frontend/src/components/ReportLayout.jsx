/**  File: frontend/src/components/ReportLayout.jsx
 *  Component to display enrollment report for a selected course across next 4 semesters.
 * */
import { useEffect, useState } from "react";
import { useApiClient } from "../lib/apiClient";

// Main ReportLayout component
export default function ReportLayout({ courseCode }) {
  const [report, setReport] = useState(null);   // single course OR all courses
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [semesterLabels, setSemesterLabels] = useState([]);
  const apiClient = useApiClient();

  // Generate semester labels once when component loads
  useEffect(() => {
    const terms = ["Spring", "Summer", "Fall"];
    const now = new Date();
    const month = now.getMonth();
    let termIndex;
    let year = now.getFullYear();

    if (month >= 8) termIndex = 2;
    else if (month >= 5) termIndex = 1;
    else termIndex = 0;

    const result = [];
    for (let i = 0; i < 4; i++) {
      const idx = (termIndex + i) % terms.length;
      const addYear = Math.floor((termIndex + i) / terms.length);
      result.push(`${terms[idx]} ${year + addYear}`);
    }

    setSemesterLabels(result);
  }, []);

  // When component loads OR the selected course changes
  useEffect(() => {
    if (!semesterLabels.length) return;

    if (!courseCode) {
      fetchAllCourses();
    } else {
      fetchReport(courseCode);
    }
  }, [courseCode, semesterLabels]);

  /**
   * Fetch single course report
   */
  const fetchReport = async (q) => {
    if (!q || !q.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      // Fetch enrollment data for the course
      const data = await apiClient.get(`/courses/enrollments?courseCode=${encodeURIComponent(q)}`);
      const enrollments = data.enrollments || [];

      // Pivot data to have semesters as columns
      const pivoted = {};
      semesterLabels.forEach((label) => {
        const match = enrollments.find((e) => e.semester === label);
        pivoted[label] = match ? match.count : 0;
      });

      setReport([{ course_code: q, ...pivoted }]);
    } catch (err) {
      setError(err.message || "Error fetching report");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch ALL courses report
   */
  const fetchAllCourses = async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    // Fetch enrollment data for all courses
    try {
      const data = await apiClient.get(`/courses/enrollments/all`);
      const list = data.enrollments || [];

      const map = {};

      // Pivot data to have semesters as columns
      list.forEach((row) => {
        const c = row.course_code;
        if (!map[c]) {
          map[c] = { course_code: c };
          semesterLabels.forEach((label) => (map[c][label] = 0));
        }
        if (semesterLabels.includes(row.semester)) {
          map[c][row.semester] = row.count;
        }
      });

      // Convert map to array
      setReport(Object.values(map));
    } catch (err) {
      setError(err.message || "Error fetching all courses");
    } finally {
      setLoading(false);
    }
  };

  // CSV Export Function
  const exportCSV = () => {
    if (!report || !semesterLabels.length) return;

    // Header row
    const headers = ["Course Code", ...semesterLabels];
    const rows = report.map((row) => [
      row.course_code,
      ...semesterLabels.map((label) => row[label]),
    ]);

    const csvContent =
      [headers, ...rows]
        .map((r) => r.join(","))
        .join("\n");

    // Create downloadable blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "enrollment_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render logic
  if (loading) return <p>Loading report...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!report) return null;

  // Render report table
  return (
    <div>
      <button onClick={exportCSV} style={{ marginBottom: "10px", marginTop: "10px" }}>
        Download CSV
      </button>
      <table className="requirements-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Course Code</th>
            {semesterLabels.map((label) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.map((row) => (
            <tr key={row.course_code}>
              <td>{row.course_code}</td>
              {semesterLabels.map((label) => (
                <td key={label}>{row[label]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}