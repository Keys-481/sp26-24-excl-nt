/**
 * File: frontend/src/components/DegreePlan.jsx{
 * This file defines the DegreePlan component to display a student's degree plan.
 */

import { useEffect, useMemo, useState } from "react";
import SemesterView from "./SemesterView";
import RequirementsView from "./RequirementView";
import GraduationStatus from "./GradStatus";
import { useApiClient } from "../../lib/apiClient";

/**
 * DegreePlan component displays the degree plan for a specific student.
 */
export default function DegreePlan({ student, program, studentId: propStudentId, programId: propProgramId , userIsStudent=false, setViewType: propSetViewType }) {
    const api = useApiClient();
    const base_url = '/students';

    // derive studentId and programId from props or student/program objects
    const studentId = useMemo(() => student?.school_student_id ?? student?.id ?? propStudentId ?? null, [student, propStudentId]);
    const thisProgramId = useMemo(() => {
        if (program?.program_id) return program.program_id;
        if (program?.programId) return program.programId;
        return propProgramId ?? null;
    }, [program, propProgramId]);

    // state to hold degree plan data, loading, and error states
    const [planData, setPlanData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // state toggle view type (by semester or by program requirements)
    const [viewType, setViewType] = useState('requirements'); // 'requirements' or 'semester'

    // trigger to refresh degree plan when graduation status changes
    const [gradRefreshToggle, setGradRefreshToggle] = useState(false);

    // function to fetch degree plan data when student or program changes
    useEffect(() => {
        if (!studentId || !thisProgramId || !viewType) return;

        // fetch degree plan data
        (async () => {
            setLoading(true);
            setError('');
            try {
                const data = await api.get(
                    // Construct API endpoint URL
                    `${base_url}/${encodeURIComponent(studentId)}/degree-plan?programId=${encodeURIComponent(thisProgramId)}&viewType=${encodeURIComponent(viewType)}`
                );
                setPlanData(data);
            } catch (error) {
                // Log error for debugging
                console.error("[DegreePlan] fetch failed:", error?.message || error);
                setPlanData(null);
                setError(error?.message || "Failed to load degree plan");
            } finally {
                setLoading(false);
            }
        })();
    }, [studentId, thisProgramId, viewType, api, gradRefreshToggle]);
        
    // Render logic
    if (!studentId || !thisProgramId) {
        return <p className="error-message">Select a student and a program to view the degree plan.</p>;
    }

    // Show loading, error, or no data messages
    if (loading) return <p>Loading degree plan...</p>;
    if (error) return <p className="error-message">Error: {error}</p>;

    // Render degree plan details
    const courses = planData?.degreePlan ?? [];
    if (!courses.length) return <p>Degree plan not found for {student?.name ?? studentId}</p>;

    // Calculate student info
    const name = student?.name ?? "";
    const id = studentId;
    const email = student?.email ?? "";
    const phone = student?.phone ?? "";
    const programName = program?.program_name ?? program?.name ?? thisProgramId;

    // Extract catalog year and credit counts
    const catalogYear = courses.find(c => c.catalog_year)?.catalog_year || 'N/A';
    const totalCredits = planData?.totalRequiredCredits ?? 0;
    const completedCredits = courses.reduce((sum, c) => sum + (c.course_status === "Completed" ? (c.credits || 0) : 0), 0);

    // Render the degree plan component
    return (
        <div className="degree-plan-container">
            {/* Student Info Section */}
            <div className="degree-plan-header">
                <div className="header-row">
                    <h3>
                        <span>Name:</span> {name}
                    </h3>
                    <h3>
                        <span>ID:</span> {id}
                    </h3>
                    <h3>
                        <span>Catalog Year:</span> {catalogYear}
                    </h3>
                </div>
                <p>
                    <span>Email:</span> {email}
                    <span style={{ margin: '20px' }}>|</span>
                    <span>Phone:</span> {phone}
                </p>
                <p><span>Program:</span> {programName}</p>
                <p>
                    {/* Graduation Status Component */}
                    <GraduationStatus
                        studentId={studentId}
                        student={student}
                        onUpdate={() => { setGradRefreshToggle((prev) => !prev); }}
                />
                </p>

                {/* View Toggle */}
                <div className="view-toggle">
                    <div>
                        <button
                            onClick={() => { 
                                setViewType('requirements');
                                if (propSetViewType.setViewType) propSetViewType.setViewType('requirements');
                            }}
                            className={viewType === 'requirements' ? 'active' : 'inactive'}>
                            Requirements View
                        </button>
                        <button
                            onClick={() => { 
                                setViewType('semester');
                                if (propSetViewType.setViewType) propSetViewType.setViewType('semester');
                            }}
                            className={viewType === 'semester' ? 'active' : 'inactive'}>
                            Semester View
                        </button>
                    </div>
                    <span className="degree-plan-content" style={{ marginLeft: '20px' }}>
                        <strong>Credit Count:</strong> {completedCredits} / {totalCredits}
                    </span>
                </div>
            </div>

            {/* Degree Plan Section */}
            <div className="degree-plan-content">
                {viewType === 'requirements' ? (
                    <RequirementsView courses={courses} program={program} studentId={studentId} userIsStudent={userIsStudent} />
                ) : (
                    <SemesterView courses={courses} program={program} />
                )}
            </div>
        </div>
    )
}
