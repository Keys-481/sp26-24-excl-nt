/**
 * file: frontend/src/components/GradLayout.jsx
 * description: Layout component for Graduation Report pages
 */
import { useEffect, useState } from "react";
import { useApiClient } from "../lib/apiClient";

/**
 * GraduationReportLayout
 * Fetches and displays students who have applied or been approved for graduation.
 */
export default function GraduationReportLayout() {
  // State variables
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiClient = useApiClient();

  // Fetch graduation applicants on component mount
  useEffect(() => {
    fetchGraduationApplicants();
  }, []);

  // Fetch graduation applicants from API
  const fetchGraduationApplicants = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get("/graduation/graduation-report/"); // Adjust endpoint as needed
      setStudents(Array.isArray(data.students) ? data.students : []);
    } catch (err) {
      console.error("fetchGraduationApplicants", err); // Log the error for debugging
      setError("Failed to load graduation applicants");
      setStudents([]); // Clear students on error
    } finally {
      setLoading(false);
    }
  };

  // CSV Export Function
  const exportCSV = () => {
    if (!students.length) return;

    // Prepare CSV content
    const headers = [
      "Student Name",
      "ID",
      "Program",
      "Status",
      "Application Date",
    ];

    // Map student data to CSV rows
    const rows = students.map((s) => [
      `${s.first_name} ${s.last_name}`,
      s.school_student_id ?? s.student_id,
      s.program_name,
      s.status,
      s.status_updated_at
        ? new Date(s.status_updated_at).toLocaleDateString() 
        : "-",
    ]);

    // Generate CSV string
    const csvContent =
      [headers, ...rows]
        .map((r) => // Handle commas in fields by wrapping in quotes
          r
            .map((val) =>
              typeof val === "string" && val.includes(",")
                ? `"${val}"`
                : val
            )
            .join(",")
        )
        .join("\n");

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); // Create URL for the Blob

    // Create a temporary link to trigger download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "graduation_report.csv"); // Filename
    document.body.appendChild(link); 
    link.click();
    document.body.removeChild(link); // Clean up
  };

  // Render component
  if (loading) return <p>Loading graduation applicants...</p>; 
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!students.length)
    return <p>No students have applied or been approved for graduation.</p>; 

  // Render table of students
  return (
    <div>
      { /* CSV Export Button */}
      <button onClick={exportCSV} style={{ marginBottom: "10px", marginTop: "10px" }}>
        Download CSV
      </button>
      <table
        className="requirements-table"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        {/* Table Header */}
        <thead>
          <tr>
            <th>Student Name</th>
            <th>ID</th>
            <th>Program</th>
            <th>Status</th>
            <th>Application Date</th>
          </tr>
        </thead>
        <tbody>
          {/* Table Rows */}
          {students.map((s) => (
            <tr key={s.student_id}>
              <td>
                {s.first_name} {s.last_name}
              </td>
              <td>{s.school_student_id ?? s.student_id}</td>
              <td>{s.program_name}</td>
              <td>{s.status}</td>
              <td>
                {s.status_updated_at
                  ? new Date(s.status_updated_at).toLocaleDateString()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
