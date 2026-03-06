/**
 * File: frontend/src/components/CommentsComps/CommentsContainer.jsx
 * Container component for displaying and adding comments related to a degree plan.
 */

import { useEffect, useState } from 'react';
import { useApiClient } from '../../lib/apiClient.js';
import CommentForm from './CommentForm.jsx';
import CommentItem from './CommentItem.jsx';
import ErrorMessage from '../ErrorMessage.jsx';
import { Maximize2, Minimize2, MessageCircle, X } from "lucide-react";



/**
 * CommentsContainer component for displaying and adding comments.
 * @param {*} param0 - Props containing studentSchoolId and programId.
 * @returns {JSX.Element} The rendered CommentsContainer component.
 */
export default function CommentsContainer({ studentSchoolId, programId, userIsStudent = false, className='' }) {

    const api = useApiClient();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [modalState, setModalState] = useState('closed');


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

    // Render modal for the comments
    return (
        <>
            {/* Shows the comment icon when modal is closed */}
            {modalState === 'closed' && (
                <button className="comments-fab" onClick={() => setModalState('open')}>
                    <MessageCircle size={18} />
                </button>
            )}

            {/* Deals with minimizing/maximizing modal */}
            {modalState !== 'closed' && (
                <div className={`modal-container ${modalState}`}>
                    <div
                        className="modal-header"
                        onClick={() => setModalState(modalState === 'open' ? 'minimized' : 'open')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }} ><MessageCircle size={18}/> Comments</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setModalState(modalState === 'open' ? 'minimized' : 'open'); }}
                                title={modalState === 'open' ? 'Minimize' : 'Expand'}>
                                {modalState === 'open' ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setModalState('closed'); }}
                                title="Close"
                            >
                                <X size={18}/>
                            </button>
                        </div>
                    </div>

                    {/* Deals with loading comments into comment modal */}
                    {modalState === 'open' && (
                        <div className="modal-body">
                            {!studentSchoolId || !programId ? (
                                <p style={{ opacity: 0.7 }}>No program selected.</p>
                            ) : loading ? (
                                <p>Loading comments...</p>
                            ) : error ? (
                                <ErrorMessage message={error} />
                            ) : (
                                <>
                                    <CommentForm
                                        studentSchoolId={studentSchoolId}
                                        programId={programId}
                                        onCommentPosted={handleCommentAdded}
                                    />
                                    {/* Comments List */}
                                    <ul className="comments-list">
                                        {comments.length === 0 ? (<li className="no-comments">No comments yet.</li>) : (
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
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}