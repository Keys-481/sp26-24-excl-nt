/**
 * File: frontend/src/components/DegreePlanComponents/reqViewComps/CourseEditRow.jsx
 * Renders the editable row for updating a course's status in the requirements view
 */

export default function CourseEditRow({
    course,
    program,
    newStatus,
    semesterId,
    onStatusChange,
    onSemesterChange,
    onSave,
    onCancel
}) {
    const colSpan = program.program_type !== 'certificate' ? 10 : 9;
    const isStatusWithSemester = ["Completed", "In Progress", "Planned"].includes(newStatus);

    return (
        <tr className="course-edit-row">
            <td colSpan={colSpan}>
                <div className="course-edit-controls">
                    <label>Status:</label>
                    <select value={newStatus} onChange={(e) => onStatusChange(e.target.value)}>
                        {["Completed", "In Progress", "Planned", "Unplanned"].map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>

                    {isStatusWithSemester && (
                        <>
                            <label>Semester:</label>
                            <select value={semesterId} onChange={(e) => onSemesterChange(e.target.value)}>
                                <option value="">Select Semester</option>
                                {course.semester_options.map(semester => (
                                    <option key={semester.semester_id} value={String(semester.semester_id)}>
                                        {semester.semester_name}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                    <button onClick={() => onSave(course)}>Save</button>
                    <button onClick={onCancel}>Cancel</button>
                </div>
            </td>
        </tr>
    )
}