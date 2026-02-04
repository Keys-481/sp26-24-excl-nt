/**
 * @fileoverview Unit tests for authorization utility functions:
 * getUser, requireUser, requireRole, and requireAnyRole.
 * 
 * These tests validate authentication and role-based access control
 * middleware behavior in Express.js applications.
 */

const { getUser, requireUser, requireRole, requireAnyRole } = require('../../src/utils/authorize');

describe('authorize.js', () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    /**
     * Tests for getUser utility.
     * 
     * @function getUser
     * @description Retrieves the user object from the request if present,
     * otherwise returns null.
     */
    describe('getUser', () => {
        /**
         * Tests for getUser utility.
         *
         * @function getUser
         * @description Retrieves the user object from the request if present,
         * otherwise returns null.
         */
        test('returns user when present', () => {
            req.user = { user_id: 1 };
            expect(getUser(req)).toEqual({ user_id: 1 });
        });

        /**
         * Ensures getUser returns null when no user is attached to the request.
         */
        test('returns null when no user', () => {
            expect(getUser(req)).toBeNull();
        });
    });

    /**
     * Tests for requireUser middleware.
     * 
     * @function requireUser
     * @description Ensures that a user is authenticated. Calls next()
     * if a user exists, otherwise responds with 401 Unauthorized.
     */
    describe('requireUser', () => {
        /**
         * Ensures that a user is authenticated. Calls next() if a user exists, otherwise responds with 401 Unauthorized.
         */
        test('calls next when user_id exists', () => {
            req.user = { user_id: 1 };
            requireUser(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        /**
         * Ensures requireUser responds with 401 Unauthorized when no user is present.
         */
        test('responds 401 when no user', () => {
            requireUser(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: User not authenticated' });
        });
    });

    /**
     * Tests for requireRole middleware.
     * 
     * @function requireRole
     * @description Ensures that the authenticated user has the required role.
     * - Responds with 401 if no user is present.
     * - Responds with 403 if the user’s role does not match.
     * - Calls next() if the role matches or if the user is an admin.
     */
    describe('requireRole', () => {
        /**
         *  Ensures that the authenticated user has the required role.
         */
        test('responds 401 when no user', () => {
            requireRole('student')(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        /**
         * Ensures requireRole responds with 403 Forbidden when the user’s role does not match.
         */
        test('responds 403 when role mismatch', () => {
            req.user = { user_id: 1, role: 'guest' };
            requireRole('student')(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        /**
         * Ensures requireRole calls next() when the user’s role matches the required role.
         */
        test('calls next when role matches', () => {
            req.user = { user_id: 1, role: 'student' };
            requireRole('student')(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        /**
         * Ensures requireRole calls next() when the user has the admin role,
         * regardless of the required role.
         */
        test('calls next when role is admin', () => {
            req.user = { user_id: 1, role: 'admin' };
            requireRole('student')(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });

    /**
     * Tests for requireAnyRole middleware.
     * 
     * @function requireAnyRole
     * @description Ensures that the authenticated user has one of the allowed roles.
     * - Responds with 401 if no user is present.
     * - Responds with 403 if the user’s role is not in the allowed list.
     * - Calls next() if the role is allowed or if the user is an admin.
     */
    describe('requireAnyRole', () => {
        /**
         * Ensures that the authenticated user has one of the allowed roles.
         */
        test('responds 401 when no user', () => {
            requireAnyRole(['student'])(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        /**
         * Ensures requireAnyRole responds with 403 Forbidden when the user’s role
         * is not in the allowed list.
         */
        test('responds 403 when role not allowed', () => {
            req.user = { user_id: 1, role: 'guest' };
            requireAnyRole(['student'])(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        /**
         * Ensures requireAnyRole calls next() when the user’s role is in the allowed list.
         */
        test('calls next when role allowed', () => {
            req.user = { user_id: 1, role: 'student' };
            requireAnyRole(['student'])(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        /**
         * Ensures requireAnyRole calls next() when the user has the admin role,
         * regardless of the allowed roles list.
         */
        test('calls next when role is admin', () => {
            req.user = { user_id: 1, role: 'admin' };
            requireAnyRole(['student'])(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
});
