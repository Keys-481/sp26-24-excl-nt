/**
 * File: backend/src/routes/notifications.js
 * Routes for handling notifications.
 */

const express = require('express');
const router = express.Router();
const NotificationsModel = require('../models/NotificationsModel');

/**
 * route GET /notifications
 * Retrieves all notifications for a specific user
 */
router.get('/', async (req, res) => {
    if (!req.user || !req.user.user_id) {
        return res.status(401).json({ message: 'Unauthorized: User ID is required' });
    }

    // Get user ID from authenticated request
    const currentUserId = req.user.user_id;

    try {
        const notifications = await NotificationsModel.getNotificationsForUser(currentUserId); // Fetch notifications from model
        return res.status(200).json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        console.error(error.stack);
        return res.status(500).json({ message: 'Internal server error', stack: error.stack });
    }
});

/**
 * route PUT /notifications/:id/read
 * Marks a specific notification as read
 */
router.put('/:id/read', async (req, res) => {
    if (!req.user || !req.user.user_id) {
        return res.status(401).json({ message: 'Unauthorized: User ID is required' });
    }

    // Get notification ID from URL parameters
    const notificationId = req.params.id;
    const { is_read } = req.body;

    if (typeof is_read !== 'boolean') {
        return res.status(400).json({ message: 'is_read boolean is required in request body' }); // Validate is_read parameter
    }

    try {
        const result = await NotificationsModel.markNotificationReadState(notificationId, is_read);

        // Check if notification was found and updated
        if (!result) {
            return res.status(404).json({ message: 'Notification not found or does not authorized' });
        }
        return res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * route DELETE /notifications/:id
 * Deletes a specific notification
 */
router.delete('/:id', async (req, res) => {
    if (!req.user || !req.user.user_id) {
        return res.status(401).json({ message: 'Unauthorized: User ID is required' });
    }

    // Get notification ID from URL parameters
    const notificationId = req.params.id;

    try {
        const result = await NotificationsModel.deleteNotification(notificationId);

        if (!result) {
            return res.status(404).json({ message: 'Notification not found or not authorized' }); // Check if notification was found and deleted
        }
        return res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;