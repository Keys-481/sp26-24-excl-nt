/**
 * File: frontend/src/components/DegreePlanComponents/RequirementsView.jsx
 * This file defines the RequirementsView component to display courses grouped by program requirements.
 */
import { useEffect, useState } from "react";
import { useApiClient } from "../../lib/apiClient";
import CertificateAlert from "./reqViewComps/CertificateAlert";
import CourseEditRow from "./reqViewComps/CourseEditRow";
import CourseRow from "./reqViewComps/CourseRow";
import { buildHierarchy, calculateCompletedCredits, flattenHierarchy } from "./utils/requirementsHelpers";

/**
 * RequirementsView component displays courses grouped by program requirements.
 * @param {*} courses - array of course objects to display
 * @returns {JSX.Element} - The rendered requirements view
 */
export default function RequirementsView( { courses, program, semesters=[], studentId, userIsStudent=false } ) {
    const api = useApiClient();

    const [localCourses, setLocalCourses] = useState(courses);
    const [editingCourse, setEditingCourse] = useState(null);
    const [newStatus, setNewStatus] = useState('Unplanned');
    const [semesterId, setSemesterId] = useState('');

     // keep local copy of courses to trigger re-render on updates
    useEffect(() => {
        setLocalCourses(courses);
    }, [courses]);

    // when editingCourse changes, set initial values for status and semester
    useEffect(() => {
        if (editingCourse) {
            const course = localCourses.find(c => c.course_id === editingCourse);
            setSemesterId(course?.semester_id || '');
            setNewStatus(course?.course_status || 'Unplanned');
            console.log("Editing Course:", course);
            console.log("Initial Semester ID:", course?.semester_id);
        }
    }, [editingCourse, localCourses]);

    // Return early if no courses
    if (!courses || courses.length === 0) {
        return <p>No courses found</p>;
    }

    // Return early if no program
    if (!program?.program_type) {
        return <p>No program selected</p>;
    }

    // Extract unique requirements from courses
    const uniqueReqs = Object.values(
        localCourses.reduce((acc, c) => {
            if (!acc[c.requirement_id]) {
                acc[c.requirement_id] = {
                    requirement_id: c.requirement_id,
                    req_description: c.req_description,
                    parent_requirement_id: c.parent_requirement_id,
                    parent_description: c.parent_description,
                    required_credits: c.required_credits,
                    requirement_type: c.requirement_type,
                }
            }
            return acc;
        }, {})
    )

    const hierarchy = buildHierarchy(uniqueReqs);

    // map courses to requirements in the hierarchy
    const flatReqsMap = hierarchy.flatMap(root => flattenHierarchy(root));
    const map = new Map(flatReqsMap.map(req => [req.requirement_id, req]));
    localCourses.forEach(course => {
        const node = map.get(course.requirement_id);
        if (node) node.courses.push(course);
    });

    // Handler to save updated course status from editing mode
    async function handleSaveStatus(course) {
        const schoolId = studentId;
        let chosenSemesterId = null;
        if (newStatus === 'Unplanned') {
            chosenSemesterId = null;
        } else if (["Completed", "In Progress", "Planned"].includes(newStatus)) {
            chosenSemesterId = semesterId ? Number(semesterId) : course.semester_id || null;
        }

        // Validate semester selection
        if (["Completed", "In Progress", "Planned"].includes(newStatus) && !chosenSemesterId) {
            alert(`Please select a semester for "${newStatus}" courses.`);
            return;
        }

        // Make API call to update course status
        try {
            const updated = await api.patch(`/students/${encodeURIComponent(schoolId)}/degree-plan/course`, {
                courseId: course.course_id,
                status: newStatus,
                semesterId: chosenSemesterId,
                programId: program.program_id
            });

            // Log the updated course for debugging
            console.log("Course status updated:", updated);
            setEditingCourse(null);

            setLocalCourses(prev =>
                prev.map(c =>
                    c.course_id === course.course_id
                        ? { ...c,
                            course_status: updated.course_status,
                            semester_id: updated.semester_id ?? chosenSemesterId,
                            semester_name: semesters.find(s => s.semester_id === updated.semester_id)?.semester_name || c.semester_name}
                        : c
                )
            )

            if (typeof onCourseUpdated === 'function') {
                onCourseUpdated();
            }

        } catch (error) {
            console.error("Error saving course status:", error);
            let displayMessage = error.message || 'An error occurred while updating course status.';
            if (/prerequisite/i.test(displayMessage)) {
                displayMessage = "Unsatisfied prerequisite(s) prevent this status update.";
            }

            alert(displayMessage);
        }
    }

    // Calculate completed credits for each requirement
    hierarchy.forEach(req => calculateCompletedCredits(req));

    // Recursive function to render requirements and their courses
    function renderRequirement(req, level = 0) {

        // Requirement header row
        const completedReqCredits = req.completedCredits || 0;
        const requiredReqCredits = req.required_credits || 0;
        
        const rows = [];
        const rowStyle = { '--level': level };

        // Requirement header
        rows.push(
            <tr key={`req=${req.requirement_id}`} className={`req-row req-level-${level}`} style={rowStyle}> 
                <td colSpan={program.program_type !== 'certificate' ? 9 : 8} className="requirement-header-cell">
                    <div className="requirement-header-content">
                        <strong>{req.req_description}</strong>
                        {requiredReqCredits > 0 && (
                            <span style={{ marginLeft: '20px' }}>{completedReqCredits} / {requiredReqCredits}</span>
                        )}
                    </div>
                </td>
            </tr>
        );

        // Render courses under this requirement
        if (req.courses?.length > 0) {
            req.courses
            .filter(course => course?.course_id)
            .forEach(course => {
                rows.push(
                    <CourseRow
                        key={`${req.requirement_id}-${course.course_id}`}
                        course={course}
                        program={program}
                        editingCourse={editingCourse}
                        setEditingCourse={setEditingCourse}
                        rowStyle={rowStyle}
                        requirementId={req.requirement_id}
                        userIsStudent={userIsStudent}
                    />
                );

                // If this course is being edited, render the CourseEditRow
                if (editingCourse === course.course_id) {
                    rows.push(
                        <CourseEditRow
                            key={`${req.requirement_id}-${course.course_id}-edit-row`}
                            course={course}
                            program={program}
                            newStatus={newStatus}
                            semesterId={semesterId}
                            semesters={semesters}
                            onStatusChange={setNewStatus}
                            onSemesterChange={setSemesterId}
                            onSave={() => handleSaveStatus(course)}
                            onCancel={() => setEditingCourse(null)}
                        />
                    )
                }
            });
        }

        // Recursively render child requirements
        if (req.children?.length > 0) {
            req.children.forEach(child => {
                rows.push(...renderRequirement(child, level + 1));
            });
        }

        return rows;
    }

    // Main render
    return (
        <div className="requirements-view-container">
            {/* Certificate Alert */}
            <div className="requirements-view">
                <CertificateAlert program={program} courses={localCourses} />
                <table className="requirements-table">
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
                            <th>Completed</th>
                            <th>In Progress</th>
                            <th>Planned</th>
                        </tr>
                        {/* Legend Row */}
                        <tr className="legend-row">
                            <td colSpan={9} style={{ textAlign: 'left', padding: '6px 10px', fontSize: '0.85rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '16px' }}>
                                <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--planned)', border: '1px solid #ccc', marginRight: '6px' }}></span>
                                <span>Planned</span>
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '16px' }}>
                                <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--in-progress)', border: '1px solid #ccc', marginRight: '6px' }}></span>
                                <span>Enrolled</span>
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--completed)', border: '1px solid #ccc', marginRight: '6px' }}></span>
                                <span>Completed</span>
                            </span>
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        {hierarchy.map(req => renderRequirement(req))}
                    </tbody>
                </table>
            </div>
        </div>
        
    );
}