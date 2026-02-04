/**
 * 
 * file: backend/tests/routes/graduation.test.js
 * Integration tests for graduation routes using Jest and Supertest
 * Tests assume certain values in seed data, if seed data changes, tests may need to be updated
 */

const request = require('supertest');
const express = require('express');
const { runSchemaAndSeeds } = require('../../db_setup');
const pool = require('../../src/db');
const graduationRoutes = require('../../src/routes/graduation');

let client;

// Reset and seed the database before each test
beforeAll(async () => {
    await runSchemaAndSeeds();
});

// Start a transaction before each test
beforeEach(async () => {
    client = await pool.connect();
    await client.query('BEGIN;');
});

// Discard any changes after each test
afterEach(async () => {
    await client.query('ROLLBACK;');
    client.release();
});

// Close the database connection after all tests
afterAll(async () => {
    await pool.end();
});

/**
 * Helper function to create an Express app with mocked authentication
 * @param mockUser - The user object to set in req.user
 * @returns Express app with mocked authentication middleware
 */
function makeAppWithUser(mockUser) {
    const app = express();
    app.use(express.json());

    // mock authentication middleware
    app.use((req, res, next) => {
        req.user = mockUser;
        next();
    });

    app.use('/api/graduation', graduationRoutes);
    return app;
}

/**
 * Test get /graduation route
 */
describe('GET /api/graduation', () => {
    test('returns all applications for admin user', async () => {
        const mockAdminUser = { user_id: 1 };
        const app = makeAppWithUser(mockAdminUser);
        const res = await request(app).get('/api/graduation');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('students');
        expect(Array.isArray(res.body.students)).toBe(true);
        expect(res.body.students.length).toBeGreaterThan(0); // assuming seed data has applications
    });
    test('returns only advisor students for advisor user', async () => {
        const mockAdvisorUser = { user_id: 3 };
        const app = makeAppWithUser(mockAdvisorUser);
        const res = await request(app).get('/api/graduation');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('students');
        expect(Array.isArray(res.body.students)).toBe(true);
        // further checks can be added based on seed data
    });
    test('returns only own application for student user', async () => {
        const mockStudentUser = { user_id: 5 };
        const app = makeAppWithUser(mockStudentUser);
        const res = await request(app).get('/api/graduation');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('students');
        expect(Array.isArray(res.body.students)).toBe(true);
        // further checks can be added based on seed data
    });
});

/**
 * Test get /graduation-report route
 */
describe('GET /api/graduation/graduation-report', () => {
    test('returns filtered applications for accounting user', async () => {
        const mockAccountingUser = { user_id: 14 };
        const app = makeAppWithUser(mockAccountingUser);
        const res = await request(app).get('/api/graduation/graduation-report?status=Applied,Approved');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('students');
        expect(Array.isArray(res.body.students)).toBe(true);
        // further checks can be added based on seed data
    });
});

/**
 * Test put /graduation/:id/status route
 */
describe('PUT /api/graduation/:id/status', () => {
    test('updates application status for admin user', async () => {
        const mockAdminUser = { user_id: 1 };
        const app = makeAppWithUser(mockAdminUser);
        const newStatus = 'Approved';
        const applicationId = 1; // assuming application with ID 1 exists in seed data
        const res = await request(app)
            .put(`/api/graduation/${applicationId}/status`)
            .send({ status: newStatus });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('application_id', applicationId);
        expect(res.body).toHaveProperty('status', newStatus);
    });
});


/**
 * Test GET /graduation route with invalid status filter
 * Should return 400 Bad Request
 */
describe('GET /api/graduation with invalid status filter', () => {
    test('returns 400 for invalid status', async () => {
        const mockAdminUser = { user_id: 1 };
        const app = makeAppWithUser(mockAdminUser);

        const res = await request(app).get('/api/graduation?status=InvalidStatus');

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message', 'Invalid status filter');
    });
});

/**
 * Test PUT /graduation/:id/status route missing status in body
 * Should return 400 Bad Request
 */
describe('PUT /api/graduation/:id/status missing status', () => {
    test('returns 400 if status is not provided', async () => {
        const app = makeAppWithUser({ user_id: 1 }); // admin

        const res = await request(app)
            .put('/api/graduation/1/status')
            .send({}); // no status

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message', 'Missing status');
    });
});

/**
 * Test PUT /graduation/:id/status route forbidden access
 * Should return 403 Forbidden
 */
test("PUT /graduation/:id/status forbids user with no allowed roles", async () => {
    const mockStudentUser = { user_id: 5 }; // has only 'student' role
    const app = makeAppWithUser(mockStudentUser);

    const res = await request(app)
        .put("/api/graduation/1/status")
        .send({ status: "Approved" });

    expect(res.statusCode).toBe(403);
});

/**
 * Test PUT /graduation/:id/status route for non-existent application
 * Should return 404 Not Found
 */
test("PUT /graduation/:id/status returns 404 for missing application", async () => {
    const mockAdminUser = { user_id: 1 };
    const app = makeAppWithUser(mockAdminUser);

    const res = await request(app)
        .put("/api/graduation/99999/status")
        .send({ status: "Approved" });

    expect(res.statusCode).toBe(404);
});

/**
 * Test PUT /graduation/:id/status route for advisor trying to update status for a student they do not advise
 * Should return 403 Forbidden
 */ 
test("advisor cannot update status for student they do not advise", async () => {
    const mockAdvisorUser = { user_id: 3 };
    const app = makeAppWithUser(mockAdvisorUser);

    const res = await request(app)
        .put("/api/graduation/1/status") // ID belonging to non-advisee
        .send({ status: "Approved" });

    expect(res.statusCode).toBe(403);
});

/**
 * Test PUT /graduation/:id/status route for student trying to update their own status
 * Should return 403 Forbidden
 */
test("student cannot update their own graduation status", async () => {
    const mockStudentUser = { user_id: 5 };
    const app = makeAppWithUser(mockStudentUser);
    const res = await request(app)
        .put("/api/graduation/2/status") // ID belonging to the student
        .send({ status: "Approved" });

    expect(res.statusCode).toBe(403);
});

/**
 * Additional tests for edge cases and permissions
 * e.g., forbidden access, not found application, etc.
 */
test("returns 400 for invalid status filter on GET /graduation", async () => {
    const mockUser = { user_id: 1 }; // admin user
    const app = makeAppWithUser(mockUser);

    const res = await request(app).get("/api/graduation?status=NotARealStatus"); // invalid status

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid status filter");
});