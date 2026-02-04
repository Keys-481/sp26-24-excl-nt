/**
 * File: frontend/src/pages/Advisor/Advising.jsx
 * This file defines the Advising page for advisors to search for students and view their information.
 * Includes search student functionality and degree plan component
 */

import { useEffect, useState } from "react";
import AdvisorNavBar from "../../components/NavBars/AdvisorNavBar";
import SearchBar from "../../components/SearchBar";
import ProgramSelector from "../../components/ProgramSelector";
import { useApiClient } from "../../lib/apiClient";
import { useLocation } from "react-router-dom";

/**
 * Advising component displays the Advising page for the advisors.
 * Search for students to view their information and degree plan.
 * @component
 * @returns {JSX.Element} advisor view for searching and viewing student information
 */
export default function Advising() {

  // API client for backend requests
  const api = useApiClient();
  const location = useLocation();
  const { schoolStudentId, programId } = location.state || {};

  // State to hold search results
  const [assigned, setAssigned] = useState([]);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // state to hold selected student and their programs
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);

  useEffect(() => {
    if (!schoolStudentId) return;

    (async () => {
      try {
        const res = await api.get(`/students/${schoolStudentId}/programs`);
        const student = res?.student;
        const studentPrograms = res?.programs || [];
        if (!student) return;

        setSelectedStudent(student);
        setPrograms(studentPrograms);

        if (studentPrograms.length === 0) return;

        const targetProgram = studentPrograms.find(p => p.program_id === programId) || studentPrograms[0];
        setSelectedProgram(targetProgram);
        
      } catch (error) {
        console.error('[advising] Error fetching student or programs:', error.message);
      }
    })();
  }, [schoolStudentId, programId, api]);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.get('/students/assigned');
        setAssigned(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error('[advising] Error fetching assigned students:', error.message);
      }
    })();
  }, [api]);

  // Handle search results from SearchBar component
  const handleSearchResults = (results, query) => {
    const isEmptySearch = !query || ((!query.q1 || query.q1.trim() === "") && (!query.q2 || query.q2.trim() === ""));

    if (isEmptySearch) {
      setHasSearched(false);
      setResults([]);
      return;
    }

    setResults(results);
    setHasSearched(true);
  }

  // Handle click on student from results list
  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setSelectedProgram(null);

    try {
      const data = await api.get(`/students/${student.id}/programs`);
      setPrograms(data?.programs || []);
    } catch (error) {
      setPrograms([]);
      console.error('[advising] Error fetching student programs:', error.message);
    }
  }

  const searchStudentEndpoint = '/students/search';

  // render results message only after a search has been made
  const renderResults = () => {
    if (!hasSearched) {
      return renderStudentList(assigned);
    }

    if (results.length === 0) {
      return <p style={{ color: "black" }}>Student not found</p>;
    }

    // render results list
    return renderStudentList(results);
  }

  const renderStudentList = (list) => (
    <ul className="results-list" data-testid="search-results">
        {list.map((student, index) => (
          <li key={index} className={`result-item ${selectedStudent?.id === student.id ? 'selected' : ''}`} onClick={() => handleStudentSelect(student)}>
            <strong>{student.name}</strong> <br />
            {student.id}
          </li>
        ))}
      </ul>
  );

  return (
    <div>
      {/* Advisor Navigation Bar */}
      <AdvisorNavBar />
      <div className="window">
        <div className="title-bar">
          {/* Title */}
          <h1>Advising</h1>
        </div>

        <div className="container">
          <div className="side-panel">
            {/* Search Section */}
            <p>Find a Student</p>
            <SearchBar
              onSearch={handleSearchResults}
              searchEndpoint={searchStudentEndpoint}
              placeholder1="School ID or Phone Number"
              placeholder2="Name"
            />
            <div className="horizontal-line-half"></div>
            <div className="side-panel-results">
              {/* Results list below search bar */}
              <div>
                {renderResults()}
              </div>
            </div>

            <div className="section-results">
              {/* Right panel for future implementation */}
              <div className="section-results-side">
                <ProgramSelector
                  student={selectedStudent}
                  programs={programs}
                  selectedStudentProgram={selectedProgram}
                  setSelectedProgram={setSelectedProgram}
                  userIsStudent={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}