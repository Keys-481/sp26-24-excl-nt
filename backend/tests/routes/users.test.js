/**
 * file: backend/tests/routes/users.test.js
 * Integration tests for user routes using Jest and Supertest
 */
const request = require('supertest');
const express = require('express');
const usersRouter = require('../../src/routes/users');
const pool = require('../../src/db');

const UserModel = require('../../src/models/UserModel');
const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

let createdUserId;

/**
 * Closes the database connection after all tests complete.
 * Ensures proper cleanup of pooled resources.
 */
afterAll(async () => {
  await pool.end();
});

// Silence console.error during tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => { });
});

// Restore console.error after tests
afterAll(() => {
  console.error.mockRestore();
});

describe('User Routes', () => {
  const dynamicPhone = `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;

  /**
   * Tests POST /api/users
   * Creates a new user with the Advisor role and verifies successful creation.
   */
  test('POST /api/users - create user', async () => {
    const timestamp = Date.now();
    const res = await request(app).post('/api/users').send({
      name: 'Route Tester',
      email: `route${timestamp}@test.com`,
      phone: dynamicPhone,
      password: 'testpass',
      default_view: 'Advisor',
      roles: ['Advisor']
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('userId');
    createdUserId = res.body.userId;
  });

  /**
   * Tests GET /api/users/:id
   * Fetches user details by ID and verifies name and email fields.
   */
  test('GET /api/users/:id - fetch user details', async () => {
    const res = await request(app).get(`/api/users/${createdUserId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('email');
  });

  /**
   * Tests GET /api/users/:id/roles
   * Fetches roles assigned to the user and verifies Advisor role is present.
   */
  test('GET /api/users/:id/roles - fetch user roles', async () => {
    const res = await request(app).get(`/api/users/${createdUserId}/roles`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toContain('Advisor');
  });

  /**
   * Tests PUT /api/users/:id
   * Updates user details and verifies success response.
   */
  test('PUT /api/users/:id - update user details', async () => {
    const res = await request(app).put(`/api/users/${createdUserId}`).send({
      name: 'Updated Tester',
      email: 'updated@test.com',
      phone: dynamicPhone,
      password: 'newpass',
      default_view: 'Advisor'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  /**
   * Tests GET /api/users/all
   * Fetches all users and verifies response is an array.
   */
  test('GET /api/users/all - fetch all users', async () => {
    const res = await request(app).get('/api/users/all');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  /**
   * Tests GET /api/users/roles
   * Fetches all available roles and verifies response structure.
   */
  test('GET /api/users/roles - fetch all roles', async () => {
    const res = await request(app).get('/api/users/roles');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  /**
   * Tests GET /api/users/permissions
   * Fetches all available permissions and verifies response structure.
   */
  test('GET /api/users/permissions - fetch all permissions', async () => {
    const res = await request(app).get('/api/users/permissions');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  /**
   * Tests GET /api/users/:id/advising
   * Fetches advising relationships for the user and verifies structure.
   */
  test('GET /api/users/:id/advising - fetch advising relations', async () => {
    const res = await request(app).get(`/api/users/${createdUserId}/advising`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('students');
    expect(res.body).toHaveProperty('advisors');
  });

  /**
   * Verifies that GET /api/users/me returns 401 Unauthorized when no user is authenticated.
   */
  test('GET /api/users/me - unauthorized when no user', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.statusCode).toBe(401);
  });

  /**
   * Verifies that GET /api/users/search successfully searches users.
   *
   * Asserts that the response status is 200 and the body is an array.
   */
  test('GET /api/users/search - search users', async () => {
    const res = await request(app).get('/api/users/search?q1=Advisor&q2=Tester');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  /**
   * Verifies that PUT /api/users/:id/roles successfully updates user roles.
   *
   * Asserts that the response status is 200 and the body indicates success.
   */
  test('PUT /api/users/:id/roles - update roles', async () => {
    const res = await request(app).put(`/api/users/${createdUserId}/roles`).send({
      roles: ['Advisor'] // use a valid role
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  /**
   * Verifies that GET /api/users/roles/:roleName/permissions fetches role permissions.
   *
   * Asserts that the response status is 200 and the body is an array.
   */
  test('GET /api/users/roles/:roleName/permissions - fetch role permissions', async () => {
    const res = await request(app).get('/api/users/roles/Advisor/permissions');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  /**
   * Verifies that POST /api/users/:id/advising successfully updates advising relations.
   *
   * Asserts that the response status is 200 and the body indicates success.
   */
  test('POST /api/users/:id/advising - update advising relations', async () => {
    const res = await request(app).post(`/api/users/${createdUserId}/advising`).send({
      advisorIds: [],
      studentIds: []
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  /**
   * Verifies that GET /api/users/public/:publicId fetches a user by public ID.
   *
   * Asserts that the response status is either 200 (found) or 404 (not found).
   */
  test('GET /api/users/public/:publicId - fetch by public ID', async () => {
    const res = await request(app).get('/api/users/public/somePublicId');
    expect([200, 404]).toContain(res.statusCode);
  });

  /**
   * Verifies that PUT /api/users/:id/preferences successfully updates user preferences.
   *
   * Asserts that the response status is 200 and the body indicates success.
   */
  test('PUT /api/users/:id/preferences - update preferences', async () => {
    const res = await request(app).put(`/api/users/${createdUserId}/preferences`).send({
      theme: 'dark',
      font_size_change: '2px',
      font_family: 'Arial'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  /**
   * Verifies that GET /api/users/:id/preferences fetches user preferences.
   *
   * Asserts that the response status is 200 and the body contains expected preference properties.
   */
  test('GET /api/users/:id/preferences - fetch preferences', async () => {
    const res = await request(app).get(`/api/users/${createdUserId}/preferences`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('theme');
    expect(res.body).toHaveProperty('font_size_change');
    expect(res.body).toHaveProperty('font_family');
  });

  /**
   * Verifies that PUT /api/users/:id/password successfully updates the user password.
   *
   * Asserts that the response status is 200 and the body indicates success.
   */
  test('PUT /api/users/:id/password - update password', async () => {
    const res = await request(app).put(`/api/users/${createdUserId}/password`).send({
      password: 'newsecurepass'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  /**
   * Verifies that GET /api/users/:id returns 500 Internal Server Error when the database call fails.
   */
  test('GET /api/users/:id - handles DB error', async () => {
    jest.spyOn(UserModel, 'getUserById').mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/api/users/123');
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    UserModel.getUserById.mockRestore();
  });

  describe('User Routes - Error Paths (UserModel only)', () => {
    /**
     * Verifies that GET /api/users/search returns 500 when UserModel.searchUsers throws a DB error.
     */
    test('GET /api/users/search - DB error returns 500', async () => {
      jest.spyOn(UserModel, 'searchUsers').mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/api/users/search?q1=Advisor&q2=Tester');
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
      UserModel.searchUsers.mockRestore();
    });

    /**
     * Verifies that GET /api/users/roles returns 500 when UserModel.getAllRoles throws a DB error.
     */
    test('GET /api/users/roles - DB error returns 500', async () => {
      jest.spyOn(UserModel, 'getAllRoles').mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/api/users/roles');
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
      UserModel.getAllRoles.mockRestore();
    });

    /**
     * Verifies that GET /api/users/all returns 500 when UserModel.searchUsers throws a DB error.
     */
    test('GET /api/users/all - DB error returns 500', async () => {
      jest.spyOn(UserModel, 'searchUsers').mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/api/users/all');
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
      UserModel.searchUsers.mockRestore();
    });

    /**
     * Verifies that GET /api/users/:id/roles returns 500 when UserModel.getUserRoles throws a DB error.
     */
    test('GET /api/users/:id/roles - DB error returns 500', async () => {
      jest.spyOn(UserModel, 'getUserRoles').mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/api/users/123/roles');
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
      UserModel.getUserRoles.mockRestore();
    });

    /**
     * Verifies that PUT /api/users/:id/roles returns 500 when UserModel.updateUserRoles throws a DB error.
     */
    test('PUT /api/users/:id/roles - DB error returns 500', async () => {
      jest.spyOn(UserModel, 'updateUserRoles').mockRejectedValue(new Error('DB error'));
      const res = await request(app).put('/api/users/123/roles').send({ roles: ['Advisor'] });
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
      UserModel.updateUserRoles.mockRestore();
    });

    /**
     * Verifies that GET /api/users/roles/:roleName/permissions returns 500 when UserModel.getRolePermissions throws a DB error.
     */
    test('GET /api/users/roles/:roleName/permissions - DB error returns 500', async () => {
      jest.spyOn(UserModel, 'getRolePermissions').mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/api/users/roles/Advisor/permissions');
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
      UserModel.getRolePermissions.mockRestore();
    });

    /**
     * Verifies that POST /api/users returns 500 when UserModel.addUser throws a DB error.
     */
    test('POST /api/users - DB error returns 500', async () => {
      jest.spyOn(UserModel, 'addUser').mockRejectedValue(new Error('DB error'));
      const res = await request(app).post('/api/users').send({
        name: 'Error Tester',
        email: 'error@test.com',
        phone: '555-000-0000',
        password: 'pass',
        default_view: 'Advisor',
        roles: ['Advisor']
      });
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
      UserModel.addUser.mockRestore();
    });

    /**
     * Verifies that DELETE /api/users/:id returns 500 when UserModel.deleteUser throws a DB error.
     */
    test('DELETE /api/users/:id - DB error returns 500', async () => {
      jest.spyOn(UserModel, 'deleteUser').mockRejectedValue(new Error('DB error'));
      const res = await request(app).delete('/api/users/123');
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
      UserModel.deleteUser.mockRestore();
    });

    /**
     * Verifies that GET /api/users/permissions returns 500 when UserModel.getAllPermissions throws a DB error.
     */
    test('GET /api/users/permissions - DB error returns 500', async () => {
      jest.spyOn(UserModel, 'getAllPermissions').mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/api/users/permissions');
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
      UserModel.getAllPermissions.mockRestore();
    });

    /**
     * Verifies that GET /api/users/:id returns 500 when UserModel.getUserById throws a DB error.
     */
    test('GET /api/users/:id - DB error returns 500', async () => {
      jest.spyOn(UserModel, 'getUserById').mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/api/users/123');
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
      UserModel.getUserById.mockRestore();
    });

    /**
     * Verifies that GET /api/users/:id/advising returns 500 when UserModel.getAdvisingRelations throws a DB error.
     */
    test('GET /api/users/:id/advising - DB error returns 500', async () => {
      jest.spyOn(UserModel, 'getAdvisingRelations').mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/api/users/123/advising');
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
      UserModel.getAdvisingRelations.mockRestore();
    });

    /**
     * Verifies that POST /api/users/:id/advising returns 500 when UserModel.updateAdvisingRelations throws a DB error.
     */
    test('POST /api/users/:id/advising - DB error returns 500', async () => {
      jest.spyOn(UserModel, 'updateAdvisingRelations').mockRejectedValue(new Error('DB error'));
      const res = await request(app).post('/api/users/123/advising').send({ advisorIds: [], studentIds: [] });
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
      UserModel.updateAdvisingRelations.mockRestore();
    });

    /**
     * Verifies that PUT /api/users/:id returns 500 when UserModel.updateUserDetails throws a DB error.
     */
    test('PUT /api/users/:id - DB error returns 500', async () => {
      jest.spyOn(UserModel, 'updateUserDetails').mockRejectedValue(new Error('DB error'));
      const res = await request(app).put('/api/users/123').send({
        name: 'Error Tester',
        email: 'error@test.com',
        phone: '555-000-0000',
        password: 'pass',
        default_view: 'Advisor'
      });
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
      UserModel.updateUserDetails.mockRestore();
    });

    /**
     * Verifies that GET /api/users/public/:publicId returns 500 when UserModel.getUserByPublicId throws a DB error.
     */
    test('GET /api/users/public/:publicId - DB error returns 500', async () => {
      jest.spyOn(UserModel, 'getUserByPublicId').mockRejectedValue(new Error('DB error'));
      const res = await request(app).get('/api/users/public/somePublicId');
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: 'Internal server error' });
    });
  });

  /**
   * Tests DELETE /api/users/:id
   * Deletes the created user and verifies success response.
   */
  test('DELETE /api/users/:id - delete user', async () => {
    const res = await request(app).delete(`/api/users/${createdUserId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});
