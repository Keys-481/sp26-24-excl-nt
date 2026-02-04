/**
 * File: frontend/src/components/CommentComps/CommentItem.jsx
 * CommentItem component for displaying a single comment and handleing its menu actions.
 */

import { Ellipsis } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { useApiClient } from '../../lib/apiClient';

/**
 * CommentItem component for displaying a single comment.
 * @param {*} param0 - Props containing the comment object.
 * @returns {JSX.Element} The rendered CommentItem component.
 */
export default function CommentItem({ comment, userIsStudent=false, setComments, openMenuId, setOpenMenuId }) {
    if (!comment || !comment.comment_id || !setComments) return null;

    // initialize api client and auth user
    const api = useApiClient();
    const { user } = useAuth();
    
    // derive author handle and permissions
    const authorHandle = `@${comment.first_name}_${comment.last_name}`;
    const canDelete = !userIsStudent || userIsStudent && String(comment.author_id) === String(user?.id);
    const canEdit = String(comment.author_id) === String(user?.id);

    // state for editing mode
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.comment_text);

    // handle menu toggle
    const toggleMenu = () => {
        setOpenMenuId(openMenuId === comment.comment_id ? null : comment.comment_id);
    };

    // check if menu is open
    const isMenuOpen = openMenuId === comment.comment_id;

    // close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event) => { 
            if (!event.target.closest('.comment-menu-btn')) {
                if (!event.target.closest(`#comment-menu-btn-${comment.comment_id}`)) {
                    setOpenMenuId(null);
                }
            };
        };
        // Attach event listener to handle clicks outside the menu
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [comment.comment_id, setOpenMenuId]);

    // handle delete comment
    const handleDelete = (deletedCommentId) => {
        const confirm = window.confirm('Are you sure you want to delete this comment?');
        if (!confirm) return;

        (async () => {
            try {
                await api.del(`/comments/${deletedCommentId}`);
            } catch (error) {
                console.error('Error deleting comment:', error);
                alert('Error deleting comment: ' + (error?.message || 'Unknown error'));
            }
        })();
        setComments((prevComments) => prevComments.filter(comment => comment.comment_id !== deletedCommentId));
    };

    // handle edit comment
    const handleEdit = () => {
        setIsEditing(true);
        setOpenMenuId(null);
    }

    // update comment with new text
    const handleSaveEdit = async () => {
        try {
            const updatedComment = await api.put(`/comments/${comment.comment_id}`, { newText: editText });
            setComments((prevComments) => prevComments.map(c => c.comment_id === comment.comment_id ? updatedComment : c));
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving comment edit:', error);
            alert('Error saving comment edit: ' + (error?.message || 'Unknown error'));
        }
    }

    // cancel edit mode
    const handleCancelEdit = () => {
        setEditText(comment.comment_text);
        setIsEditing(false);
    }

    // render comment item
    return (
        <li className="comment-item">
            {/* Comment Header with Author and Menu Button */}
            <div className="comment-header">
                <span className="comment-author">{authorHandle}</span>
                <button className="comment-menu-btn" id={`comment-menu-btn-${comment.comment_id}`} onClick={toggleMenu}>
                    <Ellipsis />
                </button>
            </div>

            {/* Comment Text or Edit Area */}
            {isEditing ? (
                <div className="comment-edit">
                    <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="comment-edit-textarea"
                    />
                    <div className="edit-comment-actions">
                        <button onClick={handleSaveEdit} disabled={editText.trim() === ''}>Save</button>
                        <button onClick={handleCancelEdit}>Cancel</button>
                    </div>
                </div>
            ) : (
                <span className="comment-text">{comment.comment_text}</span>
            )}

            <br />
            {comment.created_at && (
                <span className="comment-timestamp">
                    {new Date(comment.created_at).toLocaleString()}
                </span>
            )}

            {isMenuOpen && (
                <ul className="comment-menu">
                    <li>
                        <button onClick={handleEdit} id={`comment-menu-${comment.comment_id}`} disabled={!canEdit}>Edit</button>
                    </li>
                    <li>
                        <button onClick={() => handleDelete(comment.comment_id)} id={`comment-menu-${comment.comment_id}`} disabled={!canDelete}>Delete</button>
                    </li>
                </ul>
            )}
        </li>
    );
}