/**
 * File: frontend/src/pages/Accounting/ReportingFunctionality.jsx
 * Accountants can search for a course and view its enrollment report across 4 future semesters.
 */
import { useState } from "react";
import AccountingNavBar from "../../components/NavBars/AccountingNavBar";
import SearchBar from "../../components/SearchBar";
import ReportLayout from "../../components/ReportLayout";

// Main component for reporting functionality
export default function AccountingReportingFunctionality() {
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleSearchResults = (results) => {
    // User cleared inputs
    if (results === null) {
      setResults([]);
      setHasSearched(false);
      setSelectedCourse(null);
      return;
    }

    // Search returned no results
    if (Array.isArray(results) && results.length === 0) {
      setResults([]);
      setHasSearched(false);
      setSelectedCourse(null);
      return;
    }

    // Search returned results
    setResults(results);
    setHasSearched(true);
  };

  // Handle course selection from results
  const handleCourseSelect = (course) => {
    console.log("Selected course:", course);
    setSelectedCourse(course);
  };

  // Render search results
  const renderResults = () => {
    if (!hasSearched) return null;
    if (results.length === 0) return <p style={{ color: "black" }}>No courses found.</p>;

    return (
      <ul className="results-list">
        {results.map((course, index) => (
          <li
            key={index}
            className={`result-item ${selectedCourse?.code === course.code ? "selected" : ""}`}
            onClick={() => handleCourseSelect(course)}
          >
            <strong>{course.name}</strong> <br />
            {course.code || course.course_code || "No code"}
          </li>
        ))}
      </ul>
    );
  };

  // Main 
  return (
    <div>
        {/* Navigation Bar */}
      <AccountingNavBar />
      <div className="window">
        <div className="title-bar">
          <h1>Enrollment Report</h1>
        </div>

        {/* Main Container */}
        <div className="container">
          <div className="side-panel">
            <p>Search for a Course</p>
            <SearchBar
              onSearch={handleSearchResults}
              searchEndpoint="/courses/search"
              placeholder1="Course Name"
              placeholder2="Course Code"
            />
            <div className="horizontal-line-half"></div>
            <div className="side-panel-results">{renderResults()}</div>
          </div>

          {/* Report Section */}
          <div className="section-results">
            <div className="section-results-main">
              <ReportLayout courseCode={selectedCourse?.code || selectedCourse?.course_code} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}