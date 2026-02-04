/**
 * File: backend/src/routes/programs.js
 * Routes for handling programs.
 */

const express = require('express');
const router = express.Router();
const ProgramsModel = require('../models/ProgramsModel');

/**
 * route GET /programs
 * Retrieves all programs from the database
 */
router.get('/', async (req, res) => {
    try {
        const programs = await ProgramsModel.getAllPrograms();
        res.json(programs);
    } catch (error) {
        console.error('Error fetching programs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
