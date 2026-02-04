/**
 * @file middleware/auth.js
 * @description Middleware to handle authentication using JWT or development headers.
 */

const jwt = require('jsonwebtoken');

const AUTH_HEADER = 'authorization';
const DEV_UID_HEADER = 'x-user-id';
const DEV_ROLE_HEADER = 'x-user-role';

/**
 * Parses a Bearer token from the given header value.
 * @param {string} headerValue - The value of the authorization header.
 * @returns {string|null} The Bearer token or null if not found.
 */
function parseBearer(headerValue) {
    if (!headerValue) return null;
    const [scheme, token] = headerValue.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
    return token;
}

module.exports = function auth(req, _res, next) {
    // Try JWT (production)
    const token = parseBearer(req.header(AUTH_HEADER));
    if (token && process.env.JWT_SECRET) {
        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            if (payload?.user_id) {
                req.user = {
                    user_id: Number(payload.user_id),
                    role: payload.role || 'student',
                };
                return next();
            }
        } catch (err) {
            // Invalid token, fall through to dev headers
            console.warn('[auth] JWT verification failed:', err.message);
        }
    }

    // Dev fallback (should not be used in production)
    const devId = req.header(DEV_UID_HEADER);
    const devRole = req.header(DEV_ROLE_HEADER);
    if (devId) {
        req.user = {
            user_id: Number(devId),
            role: devRole || 'student',
        };
    }
    next();
}
