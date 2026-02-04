/**
 * Database Setup Script:
 * file: backend/db_setup.js
 * Automates the database setup and seeding process for local development and testing.
 * Connects to PostgreSQL, drops all existing tables, re-creates them, and populates with mock data.
 * Can be called directly or imported for Jest tests
 */

require('./loadEnv');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const dbConfig = {
    host: process.env.DB_HOST || 'postgres',
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT || 5432,
};

async function ensureDatabaseExists() {
    const client = new Client({ ...dbConfig, database: 'postgres'});
    await client.connect();

    try {
        const res = await client.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [dbConfig.database]
        );

        if (res.rowCount === 0) {
            console.log(`Database "${dbConfig.database}" does not exist. Creating...`);
            await client.query(`CREATE DATABASE ${dbConfig.database}`);
            console.log(`Database "${dbConfig.database}" created successfully.`);
        } else {
            console.log(`Database "${dbConfig.database}" already exists.`);
        }
    } catch (error) {
        console.error('Error ensuring database exists:', error);
    } finally {
        await client.end();
    }
}

/**
 * runSchemaAndSeeds: connects to the database, executes schema and seed SQL files.
 * @async
 */
async function runSchemaAndSeeds() {
    console.log('--- Setting up database... ---');
    const client = new Client(dbConfig);

    try {
        await client.connect();

        // Read and execute the schema.sql file
        console.log('Executing schema.sql...');
        const schemaSQL = fs.readFileSync(path.resolve(__dirname, '../database/schema.sql'), 'utf8');
        await client.query(schemaSQL);
        console.log('Schema setup complete.');

        // Read and execute the seeds.sql file
        console.log('Executing seeds.sql...');
        const seedsSQL = fs.readFileSync(path.resolve(__dirname, '../database/seeds.sql'), 'utf8');
        await client.query(seedsSQL);
        console.log('Mock data seeded successfully.');

        console.log('--- Database setup complete! ---');
    } catch (err) {
        console.error('Failed to set up database:', err.stack);
        throw err;
    } finally {
        await client.end();
    }
}

// If this script is run directly, execute the setup
if (require.main === module) {
    (async () => {
        try {
            await ensureDatabaseExists();
            await runSchemaAndSeeds();
            console.log('DB setup finished successfully.');
        } catch (err) {
            console.error('DB setup failed:', err);
            process.exit(1);
        }
    })();
}

module.exports = { runSchemaAndSeeds };