/**
 * File: backend/src/models/NotificationsModel.js
 * Model for handling notifications in the application.
 */

const pool = require('../db');

/**
 * Create a new comment notification for relevant users when a comment is created or updated.
 * @param {*} comment - The comment object containing details about the comment.
 * @param {*} event - The event triggering the notification ("comment_created", "comment_updated").
 */
async function createNewCommentNotif(comment, event) {
    try {
        // Determine notification title based on event type
        const notificationTitle = event === "comment_created"
            ? 'New Degree Plan Comment'
            : event === 'comment_updated'
            ? 'Updated Degree Plan Comment'
            : 'Degree Plan Comment';

            // Fetch recipients: the student and all advisors of the student
        const recipientsResponse = await pool.query(
            `SELECT s.user_id AS recipient_id, s.student_id
            FROM students s
            WHERE s.student_id = $1
            UNION
            SELECT a.user_id AS recipient_id, ar.student_id
            FROM advisors a
            JOIN advising_relations ar ON a.advisor_id = ar.advisor_id
            WHERE ar.student_id = $1`,
            [comment.student_id]
        )

        // Filter out the author from recipients
        const recipients = recipientsResponse.rows.filter(r => r.recipient_id !== comment.author_id);

        if (recipients.length === 0) return;

        // Insert notifications for each recipient
        const insertNotifs = recipients.map(r =>
            pool.query(
                `INSERT INTO comment_notifications
                (recipient_id, triggered_by, title, notif_message, comment_id, program_id, student_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [r.recipient_id, comment.author_id, notificationTitle, comment.notif_message, comment.comment_id, comment.program_id, r.student_id]
            )
        );
        await Promise.all(insertNotifs);

    } catch (error) {
        console.error('Error creating comment notification:', error);
        throw error;
    }
}

/**
 * Mark a notification as read or unread.
 * @param {*} notificationId - The ID of the notification to mark as read or unread.
 * @param {*} isRead - Boolean indicating whether the notification is read or unread.
 * @returns The number of rows updated.
 */
async function markNotificationReadState(notificationId, isRead) {
    try {
        const results = await pool.query(
            `UPDATE comment_notifications
            SET is_read = $1
            WHERE notification_id = $2`,
            [isRead, notificationId]
        );
        return results.rowCount;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
}

/**
 * Get all notifications for a specific user.
 * @param {*} userId - The ID of the user to fetch notifications for.
 * @returns An array of notification objects.
 */
async function getNotificationsForUser(userId) {
    try {
        const result = await pool.query(
            `SELECT n.*,
                u_full.first_name || ' ' || u_full.last_name AS triggered_by_name,
                s_user.first_name || ' ' || s_user.last_name AS student_name,
                p.program_name,
                s_full.school_student_id
            FROM comment_notifications n
            LEFT JOIN users u_full ON n.triggered_by = u_full.user_id
            LEFT JOIN students s_full ON n.student_id = s_full.student_id
            LEFT JOIN users s_user ON s_full.user_id = s_user.user_id
            LEFT JOIN programs p ON n.program_id = p.program_id
            WHERE recipient_id = $1
            ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching notifications for user:', error);
        throw error;
    }
}

/**
 * Delete a notification by its ID.
 * @param {*} notificationId - The ID of the notification to delete.
 * @return The number of rows deleted.
 */
async function deleteNotification(notificationId) {
    try {
        const results = await pool.query(
            `DELETE FROM comment_notifications
            WHERE notification_id = $1`,
            [notificationId]
        );
        return results.rowCount;
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
}

//Export Functions
module.exports = {
    createNewCommentNotif,
    markNotificationReadState,
    getNotificationsForUser,
    deleteNotification
};