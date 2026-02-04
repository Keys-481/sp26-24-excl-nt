/**
 * File: backend/jest.env.js
 * Jest environment setup file to load environment variables before tests run
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
