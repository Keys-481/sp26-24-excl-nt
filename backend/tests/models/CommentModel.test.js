/**
 * File: backend/tests/models/CommentModel.test.js
 * Unit tests for CommentModel
 */

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

// Silence console.error during tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => { });
});

// Restore console.error after tests
afterAll(() => {
  console.error.mockRestore();
});

/**
 * Tests for CommentModel
 */
describe('CommentModel', () => {

  // test for creating a new comment
  test('createComment inserts a new comment and returns it', async () => {
    const programId = 1; // OPWL MS
    const studentId = 1; // student 1: Alice Johnson
    const authorId = 2; // advisor 2: Jane Doe
    const commentText = 'This is a test comment.';

    const newComment = await CommentModel.createComment(programId, studentId, authorId, commentText);

    expect(newComment).toHaveProperty('comment_id');
    expect(newComment.program_id).toBe(programId);
    expect(newComment.student_id).toBe(studentId);
    expect(newComment.author_id).toBe(authorId);
    expect(newComment.comment_text).toBe(commentText.trim());
    expect(newComment).toHaveProperty('created_at');
  });

  // test for getting comments by program ID and student ID
  test('getCommentsByProgramId retrieves comments for a given program and student', async () => {
    const programId = 1; // OPWL MS
    const studentId = 1; // student 1: Alice Johnson

    // There is at least one comment in the seeds for this program and student
    const comments = await CommentModel.getCommentsByProgramAndStudent(programId, studentId);
    expect(Array.isArray(comments)).toBe(true);
    expect(comments.length).toBeGreaterThan(0);
    comments.forEach(comment => {
      expect(comment.program_id).toBe(programId);
      expect(comment.student_id).toBe(studentId);
      expect(comment).toHaveProperty('comment_id');
      expect(comment).toHaveProperty('author_id');
      expect(comment).toHaveProperty('comment_text');
      expect(comment).toHaveProperty('created_at');
    });
  });

  // test for deleting a comment by ID
  test('deleteCommentById deletes a comment by its ID', async () => {
    // First, create a new comment to delete
    const programId = 1;
    const studentId = 1;
    const authorId = 2;
    const commentText = 'Comment to be deleted.';

    const newComment = await CommentModel.createComment(programId, studentId, authorId, commentText);
    const commentId = newComment.comment_id;

    // delete comment and confirm deletion
    const deletedComment = await CommentModel.deleteCommentById(commentId);
    expect(deletedComment.comment_id).toBe(commentId);

    const comments = await CommentModel.getCommentsByProgramAndStudent(programId, studentId);
    expect(comments).not.toContainEqual(expect.objectContaining({ comment_id: commentId }));
  });

  // test for updating a comment by ID
  test('updateComment updates a comment by its ID', async () => {
    const programId = 1;
    const studentId = 1;
    const authorId = 2;
    const commentText = 'Original comment text.';

    const newComment = await CommentModel.createComment(programId, studentId, authorId, commentText);
    const commentId = newComment.comment_id;

    const updatedText = 'Updated comment text.';
    const updatedComment = await CommentModel.updateComment(commentId, updatedText);

    expect(updatedComment).toHaveProperty('comment_id', commentId);
    expect(updatedComment.comment_text).toBe(updatedText);
    expect(updatedComment).toHaveProperty('author_id', authorId);
    expect(updatedComment).toHaveProperty('program_id', programId);
  });
});

/**
 * Ensures createComment propagates errors when a DB insert fails.
 * @throws {Error} when insert query rejects
 */
test('createComment throws error when DB insert fails', async () => {
  const badProgramId = 9999;
  await expect(
    CommentModel.createComment(badProgramId, 1, 2, 'Bad comment')
  ).rejects.toThrow();
});

/**
 * Validates that getCommentsByProgramAndStudent returns an empty array
 * when no comments exist for the given program/student IDs.
 * @returns {Array} [] when no comments found
 */
test('getCommentsByProgramAndStudent returns empty array when no comments found', async () => {
  const comments = await CommentModel.getCommentsByProgramAndStudent(9999, 9999);
  expect(comments).toEqual([]);
});

/**
 * Ensures deleteCommentById returns undefined
 * when attempting to delete a non-existent comment.
 * @returns {undefined} if comment does not exist
 */
test('deleteCommentById returns undefined when comment does not exist', async () => {
  const deletedComment = await CommentModel.deleteCommentById(9999);
  expect(deletedComment).toBeUndefined();
});

/**
 * Ensures updateComment propagates an error
 * when the target comment cannot be found.
 * @throws {Error} "Comment not found"
 */
test('updateComment throws error when comment not found', async () => {
  await expect(
    CommentModel.updateComment(9999, 'No comment here')
  ).rejects.toThrow('Comment not found');
});

/**
 * Ensures updateComment propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('updateComment throws error on DB failure', async () => {
  jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB error'));
  await expect(
    CommentModel.updateComment(1, 'Fails')
  ).rejects.toThrow('DB error');
  pool.query.mockRestore();
});

/**
 * Ensures getCommentsByProgramAndStudent propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('getCommentsByProgramAndStudent handles DB error', async () => {
  jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB error'));

  await expect(
    CommentModel.getCommentsByProgramAndStudent(1, 1)
  ).rejects.toThrow('DB error');

  pool.query.mockRestore();
});

/**
 * Ensures deleteCommentById propagates database errors.
 * @throws {Error} when pool.query rejects
 */
test('deleteCommentById handles DB error', async () => {
  jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB error'));

  await expect(
    CommentModel.deleteCommentById(1)
  ).rejects.toThrow('DB error');

  pool.query.mockRestore();
});
