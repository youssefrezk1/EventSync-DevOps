// models/NotificationPreferences.js
import mongoose from 'mongoose';

const NotificationPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userRole'
  },
  userRole: {
    type: String,
    required: true,
    enum: ['Student', 'Staff']
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  selectedGymClasses: [{
    type: String,
    enum: ['Yoga', 'Zumba', 'Kick-boxing', 'Pilates', 'Aerobics', 'Cross Circuit']
  }],
  selectedEventTypes: [{
    type: String,
    enum: ['Workshops', 'Trips', 'Bazaars', 'Conferences', 'Booths']
  }]
}, {
  timestamps: true
});

// Ensure one preference document per user
NotificationPreferencesSchema.index({ userId: 1, userRole: 1 }, { unique: true });

export const NotificationPreferences = mongoose.model('NotificationPreferences', NotificationPreferencesSchema);