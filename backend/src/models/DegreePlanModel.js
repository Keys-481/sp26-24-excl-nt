/**
 * File: backend/src/models/DegreePlanModel.js
 * Model for interacting with the degree_plans table in the database.
 */

const pool = require('../db');

/**
 * Get the degree plan for a specific student by their internal student ID.
 * @param studentId - The internal ID of the student (not school ID).
 * @param programId - The internal ID of a program
 * @returns A promise that resolves to an array of degree plan entries for the student (courses in the plan).
 */
async function getDegreePlanByStudentId(studentId, programId) {
    try {
        const result = await pool.query(
            `SELECT dp.plan_id, dp.student_id, dp.course_id, dp.course_status, dp.catalog_year, dp.program_id,
                c.course_id, c.course_code, c.course_name, c.credits,
                s.semester_id, s.semester_name, s.semester_type,
                s.sem_start_date, s.sem_end_date,
                p.program_name, p.program_type
            FROM degree_plans dp
            JOIN courses c ON dp.course_id = c.course_id
            JOIN semesters s on dp.semester_id = s.semester_id
            JOIN programs p ON dp.program_id = p.program_id
            WHERE dp.student_id = $1 AND dp.program_id = $2
            ORDER BY s.sem_start_date ASC, c.course_code ASC`,
            [studentId, programId]
        );
        
        return result.rows;

    } catch (error) {
        console.error('Error fetching degree plan:', error);
        throw error;
    }
}

/**
 * Get a student's degree plan by their phone number.
 * @param {*} studentPhoneNumber - internal student phone number
 * @param {*} programId - internal program ID
 * @returns All students with a matching phone number
 */
async function getDegreePlanByStudentPhoneNumber(studentPhoneNumber, programId) {
    try {
        const result = await pool.query(
            `SELECT dp.plan_id, dp.student_id, dp.course_id, dp.course_status, dp.catalog_year,
                c.course_id, c.course_code, c.course_name, c.credits,
                s.semester_id, s.semester_name, s.semester_type,
                s.sem_start_date, s.sem_end_date,
                p.program_name, p.program_type
            FROM degree_plans dp
            JOIN students st ON dp.student_id = st.student_id
            JOIN users u ON st.user_id = u.user_id
            JOIN courses c ON dp.course_id = c.course_id
            LEFT JOIN semesters s on dp.semester_id = s.semester_id
            JOIN programs p ON dp.program_id = p.program_id
            WHERE regexp_replace(u.phone_number, '\\D', '', 'g') = regexp_replace($1, '\\D', '', 'g')
            AND dp.program_id = $2
            ORDER BY s.sem_start_date ASC NULLS LAST, c.course_code ASC`,
            [studentPhoneNumber, programId]
        );

        return result.rows;
    } catch (error) {
        console.error('Error fetching degree plan by phone number:', error);
        throw error;
    }
}

/**
 * Get a student's degree plan by program requirements,
 * this is to support viewing all program requirements and which courses satisfy them
 * @param {*} studentId - internal student ID
 * @param {*} programId - internal program ID
 * @returns 
 */
async function getDegreePlanByRequirements(studentId, programId) {
    try {
        const query = `
        WITH reqs AS (
            SELECT
                pr.requirement_id, pr.program_id, pr.req_description, pr.required_credits, pr.parent_requirement_id, pr.requirement_type, pr.display_order,
                parent.req_description AS parent_description,
                parent.display_order AS parent_order,
                CASE WHEN pr.parent_requirement_id IS NOT NULL THEN parent.req_description
                ELSE pr.req_description END AS requirement_label
            FROM program_requirements pr
            LEFT JOIN program_requirements parent
                ON parent.requirement_id = pr.parent_requirement_id
            WHERE pr.program_id = $2
        )
        SELECT
            r.requirement_id, r.requirement_type, r.req_description, r.parent_requirement_id, r.parent_description, r.required_credits, r.requirement_label, r.display_order, r.parent_order,
            c.course_id, c.course_code, c.course_name, c.credits,
            dp.course_status, dp.catalog_year, s.semester_id, s.semester_name
        FROM reqs r
        LEFT JOIN requirement_courses rc
            ON rc.requirement_id = r.requirement_id
        LEFT JOIN courses c
            ON c.course_id = rc.course_id
        LEFT JOIN degree_plans dp
            ON dp.course_id = c.course_id
            AND dp.student_id = $1
            AND dp.program_id = r.program_id
        LEFT JOIN semesters s
            ON s.semester_id = dp.semester_id
        ORDER BY
            COALESCE(r.parent_order, r.display_order),
            r.display_order,
            c.course_code;
        `;

        const { rows } = await pool.query(query, [studentId, programId]);
        return rows;
    } catch (error) {
        console.error('Error fetching degree plan by requirement:', error);
        throw error;
    }
}

/** Get the total required credits for a program
 * @param {*} programId - internal program ID
 * @returns total required credits for the program
 */
async function getTotalProgramRequiredCredits(programId) {
    try {
        const result = await pool.query(
            `SELECT SUM(required_credits) AS total_required_credits
            FROM program_requirements
            WHERE program_id = $1 AND parent_requirement_id IS NULL`,
            [programId]
        );
        return parseInt(result.rows[0]?.total_required_credits) || 0;
    } catch (error) {
        console.error('Error fetching total program required credits:', error);
        throw error;
    }
}

/**
 * Update the status of a course in a student's degree plan
 * @param {*} studentId - internal student ID
 * @param {*} courseId - internal course ID
 * @param {*} newStatus - new status for the course
 * @param {*} semesterId - internal semester ID
 * @param {*} programId - internal program ID
 * @returns The updated degree plan entry
 */
async function updateCourseStatus(studentId, courseId, newStatus, semesterId, programId) {
    try {
        const query = `
            INSERT INTO degree_plans (student_id, course_id, course_status, semester_id, program_id, catalog_year)
            VALUES (
                $1, $2, $3, $4, $5,
                COALESCE(
                    (SELECT dp.catalog_year FROM degree_plans dp WHERE dp.student_id = $1 AND dp.program_id = $5
                    LIMIT 1), '2025-2026'
                )
            )
            ON CONFLICT (student_id, course_id, program_id)
            DO UPDATE SET
                course_status = EXCLUDED.course_status,
                semester_id = EXCLUDED.semester_id
            RETURNING *;
        `;
        const result = await pool.query(query, [studentId, courseId, newStatus, semesterId, programId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating course status:', error.message);
        throw error;
    }
}

/** Get the status of a specific course in a student's degree plan
 * @param {*} studentId - internal student ID
 * @param {*} courseId - internal course ID
 * @returns The status of the course (e.g., 'completed', 'in-progress', 'planned') or null if not found
 */
async function getCourseStatus(studentId, courseId, programId) {
    try {
        const query = `
            SELECT course_id, course_status, semester_id
            FROM degree_plans
            WHERE student_id = $1 AND course_id = $2 AND program_id = $3
        `;
        const result = await pool.query(query, [studentId, courseId, programId]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error fetching course status:', error.message);
        throw error;
    }
}

/**
 * Create a default degree plan for a student in a specific program and preserves history if it exists
 * @param {*} studentId - internal student ID
 * @param {*} programId - internal program ID
 * @param {*} defaultStatus - default status for the courses
 * @param {*} catalogYear - catalog year for the courses
 * @returns The newly created degree plan entries
 */
async function createDefaultPlan(studentId, programId, defaultStatus = 'Unplanned', catalogYear = '2025-2026') {
    try {
        const query = `
            INSERT INTO degree_plans (student_id, program_id, course_id, semester_id, course_status, catalog_year)
            SELECT
                $1 AS student_id,
                $2 AS program_id,
                c.course_id,
                COALESCE(dp_existing.semester_id, NULL) AS semester_id,
                COALESCE(dp_existing.course_status, $3) AS course_status,
                COALESCE(
                    (SELECT dp.catalog_year
                    FROM degree_plans dp
                    WHERE dp.student_id = $1 AND dp.program_id = $2
                    LIMIT 1), $4
                ) AS catalog_year
            FROM program_requirements pr
            JOIN requirement_courses rc ON pr.requirement_id = rc.requirement_id
            JOIN courses c ON rc.course_id = c.course_id
            LEFT JOIN degree_plans dp_existing
                ON dp_existing.student_id = $1
                AND dp_existing.course_id = c.course_id
            WHERE pr.program_id = $2
            ON CONFLICT (student_id, course_id, program_id) DO NOTHING
            RETURNING *;
        `;

        const { rows } = await pool.query(query, [studentId, programId, defaultStatus, catalogYear]);
        return rows;
    } catch (error) {
        console.error('Error creating default degree plan:', error);
        throw error;
    }
}

//Export functions
module.exports = {
    getDegreePlanByStudentId,
    getDegreePlanByRequirements,
    getTotalProgramRequiredCredits,
    updateCourseStatus,
    getCourseStatus,
    getDegreePlanByStudentPhoneNumber,
    createDefaultPlan,
}

