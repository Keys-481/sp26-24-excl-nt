/**
 * File: frontend/src/components/ProgramSelector.jsx
 * This file defines the ProgramSelector component to select a program for a student.
 */

import { useEffect, useState } from "react";
import CommentsContainer from "./CommentComps/CommentsContainer";
import DegreePlan from "./DegreePlanComponents/DegreePlan";

// ProgramSelector component allows selection of a program for a student and displays the degree plan and comments.
export default function ProgramSelector({ student, programs, selectedStudentProgram, setSelectedProgram, userIsStudent=false }) {
    const [currentProgram, setCurrentProgram] = useState(selectedStudentProgram);
    const [degreePlanViewType, setDegreePlanViewType] = useState('requirements');

    // Update currentProgram when selectedStudentProgram changes
    useEffect(() => {
        setCurrentProgram(selectedStudentProgram);
    }, [selectedStudentProgram]);

    // If no student is provided, display a message
    if (!student) {
        return <p className="p2">No student selected</p>;
    }

    // Render the program selector and associated components
    return (
        <div className={`program-selector-wrapper ${userIsStudent ? 'student-layout' : 'advisor-layout'}`}>
            {/* Program Selection List */}
            <div className="program-selector">
                <h3 style={{ margin: '15px' }}>Select Program:</h3>
                {programs.length > 0 ? (
                    <ul className="results-list">
                        {programs.map((program, index) => (
                            <li
                                key={index}
                                onClick={() => {
                                    setSelectedProgram(program);
                                    setCurrentProgram(program);
                                }}
                                className={`result-item ${currentProgram?.program_id === program.program_id ? 'selected' : ''}`}
                            >
                                <strong>{program.program_name}</strong>
                                <br />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No programs found for this student</p>
                )}
            </div>

            {/* Degree Plan and Comments Section */}
            <div className={"degree-plan-comments-wrapper"}>
                <div className="degree-plan-wrapper">
                    {currentProgram ? (
                        <DegreePlan
                            student={student}
                            program={currentProgram}
                            userIsStudent={userIsStudent}
                            setViewType={(viewType) => setDegreePlanViewType(viewType)}
                        />
                    ) : (
                        <p>Select a program to view the degree plan</p>
                    )}
                </div>
                <CommentsContainer
                    student={student}
                    studentSchoolId={student.id || student.school_student_id}
                    programId={currentProgram?.program_id}
                    userIsStudent={userIsStudent}
                    className={userIsStudent ? 'student-layout' : 'advisor-layout'}
                />
            </div>
        </div>
    )
}
