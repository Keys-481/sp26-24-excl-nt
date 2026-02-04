/**
 * File: backend/src/models/AccessModel.js
 * This file defines functions to interact with entities related to access control in the database.
 * It includes functions to check user roles and permissions, as well as access to specific data.
 */

const pool = require('../db');

/**
 * Get roles for a given user ID
 * @param userId - The ID of the user
 * @returns A promise that resolves to an array of role names
 */
async function getUserRoles(userId) {
    try {
        // Query to get roles associated with the user
        const result = await pool.query(
            `SELECT r.role_name FROM roles r
            JOIN user_roles ur ON r.role_id = ur.role_id
            WHERE ur.user_id = $1`,
            [userId]
        );
        return result.rows.map(row => row.role_name);
    } catch (error) {
        console.error('Error fetching user roles:', error);
        throw error;
    }
}

/**
 * Check if a user has access to a specific student
 * @param userId - The user ID of the advisor
 * @param studentId - The ID of the student
 * @returns A promise that resolves to true if the advisor has access, false otherwise
 */
async function isAdvisorOfStudent(userId, studentId) {
    try {
        // Query to check if the advisor is assigned to the student
        const result = await pool.query(
            `SELECT 1 FROM advising_relations ar
            JOIN advisors a ON ar.advisor_id = a.advisor_id
            WHERE a.user_id = $1 AND ar.student_id = $2`,
            [userId, studentId]
        );
        return result.rowCount > 0;
    } catch (error) {
        console.error('Error checking advisor-student relation:', error);
        throw error;
    }
}

// Export functions
module.exports = {
    getUserRoles,
    isAdvisorOfStudent
};