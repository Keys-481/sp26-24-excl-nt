/**
 * File: backend/tests/routes/notifications.test.js
 * Tests for notifications routes.
 */

const request = require('supertest');
const express = require('express');
const { runSchemaAndSeeds } = require('../../db_setup');
const pool = require('../../src/db');
const notifications = require('../../src/routes/notifications');

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
 * Global setup hook executed once before all tests in this suite.
 *
 * This hook mocks {@code console.error} using Jest to suppress error logs
 * during test execution. The purpose is to prevent noisy console output while
 * still allowing error handling to be tested.
 */
beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

/**
 * Global teardown hook executed once after all tests in this suite.
 *
 * This hook restores the original {@code console.error} implementation
 * to ensure that subsequent code outside the test suite is not affected
 * by the mocked console method.
 */
afterAll(() => {
    console.error.mockRestore();
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

    app.use('/api/notifications', notifications);
    return app;
}

/**
 * Tests for GET /notifications route
 */
describe('GET /notifications', () => {
    // test for successful retrieval of notifications (admin user)
    test('returns 200 and notifications for valid user', async () => {
        const mockUser = { user_id: 1 }; // admin in seed data
        const app = makeAppWithUser(mockUser);

        const response = await request(app)
            .get('/api/notifications');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.notifications)).toBe(true);
    });

    // test for successful retrieval of notifications (advisor user)
    test('returns 200 and notifications for advisor', async () => {
        const mockUser = { user_id: 2 }; // advisor in seed data
        const app = makeAppWithUser(mockUser);

        const response = await request(app)
            .get('/api/notifications');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.notifications)).toBe(true);
    });

    // test for successful retrieval of notifications (student user)
    test('returns 200 and notifications for student', async () => {
        const mockUser = { user_id: 4 }; // student Alice Johnson in seed data
        const app = makeAppWithUser(mockUser);

        const response = await request(app)
            .get('/api/notifications');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.notifications)).toBe(true);
    });

    // test for missing user_id
    test('returns 400 for missing user_id', async () => {
        const app = makeAppWithUser(null);

        const response = await request(app)
            .get('/api/notifications');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Unauthorized: User ID is required');
    });
});

/**
 * Tests for PUT /notifications/:id/read route
 */
describe('PUT /notifications/:id/read', () => {
    // test for successful marking of notification as read
    test('returns 200 for successfully marking notification as read', async () => {
        const mockUser = { user_id: 1 }; // admin in seed data
        const app = makeAppWithUser(mockUser);

        const response = await request(app)
            .put('/api/notifications/1/read')
            .send({ is_read: true });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Notification marked as read');
    });

    // test for missing user_id
    test('returns 401 for missing user_id', async () => {
        const app = makeAppWithUser(null);

        const response = await request(app)
            .put('/api/notifications/1/read')
            .send({ is_read: true });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Unauthorized: User ID is required');
    });

    // test for invalid request body
    test('returns 400 for invalid request body', async () => {
        const mockUser = { user_id: 1 }; // admin in seed data
        const app = makeAppWithUser(mockUser);

        const response = await request(app)
            .put('/api/notifications/1/read')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('is_read boolean is required in request body');
    });
});

/**
 * Tests for DELETE /notifications/:id route
 */
describe('DELETE /notifications/:id', () => {
    // test for successful deletion of notification
    test('returns 200 for successfully deleting notification', async () => {
        const mockUser = { user_id: 1 }; // admin in seed data
        const app = makeAppWithUser(mockUser);

        const response = await request(app)
            .delete('/api/notifications/1');

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Notification deleted successfully');
    });

    // test for missing user_id
    test('returns 401 for missing user_id', async () => {
        const app = makeAppWithUser(null);

        const response = await request(app)
            .delete('/api/notifications/1');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Unauthorized: User ID is required');
    });

    // test for deleting non-existent notification
    test('returns 404 for deleting non-existent notification', async () => {
        const mockUser = { user_id: 1 }; // admin in seed data
        const app = makeAppWithUser(mockUser);

        const response = await request(app)
            .delete('/api/notifications/9999'); // assuming 9999 does not exist

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Notification not found or not authorized');
    });
});

/* Test: GET /notifications
 * Scenario: The NotificationsModel.getNotificationsForUser method throws a database error.
 * Expectation: API should return HTTP 500 with message "Internal server error".
 */
test('returns 500 when NotificationsModel.getNotificationsForUser throws error', async () => {
    const mockUser = { user_id: 1 };
    const app = makeAppWithUser(mockUser);

    // Mock the model to throw
    jest.spyOn(require('../../src/models/NotificationsModel'), 'getNotificationsForUser')
        .mockRejectedValueOnce(new Error('DB error'));

    const response = await request(app).get('/api/notifications');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
});

/**
 * Test: PUT /notifications/:id/read
 * Scenario: Attempting to mark a notification as read when the notification does not exist.
 * Expectation: API should return HTTP 404 with message "Notification not found or does not authorized".
 */
test('returns 404 when notification not found', async () => {
    const mockUser = { user_id: 1 };
    const app = makeAppWithUser(mockUser);

    jest.spyOn(require('../../src/models/NotificationsModel'), 'markNotificationReadState')
        .mockResolvedValueOnce(null); // Simulate not found

    const response = await request(app)
        .put('/api/notifications/999/read')
        .send({ is_read: true });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Notification not found or does not authorized');
});

/**
 * Test: PUT /notifications/:id/read
 * Scenario: The NotificationsModel.markNotificationReadState method throws a database error.
 * Expectation: API should return HTTP 500 with message "Internal server error".
 */
test('returns 500 when NotificationsModel.markNotificationReadState throws error', async () => {
    const mockUser = { user_id: 1 };
    const app = makeAppWithUser(mockUser);

    jest.spyOn(require('../../src/models/NotificationsModel'), 'markNotificationReadState')
        .mockRejectedValueOnce(new Error('DB error'));

    const response = await request(app)
        .put('/api/notifications/1/read')
        .send({ is_read: true });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
});
