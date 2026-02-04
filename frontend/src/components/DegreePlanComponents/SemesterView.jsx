/**
 * File: frontend/src/components/DegreePlanComponents/SemesterView.jsx
 * This file defines the SemesterView component to display courses grouped by semester.
 */


/**
 * The SemesterView component displays courses grouped by semester.
 * @param {*} courses - array of course objects to display
 * @returns {JSX.Element} - The rendered semester view
 */
export default function SemesterView( { courses, program } ) {
    if (!courses || courses.length === 0) {
        return <p>No courses found</p>;
    }

    if (!program?.program_type) {
        return <p>No program selected</p>;
    }

    // Group courses by semester
    const grouped = courses.reduce((acc, course) => {
        const key = course.semester_name || 'Unscheduled Courses';
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(course);
        return acc;
    }, {});

    // Sort semesters, placing 'Unscheduled Courses' at the end
    const sortedSemesters = Object.keys(grouped);

    // Move 'Unscheduled Courses' to the end if it exists
    return (
        <div className="semester-view-container">
            {/* Render each semester section */}
            {sortedSemesters.map((semester) => (
                
                <div key={semester} className="semester-section">
                    <h4 className="semester-header">{semester}</h4>

                    <div className="table-wrapper">
                        <table className="semester-table">
                            <thead>
                                <tr>
                                    <th>Course Code</th>
                                    <th>Course Title</th>
                                    {program.program_type !== 'certificate' && (
                                        <th>Certificate Overlap</th>
                                    )}
                                    <th>Prerequisites</th>
                                    <th>Offered</th>
                                    <th>Credits</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grouped[semester].map((course) => (
                                    <tr key={`${semester}-${course.course_id || course.course_code}`}>
                                        <td><strong>{course.course_code}</strong></td>
                                        <td>{course.course_name}</td>
                                        {program.program_type !== 'certificate' && (
                                            <td>{course.certificate_overlaps && course.certificate_overlaps.length > 0 ? course.certificate_overlaps.map(co => co.certificate_short_name).join(', ') : 'None'}</td>
                                        )}
                                        <td>{course.prerequisites && course.prerequisites.length > 0 ? course.prerequisites.map(pr => pr.course_code).join(', ') : 'None'}</td>
                                        <td>{course.offered_semesters || 'N/A'}</td>
                                        <td>{course.credits}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    )
}