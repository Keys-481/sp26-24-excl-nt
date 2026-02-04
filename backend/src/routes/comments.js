/**
 * File: backend/src/routes/comments.js
 * Routes for handling comments related to degree plans.
 */

const express = require('express');
const router = express.Router();
const CommentModel = require('../models/CommentModel');
const AccessModel = require('../models/AccessModel');
const StudentModel = require('../models/StudentModel');

/**
 * route POST /comments
 * Posts a new comment for a degree plan for a specific student and program
 */
router.post('/', async (req, res) => {
    const { programId, studentSchoolId, commentText } = req.body;
    const authorId = req.user.user_id;

    // Validate required fields
    if (!programId || !studentSchoolId || !authorId || !commentText) {
        return res.status(400).json({ message: 'Missing required fields: programId, studentSchoolId, authorId, commentText' });
    }

    try {
        if (!commentText.trim()) {
            return res.status(400).json({ message: 'Comment text cannot be empty' });
        }

        // get student info from studentSchoolId
        const studentArr = await StudentModel.getStudentBySchoolId(studentSchoolId);
        if (!studentArr || studentArr.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        const student = studentArr[0];

        // Check access permissions
        const userRoles = await AccessModel.getUserRoles(authorId);
        const isAdmin = userRoles.includes('admin');
        const isAdvisor = userRoles.includes('advisor');
        const isStudent = userRoles.includes('student');
        let hasAccess = false;

        // Determine if the user has access to comment
        if (isAdmin) {
            hasAccess = true;
        } else if (isAdvisor) {
            hasAccess = await AccessModel.isAdvisorOfStudent(authorId, student.student_id);
        } else if (isStudent) {
            hasAccess = authorId === student.user_id;
        }

        // If no access, return forbidden
        if (!hasAccess) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to comment on this degree plan' });
        }

        const trimmedComment = commentText.trim();
        const newComment = await CommentModel.createComment(programId, student.student_id, authorId, trimmedComment);
        return res.status(201).json(newComment);

    } catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


/**
 * route GET /comments
 * Retrieves all comments for a specific student's degree plan in a specific program
 */
router.get('/', async (req, res) => {
    const { programId, studentSchoolId } = req.query;
    const currentUserId = req.user.user_id;

    // Validate required query parameters
    if (!programId || !studentSchoolId) {
        return res.status(400).json({ message: 'Missing required query parameters: programId, studentSchoolId' });
    }

    try {

        // get student info from studentSchoolId
        const studentArr = await StudentModel.getStudentBySchoolId(studentSchoolId);
        if (!studentArr || studentArr.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        const student = studentArr[0];

        // Check access permissions
        const userRoles = await AccessModel.getUserRoles(currentUserId);
        const isAdmin = userRoles.includes('admin');
        const isAdvisor = userRoles.includes('advisor');
        const isStudent = userRoles.includes('student');
        let hasAccess = false;

        // Determine if the user has access to view comments
        if (isAdmin) {
            hasAccess = true;
        } else if (isAdvisor) {
            hasAccess = await AccessModel.isAdvisorOfStudent(currentUserId, student.student_id);
        } else if (isStudent) {
            hasAccess = currentUserId === student.user_id;
        }

        // If no access, return forbidden
        if (!hasAccess) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to view comments for this degree plan' });
        }

        const comments = await CommentModel.getCommentsByProgramAndStudent(programId, student.student_id);
        return res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * route DELETE /comments/:commentId
 * Deletes a specific comment by its ID
 */
router.delete('/:commentId', async (req, res) => {
    const { commentId } = req.params;

    // Validate commentId parameter
    if (!commentId) {
            return res.status(400).json({ message: 'Missing commentId parameter' });
    }

    try {
        const deletedComment = await CommentModel.deleteCommentById(commentId);
        if (!deletedComment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        // return success response
        return res.json({ message: 'Comment deleted successfully', commentId: deletedComment.comment_id });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * route PUT /comments/:commentId
 * Updates a specific comment by its ID
 */
router.put('/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const { newText } = req.body;

    // Validate required parameters
    if (!commentId || !newText) {
        return res.status(400).json({ message: 'Missing required parameters: commentId, newText' });
    }

    // Validate that newText is not empty
    try {
        const updatedComment = await CommentModel.updateComment(commentId, newText);
        if (!updatedComment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        return res.json(updatedComment);
    } catch (error) {
        console.error('Error updating comment:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;