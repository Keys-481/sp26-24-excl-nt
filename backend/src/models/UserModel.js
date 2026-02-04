const pool = require('../db');
const bcrypt = require('bcrypt');

/**
 * Searches users by name and/or role.
 *
 * @async
 * @function searchUsers
 * @param {string|null} nameQuery - Partial or full name to search (first or last name). Case-insensitive.
 * @param {string|null} roleQuery - Partial or full role name to filter users by. Case-insensitive.
 * @returns {Promise<Array<Object>>} Array of user objects with `id`, `name`, and `roles` fields.
 */
async function searchUsers(nameQuery, roleQuery) {
    const nameParam = nameQuery && nameQuery.trim() !== '' ? `%${nameQuery}%` : null;
    const roleParam = roleQuery && roleQuery.trim() !== '' ? `%${roleQuery.toLowerCase()}%` : null;

    // Step 1: Get matching user IDs
    const userIdResult = await pool.query(
        `
        SELECT DISTINCT u.user_id
        FROM users u
        LEFT JOIN user_roles ur ON u.user_id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.role_id
        WHERE ($1::TEXT IS NULL OR u.first_name ILIKE $1 OR u.last_name ILIKE $1)
        AND ($2::TEXT IS NULL OR r.role_name::TEXT ILIKE $2)
        `,
        [nameParam, roleParam]
    );

    const userIds = userIdResult.rows.map(row => row.user_id);
    if (userIds.length === 0) return [];

    // Step 2: Get full user info and all roles
    const result = await pool.query(
        `
        SELECT 
            u.user_id AS id,
            u.public_id AS public,
            CONCAT(u.first_name, ' ', u.last_name) AS name,
            COALESCE(ARRAY_AGG(DISTINCT r.role_name::TEXT), ARRAY[]::TEXT[]) AS roles
        FROM users u
        LEFT JOIN user_roles ur ON u.user_id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.role_id
        WHERE u.user_id = ANY($1)
        GROUP BY u.user_id, u.public_id, u.first_name, u.last_name
        `,
        [userIds]
    );

    return result.rows.map(row => ({
        id: row.id,
        public: row.public,
        name: row.name,
        roles: row.roles
    }));
}

/**
 * Retrieves all available roles from the database.
 *
 * @async
 * @function getAllRoles
 * @returns {Promise<Array<string>>} Array of role objects.
 */
async function getAllRoles() {
    const result = await pool.query(`SELECT role_id, role_name FROM roles ORDER BY role_name`);
    return result.rows.map(r => ({
        role_id: r.role_id,
        role_name: r.role_name
    }));
}

/**
 * Retrieves all roles assigned to a specific user.
 *
 * @async
 * @function getUserRoles
 * @param {number} userId - The ID of the user.
 * @returns {Promise<Array<string>>} Array of role names assigned to the user, capitalized.
 */
async function getUserRoles(userId) {
    const result = await pool.query(
        `
        SELECT r.role_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.role_id
        WHERE ur.user_id = $1
        `,
        [userId]
    );

    return result.rows.map(r => r.role_name.charAt(0).toUpperCase() + r.role_name.slice(1));
}

/**
 * Updates the roles assigned to a user.
 * Removes all existing roles and assigns the new list of roles.
 *
 * @async
 * @function updateUserRoles
 * @param {number} userId - The ID of the user to update.
 * @param {Array<string>} roles - Array of role names to assign to the user.
 * @throws Will throw an error if the transaction fails.
 */
async function updateUserRoles(userId, roles) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get default view role ID
        const defaultViewRes = await client.query(
            `SELECT default_view FROM users WHERE user_id = $1`,
            [userId]
        );
        const defaultViewId = defaultViewRes.rows[0]?.default_view;

        // Get public_id for school_student_id
        const publicIdRes = await client.query(
            `SELECT public_id FROM users WHERE user_id = $1`,
            [userId]
        );
        const schoolStudentId = publicIdRes.rows[0]?.public_id;
        const roleIds = new Set();

        for (const roleName of roles) {
            const normalizedRole = roleName.trim().toLowerCase();
            // Resolve role_id
            const roleRes = await client.query(
                `SELECT role_id FROM roles WHERE LOWER(role_name::TEXT) = LOWER($1)`,
                [normalizedRole]
            );
            if (roleRes.rows.length > 0) {
                roleIds.add(roleRes.rows[0].role_id);
            }

            // Insert into students table
            if (normalizedRole === 'student' && schoolStudentId) {
                const existing = await client.query(
                    `SELECT 1 FROM students WHERE user_id = $1`,
                    [userId]
                );
                if (existing.rowCount === 0) {
                    await client.query(
                        `INSERT INTO students (school_student_id, user_id) VALUES ($1, $2)`,
                        [schoolStudentId, userId]
                    );
                }
            }

            // Insert into advisors table
            if (normalizedRole === 'advisor') {
                const existingAdvisor = await client.query(
                    `SELECT 1 FROM advisors WHERE user_id = $1`,
                    [userId]
                );
                if (existingAdvisor.rowCount === 0) {
                    await client.query(
                        `INSERT INTO advisors (user_id) VALUES ($1)`,
                        [userId]
                    );
                }
            }
        }

        if (defaultViewId) {
            roleIds.add(defaultViewId);
        }

        // Clear existing roles
        await client.query(`DELETE FROM user_roles WHERE user_id = $1`, [userId]);

        // Assign new roles
        for (const roleId of roleIds) {
            await client.query(
                `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
                [userId, roleId]
            );
        }

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Adds a new user to the database with the specified roles.
 * Password is securely hashed using bcrypt.
 *
 * @async
 * @function addUser
 * @param {string} name - Full name of the user (first and last name).
 * @param {string} email - Email address of the user.
 * @param {string} phone - Phone number of the user.
 * @param {string} password - Plaintext password to be hashed.
 * @param {string} defaultView - Default view role name.
 * @param {Array<string>} roles - Array of role names to assign to the user.
 * @returns {Promise<Object>} Object containing the new user's ID.
 * @throws Will throw an error if the transaction fails.
 */
async function addUser(name, email, phone, password, defaultView, roles) {
    const client = await pool.connect();
    const [firstName, ...rest] = name.trim().split(' ');
    const lastName = rest.join(' ') || '';
    const passwordHash = await bcrypt.hash(password, 10); // secure hash

    try {
        await client.query('BEGIN');

        // Get role_id for defaultView
        const defaultViewRes = await client.query(
            `SELECT role_id FROM roles WHERE LOWER(role_name::TEXT) = LOWER($1)`,
            [defaultView]
        );
        const defaultViewId = defaultViewRes.rows[0]?.role_id;
        if (!defaultViewId) throw new Error('Invalid default view role');

        // TEMP insert to get user_id
        const tempUserRes = await client.query(
            `SELECT nextval('users_user_id_seq') AS next_id`
        );
        const nextUserId = tempUserRes.rows[0].next_id;
        const publicId = `${String(nextUserId).padStart(9, '0')}`;

        // Insert user with public_id
        const userRes = await client.query(
            `INSERT INTO users (user_id, first_name, last_name, email, phone_number, password_hash, default_view, public_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING user_id`,
            [nextUserId, firstName, lastName, email, phone, passwordHash, defaultViewId, publicId]
        );
        const userId = userRes.rows[0].user_id;

        // Insert default user_settings row
        await client.query(
            `INSERT INTO user_settings (user_id, theme, font_size_change, font_family)
       VALUES ($1, 'light', '0px', 'Arial, sans-serif')`,
            [userId]
        );

        // Assign roles
        const roleIds = new Set();
        for (const roleName of roles) {
            const roleRes = await client.query(
                `SELECT role_id FROM roles WHERE LOWER(role_name::TEXT) = LOWER($1)`,
                [roleName]
            );
            if (roleRes.rows.length > 0) {
                roleIds.add(roleRes.rows[0].role_id);
            }
        }

        roleIds.add(defaultViewId);

        for (const roleId of roleIds) {
            await client.query(
                `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
                [userId, roleId]
            );
        }

        await client.query('COMMIT');
        return { userId };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Deletes a user and all associated roles from the database.
 *
 * @async
 * @function deleteUser
 * @param {number} userId - The ID of the user to delete.
 * @throws Will throw an error if the transaction fails.
 */
async function deleteUser(userId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`DELETE FROM user_roles WHERE user_id = $1`, [userId]);
        await client.query(`DELETE FROM users WHERE user_id = $1`, [userId]);
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Gets all permissions associated with a specific role.
 *
 * @async
 * @function getRolePermissions
 * @param {string} roleName - The name of the role.
 * @returns {Promise<Array<string>>} Array of permission names.
 */
async function getRolePermissions(roleName) {
    const result = await pool.query(
        `
        SELECT p.permission_name
        FROM roles r
        JOIN role_permissions rp ON r.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE LOWER(r.role_name::TEXT) = LOWER($1)
        ORDER BY p.permission_name
        `,
        [roleName]
    );

    return result.rows.map(row => row.permission_name);
}

/**
 * Gets all available permissions in the system.
 *
 * @async
 * @function getAllPermissions
 * @returns {Promise<Array>} Array of all permission names.
 */
async function getAllPermissions() {
    const query = `SELECT permission_name FROM permissions ORDER BY permission_name`;
    const result = await pool.query(query);
    return result.rows;
}

/**
 * Updates a user's profile information in the database.
 *
 * @async
 * @function updateUserDetails
 * @param {number} userId - The ID of the user to update.
 * @param {string} name - Full name of the user (first and last name).
 * @param {string} email - Email address of the user.
 * @param {string} phone - Phone number of the user.
 * @param {string|null} password - Plaintext password to be hashed (optional).
 * @param {string} defaultView - Role name to set as the user's default view.
 * @throws Will throw an error if the update fails or the default view role is invalid.
 */
async function updateUserDetails(userId, name, email, phone, password, defaultView) {
    const client = await pool.connect();
    const [firstName, ...rest] = name.trim().split(' ');
    const lastName = rest.join(' ') || '';
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    try {
        await client.query('BEGIN');

        const defaultViewRes = await client.query(
            `SELECT role_id FROM roles WHERE LOWER(role_name::TEXT) = LOWER($1)`,
            [defaultView]
        );
        const defaultViewId = defaultViewRes.rows[0]?.role_id;
        if (!defaultViewId) throw new Error('Invalid default view role');

        const updates = [
            `first_name = $1`,
            `last_name = $2`,
            `email = $3`,
            `phone_number = $4`,
            `default_view = $5`
        ];
        const values = [firstName, lastName, email, phone, defaultViewId];

        if (passwordHash) {
            updates.push(`password_hash = $6`);
            values.push(passwordHash);
        }

        await client.query(
            `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${values.length + 1}`,
            [...values, userId]
        );

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Retrieves basic user details by user ID.
 *
 * @async
 * @function getUserById
 * @param {number} userId - The ID of the user to retrieve.
 * @returns {Promise<Object>} An object containing the user's full name, email, phone number, and default view role name.
 */
async function getUserById(userId) {
    const result = await pool.query(
        `SELECT 
            u.public_id,
            u.first_name,
            u.last_name,
            CONCAT(u.first_name, ' ', u.last_name) AS name,
            u.email,
            u.phone_number,
            r.role_name AS default_view
        FROM users u
        LEFT JOIN roles r ON u.default_view = r.role_id
        WHERE u.user_id = $1`,
        [userId]
    );
    return result.rows[0];
}

/**
 * Retrieves advising relationships for a user.
 *
 * @async
 * @function getAdvisingRelations
 * @param {number} userId - The ID of the user to check.
 * @returns {Promise<Object>} An object with two arrays:
 *   - `students`: If the user is an advisor, an array of their assigned students.
 *   - `advisors`: If the user is a student, an array of their assigned advisors.
 */
async function getAdvisingRelations(userId) {
    const client = await pool.connect();
    try {
        // If user is an advisor, get their students
        const advisorRes = await client.query(
            `SELECT advisor_id FROM advisors WHERE user_id = $1`,
            [userId]
        );
        const advisorId = advisorRes.rows[0]?.advisor_id;

        let students = [];
        if (advisorId) {
            const studentRes = await client.query(
                `SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS name
                FROM advising_relations ar
                JOIN students s ON ar.student_id = s.student_id
                JOIN users u ON s.user_id = u.user_id
                WHERE ar.advisor_id = $1`,
                [advisorId]
            );
            students = studentRes.rows;
        }

        // If user is a student, get their advisor
        const studentRes = await client.query(
            `SELECT student_id FROM students WHERE user_id = $1`,
            [userId]
        );
        const studentId = studentRes.rows[0]?.student_id;

        let advisors = [];
        if (studentId) {
            const advisorRes = await client.query(
                `SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS name, u.email, u.phone_number
                FROM advising_relations ar
                JOIN advisors a ON ar.advisor_id = a.advisor_id
                JOIN users u ON a.user_id = u.user_id
                WHERE ar.student_id = $1`,
                [studentId]
            );
            advisors = advisorRes.rows;
        }
        return { students, advisors };
    } finally {
        client.release();
    }
}

/**
 * Updates advising relationships for a user.
 *
 * @async
 * @function updateAdvisingRelations
 * @param {number} userId - The ID of the user being edited.
 * @param {Array<number>} advisorUserIds - Array of advisor user IDs to assign (if user is a student).
 * @param {Array<number|string>} studentUserIds - Array of student user IDs or public IDs to assign (if user is an advisor).
 * @throws Will throw an error if the transaction fails or if any user IDs cannot be resolved.
 */
async function updateAdvisingRelations(userId, advisorUserIds, studentUserIds) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Get advisor_id if user is an advisor
        const advisorRes = await client.query(
            `SELECT advisor_id FROM advisors WHERE user_id = $1`,
            [userId]
        );
        const isAdvisor = advisorRes.rows.length > 0;
        const advisorId = advisorRes.rows[0]?.advisor_id;

        // Get student_id if user is a student
        const studentRes = await client.query(
            `SELECT student_id FROM students WHERE user_id = $1`,
            [userId]
        );
        const isStudent = studentRes.rows.length > 0;
        const studentId = studentRes.rows[0]?.student_id;

        // Remove existing relations
        if (isAdvisor) {
            await client.query(`DELETE FROM advising_relations WHERE advisor_id = $1`, [advisorId]);
        }
        if (isStudent) {
            await client.query(`DELETE FROM advising_relations WHERE student_id = $1`, [studentId]);
        }

        // If user is advisor, insert new student relations
        if (isAdvisor && studentUserIds?.length > 0) {
            for (const studentIdentifier of studentUserIds) {
                let resolvedUserId = studentIdentifier;

                // If it's a public_id (string), resolve to user_id
                if (typeof studentIdentifier === 'string') {
                    const userRes = await client.query(
                        `SELECT user_id FROM users WHERE public_id = $1`,
                        [studentIdentifier]
                    );
                    resolvedUserId = userRes.rows[0]?.user_id;
                }

                if (!resolvedUserId) {
                    console.warn(`Could not resolve student identifier: ${studentIdentifier}`);
                    continue;
                }

                const res = await client.query(
                    `SELECT student_id FROM students WHERE user_id = $1`,
                    [resolvedUserId]
                );
                let sid = res.rows[0]?.student_id;

                if (!sid) {
                    const insertRes = await client.query(
                        `INSERT INTO students (school_student_id, user_id)
                        SELECT public_id, user_id FROM users WHERE user_id = $1
                        RETURNING student_id`,
                        [resolvedUserId]
                    );
                    sid = insertRes.rows[0]?.student_id;
                }

                if (sid) {
                    await client.query(
                        `INSERT INTO advising_relations (advisor_id, student_id) VALUES ($1, $2)`,
                        [advisorId, sid]
                    );
                }
            }
        }

        // If user is student, insert advisor relation
        if (isStudent && Array.isArray(advisorUserIds)) {
            for (const advisorUserId of advisorUserIds) {
                const res = await client.query(
                    `SELECT advisor_id FROM advisors WHERE user_id = $1`,
                    [advisorUserId]
                );
                const aid = res.rows[0]?.advisor_id;

                if (aid) {
                    await client.query(
                        `INSERT INTO advising_relations (advisor_id, student_id) VALUES ($1, $2)`,
                        [aid, studentId]
                    );
                }
            }
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Retrieves a user's internal ID and full name using their public ID.
 *
 * @async
 * @function getUserByPublicId
 * @param {string} publicId - The public ID of the user (e.g., school-assigned ID).
 * @returns {Promise<Object|null>} An object with `user_id` and `name`, or `null` if not found.
 */
async function getUserByPublicId(publicId) {
    const result = await pool.query(
        `SELECT user_id, CONCAT(first_name, ' ', last_name) AS name FROM users WHERE public_id = $1`,
        [publicId]
    );
    return result.rows[0];
}

/**
 * Retrieves the saved user interface preferences for a given user.
 *
 * Executes a SQL query against the `user_settings` table to fetch
 * the theme, font size adjustment, and font family associated with
 * the specified user ID.
 *
 * @async
 * @function getUserPreferences
 * @param {number} userId - The unique numeric identifier of the user.
 * @returns {Promise<Object>} An object containing the user's preferences:
 *   { theme: string, font_size_change: string, font_family: string }.
 * @throws Will propagate any database query errors.
 */
async function getUserPreferences(userId) {
    const result = await pool.query(
        `SELECT theme, font_size_change, font_family 
     FROM user_settings 
     WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0];
}

/**
 * Updates the user interface preferences for a given user.
 *
 * Executes a SQL UPDATE against the `user_settings` table to persist
 * changes to theme, font size adjustment, and font family.
 *
 * @async
 * @function updateUserPreferences
 * @param {number} userId - The unique numeric identifier of the user.
 * @param {string} theme - The theme preference (e.g., 'light' or 'dark').
 * @param {string} size - The font size adjustment (e.g., '0px', '2px').
 * @param {string} family - The font family preference (e.g., 'Arial, sans-serif').
 * @returns {Promise<void>} Resolves when the update completes successfully.
 * @throws Will propagate any database query errors.
 */
async function updateUserPreferences(userId, theme, size, family) {
    await pool.query(
        `UPDATE user_settings 
     SET theme = $1, font_size_change = $2, font_family = $3 
     WHERE user_id = $4`,
        [theme, size, family, userId]
    );
}

/**
 * Updates the stored password for a given user.
 *
 * Hashes the provided plaintext password using bcrypt before saving
 * it to the `users` table. The password is stored in the `password_hash`
 * column to ensure secure authentication.
 *
 * @async
 * @function updateUserPassword
 * @param {number} userId - The unique numeric identifier of the user.
 * @param {string} password - The new plaintext password to be hashed.
 * @returns {Promise<void>} Resolves when the update completes successfully.
 * @throws Will propagate any database query errors.
 */
async function updateUserPassword(userId, password) {
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
        `UPDATE users SET password_hash = $1 WHERE user_id = $2`,
        [passwordHash, userId]
    );
}

module.exports = {
    searchUsers,
    getAllRoles,
    getUserRoles,
    updateUserRoles,
    addUser,
    deleteUser,
    getRolePermissions,
    getAllPermissions,
    updateUserDetails,
    getUserById,
    getAdvisingRelations,
    updateAdvisingRelations,
    getUserByPublicId,
    getUserPreferences,
    updateUserPreferences,
    updateUserPassword
};
