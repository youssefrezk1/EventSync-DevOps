// controllers/notificationPreferencesController.js
import { NotificationPreferences } from '../models/NotificationPreferences.js';

export async function getNotificationPreferences(req, res, next) {
  try {
    const userId = req.id;
    const userRole = req.role === 'student' ? 'Student' : 'Staff';

    let preferences = await NotificationPreferences.findOne({ 
      userId, 
      userRole 
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await NotificationPreferences.create({
        userId,
        userRole,
        notificationsEnabled: false,
        selectedGymClasses: [],
        selectedEventTypes: []
      });
    }

    res.json(preferences);
  } catch (err) {
    next(err);
  }
}

export async function updateNotificationPreferences(req, res, next) {
  try {
    const userId = req.id;
    const userRole = req.role === 'student' ? 'Student' : 'Staff';
    const { notificationsEnabled, selectedGymClasses, selectedEventTypes } = req.body;

    const preferences = await NotificationPreferences.findOneAndUpdate(
      { userId, userRole },
      {
        notificationsEnabled,
        selectedGymClasses,
        selectedEventTypes
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ 
      message: 'Notification preferences updated successfully',
      preferences 
    });
  } catch (err) {
    next(err);
  }
}