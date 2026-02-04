/**
 * File: backend/src/models/ProgramsModel.js
 * Model for interacting with the programs entity in the database
 */

const pool = require('../db');

/**
 * Retrieves all programs from the database.
 * @returns {Promise<Array>} - A promise that resolves to an array of programs.
 */
const getAllPrograms = async () => {
    try {
        const result = await pool.query(
            `SELECT *
            FROM programs`
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching programs:', error);
        throw error;
    }
};

module.exports = {
    getAllPrograms
};
