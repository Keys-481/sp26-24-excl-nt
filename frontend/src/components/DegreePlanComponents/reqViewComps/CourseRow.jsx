/**
 * File: frontend/src/components/DegreePlanComponents/reqViewComps/CourseRow.jsx
 * Component to display a single course row within the requirements view of the degree plan.
 */

import { PencilLine } from "lucide-react";

// Component to display a single course row within the requirements view of the degree plan.
export default function CourseRow({
    course,
    program,
    editingCourse,
    setEditingCourse,
    rowStyle,
    requirementId,
    userIsStudent=false
}) {
    const statusClass = (course.course_status || "unplanned").toLowerCase().replace(/\s/g, "-");

    // Render the course row with relevant details and edit button if applicable
    return (
        <tr
            key={`${requirementId}-${course.course_id}`}
            className={`course-row course-status-${(course.course_status || 'unplanned').toLowerCase().replace(/\s/g, '-')}`}
            style={rowStyle}
        >
            <td><strong>{course.course_code || '-'}</strong></td>
            <td>{course.course_name || '-'}</td>

            {program.program_type !== 'certificate' && (
                <td>
                    {course.certificate_overlaps?.length > 0
                        ? course.certificate_overlaps.map(co => co.certificate_short_name).join(', ')
                        : 'None'}
                </td>
            )}

            <td>
                {course.prerequisites?.length > 0
                    ? course.prerequisites.map(pr => pr.course_code).join(', ')
                    : 'None'}
            </td>

            <td>{course.offered_semesters || 'N/A'}</td>
            <td>{course.credits || '-'}</td>

            {["Completed", "In Progress", "Planned"].map(status => (
                <td key={status}>
                    {course.course_status === status ? (course.semester_name || '-') : '-'}
                </td>
            ))}

            <td className="edit-cell-anchor">
                {!userIsStudent && (
                    <button
                        className={`course-status-edit-btn ${editingCourse === course.course_id ? 'active' : ''}`}
                        onClick={() => setEditingCourse(course.course_id)}
                    >
                        <PencilLine size={16} />
                    </button>
                )}
            </td>
        </tr>
    )
}