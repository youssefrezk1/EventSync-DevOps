import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from '../controllers/notificationController.js';
import { requireAuth } from '../middlewares/authMiddleware.js'; // Your auth middleware

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Get user's notifications
router.get('/', getMyNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark specific notification as read
router.patch('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:notificationId', deleteNotification);


export default router;