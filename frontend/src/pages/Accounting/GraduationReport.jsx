/**
 * file: frontend/src/pages/Accounting/GraduationReport.jsx
 * description: Graduation Report page for accounting department
 */
import { useState } from "react";
import AccountingNavBar from "../../components/NavBars/AccountingNavBar";
import GraduationReportLayout from "../../components/GradLayout";
import SearchBar from "../../components/SearchBar";

/**
 * AccountingGraduationReport
 * Page to display the Graduation Report for accounting department
 */
export default function AccountingGraduationReport() {
  // State variables
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);

  const handleSearchResults = (results) => {
    if (!results || results.length === 0) {
      // Search cleared or nothing found → reset
      setResults([]);
      setHasSearched(false); // No search has been made
      setSelectedProgram(null); // No program selected
    } else {
      setResults(results); // Update with new results
      setHasSearched(true); // A search has been made
    }
  };

  // Handle course selection from results
  const handleProgramSelect = (program) => {
    console.log("Selected Program:", program);
    setSelectedProgram(program);
  };

  // Render search results
  const renderResults = () => {
    if (!hasSearched) return null;
    if (results.length === 0) return <p style={{ color: "black" }}>No Program or Student Found.</p>;

    // Display results
    return (
      <ul programName="results-list">
        {results.map((program, index) => (
          <li
            key={index}
            programName={`result-item ${selectedProgram?.code === program.code ? "selected" : ""}`} // Highlight selected
            onClick={() => handleProgramSelect(program)} // Select program on click
          >
            <strong>{program.name}</strong> <br />
            {program.code || program.program_code || "No code"}
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
          <h1>Graduation Report</h1>
        </div>

        { /* Search Panel and Results */}
        <div className="container">
          <div className="side-panel">
            <p>Search by Program</p>
            <SearchBar
              onSearch={handleSearchResults}
              searchEndpoint="/programs/search"
              placeholder1="Program Name"
              placeholder2=""
            />
            { /* Horizontal Line and Results */}
            <div className="horizontal-line-half"></div>
            <div className="side-panel-results">{renderResults()}</div>
          </div>

          { /* Report Layout */}
          <div className="section-results">
            <div className="section-results-main">
              <GraduationReportLayout />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}