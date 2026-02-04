/**
 * file: backend/src/routes/auth.js
 * Authentication routes for the application.
 */
const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");
const router = express.Router();

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

module.exports = router;