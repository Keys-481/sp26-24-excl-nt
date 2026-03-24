/**
 * file: backend/src/routes/auth.js
 * Authentication routes for the application.
 */
const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");
const { sendLoginInfoEmail } = require("../services/email");
const { isValidBoiseStateEmail } = require("../utils/boiseStateEmail");
const router = express.Router();

/** Same response whether or not the account exists (avoid email enumeration). */
const RESEND_GENERIC_MESSAGE =
  "If an account exists for that Boise State email, login instructions have been sent. Check your inbox and spam folder.";

// Login route
router.post("/login", async (req, res) => {
    // Extract identifier and password from request body
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
        return res.status(400).json({ error: "Identifier and password are required." });
    }

    // Ensure database pool is available
    if (!pool || typeof pool.query !== "function") {
        console.error("[auth] Database pool is not properly initialized.");
        return res.status(500).json({ error: "Internal server error." });
    }

    // Query to find user by username or email
    try {
        const { rows } = await pool.query(
            `SELECT u.user_id,
                    u.public_id,
                    u.email,
                    u.phone_number,
                    u.first_name,
                    u.last_name,
                    u.password_hash,
                    u.default_view,
                    COALESCE(rl.role_name, 'student') AS role_name
            FROM users u
            LEFT JOIN LATERAL (
                SELECT r.role_name
                FROM user_roles ur
                JOIN roles r ON r.role_id = ur.role_id
                WHERE ur.user_id = u.user_id
                ORDER BY CASE r.role_name
                    WHEN 'admin' THEN 1
                    WHEN 'advisor' THEN 2
                    WHEN 'accounting' THEN 3
                    WHEN 'student' THEN 4  
                    ELSE 5
                END
                LIMIT 1
            ) rl ON true
            WHERE u.email = $1 OR u.phone_number = $1 
            LIMIT 1`,
            [identifier]
        );

        // Fetch user record
        const user = rows[0];
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        // Compare provided password with stored hash
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        return res.status(200).json({
            token: "dev-token",
            user: { 
                id: user.user_id,
                public_id: user.public_id,
                email: user.email,
                phone_number: user.phone_number,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role_name || "student",
                default_view: user.default_view
            },
        });
    } catch (err) {
        console.error("[auth] Login error:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
});

/**
 * POST /resend-login-email
 * Resends login instructions to a Boise State address if a matching user exists.
 * Always returns the same generic message when no account is found (privacy).
 *
 * @body {string} email - Boise State email (@u.boisestate.edu or @boisestate.edu)
 */
router.post("/resend-login-email", async (req, res) => {
    const { email } = req.body || {};

    if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ error: "Email is required." });
    }
    if (!isValidBoiseStateEmail(email)) {
        return res.status(400).json({
            error: "A valid Boise State email is required (@u.boisestate.edu or @boisestate.edu).",
        });
    }

    if (!pool || typeof pool.query !== "function") {
        console.error("[auth] Database pool is not properly initialized.");
        return res.status(500).json({ error: "Internal server error." });
    }

    const normalized = email.trim().toLowerCase();

    try {
        const { rows } = await pool.query(
            `SELECT user_id, first_name, email
             FROM users
             WHERE LOWER(TRIM(email)) = $1
             LIMIT 1`,
            [normalized]
        );

        const user = rows[0];
        if (!user) {
            return res.status(200).json({ message: RESEND_GENERIC_MESSAGE });
        }

        const sent = await sendLoginInfoEmail(user.email, user.first_name || "", {
            isResend: true,
        });

        if (!sent) {
            return res.status(503).json({
                error: "Unable to send email right now. Please try again later or contact your administrator.",
            });
        }

        return res.status(200).json({ message: RESEND_GENERIC_MESSAGE });
    } catch (err) {
        console.error("[auth] resend-login-email error:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;