/**
 * File: backend/tests/models/NotificationsModel.test.js
 * Tests for NotificationsModel.
 */

const NotificationsModel = require('../../src/models/NotificationsModel');
const CommentModel = require('../../src/models/CommentModel');
const { runSchemaAndSeeds } = require('../../db_setup');
const pool = require('../../src/db');

// Reset and seed the database before each test
beforeAll(async () => {
    await runSchemaAndSeeds();
});

// Close the database connection after all tests
afterAll(async () => {
    await pool.end();
});

/**
 * Tests for NotificationsModel
 */
describe('NotificationsModel', () => {

    let newComment;

    beforeAll(async () => {
        // Create a test comment to trigger notifications: MS OPWL, student 1 (Alice Johnson), advisor 2 (Jane Doe)
        newComment = await CommentModel.createComment(1, 1, 2, 'Test comment for notifications');
    });

    // Test for creating new comment notification
    test('createNewCommentNotif inserts notifications for relevant users', async () => {
        await NotificationsModel.createNewCommentNotif({
            author_id: newComment.author_id,
            notif_message: newComment.comment_text,
            comment_id: newComment.comment_id,
            program_id: newComment.program_id,
            student_id: newComment.student_id,
        }, "comment_created");

        const result = await pool.query(
            `SELECT *
            FROM comment_notifications
            WHERE comment_id = $1`,
            [newComment.comment_id]
        );

        //
        expect(result.rows.length).toBeGreaterThan(0);
        result.rows.forEach(notif => {
            expect(notif.comment_id).toBe(newComment.comment_id);
            expect(notif.title).toBe('New Degree Plan Comment');
            expect(notif.notif_message).toBe(newComment.comment_text);
            expect(notif.program_id).toBe(newComment.program_id);
            expect(notif.student_id).toBe(newComment.student_id);
            expect(notif.triggered_by).toBe(newComment.author_id);
            expect(notif.recipient_id).not.toBe(newComment.author_id); // author should not receive notification
            expect(notif.is_read).toBe(false);
        });
    });

    test('getNotificationsForUser returns all notifications for a user', async () => {
        const userId = 4; // user 4: Alice Johnson (student)
        const notifications = await NotificationsModel.getNotificationsForUser(userId);

        // Verify notifications belong to the user
        expect(Array.isArray(notifications)).toBe(true);
        notifications.forEach(notif => {
            expect(notif.recipient_id).toBe(userId);
            expect(notif).toHaveProperty('notification_id');
            expect(notif).toHaveProperty('title');
            expect(notif).toHaveProperty('notif_message');
        });
    });

    test('markNotificationReadState updates the notification to is_read = true', async () => {
        // Get one notification to mark as read
        const result = await pool.query(
            `SELECT notification_id FROM comment_notifications WHERE is_read = false LIMIT 1`
        );
        // Ensure we have at least one notification to test
        const notificationId = result.rows[0].notification_id;

        await NotificationsModel.markNotificationReadState(notificationId, true);

        const updated = await pool.query(
            `SELECT is_read FROM comment_notifications WHERE notification_id = $1`,
            [notificationId]
        );
        expect(updated.rows[0].is_read).toBe(true);

        // Revert back to unread
        await NotificationsModel.markNotificationReadState(notificationId, false);
        const reverted = await pool.query(
            `SELECT is_read FROM comment_notifications WHERE notification_id = $1`,
            [notificationId]
        );
        expect(reverted.rows[0].is_read).toBe(false);
    });

    // Test for deleting a notification
    test('deleteNotification removes the notification', async () => {
        // Create a notification to delete
        const createResult = await pool.query(
            `INSERT INTO comment_notifications (recipient_id, triggered_by, title, notif_message, comment_id, program_id, student_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING notification_id`,
            [5, newComment.author_id, 'Test Delete', 'This notification will be deleted', newComment.comment_id, newComment.program_id, newComment.student_id]
        );
        const notificationId = createResult.rows[0].notification_id;

        // Delete the notification
        const deleteCount = await NotificationsModel.deleteNotification(notificationId);
        expect(deleteCount).toBe(1);

        // Verify deletion
        const verify = await pool.query(
            `SELECT * FROM comment_notifications WHERE notification_id = $1`,
            [notificationId]
        );
        expect(verify.rows.length).toBe(0);
    });

});

/**
 * Ensures createNewCommentNotif propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('createNewCommentNotif throws error when query fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => { }); // silence logs
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB failure'));

    // Try to create a notification
    await expect(
        NotificationsModel.createNewCommentNotif({
            author_id: 1,
            notif_message: 'msg',
            comment_id: 1,
            program_id: 1,
            student_id: 1,
        }, "comment_created")
    ).rejects.toThrow('DB failure');

    pool.query.mockRestore();
    console.error.mockRestore();
});

/**
 * Ensures markNotificationReadState propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('markNotificationReadState throws error when query fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB failure'));

    // Try to mark a notification read state
    await expect(
        NotificationsModel.markNotificationReadState(1, true)
    ).rejects.toThrow('DB failure');

    pool.query.mockRestore();
    console.error.mockRestore();
});

/**
 * Ensures getNotificationsForUser propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('getNotificationsForUser throws error when query fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB failure'));

    // Try to get notifications for a user
    await expect(
        NotificationsModel.getNotificationsForUser(1)
    ).rejects.toThrow('DB failure');

    pool.query.mockRestore();
    console.error.mockRestore();
});

/**
 * Ensures deleteNotification propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('deleteNotification throws error when query fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB failure'));

    // Try to delete a notification
    await expect(
        NotificationsModel.deleteNotification(1)
    ).rejects.toThrow('DB failure');

    pool.query.mockRestore();
    console.error.mockRestore();
});

describe('NotificationsModel', () => {
    let newComment;

    beforeAll(async () => {
        newComment = await CommentModel.createComment(1, 1, 2, 'Test comment for notifications');
    });

    /**
     * Validates that createNewCommentNotif inserts notifications
     * with the "comment_updated" title when event type is "comment_updated".
     */
    test('createNewCommentNotif inserts notifications with "comment_updated" title', async () => {
        const comment = {
            author_id: newComment.author_id,
            notif_message: newComment.comment_text,
            comment_id: newComment.comment_id,
            program_id: newComment.program_id,
            student_id: newComment.student_id,
        };

        // Create notification for comment updated event
        await NotificationsModel.createNewCommentNotif(comment, "comment_updated");

        // Verify notification with updated title exists
        const result = await pool.query(
            `SELECT * FROM comment_notifications WHERE comment_id = $1 AND title = 'Updated Degree Plan Comment'`,
            [comment.comment_id]
        );

        expect(result.rows.length).toBeGreaterThan(0);
    });

    /**
     * Validates that createNewCommentNotif inserts notifications
     * with the default title when event type is unknown.
     */
    test('createNewCommentNotif inserts notifications with default title when event is unknown', async () => {
        const comment = {
            author_id: newComment.author_id,
            notif_message: newComment.comment_text,
            comment_id: newComment.comment_id,
            program_id: newComment.program_id,
            student_id: newComment.student_id,
        };

        // Create notification for unknown event
        await NotificationsModel.createNewCommentNotif(comment, "random_event");

        // Verify notification with default title exists
        const result = await pool.query(
            `SELECT * FROM comment_notifications WHERE comment_id = $1 AND title = 'Degree Plan Comment'`,
            [comment.comment_id]
        );

        expect(result.rows.length).toBeGreaterThan(0);
    });

    /**
     * Ensures createNewCommentNotif returns early (no insert)
     * when the only recipient is the author themselves.
     */
    test('createNewCommentNotif returns early when only recipient is the author', async () => {
        // Create a comment where the only "recipient" is the author themselves
        const comment = {
            author_id: 1, // same as student user_id
            notif_message: 'Self comment',
            comment_id: 999,
            program_id: 1,
            student_id: 1,
        };

        // Mock pool.query to return only the author as recipient
        jest.spyOn(pool, 'query').mockResolvedValueOnce({
            rows: [{ recipient_id: 1, student_id: 1 }]
        });

        // Attempt to create notification
        await NotificationsModel.createNewCommentNotif(comment, "comment_created");

        // Verify no insert was attempted
        expect(pool.query).toHaveBeenCalledTimes(1);

        pool.query.mockRestore();
    });
});
