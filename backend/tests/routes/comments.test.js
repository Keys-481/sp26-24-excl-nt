/**
 * File: backend/tests/routes/comments.test.js
 * Integration tests for comments routes
 */

const request = require('supertest');
const express = require('express');
const { runSchemaAndSeeds } = require('../../db_setup');
const pool = require('../../src/db');
const commentRoutes = require('../../src/routes/comments');

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

    app.use('/api/comments', commentRoutes);
    return app;
}

/**
 * Tests for GET /comments route
 */
describe('GET /comments', () => {
    // test for successful retrieval of comments (admin user)
    test('returns 200 and comments for valid programId and studentSchoolId', async () => {
        const mockUser = { user_id: 1 }; // admin in seed data
        const app = makeAppWithUser(mockUser);

        const response = await request(app)
            .get('/api/comments')
            .query({ programId: 1, studentSchoolId: '112299690' }); // Alice Johnson's school ID from seed data

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    // test for successful retrieval of comments (advisor user with access)
    test('returns 200 and comments for advisor with access', async () => {
        const mockUser = { user_id: 2 }; // advisor in seed data
        const app = makeAppWithUser(mockUser);

        const response = await request(app)
            .get('/api/comments')
            .query({ programId: 1, studentSchoolId: '112299690' }); // Alice Johnson's school ID from seed data

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    // test for successful retrieval of comments (student user accessing own comments)
    test('returns 200 and comments for student accessing own comments', async () => {
        const mockUser = { user_id: 4 }; // student Alice Johnson in seed data
        const app = makeAppWithUser(mockUser);

        const response = await request(app)
            .get('/api/comments')
            .query({ programId: 1, studentSchoolId: '112299690' }); // Alice Johnson's school ID from seed data

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    // test for missing query parameters
    test('returns 400 for missing query parameters', async () => {
        const mockUser = { user_id: 1 }; // Mock authenticated user
        const app = makeAppWithUser(mockUser);

        const response = await request(app)
            .get('/api/comments')
            .query({ programId: 1 }); // Missing studentSchoolId

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Missing required query parameters: programId, studentSchoolId');
    });

    // test for failed access (advisor without access)
    test('returns 403 for advisor without access', async () => {
        const mockUser = { user_id: 3 }; // advisor without access in seed data
        const app = makeAppWithUser(mockUser);

        const response = await request(app)
            .get('/api/comments')
            .query({ programId: 1, studentSchoolId: '112299690' }); // Alice Johnson's school ID from seed data

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Forbidden: You do not have permission to view comments for this degree plan');
    });

    // test for student trying to access another student's comments
    test('returns 403 for student trying to access another student\'s comments', async () => {
        const mockUser = { user_id: 5 }; // student Bob Smith in seed data
        const app = makeAppWithUser(mockUser);

        const response = await request(app)
            .get('/api/comments')
            .query({ programId: 1, studentSchoolId: '112299690' }); // Alice Johnson's school ID from seed data

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Forbidden: You do not have permission to view comments for this degree plan');
    });
});

/**
 * Tests for POST /comments route
 */
describe('POST /comments', () => {
    // test for successful comment creation (admin user)
    test('returns 201 and creates a new comment for valid input', async () => {
        const mockUser = { user_id: 1 }; // admin user
        const app = makeAppWithUser(mockUser);

        const newCommentData = {
            programId: 1,
            studentSchoolId: '112299690',
            commentText: 'This is a test comment.'
        };

        const response = await request(app)
            .post('/api/comments')
            .send(newCommentData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('comment_id');
        expect(response.body.comment_text).toBe(newCommentData.commentText.trim());
    });

    // test for missing required fields
    test('returns 400 for missing required fields', async () => {
        const mockUser = { user_id: 1 }; // admin user
        const app = makeAppWithUser(mockUser);

        const newCommentData = {
            programId: 1,
            // Missing studentSchoolId and commentText
        };

        const response = await request(app)
            .post('/api/comments')
            .send(newCommentData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Missing required fields: programId, studentSchoolId, authorId, commentText');
    });

    // test for unauthorized access (advisor without access)
    test('returns 403 for advisor without access', async () => {
        const mockUser = { user_id: 3 }; // advisor without access
        const app = makeAppWithUser(mockUser);

        const newCommentData = {
            programId: 1,
            studentSchoolId: '112299690',
            commentText: 'This is a test comment.'
        };

        const response = await request(app)
            .post('/api/comments')
            .send(newCommentData);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Forbidden: You do not have permission to comment on this degree plan');
    });
});

/**
 * Tests for PUT /comments/:id route
 */
describe('PUT /comments/:id', () => {
    // test for successful comment update
    test('returns 200 and updates the comment for valid input', async () => {
        const mockUser = { user_id: 2 }; // advisor who authored the comment
        const app = makeAppWithUser(mockUser);

        const updatedCommentText = 'This is an updated test comment.';

        const response = await request(app)
            .put('/api/comments/1') // assuming comment with ID 1 exists and was authored by user_id 2
            .send({ newText: updatedCommentText });

        expect(response.status).toBe(200);
        expect(response.body.comment_id).toBe(1);
        expect(response.body.comment_text).toBe(updatedCommentText);
    });

    // test for missing required fields
    test('returns 400 for missing required fields', async () => {
        const mockUser = { user_id: 2 }; // advisor who authored the comment
        const app = makeAppWithUser(mockUser);

        const response = await request(app)
            .put('/api/comments/1') // assuming comment with ID 1 exists
            .send({}); // missing newText

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Missing required parameters: commentId, newText');
    });

    /* Test: POST /comments
     * Scenario: Attempting to create a comment with empty text (whitespace only).
     * Expectation: API should return HTTP 400 with message "Comment text cannot be empty".
     */
    test('returns 400 when commentText is empty string', async () => {
        const mockUser = { user_id: 1 };
        const app = makeAppWithUser(mockUser);

        const res = await request(app).post('/api/comments').send({
            programId: 1,
            studentSchoolId: '112299690',
            commentText: '   ' // whitespace only
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Comment text cannot be empty');
    });

    /**
     * Test: GET /comments
     * Scenario: Attempting to fetch comments for a non-existent student.
     * Expectation: API should return HTTP 404 with message "Student not found".
     */
    test('returns 404 when student not found', async () => {
        const mockUser = { user_id: 1 };
        const app = makeAppWithUser(mockUser);

        const res = await request(app).get('/api/comments').query({
            programId: 1,
            studentSchoolId: '999999999'
        });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Student not found');
    });

    /**
     * Test: POST /comments
     * Scenario: Attempting to create a comment for a non-existent student.
     * Expectation: API should return HTTP 404 with message "Student not found".
     */
    test('POST /comments returns 404 when student not found', async () => {
        const mockUser = { user_id: 1 }; // admin
        const app = makeAppWithUser(mockUser);

        const res = await request(app).post('/api/comments').send({
            programId: 1,
            studentSchoolId: '999999999', // bogus ID
            commentText: 'Hello'
        });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Student not found');
    });

    /**
     * Test: DELETE /comments/:id
     * Scenario: Attempting to delete a non-existent comment.
     * Expectation: API should return HTTP 404 with message "Comment not found".
     */
    test('returns 404 when comment not found', async () => {
        const mockUser = { user_id: 1 };
        const app = makeAppWithUser(mockUser);

        const res = await request(app).delete('/api/comments/999999');
        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Comment not found');
    });

    /**
     * Suite: DELETE /comments error handling
     *
     * Contains tests verifying error handling behavior when the CommentModel.deleteCommentById
     * method throws an exception. Ensures that the API responds with HTTP 500 and a consistent
     * error message.
     */
    describe('DELETE /comments error handling', () => {
        let app, CommentModel;
        beforeEach(() => {
            jest.resetModules();
            jest.mock('../../src/models/CommentModel', () => ({
                deleteCommentById: jest.fn()
            }));
            CommentModel = require('../../src/models/CommentModel');
            const express = require('express');
            const commentRoutes = require('../../src/routes/comments');
            app = express();
            app.use(express.json());
            app.use((req, res, next) => { req.user = { user_id: 1 }; next(); });
            app.use('/api/comments', commentRoutes);
        });

        /**
         * Test: DELETE /comments/:id
         * Scenario: CommentModel.deleteCommentById throws a database error.
         * Expectation: API should return HTTP 500 with message "Internal server error".
         */
        test('returns 500 when deleteCommentById throws', async () => {
            const spy = jest.spyOn(console, 'error').mockImplementation(() => { });

            CommentModel.deleteCommentById.mockRejectedValue(new Error('DB error'));
            const res = await request(app).delete('/api/comments/1');

            expect(res.status).toBe(500);
            expect(res.body.message).toBe('Internal server error');

            spy.mockRestore();
        });
    });
});
