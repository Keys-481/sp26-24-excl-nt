/**
 * @file frontend/src/components/NotifButton.jsx
 * @description Provides a notification button to navigate to the notifications page
 */

import { Bell } from 'lucide-react';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApiClient } from "../lib/apiClient";


/**
 * NotifButton component displays a notification bell with unread count badge.
 * Clicking the button navigates to the notifications page.
 * @returns {JSX.Element} - The rendered notification button
 */
export default function NotifButton() {
    const navigate = useNavigate();
    const api = useApiClient();
    const [unreadCount, setUnreadCount] = useState(0);

    // Function to fetch unread notifications count from the API
    const fetchUnreadCount = async () => {
        try {
            console.log('Fetching unread notifications count...'); // Debug log
            const data = await api.get('/notifications'); // Adjust endpoint as necessary
            console.log('Fetched notifications:', data);
            const count = data.notifications.filter(n => !n.is_read).length;
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread notifications count:', error);
            if (error.response) {
                console.error('Response message:', error.response.message);
                console.error('Response stack:', error.response.stack);
            }
        }
    };

    // Set up periodic fetching of unread notifications count
    useEffect(() => {
        fetchUnreadCount();

        // Refresh every 5 seconds
        const interval = setInterval(fetchUnreadCount, 5000);
        return () => clearInterval(interval);
    }, [api]);

    // Expose a global function to update unread count (for testing/demo purposes)
    window.updateUnreadCount = (change) => {
        setUnreadCount((prev) => Math.max(0, prev + change));
    }

    // Render the notification button with badge
    return (
        <button
            className="notifications-button"
            onClick={() => navigate('/notifications')}
        >
            <Bell size={20} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>
    );
}