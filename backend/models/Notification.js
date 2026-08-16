import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // Recipient information (one of these will be populated)
    recipientType: {
      type: String,
      enum: ['Student', 'Staff', 'EventOffice', 'Admin', 'All'],
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'recipientType',
      required: function() {
        return this.recipientType !== 'All';
      }
    },

    // Notification content
    type: {
      type: String,
      enum: [
        'workshop_request',
        'workshop_status',
        'new_event',
        'event_reminder',
        'new_partner',
        'vendor_request'
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },

    // Related entity (optional - for linking back to the source)
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['Workshop', 'Bazaar', 'Trip', 'Confrence', 'RegisterBooth', 'RegisterBazaar', 'Wir', 'GymClass'],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },

    // Metadata
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
notificationSchema.index({ recipientType: 1, recipientId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);