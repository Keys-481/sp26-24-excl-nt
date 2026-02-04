/**
 * File: backend/src/models/CommentModel.js
 * Model for handling comments in the application.
 */

const pool = require('../db');
const NotificationsModel = require('./NotificationsModel');

/**
 * Inserts a new comment into the degree_plan_comments table and triggers notifications.
 * @param {*} programId - ID of the program the comment is associated with.
 * @param {*} studentId - ID of the student the comment is associated with.
 * @param {*} authorId - ID of the user creating the comment.
 * @param {*} commentText - The text content of the comment.
 * @returns The newly created comment object.
 */
async function createComment(programId, studentId, authorId, commentText) {
    try {
        const comment = commentText.trim(); // sanitize input
        // Insert the new comment and return the inserted row with author names
        const result = await pool.query(
        `INSERT INTO degree_plan_comments (program_id, student_id, author_id, comment_text)
         VALUES ($1, $2, $3, $4) RETURNING *,
        (SELECT u.first_name FROM users u WHERE u.user_id = $3) AS first_name,
        (SELECT u.last_name FROM users u WHERE u.user_id = $3) AS last_name`,
        [programId, studentId, authorId, comment]
    );

    const newComment = result.rows[0]; // newly created comment

    // trigger notifications for relevant users
    await NotificationsModel.createNewCommentNotif({
        author_id: authorId,
        notif_message: comment,
        comment_id: newComment.comment_id,
        program_id: programId,
        student_id: studentId,
    }, "comment_created");

    return newComment;
    } catch (error) {
        console.error('Error creating comment:', error);
        throw error;
    }
}

/**
 * Fetches all comments associated with a specific program.
 * @param {*} programId - ID of the program to fetch comments for.
 * @param {*} studentId - ID of the student to fetch comments for.
 * @returns An array of comment objects.
 */
async function getCommentsByProgramAndStudent(programId, studentId) {
    try {
        // Query to get comments along with author names
        const result = await pool.query(
            `SELECT c.*,
            u.first_name, u.last_name
            FROM degree_plan_comments c
            JOIN users u ON c.author_id = u.user_id
            WHERE program_id = $1 AND student_id = $2
            ORDER BY created_at`,
            [programId, studentId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
    }
}

/**
 * Deletes a comment by its ID.
 * @param {*} commentId - ID of the comment to delete.
 * @returns The deleted comment object.
 */
async function deleteCommentById(commentId) {
    try {
        // Query to delete the comment
        const result = await pool.query(
            `DELETE FROM degree_plan_comments WHERE comment_id = $1 RETURNING *`,
            [commentId]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
}

/**
 * Update a comment by its ID and triggers notifications.
 * @param {*} commentId - ID of the comment to update.
 * @param {*} newText - New text content for the comment.
 * @returns The updated comment object.
 */
async function updateComment(commentId, newText) {
    try {
        const text = newText.trim(); // sanitize input
        // Query to update the comment and return the updated row with author names
        const result = await pool.query(
            `WITH updated AS (
                UPDATE degree_plan_comments
                SET comment_text = $1
                WHERE comment_id = $2
                RETURNING *
            ) SELECT updated.*,
                u.first_name, u.last_name
            FROM updated
            LEFT JOIN users u ON u.user_id = updated.author_id`,
            [text, commentId]
        );

        const updatedComment = result.rows[0];

        if (!updatedComment) {
            throw new Error('Comment not found');
        }

        // trigger notifications for relevant users
        await NotificationsModel.createNewCommentNotif({
            author_id: updatedComment.author_id,
            notif_message: text,
            comment_id: updatedComment.comment_id,
            program_id: updatedComment.program_id,
            student_id: updatedComment.student_id,
        }, "comment_updated");

        return updatedComment;
    } catch (error) {
        console.error('Error updating comment:', error);
        throw error;
    }
}

// Export functions
module.exports = {
    createComment,
    getCommentsByProgramAndStudent,
    deleteCommentById,
    updateComment
};