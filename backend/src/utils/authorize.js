/**
 * @file backend/src/utils/authorize.js
 * @description Utility functions for authorization.
 */

/**
 * Retrieves the user information from the request object.
 * @param {*} req - The request object.
 * @returns {Object|null} The user information or null if not available.
 */
function getUser(req) {
    return req.user || null;
}

/**
 * Middleware to require a user to be authenticated.
 * @param {*} req - The request object.
 * @param {*} res - The response object.
 * @param {*} next - The next function in the middleware chain.
 * @returns next() if authenticated, otherwise sends 401 response.
 */
function requireUser(req, res, next) {
    if (!req.user?.user_id) {
        return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    return next();
}

/**
 * Middleware to require a user to have a specific role.
 * @param {*} role - The required role.
 * @returns next() if authorized, otherwise sends 401 or 403 response.
 */
function requireRole(role) {
    return (req, res, next) => {
        const u = req.user;
        if (!u?.user_id) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
        }
        if (u.role !== role && u.role !== 'admin') {
            return res.status(403).json({ message: `Forbidden: Insufficient role, requires ${role}` });
        }
        return next();
    };
}

/**
 * Middleware to require a user to have any of the specified roles.
 * @param {*} roles - An array of roles.
 * @returns next() if authorized, otherwise sends 401 or 403 response.
 */
function requireAnyRole(roles) {
    const set = new Set(roles.concat('admin'));
    return (req, res, next) => {
        const u = req.user;
        if (!u?.user_id) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
        }
        if (!set.has(u.role)) {
            return res.status(403).json({ message: `Forbidden: Insufficient role, requires one of ${roles.join(', ')}` });
        }
        return next();
    };
}

module.exports = {
    getUser,
    requireUser,
    requireRole,
    requireAnyRole,
};