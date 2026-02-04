/** 
 * File: frontend/src/pages/Student/DegreeTracking.jsx
 * Student Degree Tracking Page
 * This file allows students to view their degree progress and plans 
 */
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import StudentNavBar from "../../components/NavBars/StudentNavBar";
import ProgramSelector from "../../components/ProgramSelector";
import { useAuth } from "../../auth/AuthProvider.jsx"; // use the auth provider to get current user
import { useApiClient } from "../../lib/apiClient";

export default function StudentDegreeTracking() {
    const api = useApiClient();
    // get logged-in user
    const { user } = useAuth();

    const location = useLocation();
    const { programId: notifProgramId } = location.state || {};

    // keep a local student object (we'll set it once we know which id works)
    const [student, setStudent] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState(null);

    // fetch student programs when user changes
    useEffect(() => {
        if (!user || !user.public_id) {
            setPrograms([]);
            setSelectedProgram(null);
            setStudent(null);
            return;
        }

        // fetch programs for the logged-in student
        let cancelled = false;
        (async () => {
            try {
                const encoded = encodeURIComponent(user.public_id);
                const data = await api.get(`/students/${encoded}/programs`);

                const studentPrograms = data.programs || (data.programs === undefined && data.programs === null ? [] : data.programs) || [];

                if (!cancelled) {
                    setPrograms(studentPrograms);

                    // select program from notifications if available
                    let initialProgram = studentPrograms[0] ?? null;
                    if (notifProgramId) {
                        const notifProgram = studentPrograms.find(p => p.program_id === notifProgramId);
                        if (notifProgram) {
                            initialProgram = notifProgram;
                        }
                    }

                    setSelectedProgram(initialProgram);

                    // build a minimal student object expected by ProgramSelector / DegreePlan
                    const name = user.name ?? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
                    setStudent({
                        id: String(user.public_id),
                        name: name || undefined,
                        email: user.email,
                        phone: user.phone ?? user.phone_number
                    });
                }
                } catch (err) {
                    console.error('Error fetching student programs:', err);
                }
            }
        )();

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // if no user or student, prompt to log in
    if (!user || !student) {
        return (
            <div>
                <StudentNavBar />
                <div className="window">
                    <div className="title-bar">
                        <h1>Degree Tracking</h1>
                    </div>
                    <div className="container">
                        <p>Please log in to view your degree tracking.</p>
                    </div>
                </div>
            </div>
        );
    }

    // render the degree tracking page
    return (
        <div>
            {/* Student Navigation Bar */}
            <StudentNavBar />
            <div className="window">
                <div className="title-bar">
                    <h1>Degree Tracking</h1>
                </div>
                <div className="container">
                    {/* Program Selector Component */}
                    <ProgramSelector
                        student={student}
                        programs={programs}
                        selectedStudentProgram={selectedProgram}
                        setSelectedProgram={setSelectedProgram}
                        userIsStudent={true}
                    />
                </div>
            </div>
        </div>
    );
}