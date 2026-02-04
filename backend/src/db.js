/**
 * File: backend/src/db.js
 * This file sets up a  database connection pool to be used across the application.
 * It uses environment variables for configuration.
 */
const path = require('path');
const { Pool } = require('pg');

try {
    require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch {}

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
});

module.exports = pool;