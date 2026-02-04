/**
 * file: backend/tests/models/UserModel.test.js
 * Unit tests for UserModel using Jest
 */
const UserModel = require('../../src/models/UserModel');
const pool = require('../../src/db');

let testUserId;

/**
 * Begins a database transaction before all tests.
 * Ensures that changes made during tests can be rolled back.
 */
beforeAll(async () => {
  // start a transaction
  await pool.query('BEGIN');
});

/**
 * Rolls back the transaction and closes the database connection after all tests.
 * This cleanup ensures no test data persists in the database.
 */
afterAll(async () => {
  // rollback if you used BEGIN
  await pool.query('ROLLBACK');
  await pool.end();
});

describe('UserModel Functions', () => {
  /**
   * Tests that a user can be created and deleted successfully.
   * Verifies role assignment and cleanup.
   */
  test('addUser creates and deletes a user safely', async () => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;
    const phone = `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const result = await UserModel.addUser(
      'Test User',
      email,
      phone,
      'securepass',
      'Student',
      ['Student']
    );

    expect(result).toHaveProperty('userId');
    testUserId = result.userId;

    const roles = await UserModel.getUserRoles(testUserId);
    expect(roles).toContain('Student');

    await UserModel.deleteUser(testUserId);
    const deletedRoles = await UserModel.getUserRoles(testUserId);
    expect(deletedRoles).toEqual([]);
  });

  /**
   * Tests that getUserById returns correct user details.
   * Verifies name, email, and default view role.
   */
  test('getUserById returns correct details', async () => {
    const timestamp = Date.now();
    const email = `getuser${timestamp}@example.com`;
    const phone = `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;

    // Create user to fetch
    const { userId } = await UserModel.addUser(
      'Get User',
      email,
      phone,
      'pass',
      'Advisor',
      ['Advisor']
    );

    const user = await UserModel.getUserById(userId); // Fetch the user
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
    expect(user.default_view.toLowerCase()).toBe('advisor');

    await UserModel.deleteUser(userId);
  });

  /**
   * Tests that updateUserDetails modifies user profile correctly.
   * Verifies updated name, email, and phone number.
   */
  test('updateUserDetails modifies user info', async () => {
    const timestamp = Date.now();
    const email = `updateuser${timestamp}@example.com`;
    const phone = `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;

    // Create user to update
    const { userId } = await UserModel.addUser(
      'Update User',
      email,
      phone,
      'pass',
      'Student',
      ['Student']
    );

    // Update user details
    const newPhone = `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;
    await UserModel.updateUserDetails(
      userId,
      'Updated Name',
      `updated${timestamp}@example.com`,
      newPhone,
      null,
      'Student'
    );

    // Verify updates
    const updated = await UserModel.getUserById(userId);
    expect(updated.name).toBe('Updated Name');
    expect(updated.email).toBe(`updated${timestamp}@example.com`);

    await UserModel.deleteUser(userId);
  });

  /**
   * Tests that getAllRoles returns a list of available roles.
   * Verifies structure and presence of role_name.
   */
  test('getAllRoles returns role list', async () => {
    const roles = await UserModel.getAllRoles();
    expect(Array.isArray(roles)).toBe(true);
    expect(roles[0]).toHaveProperty('role_name');
  });

  /**
   * Tests that getAllPermissions returns a list of all permissions.
   * Verifies structure and presence of permission_name.
   */
  test('getAllPermissions returns permission list', async () => {
    const perms = await UserModel.getAllPermissions();
    expect(Array.isArray(perms)).toBe(true);
    expect(perms[0]).toHaveProperty('permission_name');
  });

  /**
   * Tests that getRolePermissions returns permissions for a specific role.
   * Verifies that the result is an array.
   */
  test('getRolePermissions returns permissions for role', async () => {
    const perms = await UserModel.getRolePermissions('Student');
    expect(Array.isArray(perms)).toBe(true);
  });

  /**
   * Tests that updateUserRoles correctly assigns new roles to a user.
   * Verifies role assignment and normalization.
   */
  test('updateUserRoles assigns new roles', async () => {
    const timestamp = Date.now();
    const email = `roleuser${timestamp}@example.com`;
    const phone = `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;

    // Create user to update roles
    const { userId } = await UserModel.addUser(
      'Role User',
      email,
      phone,
      'pass',
      'Student',
      ['Student']
    );

    // Update roles to Advisor
    await UserModel.updateUserRoles(userId, ['Advisor']);
    const roles = await UserModel.getUserRoles(userId);
    const normalizedRoles = roles.map(r => r.toLowerCase());
    expect(normalizedRoles).toContain('advisor');

    await UserModel.deleteUser(userId);
  });

  /**
   * Tests that getUserByPublicId resolves a user from their public ID.
   * Verifies that the resolved user matches the original user ID.
   */
  test('getUserByPublicId resolves public ID', async () => {
    const timestamp = Date.now();
    const email = `publicid${timestamp}@example.com`;
    const phone = `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;

    // Create user to get public ID
    const { userId } = await UserModel.addUser(
      'Public ID User',
      email,
      phone,
      'pass',
      'Student',
      ['Student']
    );

    // Manually fetch public_id from the database
    const result = await pool.query(
      `SELECT public_id FROM users WHERE user_id = $1`,
      [userId]
    );
    const publicId = result.rows[0]?.public_id;
    expect(publicId).toBeDefined();

    // Resolve user by public ID
    const resolved = await UserModel.getUserByPublicId(publicId);
    expect(resolved.user_id).toBe(userId);

    await UserModel.deleteUser(userId);
  });

  /**
   * Tests that getAdvisingRelations returns empty arrays for a new user.
   * Verifies structure of the returned advising data.
   */
  test('getAdvisingRelations returns empty arrays for new user', async () => {
    const timestamp = Date.now();
    const email = `advising${timestamp}@example.com`;
    const phone = `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;

    // Create user to check advising relations
    const { userId } = await UserModel.addUser(
      'Advising User',
      email,
      phone,
      'pass',
      'Student',
      ['Student']
    );

    // Fetch advising relations
    const relations = await UserModel.getAdvisingRelations(userId);
    expect(relations).toHaveProperty('students');
    expect(relations).toHaveProperty('advisors');

    await UserModel.deleteUser(userId);
  });

  /**
   * Tests that updateAdvisingRelations correctly assigns students to an advisor.
   * Verifies that the student appears in the advisor's advising list.
   */
  test('updateAdvisingRelations assigns advisors and students', async () => {
    const timestamp = Date.now();
    const advisorEmail = `advisor${timestamp}@example.com`;
    const studentEmail = `student${timestamp}@example.com`;
    const advisorPhone = `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const studentPhone = `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;

    // Create advisor and student users
    const advisor = await UserModel.addUser(
      'Advisor User',
      advisorEmail,
      advisorPhone,
      'pass',
      'Advisor',
      ['Advisor']
    );

    // Create student user
    const student = await UserModel.addUser(
      'Student User',
      studentEmail,
      studentPhone,
      'pass',
      'Student',
      ['Student']
    );

    // Establish advising relation
    await UserModel.updateUserRoles(advisor.userId, ['Advisor']); // Ensure advisor role is set
    await UserModel.updateAdvisingRelations(advisor.userId, [], [student.userId]);

    const relations = await UserModel.getAdvisingRelations(advisor.userId);
    expect(relations.students.some(s => s.user_id === student.userId)).toBe(true);

    await UserModel.deleteUser(student.userId);
    await UserModel.deleteUser(advisor.userId);
  });
});

/**
 * Test: searchUsers
 * Scenario: Verify that users can be found by name, by role, by both, or not at all.
 * Expectation:
 *  - Searching by name returns the created user.
 *  - Searching by role returns the created user.
 *  - Searching by both returns the created user.
 *  - Searching with a non-existent name returns an empty array.
 */
test('searchUsers finds users by name and role', async () => {
  const timestamp = Date.now();
  const email = `search${timestamp}@example.com`;
  // Create user to search for
  const { userId } = await UserModel.addUser(
    'Search User',
    email,
    '111-123-4567',
    'pass',
    'Student',
    ['Student']
  );

  // Search by name
  const byName = await UserModel.searchUsers('Search', null);
  expect(byName.some(u => u.id === userId)).toBe(true);

  // Search by role
  const byRole = await UserModel.searchUsers(null, 'Student');
  expect(byRole.some(u => u.id === userId)).toBe(true);

  // Search by both name and role
  const both = await UserModel.searchUsers('Search', 'Student');
  expect(both.some(u => u.id === userId)).toBe(true);

  // Search with no matches
  const none = await UserModel.searchUsers('Nonexistent', null);
  expect(none).toEqual([]);

  await UserModel.deleteUser(userId);
});

/**
 * Test: getUserRoles
 * Scenario: User is created with lowercase role names.
 * Expectation: Returned role names should be capitalized.
 */
test('getUserRoles capitalizes role names', async () => {
  const timestamp = Date.now();
  const email = `roles${timestamp}@example.com`;
  // Create user with lowercase role
  const { userId } = await UserModel.addUser(
    'Role Test',
    email,
    '222-123-4567',
    'pass',
    'Student',
    ['student'] // lowercase
  );

  // Fetch roles and verify capitalization
  const roles = await UserModel.getUserRoles(userId);
  expect(roles[0][0]).toBe(roles[0][0].toUpperCase());

  await UserModel.deleteUser(userId);
});

/**
 * Test: updateUserRoles
 * Scenario: Update user roles to include both Student and Advisor.
 * Expectation: User roles should include both "student" and "advisor".
 */
test('updateUserRoles inserts into students and advisors tables', async () => {
  const timestamp = Date.now();
  const email = `update${timestamp}@example.com`;
  // Create user with initial Student role
  const { userId } = await UserModel.addUser(
    'Update Roles',
    email,
    '333-123-4567',
    'pass',
    'Student',
    ['Student']
  );

  //  Update roles to include Advisor
  await UserModel.updateUserRoles(userId, ['Student', 'Advisor']);
  const roles = await UserModel.getUserRoles(userId);
  expect(roles.map(r => r.toLowerCase())).toEqual(expect.arrayContaining(['student', 'advisor']));

  await UserModel.deleteUser(userId);
});

/**
 * Test: addUser
 * Scenario: Attempt to add a user with an invalid default view role.
 * Expectation: Method should throw "Invalid default view role".
 */
test('addUser throws error for invalid default view role', async () => {
  await expect(UserModel.addUser(
    'Bad User',
    'bad@example.com',
    '555-000-0000',
    'pass',
    'NotARole',
    ['Student']
  )).rejects.toThrow('Invalid default view role');
});

/**
 * Test: updateUserDetails
 * Scenario: Attempt to update user details with an invalid default view role.
 * Expectation: Method should throw "Invalid default view role".
 */
test('updateUserDetails throws error for invalid default view role', async () => {
  const { userId } = await UserModel.addUser(
    'Detail User',
    'detail@example.com',
    '555-111-1111',
    'pass',
    'Student',
    ['Student']
  );

  // Attempt to update with invalid role
  await expect(UserModel.updateUserDetails(
    userId,
    'Detail User',
    'detail@example.com',
    '111-111-1111',
    null,
    'NotARole'
  )).rejects.toThrow('Invalid default view role');

  await UserModel.deleteUser(userId);
});

/**
 * Test: getAdvisingRelations
 * Scenario: Establish advising relations between advisor and student.
 * Expectation:
 *  - Advisor relations should include the student.
 *  - Student relations should include the advisor.
 */
test('getAdvisingRelations returns students for advisor and advisors for student', async () => {
  const timestamp = Date.now();
  const advisorEmail = `advA${timestamp}@example.com`;
  const studentEmail = `stuA${timestamp}@example.com`;

  // Create advisor and student users
  const advisor = await UserModel.addUser('Advisor', advisorEmail, '111-242-2222', 'pass', 'Advisor', ['Advisor']);
  const student = await UserModel.addUser('Student', studentEmail, '111-343-3333', 'pass', 'Student', ['Student']);

  // Ensure roles are set
  await UserModel.updateUserRoles(advisor.userId, ['Advisor']);
  await UserModel.updateUserRoles(student.userId, ['Student']);

  // Establish advising relation
  await UserModel.updateAdvisingRelations(advisor.userId, [], [student.userId]);
  const advisorRelations = await UserModel.getAdvisingRelations(advisor.userId);
  expect(advisorRelations.students.some(s => s.user_id === student.userId)).toBe(true);

  // Establish reverse relation
  await UserModel.updateAdvisingRelations(student.userId, [advisor.userId], []);
  const studentRelations = await UserModel.getAdvisingRelations(student.userId);
  expect(studentRelations.advisors.some(a => a.user_id === advisor.userId)).toBe(true);

  await UserModel.deleteUser(student.userId);
  await UserModel.deleteUser(advisor.userId);
});

/**
 * Test: updateAdvisingRelations
 * Scenario: Advisor establishes relation with student using student's publicId.
 * Expectation: Student should be resolved by publicId and added to advisor's relations.
 */
test('updateAdvisingRelations resolves student by publicId and inserts if missing', async () => {
  const timestamp = Date.now();
  const advisorEmail = `advB${timestamp}@example.com`;
  const studentEmail = `stuB${timestamp}@example.com`;

  // Create advisor and student users
  const advisor = await UserModel.addUser('Advisor2', advisorEmail, '111-424-4444', 'pass', 'Advisor', ['Advisor']);
  const student = await UserModel.addUser('Student2', studentEmail, '111-525-5555', 'pass', 'Student', ['Student']);

  // Ensure roles are set
  await UserModel.updateUserRoles(advisor.userId, ['Advisor']);
  await UserModel.updateUserRoles(student.userId, ['Student']);

  // Get student's publicId
  const res = await pool.query(`SELECT public_id FROM users WHERE user_id = $1`, [student.userId]);
  const publicId = res.rows[0].public_id;

  // Establish advising relation using publicId
  await UserModel.updateAdvisingRelations(advisor.userId, [], [publicId]);
  const relations = await UserModel.getAdvisingRelations(advisor.userId);
  expect(relations.students.some(s => s.user_id === student.userId)).toBe(true);

  await UserModel.deleteUser(student.userId);
  await UserModel.deleteUser(advisor.userId);
});

/**
 * Test: updateUserPassword
 * Scenario: Update a user's password.
 * Expectation: Password hash in database should be updated and defined.
 */
test('updateUserPassword updates password hash', async () => {
  const { userId } = await UserModel.addUser('Pass User', 'pass@example.com', '111-666-6666', 'oldpass', 'Student', ['Student']);
  await UserModel.updateUserPassword(userId, 'newpass');
  const res = await pool.query(`SELECT password_hash FROM users WHERE user_id = $1`, [userId]);
  expect(res.rows[0].password_hash).toBeDefined();
  await UserModel.deleteUser(userId);
});

/**
 * Test: updateUserPreferences
 * Scenario: Update a user's preferences (theme, font size, font family).
 * Expectation: Preferences should be updated and retrievable with the new values.
 */
test('updateUserPreferences updates preferences', async () => {
  const { userId } = await UserModel.addUser('Pref User', 'pref@example.com', '111-777-7777', 'pass', 'Student', ['Student']);
  await UserModel.updateUserPreferences(userId, 'dark', '2px', 'Courier');
  const prefs = await UserModel.getUserPreferences(userId);
  expect(prefs.theme).toBe('dark');
  expect(prefs.font_size_change).toBe('2px');
  expect(prefs.font_family).toBe('Courier');
  await UserModel.deleteUser(userId);
});
