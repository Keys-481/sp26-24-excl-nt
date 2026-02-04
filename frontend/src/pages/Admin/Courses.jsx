/**
 * file: frontend/src/pages/Admin/Courses.jsx
 * Admin interface for managing courses: searching, adding, editing, and deleting courses.
 */
import { useEffect, useRef, useState } from 'react';
import AdminNavBar from '../../components/NavBars/AdminNavBar';
import SearchBar from '../../components/SearchBar';
import { useApiClient } from '../../lib/apiClient';

// Main component for Admin Courses page
export default function AdminCourses() {
  // State variables
  const apiClient = useApiClient();
  const [results, setResults] = useState([]);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    credits: '',
    offerings: '',
    prerequisites: '',
  });
  const searchRef = useRef();

  const searchEndpoint = '/courses/search';

  /**
   * Handles search results returned from the SearchBar component.
   * Clears any selected course and resets the form.
   */
  const handleSearchResults = (results) => {
    setResults(results);
    setSelectedCourse(null);
    resetForm();
  };

  /**
  * Clears selected course on initial load.
  */
  useEffect(() => {
    setSelectedCourse(null);
  }, []);


  /**
   * When a course is selected, populate the form with its data
   * and switch to edit mode.
   */
  useEffect(() => {
    if (selectedCourse) {
      // Populate form with selected course data
      setCourseForm({
        id: selectedCourse.id,
        name: selectedCourse.name || '',
        code: selectedCourse.code || '',
        credits: selectedCourse.credits || '',
        offerings: Array.isArray(selectedCourse.offerings)
          ? selectedCourse.offerings.join(', ')
          : selectedCourse.offerings || '',
        prerequisites: selectedCourse.prerequisites?.map(p => p.course_code).join(', ') || '',
      });
      setIsAddingCourse(true);
    }
  }, [selectedCourse]);

  /**
   * Sends a POST request to add a new course to the database.
   * Updates the results list and resets the form.
   */
  const handleAddCourse = async () => {
    console.log('Submitting courseForm:', courseForm);
    try {
      await apiClient.post('/courses', courseForm);
    } catch (error) {
      console.error('Error adding course:', error);
      alert('Failed to add course.');
    } finally {
      resetForm();
      searchRef.current?.triggerSearch();
    }
  };

  /**
   * Sends a PUT request to update an existing course.
   * Replaces the updated course in the results list and resets the form.
   */
  const handleUpdateCourse = async () => {
    try {
      // Send update request
      const updatedCourse = await apiClient.put(`/courses/${courseForm.id}`, courseForm);
      setResults(results.map(c => c.id === updatedCourse.id ? updatedCourse : c));
      resetForm();
      searchRef.current?.triggerSearch();
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Failed to update course.');
    }
  };

  // Deletes the selected course after confirmation
  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    if (!window.confirm(`Are you sure you want to delete the course "${selectedCourse.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Send delete request
      await apiClient.del(`/courses/${selectedCourse.id}`);
      setResults(results.filter(c => c.id !== selectedCourse.id));
      resetForm();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course.');
    }
  };


  /**
  * Resets the form and exits add/edit mode.
  */
  const resetForm = () => {
    setIsAddingCourse(false);
    setSelectedCourse(null);
    setCourseForm({
      name: '',
      code: '',
      credits: '',
      offerings: '',
      prerequisites: '',
    });
  };

  return (
    <div>
      { /* Navigation Bar */}
      <AdminNavBar />
      <div className="window">
        <div className="title-bar">
          <h1>Courses</h1>
        </div>

        { /* Main Container */}
        <div className="container">
          <div className="side-panel">
            <SearchBar
              ref={searchRef}
              onSearch={handleSearchResults}
              searchEndpoint={searchEndpoint}
              placeholder1="Course Name"
              placeholder2="Course Code"
            />
            <div className="horizontal-line-half"></div>
            <div className="side-panel-results">
              {results.length === 0 ? (
                <p>No results found</p>
              ) : (
                <ul className="results-list">
                  {results.map((item, index) => (
                    <li
                      key={index}
                      className={`result-item ${selectedCourse?.id === item.id ? 'selected' : ''}`}
                      onClick={() => {
                        if (selectedCourse?.id === item.id) {
                          setSelectedCourse(null); // unselect if already selected
                          resetForm();
                        } else {
                          setSelectedCourse(item); // select if not selected
                        }
                      }}
                    >
                      <strong>{item.code}</strong> — {item.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

            {/* Report Section */}
          <div className="section-results">
            {isAddingCourse ? (
              <div className="section-results-side">
                <div className="h2-row">
                  <h2>{selectedCourse ? 'Edit Course' : 'Add New Course'}</h2>
                  <button onClick={selectedCourse ? handleUpdateCourse : handleAddCourse}>
                    {selectedCourse ? 'Save' : 'Add'}
                  </button>
                  <button onClick={resetForm}>Cancel</button>
                  {selectedCourse && (
                    <button className="error-message" onClick={handleDeleteCourse}>Delete</button>
                  )}
                </div>
                <div className="horizontal-line"></div>

                {[
                  { label: 'Course Name', key: 'name' },
                  { label: 'Course Code', key: 'code' },
                  { label: 'Course Credits', key: 'credits' },
                  { label: 'Course Offerings', key: 'offerings' },
                ].map(({ label, key }) => (
                  <div className="textbox-row" key={key}>
                    <p className="layout">{label}:</p>
                    <input
                      type="text"
                      className="textbox"
                      value={courseForm[key]}
                      onChange={(e) =>
                        setCourseForm({ ...courseForm, [key]: e.target.value })
                      }
                      placeholder={label}
                    />
                  </div>
                ))}
                <div className="textbox-row">
                  <p className="layout">Course Pre-requisites:</p>
                  <input
                    type="text"
                    className="textbox"
                    value={courseForm.prerequisites}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, prerequisites: e.target.value })
                    }
                    placeholder="e.g. OPWL-536, OPWL-530"
                  />
                </div>
                
              </div>
            ) : (
              <div className="section-results-side">
                <div className="h2-row">
                  <button onClick={() => setIsAddingCourse(true)}>Add Course</button>
                </div>
                <div className="horizontal-line"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
