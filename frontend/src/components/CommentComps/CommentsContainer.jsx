/**
 * File: frontend/src/components/CommentsComps/CommentsContainer.jsx
 * Container component for displaying and adding comments related to a degree plan.
 */

import { useEffect, useState } from 'react';
import { useApiClient } from '../../lib/apiClient.js';
import CommentForm from './CommentForm.jsx';
import CommentItem from './CommentItem.jsx';

/**
 * CommentsContainer component for displaying and adding comments.
 * @param {*} param0 - Props containing studentSchoolId and programId.
 * @returns {JSX.Element} The rendered CommentsContainer component.
 */
export default function CommentsContainer({ studentSchoolId, programId, userIsStudent=false, className='' }) {

    const api = useApiClient();
    const [ comments, setComments ] = useState([]);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState('');
    const [ openMenuId, setOpenMenuId ] = useState(null);

    // fetch comments when studentSchoolId or programId changes
    useEffect(() => {
        if (!studentSchoolId || !programId) return;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const data = await api.get(`/comments?programId=${encodeURIComponent(programId)}&studentSchoolId=${encodeURIComponent(studentSchoolId)}`);
                setComments(data);
                console.log('Fetched comments:', data);
            } catch (error) {
                console.error('Error fetching comments:', error);
                setError('Failed to load comments');
            } finally {
                setLoading(false);
            }
        })();
    }, [studentSchoolId, programId, api]);

    // handle posting a new comment
    const handleCommentAdded = (newComment) => {
        setComments((prevComments) => [newComment, ...prevComments]);
    }

    if (!studentSchoolId || !programId) {
        return (
            <div className={`comments-container ${className}`}>
                <h4>Comments</h4>
                <p style={{ padding: "10px", opacity: 0.7 }}>
                    No program selected.
                </p>
            </div>
        )
    }

    // Render loading or error states
    if (loading) return <p>Loading comments...</p>;
    if (error) return <p className="error-message">Error: {error}</p>;

    // Render comments list and comment form
    return (
        <div className={`comments-container ${className}`}>
            {/* Comments Header */}
            <h4>Comments</h4>
            <div className="comment-form-wrapper">
                <CommentForm
                    studentSchoolId={studentSchoolId}
                    programId={programId}
                    onCommentPosted={handleCommentAdded}
                />
            </div>
            {/* Comments List */}
            <ul className="comments-list">
                {comments.length === 0 ? (
                    <li className="no-comments">No comments yet.</li>
                ) : (
                    comments.map((comment) => (
                        <CommentItem
                            key={comment.comment_id}
                            comment={comment}
                            userIsStudent={userIsStudent}
                            setComments={setComments}
                            openMenuId={openMenuId}
                            setOpenMenuId={setOpenMenuId}
                        />
                    ))
                )}
            </ul>
        </div>
    )
}