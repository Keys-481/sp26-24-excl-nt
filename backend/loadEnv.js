/**
 * File: backend/loadEnv.js
 * Loads environment variables from .env.dev in development mode.
 */
const path = require("path");
const dotenv = require("dotenv");

if (process.env.NODE_ENV === 'dev') {
    const envPath = path.resolve(__dirname, '../.env.dev');
    dotenv.config({ path: envPath });
    console.log(`[env] Loaded local env from ${envPath}`);
} else {
    console.log('[env] Using environment variables from Docker or system');
}