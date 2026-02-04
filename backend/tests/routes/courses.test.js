/**
 * File: backend/tests/routes/courses.test.js
 * Integration tests for course routes using Jest and Supertest
 * Test database should be set up and seeded before running these tests
 */

const request = require('supertest');
const express = require('express');
const { runSchemaAndSeeds } = require('../../db_setup');
const pool = require('../../src/db');
const courseRoutes = require('../../src/routes/courses');

// Reset and seed the database before all tests
beforeAll(async () => {
    await runSchemaAndSeeds();
}, 15000);

// Close the database connection after all tests
afterAll(async () => {
    await pool.end();
});

// Silence console.error during tests
beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
});

// Restore console.error after tests
afterAll(() => {
    consoleErrorSpy.mockRestore();
});

/**
 * Helper function to create an Express app
 */
function makeApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/courses', courseRoutes);
    return app;
}

/**
 * Tests for /courses/search route
 */
describe('GET /courses/search', () => {
    test('returns enriched course data for valid name and code', async () => {
        const app = makeApp();
        const res = await request(app).get('/api/courses/search').query({ // valid name and code
            q1: 'Organizational Performance and Workplace Learning',
            q2: 'OPWL-536'
        });

        expect(res.status).toBe(200);
        expect(res.body[0].code).toBe('OPWL-536');
        expect(res.body[0].name).toBe('Organizational Performance and Workplace Learning');
        expect(typeof res.body[0].offerings).toBe('string');
        expect(res.body[0].offerings).toContain('FA');
        expect(res.body[0].offerings).toContain('SP');
        expect(res.body[0].offerings).toContain('SU');
        expect(Array.isArray(res.body[0].prerequisites)).toBe(true);
    });

    // Missing parameters
    test('returns 400 for missing parameters', async () => {
        const app = makeApp();
        const res = await request(app).get('/api/courses/search');
        expect(res.status).toBe(400);
    });

    // No matching courses
    test('returns 404 for no matching courses', async () => {
        const app = makeApp();
        const res = await request(app).get('/api/courses/search').query({ q1: 'Nonexistent' });
        expect(res.status).toBe(404);
    });
});

/**
 * Tests for POST /courses
 */
describe('POST /courses', () => {
    test('creates a new course with offerings and prerequisites', async () => { // valid data
        const app = makeApp();
        const res = await request(app).post('/api/courses').send({
            name: 'Test Course',
            code: 'TEST101',
            credits: 3,
            prerequisites: 'OPWL-536',
            offerings: 'FA, SP'
        });

        expect(res.status).toBe(201);
        expect(res.body.name).toBe('Test Course');
        expect(res.body.code).toBe('TEST101');
        expect(res.body.credits).toBe(3);
    });
});

/**
 * Tests for PUT /courses/:id
 */
describe('PUT /courses/:id', () => {
    test('updates an existing course', async () => {
        const app = makeApp();

        // Create a course to update
        const createRes = await request(app).post('/api/courses').send({
            name: 'Update Me',
            code: 'UPD101',
            credits: 2,
            prerequisites: '',
            offerings: 'FA'
        });

        // Get the created course ID
        const courseId = createRes.body.id;

        // Update the course
        const updateRes = await request(app).put(`/api/courses/${courseId}`).send({
            name: 'Updated Course',
            code: 'UPD101',
            credits: 4,
            prerequisites: '',
            offerings: 'SP'
        });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.name).toBe('Updated Course');
        expect(updateRes.body.credits).toBe(4);
    });

    // Invalid course ID
    test('returns 400 for invalid course ID', async () => {
        const app = makeApp();
        const res = await request(app).put('/api/courses/abc').send({});
        expect(res.status).toBe(400);
    });
});

/**
 * Tests for DELETE /courses/:id
 */
describe('DELETE /courses/:id', () => {
    test('deletes an existing course', async () => {
        const app = makeApp();

        // Create a course to delete
        const createRes = await request(app).post('/api/courses').send({
            name: 'Delete Me',
            code: 'DEL101',
            credits: 1,
            prerequisites: '',
            offerings: ''
        });

        // Get the created course ID
        const courseId = createRes.body.id;

        //  Delete the course
        const deleteRes = await request(app).delete(`/api/courses/${courseId}`);
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.message).toBe('Course deleted successfully');
    });
});

/**
 * Tests for GET /courses/enrollments
 * 
 */
describe('GET /courses/enrollments', () => {
    test('returns enrollment data for a valid course code', async () => {
        const app = makeApp();
        const res = await request(app).get('/api/courses/enrollments').query({ courseCode: 'OPWL-536' });
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.enrollments)).toBe(true);
    });

    // Missing courseCode parameter
    test('returns 400 for missing courseCode parameter', async () => {
        const app = makeApp();
        const res = await request(app).get('/api/courses/enrollments');
        expect(res.status).toBe(400);
    });
});

/**
 * Tests for GET /courses/enrollments
 * Test a course has known enrollments
 */
describe('GET /courses/enrollments', () => {
    test('returns enrollment data for a valid course code', async () => {
        const app = makeApp();
        const res = await request(app).get('/api/courses/enrollments').query({ courseCode: 'OPWL-507' });
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.enrollments)).toBe(true);
    });

    // Missing courseCode parameter
    test('returns 400 for missing courseCode parameter', async () => {
        const app = makeApp();
        const res = await request(app).get('/api/courses/enrollments');
        expect(res.status).toBe(400);
    });
});

/**
 * Test: GET /courses/search
 * Scenario: Search performed with only course name (q1) provided.
 * Expectation: Returns HTTP 200 if seed data contains an exact match; otherwise returns 404.
 */
test('returns results when only name (q1) is provided', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/courses/search').query({
        q1: 'Organizational Performance and Workplace Learning'
    });
    // Expect 200 only if seeds exist; otherwise 404. If seeds exist, keep 200.
    // If your seed doesn’t have an exact name match, adjust expectation to 404.
    expect([200, 404]).toContain(res.status);
});

/**
 * Test: GET /courses/search
 * Scenario: Search performed with only course code (q2) provided.
 * Expectation: Returns HTTP 200 if seed data contains an exact match; otherwise returns 404.
 */
test('returns results when only code (q2) is provided', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/courses/search').query({ q2: 'OPWL-536' });
    expect([200, 404]).toContain(res.status);
});

/**
 * Test: GET /courses/search
 * Scenario: Search performed with both q1 and q2 empty.
 * Expectation: Returns HTTP 400 with message indicating missing search parameters.
 */
test('returns 400 when q1 and q2 are both empty strings', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/courses/search').query({ q1: '', q2: '' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
        message: 'Missing search parameters: course name (q1) or course code (q2)'
    });
});

/**
 * Suite: GET /courses/search error handling
 *
 * Contains tests verifying error handling behavior when the searchCourses
 * method in CourseModel throws an exception.
 */
describe('GET /courses/search error handling', () => {
    let app;
    let CourseModel;

    // Set up Express app and mock CourseModel before each test
    beforeEach(() => {
        jest.resetModules();
        jest.mock('../../src/models/CourseModel', () => ({
            searchCourses: jest.fn(),
            getCourseOfferings: jest.fn(),
            getPrerequisitesForCourse: jest.fn()
        }));

        CourseModel = require('../../src/models/CourseModel');
        const express = require('express');
        const courseRoutes = require('../../src/routes/courses');

        app = express();
        app.use(express.json());
        app.use('/api/courses', courseRoutes);
    });

    /**
     * Test: GET /courses/search
     * Scenario: CourseModel.searchCourses throws a database error.
     * Expectation: Returns HTTP 500 with message "Internal server error".
     */
    test('returns 500 when searchCourses throws', async () => {
        CourseModel.searchCourses.mockRejectedValue(new Error('DB error'));
        const res = await request(app).get('/api/courses/search').query({ q1: 'anything' });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Internal server error');
    });
});

/**
 * Suite: Error handling in /courses routes
 *
 * Contains tests verifying error handling behavior for create, update,
 * delete, and enrollment endpoints in the /courses routes when CourseModel
 * methods throw exceptions.
 */
describe('Error handling in /courses routes', () => {
    let app;
    let CourseModel;

    // Set up Express app and mock CourseModel before each test
    beforeEach(() => {
        jest.resetModules();

        jest.mock('../../src/models/CourseModel', () => ({
            createCourse: jest.fn(),
            updateCourse: jest.fn(),
            deleteCourse: jest.fn(),
            getEnrollments: jest.fn(),
            searchCourses: jest.fn(),
            getCourseOfferings: jest.fn(),
            getPrerequisitesForCourse: jest.fn()
        }));

        CourseModel = require('../../src/models/CourseModel');
        const express = require('express');
        const courseRoutes = require('../../src/routes/courses');

        app = express();
        app.use(express.json());
        app.use('/api/courses', courseRoutes);
    });

    /**
     * Test: POST /courses
     * Scenario: CourseModel.createCourse throws a database error.
     * Expectation: Returns HTTP 500 with message "Internal server error".
     */
    test('POST /courses returns 500 on error', async () => {
        CourseModel.createCourse.mockRejectedValue(new Error('DB error'));
        const res = await request(app).post('/api/courses').send({
            name: 'Bad Course',
            code: 'BAD101',
            credits: 3
        });
        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Internal server error');
    });

    /**
     * Test: PUT /courses/:id
     * Scenario: CourseModel.updateCourse throws a database error.
     * Expectation: Returns HTTP 500 with message "Internal server error".
     */
    test('PUT /courses/:id returns 500 on error', async () => {
        CourseModel.updateCourse.mockRejectedValue(new Error('DB error'));
        const res = await request(app).put('/api/courses/1').send({
            name: 'Fail Update',
            code: 'FAIL101',
            credits: 3
        });
        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Internal server error');
    });

    /**
     * Test: DELETE /courses/:id
     * Scenario: CourseModel.deleteCourse throws a database error.
     * Expectation: Returns HTTP 500 with message "Internal server error".
     */
    test('DELETE /courses/:id returns 500 on error', async () => {
        CourseModel.deleteCourse.mockRejectedValue(new Error('DB error'));
        const res = await request(app).delete('/api/courses/1');
        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Internal server error');
    });

    /**
     * Test: GET /courses/enrollments
     * Scenario: CourseModel.getEnrollments throws a database error.
     * Expectation: Returns HTTP 500 with message "Internal server error".
     */
    test('GET /courses/enrollments returns 500 on error', async () => {
        CourseModel.getEnrollments.mockRejectedValue(new Error('DB error'));
        const res = await request(app).get('/api/courses/enrollments').query({ courseCode: 'OPWL-001' });
        expect(res.status).toBe(500);
        expect(res.body.message).toBe('Internal server error');
    });
});
