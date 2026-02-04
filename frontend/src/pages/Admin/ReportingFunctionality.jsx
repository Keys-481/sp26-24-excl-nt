/**
 * File: frontend/src/pages/Admin/ReportingFunctionality.jsx
 * Admins can search for a course and view its enrollment report across 4 future semesters.
 */
import { useState } from "react";
import AdminNavBar from "../../components/NavBars/AdminNavBar";
import SearchBar from "../../components/SearchBar";
import ReportLayout from "../../components/ReportLayout";

/**
 * Admin ReportingFunctionality 
 * Enrollment Report component for Admins to view enrollment for future semesters.
 */
export default function ReportingFunctionality() {
    //State variables
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleSearchResults = (results) => {
    if (!results || results.length === 0) {
      // Search cleared or nothing found → reset
      setResults([]);
      setHasSearched(false); // Reset search state
      setSelectedCourse(null); // Clear selected course
    } else {
      setResults(results); // Update search results
      setHasSearched(true); // Mark that a search has been performed
    }
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
            className={`result-item ${selectedCourse?.code === course.code ? "selected" : ""}`} // Highlight if selected
            onClick={() => handleCourseSelect(course)} // Select course on click
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
      <AdminNavBar />
      <div className="window">
        <div className="title-bar">
          <h1>Enrollment Report</h1>
        </div>
        {/* Main Container */}
        <div className="container">
          <div className="side-panel">
            <p>Search for a Course</p>
            {/* Search Bar */}
            <SearchBar
              onSearch={handleSearchResults}
              searchEndpoint="/courses/search"
              placeholder1="Course Name"
              placeholder2="Course Code"
            />
            {/* Horizontal Line */}
            <div className="horizontal-line-half"></div>
            <div className="side-panel-results">{renderResults()}</div>
          </div>
            {/* Results Section */}
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