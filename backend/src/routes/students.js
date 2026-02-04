/**
 * File: backend/src/routes/students.js
 * This file defines the routes for student-related operations.
 */

const express = require('express');
const router = express.Router();
const StudentModel = require('../models/StudentModel');
const AccessModel = require('../models/AccessModel');
const DegreePlanModel = require('../models/DegreePlanModel');
const CourseModel = require('../models/CourseModel');
const pool = require('../db');
const { requireUser, requireAnyRole } = require('../utils/authorize');


/**
 * Route: GET /students/search
 * Supports searching for a student by their school ID, and partial or full name (q1, q2).
 * Also supports searching by phone number
 * 
 * @response 400 - Missing search parameters
 * @response 401 - Unauthorized: No user info
 * @response 404 - Student not found
 * @response 500 - Internal server error
 * @response 200 - OK
 * @returns A list of students matching the search criteria
 */
router.get('/search', requireUser, async (req, res) => {
    try {
        // Accept both modern and legacy query parameters
        const rawId = req.query.id ?? req.query.q1 ?? req.query.schoolId ?? null;
        const rawName = req.query.name ?? req.query.q2 ?? req.query.q ?? null;

        const id = typeof rawId === 'string' ? rawId.trim() : '';
        const name = typeof rawName === 'string' ? rawName.trim() : '';

        if (!id && !name) {
            return res.status(400).json({ message: 'Missing search parameters: school ID or name' });
        }

        // Get students by provided parameters
        let students = [];
        if (id && name) {
            students = await StudentModel.getStudentBySchoolIdAndName(id, name);
        } else if (id) {
            students = await StudentModel.getStudentBySchoolId(id);
        } else {
            students = await StudentModel.getStudentByName(name);
        }

        // Search by phone number if no results found
        if (!Array.isArray(students) || students.length === 0) {
            let phoneMatches = [];

            // Find phone number in ID field
            if (id) {
                phoneMatches = await StudentModel.getStudentByPhoneNumber(id);
            }

            // Try phone number in name field
            if ((!phoneMatches || phoneMatches.length === 0) && name) {
                phoneMatches = await StudentModel.getStudentByPhoneNumber(name);
            }

            students = phoneMatches;
        }

        if (!Array.isArray(students) || students.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Get current user roles
        const roles = await AccessModel.getUserRoles(req.user.user_id);
        const isAdmin = roles.includes('admin');
        const isAdvisor = roles.includes('advisor');

        let visible = students;

        // Show students under advisor
        if (!isAdmin && isAdvisor) {
            const checks = await Promise.all(
                students.map(s => AccessModel.isAdvisorOfStudent(req.user.user_id, s.student_id))
            );
            visible = students.filter((_, i) => checks[i]);
        } else if (!isAdmin) {
            // Non-admin and non-advisor
            visible = [];
        }

        // No match
        if (visible.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Return formatted results
        return res.json(visible.map(s => ({
            id: s.school_student_id,
            name: `${s.first_name} ${s.last_name}`,
            email: s.email,
            phone: s.phone_number,
            student_id: s.student_id,
        })));
    } catch (error) {
        console.error('[student] /search error', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * Route: GET /students/assigned
 * Retrieves a list of students assigned to the logged-in advisor.
 * @response 401 - Unauthorized: No user info
 * @response 403 - Forbidden: You do not have access to assigned students
 * @response 500 - Internal server error
 * @response 200 - OK
 * @returns A list of assigned students
 */
router.get('/assigned', requireAnyRole(['advisor']), async (req, res) => {
    try {
        // Expect req.user to be set by middleware (mock or real auth)
        const advisorUserId = req.user.user_id;

        // Fetch assigned students
        const { rows } = await pool.query(
            `SELECT s.student_id,
                    s.school_student_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone_number
                FROM advisors a
                JOIN advising_relations ar ON ar.advisor_id = a.advisor_id
                JOIN students s ON s.student_id = ar.student_id
                JOIN users u ON u.user_id = s.user_id
                WHERE a.user_id = $1
                ORDER BY u.last_name, u.first_name
            `,
            [advisorUserId]
        );

        // Format and return the list of assigned students
        const list = rows.map(r => ({
            id: r.school_student_id,
            name: `${r.first_name} ${r.last_name}`,
            email: r.email,
            phone: r.phone_number,
            student_id: r.student_id,
        }));

        return res.json(list);       
    } catch (err) {
        console.error('[student] Error fetching assigned students:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * Route: GET /students/:schoolId
 * Retrieves a student by their school ID.
 */
router.get('/:schoolId', async (req, res) => {
    const { schoolId } = req.params;
    try {
        // Expect req.user to be set by middleware (mock or real auth)
        const currentUser = req.user;
        if (!currentUser || !currentUser.user_id) {
            return res.status(401).json({ message: 'Unauthorized: No user info' });
        }

        // get student by schoolId
        const studentResult = await StudentModel.getStudentBySchoolId(schoolId);
        const student = studentResult && studentResult.length > 0 ? studentResult[0] : null;

        // check if student exists
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // check access permissions
        const userRoles = await AccessModel.getUserRoles(currentUser.user_id);
        if (userRoles.includes('admin')) {
            // admin has access to all students
            return res.json(student);
        }
        if (userRoles.includes('advisor')) {
            const hasAccess = await AccessModel.isAdvisorOfStudent(currentUser.user_id, student.student_id);

            if (hasAccess) {
                return res.json(student);
            } else {
                return res.status(404).json({ message: 'Student not found' });
            }
        }

    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * Route: GET /students/:schoolId/degree-plan
 * Retrieves the degree plan for a student and program by their school ID.
 * Query params:
 *   - programId: internal program ID
 *   - viewType: 'semester' or 'requirements'
 */
router.get('/:schoolId/degree-plan', async (req, res) => {
    const { schoolId } = req.params;
    const { programId, viewType } = req.query;

    try {
        // Expect req.user to be set by middleware (mock or real auth)
        const currentUser = req.user;
        if (!currentUser || !currentUser.user_id) {
            return res.status(401).json({ message: 'Unauthorized: No user info' });
        }

        // get student by schoolId
        const studentResult = await StudentModel.getStudentBySchoolId(schoolId);
        const student = studentResult && studentResult.length > 0 ? studentResult[0] : null;

        // check if student exists
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // check access permissions
        const userRoles = await AccessModel.getUserRoles(currentUser.user_id);
        let hasAccess = false;

        if (userRoles.includes('admin')) {
            hasAccess = true;
        } else if (userRoles.includes('advisor')) {
            hasAccess = await AccessModel.isAdvisorOfStudent(currentUser.user_id, student.student_id);
        } else if (userRoles.includes('student')) {
            hasAccess = currentUser.user_id === student.user_id;
        }

        if (hasAccess) {
            let degreePlan = [];
            
            if (viewType == 'requirements') {
                degreePlan = await DegreePlanModel.getDegreePlanByRequirements(student.student_id, programId);
            } else {
                degreePlan = await DegreePlanModel.getDegreePlanByStudentId(student.student_id, programId);
            }

            if (!programId) {
                return res.status(400).json({ message: 'Missing programId query parameter' });
            }

            // Get total required credits for the program
            const totalRequiredCredits = await DegreePlanModel.getTotalProgramRequiredCredits(programId);

            // add prerequisites and course offerings to each course in the degree plan
            degreePlan = await Promise.all(
                degreePlan.map(async (course) => {
                    const prerequisites = await CourseModel.getPrerequisitesForCourse(course.course_id);
                    const offered_semesters = await CourseModel.getCourseOfferings(course.course_id);
                    const certificate_overlaps = await CourseModel.getCertificateOverlaps(course.course_id);
                    const semester_options = await CourseModel.getSemesterOptionsForCourse(course.course_id);
                    return {
                        ...course,
                        prerequisites,
                        offered_semesters,
                        certificate_overlaps,
                        semester_options
                    };
                })
            );
            return res.json({ student, programId, viewType, degreePlan, totalRequiredCredits });
        } else {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this student\'s degree plan' });
        }
    } catch (error) {
        console.error('Error fetching degree plan:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * Route: GET /students/:schoolId/programs
 * Retrieves all programs associated with a student by their school ID.
 */
router.get('/:schoolId/programs', async (req, res) => {
    const { schoolId } = req.params;

    try {
        // Expect req.user to be set by middleware (mock or real auth)
        const currentUser = req.user;
        if (!currentUser || !currentUser.user_id) {
            return res.status(401).json({ message: 'Unauthorized: No user info' });
        }

        // get student by schoolId
        const studentResult = await StudentModel.getStudentBySchoolId(schoolId);
        const student = studentResult && studentResult.length > 0 ? studentResult[0] : null;

        // check if student exists
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // check access permissions
        const userRoles = await AccessModel.getUserRoles(currentUser.user_id);
        let hasAccess = false;

        if (userRoles.includes('admin')) {
            hasAccess = true;
        } else if (userRoles.includes('advisor')) {
            hasAccess = await AccessModel.isAdvisorOfStudent(currentUser.user_id, student.student_id);
        } else if (userRoles.includes('student')) {
            hasAccess = currentUser.user_id === student.user_id;
        }

        if (hasAccess) {
            const programs = await StudentModel.getProgramsByStudentId(student.student_id);
            return res.json({ student, programs });
        } else {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this student\'s programs' });
        }
    } catch (error) {
        console.error('Error fetching student programs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * Route: PATCH /students/:schoolId/programs
 * Adds a student to a new program by their school ID.
 */
router.patch('/:schoolId/programs', async (req, res) => {
    const { schoolId } = req.params;
    const { programId } = req.body;
    try {
        const currentUser = req.user;
        if (!currentUser || !currentUser.user_id) {
            return res.status(401).json({ message: 'Unauthorized: No user info' });
        }

        // get student by schoolId
        const studentResult = await StudentModel.getStudentBySchoolId(schoolId);
        const student = studentResult && studentResult.length > 0 ? studentResult[0] : null;

        // check if student exists
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // check access permissions
        const userRoles = await AccessModel.getUserRoles(currentUser.user_id);
        let hasAccess = false;

        // admin can update any student in edit user
        if (userRoles.includes('admin')) {
            hasAccess = true;
        }

        if (hasAccess) {
            const existingPrograms = await StudentModel.getProgramsByStudentId(student.student_id);
            if (existingPrograms.some(p => p.program_id === programId)) {
                return res.status(400).json({ message: 'Student is already enrolled in the specified program' });
            }

            const result = await StudentModel.addStudentToProgram(student.student_id, programId);
            return res.json({ message: 'Student enrolled in program successfully', result });
        } else {
            return res.status(403).json({ message: 'Forbidden: You do not have access to enroll this student in a program' });
        }
    } catch (error) {
        console.error('Error enrolling student in program:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * Route: DELETE /students/:schoolId/programs
 * Removes a student from a program by their school ID.
 */
router.delete('/:schoolId/programs', async (req, res) => {
    const { schoolId } = req.params;
    const { programId } = req.body;
    try {
        const currentUser = req.user;
        if (!currentUser || !currentUser.user_id) {
            return res.status(401).json({ message: 'Unauthorized: No user info' });
        }

        // get student by schoolId
        const studentResult = await StudentModel.getStudentBySchoolId(schoolId);
        const student = studentResult && studentResult.length > 0 ? studentResult[0] : null;

        // check if student exists
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // check access permissions
        const userRoles = await AccessModel.getUserRoles(currentUser.user_id);
        let hasAccess = false;

        // admin can update any student in edit user
        if (userRoles.includes('admin')) {
            hasAccess = true;
        }

        if (hasAccess) {
            const result = await StudentModel.removeStudentFromProgram(student.student_id, programId);
            if (!result) {
                return res.status(400).json({ message: 'Student not enrolled in the specified program' });
            }
            return res.json({ message: 'Student removed from program successfully', result });
        } else {
            return res.status(403).json({ message: 'Forbidden: You do not have access to remove this student from a program' });
        }
    } catch (error) {
        console.error('Error removing student from program:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * Route: PATCH /students/:schoolId/degree-plan/course/:courseId
 * Updates the status of a course in a student's degree plan (e.g., mark as completed, in-progress).
 * If status set to 'Planned', semesterId must be provided.
 *
 * Body params:
 *  - status: 'Completed', 'In Progress', 'Planned'
 *  - courseId: internal course ID
 *  - semesterId: internal semester ID (required if status is 'Planned')
 *  - programId: internal program ID
 *
 * @returns Updated course info in the degree plan
 * @response 400 - Missing parameters or invalid status
 * @response 401 - Unauthorized: No user info
 * @response 403 - Forbidden: No access to student
 * @response 404 - Student or course not found
 * @response 500 - Internal server error
 * @response 200 - OK
 */
router.patch('/:schoolId/degree-plan/course', async (req, res) => {
    const { schoolId } = req.params;
    const { courseId, status, semesterId, programId } = req.body;

    try {
        // Expect req.user to be set by middleware (mock or real auth)
        const currentUser = req.user;
        if (!currentUser || !currentUser.user_id) {
            return res.status(401).json({ message: 'Unauthorized: No user info' });
        }

        // validate input
        if (!status || !['Unplanned', 'Planned', 'In Progress', 'Completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid or missing status. Must be one of: Unplanned, Planned, In Progress, Completed' });
        }
        if (status === 'Planned' && !semesterId) {
            return res.status(400).json({ message: 'semesterId is required when status is Planned' });
        }

        // get student by schoolId
        const studentResult = await StudentModel.getStudentBySchoolId(schoolId);
        const student = studentResult && studentResult.length > 0 ? studentResult[0] : null;

        // check if student exists
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // check access permissions
        const userRoles = await AccessModel.getUserRoles(currentUser.user_id);
        let hasAccess = false;

        if (userRoles.includes('admin')) {
            hasAccess = true;
        } else if (userRoles.includes('advisor')) {
            hasAccess = await AccessModel.isAdvisorOfStudent(currentUser.user_id, student.student_id);
        } // students cannot update their own degree plans

        if (!hasAccess) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this student\'s degree plan' });
        }


        if (['Planned', 'In Progress'].includes(status)) {
            // get course prerequisites
            const prerequisites = await CourseModel.getPrerequisitesForCourse(courseId);

            if (prerequisites && prerequisites.length > 0) {
                for (let prereq of prerequisites) {
                    // check status of prerequisite in degree plan
                    const prereqCourse = await DegreePlanModel.getCourseStatus(student.student_id, prereq.course_id, programId);

                    // block update if prerequisite not in student's degree plan or is unplanned
                    if (!prereqCourse || !['In Progress', 'Completed', 'Planned'].includes(prereqCourse.course_status)) {
                        return res.status(400).json({ message: `Cannot update course status. Prerequisite course ${prereq.course_id} is not completed or in progress.` });
                    }

                    // enforce semester ordering for prerequisites
                    if (semesterId && prereqCourse.semester_id && Number(prereqCourse.semester_id) >= Number(semesterId)) {
                        return res.status(400).json({ message: `Cannot plan course in semester ${semesterId}. Prerequisite course ${prereq.course_id} is scheduled in the same or a later semester.` });
                    }
                }
            }
        }

        if (status === 'Completed') {
            const prerequisites = await CourseModel.getPrerequisitesForCourse(courseId);

            if (prerequisites && prerequisites.length > 0) {
                for (const prereq of prerequisites) {
                    const prereqCourse = await DegreePlanModel.getCourseStatus(student.student_id, prereq.course_id, programId);
                    if (!prereqCourse) {
                        console.warn(`Warning: ${courseId} marked completed, but prerequisite ${prereq.course_id} not found in degree plan.`);
                    }
                }
            }
        }

        // update course status in degree plan
        const updatedCourse = await DegreePlanModel.updateCourseStatus(
            student.student_id,
            courseId,
            status,
            semesterId,
            programId
        );

        if (!updatedCourse) {
            return res.status(404).json({ message: 'Course not found in student\'s degree plan' });
        }
        return res.json(updatedCourse);

    } catch (error) {
        console.error('Error updating course status in degree plan:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;