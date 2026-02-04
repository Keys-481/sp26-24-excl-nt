/**
 * file: backend/src/models/GraduationModel.js
 * Handles queries for graduation_applications and joins to student/user/program info.
 */
const pool = require('../../src/db');
/**
 * Get graduation applications, optionally filtered by status.
 * @param {string} [status] - Optional status to filter applications by.
 * @returns {Promise<Array>} An array of graduation application objects.
 */
async function getApplications(status) {
    const params = [];
    let where = '';
    if (status) {
        params.push(status);
        where = `WHERE ga.status = $${params.length}`; // parameterized query
    }
    // SQL query to get graduation applications with joins
    const q = `
        SELECT ga.application_id,
               ga.student_id,
               s.school_student_id,
               u.user_id AS user_id,
               u.first_name,
               u.last_name,
               ga.program_id,
               p.program_name,
               ga.status,
               ga.applied_at,
               ga.status_updated_at
        FROM graduation_applications ga
        JOIN students s ON ga.student_id = s.student_id
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN programs p ON ga.program_id = p.program_id
        ${where}
        ORDER BY ga.status_updated_at DESC NULLS LAST, ga.applied_at DESC
    `;
    const res = await pool.query(q, params);
    return res.rows;
}

/**
 * Get a graduation application by its ID.
 * @param {number} applicationId - The ID of the graduation application.
 * @returns {Promise<Object|null>} The graduation application object or null if not found.
 */
async function getApplicationById(applicationId) {
    const res = await pool.query(
        `SELECT * FROM graduation_applications WHERE application_id = $1`,
        [applicationId]
    );
    return res.rows[0] || null;
}

/**
 * Create a new graduation application for a student in a specific program.
 * @param {number} studentId - The ID of the student.
 * @param {number} programId - The ID of the program.
 * @returns {Promise<Object>} The newly created graduation application object.
 */
async function createApplication(studentId, programId) {
    const res = await pool.query(
        `INSERT INTO graduation_applications (student_id, program_id, status, applied_at, status_updated_at)
         VALUES ($1, $2, 'Not Applied', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [studentId, programId]
    );
    return res.rows[0];
}

/**
 * Update the status of a graduation application.
 * @param {number} applicationId - The ID of the graduation application.
 * @param {string} newStatus - The new status to set for the application.
 * @returns {Promise<Object>} The updated graduation application object.
 */
async function updateApplicationStatus(applicationId, newStatus) {
    const res = await pool.query(
        `UPDATE graduation_applications
         SET status = $1, status_updated_at = CURRENT_TIMESTAMP
         WHERE application_id = $2
         RETURNING *`,
        [newStatus, applicationId]
    );
    return res.rows[0];
}

//Export Functions
module.exports = {
    getApplications,
    getApplicationById,
    createApplication,
    updateApplicationStatus,
};