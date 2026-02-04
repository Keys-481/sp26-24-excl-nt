/**
 * File: frontend/src/pages/Notifications.jsx
 * Page component to display user notifications.
 */

import { Mail, MailOpen, Trash } from 'lucide-react';
import AccountingNavBar from '../components/NavBars/AccountingNavBar';
import AdminNavBar from '../components/NavBars/AdminNavBar';
import AdvisorNavBar from '../components/NavBars/AdvisorNavBar';
import StudentNavBar from '../components/NavBars/StudentNavBar';
import { useNavigate } from 'react-router-dom';

import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useApiClient } from '../lib/apiClient';

// Helper function to format notification messages
function formatNotification(notif) {
    if (notif.title === 'New Degree Plan Comment') {
        return `${notif.triggered_by_name} commented on ${notif.student_name}'s ${notif.program_name} degree plan`;
    } else if (notif.title === 'Updated Degree Plan Comment') {
        return `${notif.triggered_by_name} updated their comment on ${notif.student_name}'s ${notif.program_name} degree plan`;
    }
}

/**
 * Notifications page component.
 * @returns {JSX.Element} The rendered Notifications page.
 */
export default function Notifications() {
    const { user } = useAuth();
    const Navigate = useNavigate();
    const api = useApiClient();

    const [notifications, setNotifications] = useState([]);
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [clickedNotif, setClickedNotif] = useState(null);

    // Determine which NavBar to display based on user role
    let NavBarComponent = null;
    if (user?.default_view === 1) {
        NavBarComponent = AdminNavBar;
    } else if (user?.default_view === 2) {
        NavBarComponent = AdvisorNavBar;
    } else if (user?.default_view === 3) {
        NavBarComponent = StudentNavBar;
    } else if (user?.default_view === 4) {
        NavBarComponent = AccountingNavBar;
    }

    // get notifications for user on component mount
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await api.get(`/notifications`,
                    {
                        headers: {
                            'Cache-Control': 'no-cache',
                        }
                    }
                );
                setNotifications(data.notifications);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };

        fetchNotifications();
    }, [api]);

    // toggle selection of a notification
    const handleSelectNotif = (notifID) => {
        setSelectedNotifications((prev) =>
            prev.includes(notifID)
                ? prev.filter((id) => id !== notifID)
                : [...prev, notifID]
        );
    }

    // mark selected notifications as read
    const handleMarkSelectedRead = async () => {
        try {
            if (selectedNotifications.length === 0) return;

            // check if all selected are already read and toggle accordingly
            // if all are read, mark all as unread, else mark as read
            const allRead = selectedNotifications.every(
                (notifID) => notifications.find(notif => notif.notification_id === notifID)?.is_read
            )

            const newState = !allRead;

            await Promise.all(
                selectedNotifications.map((notifID) =>
                    api.put(`/notifications/${notifID}/read`, {
                        is_read: newState,
                    })
                )
            );

            // update local state
            setNotifications((prev) =>
                prev.map((notif) =>
                    selectedNotifications.includes(notif.notification_id)
                        ? { ...notif, is_read: newState }
                        : notif
                )
            );

            // update global unread count for notif button badge
            const change = newState
                ? -selectedNotifications.length
                : selectedNotifications.length;
            if (window.updateUnreadCount) {
                window.updateUnreadCount(change);
            }

        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    // delete selected notifications
    const handleDeleteSelected = async () => {
        try {
            if (selectedNotifications.length === 0) return;

            // make sure user confirms deletion
            if (!window.confirm('Are you sure you want to delete the selected notifications?')) {
                return;
            }

            await Promise.all(
                selectedNotifications.map((notifID) =>
                    api.del(`/notifications/${notifID}`)
                )
            );

            // update local state
            setNotifications((prev) =>
                prev.filter(
                    (notif) => !selectedNotifications.includes(notif.notification_id)
                )
            );

            // update global unread count for notif button badge
            const unreadDeleted = notifications.filter(
                (notif) =>
                    selectedNotifications.includes(notif.notification_id) && !notif.is_read
            ).length;

            if (unreadDeleted > 0 && window.updateUnreadCount) {
                window.updateUnreadCount(-unreadDeleted);
            }

            // clear selection
            setSelectedNotifications([]);
        } catch (error) {
            console.error('Error deleting notifications:', error);
        }
    }

    // Render the Notifications page
    return (
        <div>
            {/* Navigation Bar */}
            {NavBarComponent && <NavBarComponent />}
            <div className="window">
                <div className="title-bar">
                    <h1>Notifications</h1>
                </div>

                {/* Notifications List */}
                <div className="container">
                    <div className= "notifications-container">
                        {notifications.length === 0 ? (
                            <li className="no-notifs">You have no notifications.</li>
                        ) : (
                            <>
                                <table className="notif-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedNotifications(notifications.map(n => n.notification_id));
                                                        } else {
                                                            setSelectedNotifications([]);
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th>Notification</th>
                                            <th>Date</th>
                                            <th>
                                                <div className="notif-actions">
                                                    <button
                                                        className="mark-read-btn"
                                                        onClick={handleMarkSelectedRead}
                                                        disabled={selectedNotifications.length === 0}
                                                    >
                                                        {selectedNotifications.every(notifId =>
                                                            notifications.find(n => n.notification_id === notifId)?.is_read
                                                        ) ? <Mail className="icon" /> : <MailOpen className="icon" />}
                                                    </button>
                                                    <button
                                                        className="notif-delete-btn"
                                                        onClick={handleDeleteSelected}
                                                        disabled={selectedNotifications.length === 0}
                                                    >
                                                        <Trash className="icon" />
                                                    </button>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {notifications.map((notif) => (
                                            <tr key={notif.notification_id} className={`notif-row ${notif.is_read ? 'read' : 'unread'} clickable`} onClick={() => setClickedNotif(notif)}>
                                                <td className="notif-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedNotifications.includes(notif.notification_id)}
                                                        onChange={() => handleSelectNotif(notif.notification_id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </td>
                                                <td className="notif-main">{formatNotification(notif)}</td>
                                                <td className="notif-date">
                                                    {notif.created_at
                                                        ? new Date(notif.created_at).toLocaleString() : ''}
                                                </td>
                                                <td></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {clickedNotif && (
                                        <div className="notif-detail-panel">
                                            <div className="notif-detail-header">
                                                <h2>Notification Details</h2>
                                                <button onClick={() => setClickedNotif(null)}>Close</button>
                                            </div>

                                            <div className="notif-summary">
                                                {formatNotification(clickedNotif)}
                                            </div>

                                            {clickedNotif.comment_id && (
                                                <div>

                                                    <div className="notif-comment">
                                                        <h3>Comment:</h3>
                                                        <p>{clickedNotif.notif_message}</p>
                                                    </div>

                                                    <button
                                                        className="view-comment-btn"
                                                            onClick={() => {
                                                                if (user.default_view === 3) {
                                                                    Navigate('/student/degree-tracking', {
                                                                        state: {
                                                                            programId: clickedNotif.program_id
                                                                        }
                                                                    })
                                                                } else if (user.default_view === 2) {
                                                                    Navigate('/advisor/advising', {
                                                                        state: {
                                                                            schoolStudentId: clickedNotif.school_student_id,
                                                                            programId: clickedNotif.program_id
                                                                        }
                                                                    })
                                                                }
                                                            }}
                                                        >
                                                            View Comment on Degree Plan
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

