/**
 * File: StudentModel.js
 * This file defines functions to interact with the 'students' entity in the database.
 * It includes functions to create, read, update, and delete student records.
 * It also includes functions to retrieve programs associated with a student.
 */

const pool = require('../db');
const DegreePlanModel = require('./DegreePlanModel');

/**
 * Get a student by their ID.
 * @param schoolStudentId - The ID of the student to retrieve (not the primary key).
 * @returns A promise that resolves to the student object.
 */
async function getStudentBySchoolId(schoolStudentId) {
    try {
        const result = await pool.query(
            `SELECT s.student_id,
                    s.school_student_id,
                    u.public_id,
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone_number
            FROM students s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.school_student_id = $1`,
            [schoolStudentId]
        );
        return result.rows; // returns the student object or undefined if not found
    } catch (error) {
        console.error('Error fetching student by school ID:', error);
        throw error;
    }
}

/**
 * Get a student by partial name match.
 * @param {*} name - The partial or full name of the student to search for.
 * @returns A promise that resolves to an array of student objects matching the name.
 */
async function getStudentByName(name) {
    try {
        const result = await pool.query(
            `SELECT s.student_id,
                    s.school_student_id,
                    s.user_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone_number
            FROM students s
            JOIN users u ON s.user_id = u.user_id
            WHERE (u.first_name || ' ' || u.last_name) ILIKE $1 OR (u.last_name || ' ' || u.first_name) ILIKE $1`,
            [`%${name}%`]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching student by name:', error);
        throw error;
    }
}

/**
 * Get a student by their school ID and partial name match.
 * @param {*} schoolStudentId - The ID of the student to retrieve (not the primary key).
 * @param {*} name - The partial or full name of the student to search for.
 * @returns A promise that resolves to the student object or undefined if not found.
 */
async function getStudentBySchoolIdAndName(schoolStudentId, name) {
    try {
        const result = await pool.query(
            `SELECT s.student_id,
                    s.school_student_id,
                    s.user_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone_number
            FROM students s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.school_student_id = $1 AND ((u.first_name || ' ' || u.last_name) ILIKE $2 OR (u.last_name || ' ' || u.first_name) ILIKE $2)`,
            [schoolStudentId, `%${name}%`]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching student by school ID and name:', error);
        throw error;
    }
}

/**
 * Get all programs associated with a student by their ID.
 * @param {*} studentId - The internal ID of the student whose programs to retrieve.
 * @returns A promise that resolves to an array of program objects.
 */
async function getProgramsByStudentId(studentId) {
    try {
        const result = await pool.query(
            `SELECT p.program_id, p.program_name, p.program_type
            FROM student_programs sp
            JOIN programs p ON sp.program_id = p.program_id
            WHERE sp.student_id = $1`,
            [studentId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching student programs:', error);
        throw error;
    }
}

/**
 * Get all programs associated with a student by their school_student_id.
 * @param {*} schoolStudentId - The school-level ID of the student.
 * @returns A promise that resolves to an array of program objects.
 */
async function getProgramsBySchoolStudentId(schoolStudentId) {
    try {
        const result = await pool.query(
            `SELECT p.program_id, p.program_name, p.program_type
            FROM student_programs sp
            JOIN students s ON sp.student_id = s.student_id
            JOIN programs p ON sp.program_id = p.program_id
            WHERE s.school_student_id = $1`,
            [schoolStudentId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching programs by school_student_id:', error);
        throw error;
    }
}

/**
 * Add a student to a program (student programs table)
 * Return a boolean indicating success/failure.
 * @param {*} studentId - The internal ID of the student.
 * @param {*} programId - The internal ID of the program.
 */
async function addStudentToProgram(studentId, programId) {
    try {
        const result = await pool.query(
            `INSERT INTO student_programs (student_id, program_id)
            VALUES ($1, $2)
            ON CONFLICT (student_id, program_id) DO NOTHING`,
            [studentId, programId]
        );

        // Insert default degree plan entries for this program
        await DegreePlanModel.createDefaultPlan(studentId, programId);

        return result.rowCount > 0;
    } catch (error) {
        console.error('Error adding student to program:', error);
        throw error;
    }
}

/**
 * Remove a student from a program (student programs table)
 * Return a boolean indicating success/failure.
 * @param {*} studentId - The internal ID of the student.
 * @param {*} programId - The internal ID of the program.
 */
async function removeStudentFromProgram(studentId, programId) {
    try {
        const result = await pool.query(
            `DELETE FROM student_programs
            WHERE student_id = $1 AND program_id = $2`,
            [studentId, programId]
        );
        return result.rowCount > 0;
    } catch (error) {
        console.error('Error removing student from program:', error);
        throw error;
    }
}

/**
 * Get all students matching a phone number (partial or full).
 * @param {*} phoneNumber - Student's phone number (partial or full)
 * @returns A promise that resolves to an array of student objects matching the phone number.
 */
async function getStudentByPhoneNumber(phoneNumber) {
    try {
        const phoneDigits = (phoneNumber || '').replace(/\D/g, '');

        if (!phoneDigits) {
            return [];
        }

        const result = await pool.query(
            `SELECT
                s.student_id,
                s.school_student_id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone_number
            FROM students s
            JOIN users u ON s.user_id = u.user_id
            WHERE regexp_replace(u.phone_number, '\\D', '', 'g')
            LIKE $1 || '%'`,
            [phoneDigits]
        );

        return result.rows;
    } catch (error) {
        console.error('Error fetching student by phone number: ', error);
        throw error;
    }
}


module.exports = {
    getStudentBySchoolId,
    getProgramsByStudentId,
    addStudentToProgram,
    removeStudentFromProgram,
    getStudentByName,
    getStudentBySchoolIdAndName,
    getProgramsBySchoolStudentId,
    getStudentByPhoneNumber,
};
