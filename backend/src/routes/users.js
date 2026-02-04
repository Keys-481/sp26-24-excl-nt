/**
 * file: backend/src/routes/users.js
 * Routes for managing user profiles and roles.
 */
const express = require('express');
const router = express.Router();
const AccessModel = require('../models/AccessModel');
const UserModel = require('../models/UserModel');

/**
 * GET /me
 * Retrieves the currently authenticated user's profile.
 *
 * @returns {Object} User object with ID, name, email, phone, roles, and default view.
 */
router.get('/me', async (req, res) => {
    const userId = req.user?.user_id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: No user found in request' });
    }

    try {
        const result = await UserModel.getUserById(userId);
        if (!result) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch user roles and preferences
        const roles = await AccessModel.getUserRoles(userId);
        const preferences = await UserModel.getUserPreferences(userId);

        res.json({
            user_id: userId,
            id: result.public_id,
            name: `${result.first_name} ${result.last_name}`,
            email: result.email,
            phone: result.phone_number,
            default_view: result.default_view,
            roles: roles,
            preferences: preferences
        });
    } catch (error) {
        console.error(`Error fetching current user ${userId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /search
 * Searches users by name and/or role.
 *
 * @query {string} q1 - Role query (optional).
 * @query {string} q2 - Name query (optional).
 * @returns {Array<Object>} Array of formatted user objects with ID and name including roles.
 */
router.get('/search', async (req, res) => {
    const roleQuery = req.query.q1 || '';
    const nameQuery = req.query.q2 || '';

    try {
        const users = await UserModel.searchUsers(nameQuery, roleQuery);

        // Format users with capitalized roles
        const formatted = users.map(user => {
            const roles = Array.isArray(user.roles) && user.roles.length > 0
                ? user.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')
                : 'None';

            return {
                id: user.id,
                name: `${user.name} – ${roles}`,
                public: user.public
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /roles
 * Retrieves all available roles.
 *
 * @returns {Array<string>} Array of role names.
 */
router.get('/roles', async (req, res) => {
    try {
        const roles = await UserModel.getAllRoles();
        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /all
 * Retrieves all users with their roles.
 *
 * @returns {Array<Object>} Array of user objects with ID, name, and roles.
 */
router.get('/all', async (req, res) => {
    try {
        const users = await UserModel.searchUsers('', ''); // empty filters = all users
        const formatted = users.map(user => ({
            id: user.id,
            public: user.public,
            name: `${user.name}`,
            roles: user.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1))
        }));
        res.json(formatted);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /:id/roles
 * Retrieves roles assigned to a specific user.
 *
 * @param {string} id - User ID.
 * @returns {Array<string>} Array of role names.
 */
router.get('/:id/roles', async (req, res) => {
    const userId = req.params.id;

    try {
        const roles = await UserModel.getUserRoles(userId);
        res.json(roles);
    } catch (error) {
        console.error(`Error fetching roles for user ${userId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /:id/roles
 * Updates roles for a specific user.
 *
 * @param {string} id - User ID.
 * @body {Array<string>} roles - Array of role names to assign.
 * @returns {Object} Success status.
 */
router.put('/:id/roles', async (req, res) => {
    const userId = req.params.id;
    const roles = req.body.roles;

    try {
        await UserModel.updateUserRoles(userId, roles);
        res.json({ success: true });
    } catch (error) {
        console.error(`Error updating roles for user ${userId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /roles/:roleName/permissions
 * Retrieves permissions for a specific role.
 *
 * @param {string} roleName - Role name.
 * @returns {Array<string>} Array of permission names.
 */
router.get('/roles/:roleName/permissions', async (req, res) => {
    const roleName = req.params.roleName;

    try {
        const permissions = await UserModel.getRolePermissions(roleName);
        res.json(permissions);
    } catch (error) {
        console.error(`Error fetching permissions for role ${roleName}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /
 * Adds a new user with specified roles.
 *
 * @body {string} name - Full name of the user.
 * @body {string} email - Email address.
 * @body {string} phone - Phone number.
 * @body {string} password - Plaintext password.
 * @body {Array<string>} roles - Array of role names to assign.
 * @returns {Object} Success status and new user ID.
 */
router.post('/', async (req, res) => {
    const { name, email, phone, password, roles, default_view } = req.body;
    try {
        const result = await UserModel.addUser(name, email, phone, password, default_view, roles);
        res.json({ success: true, userId: result.userId });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /:id
 * Deletes a user and their associated roles.
 *
 * @param {string} id - User ID.
 * @returns {Object} Success status.
 */
router.delete('/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        await UserModel.deleteUser(userId);
        res.json({ success: true });
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /permissions
 * Retrieves all available permissions.
 *
 * @returns {Array<string>} Array of permission names.
 */
router.get('/permissions', async (req, res) => {
    try {
        const result = await UserModel.getAllPermissions();
        const permissions = result.map(p => p.permission_name);
        res.json(permissions);
    } catch (error) {
        console.error('Error fetching all permissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /:id
 * Updates user details and default view.
 *
 * @param {string} id - User ID.
 * @body {string} name - Full name.
 * @body {string} email - Email address.
 * @body {string} phone - Phone number.
 * @body {string} password - Plaintext password (optional).
 * @body {string} default_view - Role name for default view.
 */
router.get('/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await UserModel.getUserById(userId);
        res.json(result);
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /:id/advising
 * Retrieves advising relationships for a specific user.
 *
 * @param {string} id - User ID.
 * @returns {Object} Object containing arrays of assigned advisors and students.
 */
router.get('/:id/advising', async (req, res) => {
    const userId = req.params.id;
    try {
        const relations = await UserModel.getAdvisingRelations(userId);
        res.json(relations);
    } catch (error) {
        console.error(`Error fetching advising relations for user ${userId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /:id/advising
 * Updates advising relationships for a specific user.
 * 
 * @param {string} id - User ID.
 * @body {Array<string>} advisorIds - Array of advisor user IDs to assign.
 * @body {Array<string>} studentIds - Array of student user IDs to assign.
 */
router.post('/:id/advising', async (req, res) => {
    const userId = req.params.id;
    const { advisorIds, studentIds } = req.body;

    try {
        await UserModel.updateAdvisingRelations(userId, advisorIds, studentIds);
        res.json({ success: true });
    } catch (error) {
        console.error(`Error updating advising relations for user ${userId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /:id
 * Updates user details and default view.
 *
 * @param {string} id - User ID.
 * @body {string} name - Full name.
 * @body {string} email - Email address.
 * @body {string} phone - Phone number.
 * @body {string} password - Plaintext password (optional).
 * @body {string} default_view - Role name for default view.
 */
router.put('/:id', async (req, res) => {
    const userId = req.params.id;
    const { name, email, phone, password, default_view } = req.body;

    try {
        await UserModel.updateUserDetails(userId, name, email, phone, password, default_view);
        res.json({ success: true });
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /public/:publicId
 * Retrieves basic user details by public ID.
 * 
 * @param {string} publicId - Public user ID.
 * @returns {Object} User object with user_id and name.
 */
router.get('/public/:publicId', async (req, res) => {
    const publicId = req.params.publicId;
    try {
        const result = await UserModel.getUserByPublicId(publicId);
        if (!result) return res.status(404).json({ error: 'User not found' });
        res.json(result);
    } catch (error) {
        console.error(`Error fetching user ${publicId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /:id/preferences
 *
 * Retrieves the saved user interface preferences for a specific user.
 * Calls UserModel.getUserPreferences to fetch theme, font size, and font family
 * from the database and returns them as JSON.
 *
 * @route GET /api/users/:id/preferences
 * @param {string} req.params.id - The unique numeric identifier of the user.
 * @returns {Object} 200 - JSON object containing user preferences:
 *   { theme: string, font_size_change: string, font_family: string }
 * @returns {Object} 500 - Internal server error if the query fails.
 */
router.get('/:id/preferences', async (req, res) => {
  try {
    const prefs = await UserModel.getUserPreferences(req.params.id);
    res.json(prefs);
  } catch (err) {
    console.error('Error fetching preferences:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /:id/preferences
 *
 * Updates the user interface preferences for a specific user.
 * Accepts theme, font size adjustment, and font family in the request body,
 * and persists them to the database via UserModel.updateUserPreferences.
 *
 * @route PUT /api/users/:id/preferences
 * @param {string} req.params.id - The unique numeric identifier of the user.
 * @param {string} req.body.theme - The theme preference ('light' or 'dark').
 * @param {string} req.body.font_size_change - The font size adjustment (e.g., '0px', '2px').
 * @param {string} req.body.font_family - The font family preference (e.g., 'Arial, sans-serif').
 * @returns {Object} 200 - JSON object { success: true } if update succeeds.
 * @returns {Object} 500 - Internal server error if the update fails.
 */
router.put('/:id/preferences', async (req, res) => {
  const { theme, font_size_change, font_family } = req.body;
  try {
    await UserModel.updateUserPreferences(req.params.id, theme, font_size_change, font_family);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating preferences:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /:id/password
 *
 * Updates the stored password for a specific user.
 * Accepts a plaintext password in the request body, hashes it securely using bcrypt,
 * and updates the password_hash column in the users table via UserModel.updateUserPassword.
 *
 * @route PUT /api/users/:id/password
 * @param {string} req.params.id - The unique numeric identifier of the user.
 * @param {string} req.body.password - The new plaintext password to be hashed and stored.
 * @returns {Object} 200 - JSON object { success: true } if update succeeds.
 * @returns {Object} 500 - Internal server error if the update fails.
 */
router.put('/:id/password', async (req, res) => {
  const { password } = req.body;
  try {
    await UserModel.updateUserPassword(req.params.id, password);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
