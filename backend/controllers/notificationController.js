import { Notification } from '../models/Notification.js';
import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';
import { EventOffice } from '../models/EventOffice.js';
import { Admin } from '../models/Admin.js';
import { RegisterTrip } from '../models/RegisterTrip.js';
import { RegisterWorkshop } from '../models/RegisterWorkshop.js';
import { Vendor } from '../models/Vendor.js';
import { RegisterBazaar } from '../models/RegisterBazaar.js';


// ===== HELPER FUNCTIONS =====

// Create notification for a specific user
export const createNotification = async (recipientType, recipientId, type, title, message, relatedEntity = null) => {
  try {
    console.log('Creating notification:', { recipientType, recipientId, type, title });
    const notification = await Notification.create({
      recipientType,
      recipientId,
      type,
      title,
      message,
      relatedEntity,
    });
    console.log('✅ Notification created:', notification._id);
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

// Create notifications for all users of specific types
export const createNotificationsForAll = async (userTypes, type, title, message, relatedEntity = null) => {
  try {
    console.log('📢 Creating notifications for user types:', userTypes);
    const notifications = [];
    
    for (const userType of userTypes) {
      let users = [];
      
      console.log(`Fetching ${userType} users...`);
      
      switch (userType) {
        case 'Student':
          users = await Student.find({ status: 'Active', isVerified: true }).select('_id').lean();
          console.log(`Found ${users.length} active students`);
          break;
        case 'Staff':
          users = await Staff.find({ 
            status: 'Active', 
            isVerified: true, 
            isPending: 'Confirmed',
            role: 'Staff' 
          }).select('_id').lean();
          console.log(`Found ${users.length} active staff`);
          break;
        case 'TA':
          users = await Staff.find({ 
            status: 'Active', 
            isVerified: true, 
            isPending: 'Confirmed',
            role: 'TA'
          }).select('_id').lean();
          console.log(`Found ${users.length} active TAs`);
          break;
        case 'Professor':
          users = await Staff.find({ 
            status: 'Active', 
            isVerified: true, 
            isPending: 'Confirmed',
            role: 'Professor'
          }).select('_id').lean();
          console.log(`Found ${users.length} active professors`);
          break;
        case 'EventOffice':
          users = await EventOffice.find({ status: 'Active' }).select('_id').lean();
          console.log(`Found ${users.length} active event office users`);
          break;
        case 'Admin':
          users = await Admin.find({ status: 'Active' }).select('_id').lean();
          console.log(`Found ${users.length} active admins`);
          break;
      }

      for (const user of users) {
        // Map userType to valid recipientType enum values
        const recipientType = (userType === 'TA' || userType === 'Professor') ? 'Staff' : userType;
        
        notifications.push({
          recipientType,
          recipientId: user._id,
          type,
          title,
          message,
          relatedEntity,
        });
      }
    }

    console.log(`💾 Inserting ${notifications.length} notifications...`);
    
    if (notifications.length > 0) {
      const result = await Notification.insertMany(notifications);
      console.log(`✅ Successfully created ${result.length} notifications`);
      return result.length;
    } else {
      console.log('⚠️ No users found to notify');
      return 0;
    }
    
  } catch (error) {
    console.error('❌ Error creating bulk notifications:', error);
    throw error;
  }
};

// ===== ROUTE HANDLERS =====

// Helper function to check and create reminders for a specific user
const checkAndCreateRemindersForUser = async (userId, userType) => {
  try {
    console.log('🔍 Starting reminder check for user:', userId, 'type:', userType);
    
    const now = new Date();
    const mongoose = await import('mongoose');
    const objectIdUserId = new mongoose.default.Types.ObjectId(userId);

    // ===== FOR STUDENTS AND STAFF: Check Workshops and Trips =====
    if (userType === 'Student' || userType === 'Staff') {
      // ✅ GET THE CUSTOM ID (not MongoDB _id)
      let customUserId;
      if (userType === 'Student') {
        const student = await Student.findById(objectIdUserId).select('studentId').lean();
        customUserId = student?.studentId;
        console.log('📝 Found student custom ID:', customUserId);
      } else {
        const staff = await Staff.findById(objectIdUserId).select('staffId').lean();
        customUserId = staff?.staffId;
        console.log('📝 Found staff custom ID:', customUserId);
      }

      if (!customUserId) {
        console.log('⚠️ Could not find custom ID for user');
        return;
      }

      // Check Workshop registrations
      console.log('📚 Checking workshop registrations...');
      const workshopRegs = await RegisterWorkshop.find({
        [userType === 'Student' ? 'StudentID' : 'StaffID']: customUserId,
      }).populate('WorkshopName').lean();

      console.log(`Found ${workshopRegs.length} workshop registrations`);

      for (const reg of workshopRegs) {
        const workshop = reg.WorkshopName;
        console.log('Checking workshop:', workshop?.name, 'status:', workshop?.status);
        
        if (!workshop || workshop.isArchived || workshop.status !== 'confirmed') {
          console.log('⚠️ Workshop not eligible for reminder');
          continue;
        }
        
        const eventStart = new Date(workshop.start);
        const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);
        
        console.log(`⏰ Workshop "${workshop.name}" starts in ${hoursUntilEvent.toFixed(2)} hours`);

        if (hoursUntilEvent < 0) {
          console.log('⚠️ Event has already passed');
          continue;
        }

        // 24-hour reminder
        if (hoursUntilEvent < 24) {
          const existingReminder = await Notification.findOne({
            recipientType: userType,
            recipientId: objectIdUserId,
            type: 'event_reminder',
            'relatedEntity.entityType': 'Workshop',
            'relatedEntity.entityId': workshop._id,
            message: { $regex: '1 day' }
          });

          if (!existingReminder) {
            console.log('🔔 Creating 24-hour reminder notification...');
            await createNotification(
              userType,
              objectIdUserId,
              'event_reminder',
              'Upcoming Workshop Reminder',
              `Reminder: "${workshop.name}" is starting in less than 1 day!`,
              { entityType: 'Workshop', entityId: workshop._id }
            );
            console.log('✅ 24-hour reminder created!');
          }
        }

        // 1-hour reminder
        if (hoursUntilEvent < 1) {
          const existingReminder = await Notification.findOne({
            recipientType: userType,
            recipientId: objectIdUserId,
            type: 'event_reminder',
            'relatedEntity.entityType': 'Workshop',
            'relatedEntity.entityId': workshop._id,
            message: { $regex: '1 hour' }
          });

          if (!existingReminder) {
            console.log('🔔 Creating 1-hour reminder notification...');
            await createNotification(
              userType,
              objectIdUserId,
              'event_reminder',
              'Upcoming Workshop Reminder',
              `Reminder: "${workshop.name}" is starting in less than 1 hour!`,
              { entityType: 'Workshop', entityId: workshop._id }
            );
            console.log('✅ 1-hour reminder created!');
          }
        }
      }

      // Check Trip registrations
      console.log('🚌 Checking trip registrations...');
      const tripRegs = await RegisterTrip.find({
        [userType === 'Student' ? 'StudentID' : 'StaffID']: customUserId,
      }).populate('TripName').lean();

      console.log(`Found ${tripRegs.length} trip registrations`);

      for (const reg of tripRegs) {
        const trip = reg.TripName;
        console.log('Checking trip:', trip?.name);
        
        if (!trip || trip.isArchived) {
          console.log('⚠️ Trip not eligible for reminder');
          continue;
        }
        
        const eventStart = new Date(trip.start);
        const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);
        
        console.log(`⏰ Trip "${trip.name}" starts in ${hoursUntilEvent.toFixed(2)} hours`);

        if (hoursUntilEvent < 0) {
          console.log('⚠️ Event has already passed');
          continue;
        }

        // 24-hour reminder
        if (hoursUntilEvent < 24) {
          const existingReminder = await Notification.findOne({
            recipientType: userType,
            recipientId: objectIdUserId,
            type: 'event_reminder',
            'relatedEntity.entityType': 'Trip',
            'relatedEntity.entityId': trip._id,
            message: { $regex: '1 day' }
          });

          if (!existingReminder) {
            console.log('🔔 Creating 24-hour reminder notification...');
            await createNotification(
              userType,
              objectIdUserId,
              'event_reminder',
              'Upcoming Trip Reminder',
              `Reminder: "${trip.name}" is starting in less than 1 day!`,
              { entityType: 'Trip', entityId: trip._id }
            );
            console.log('✅ 24-hour reminder created!');
          }
        }

        // 1-hour reminder
        if (hoursUntilEvent < 1) {
          const existingReminder = await Notification.findOne({
            recipientType: userType,
            recipientId: objectIdUserId,
            type: 'event_reminder',
            'relatedEntity.entityType': 'Trip',
            'relatedEntity.entityId': trip._id,
            message: { $regex: '1 hour' }
          });

          if (!existingReminder) {
            console.log('🔔 Creating 1-hour reminder notification...');
            await createNotification(
              userType,
              objectIdUserId,
              'event_reminder',
              'Upcoming Trip Reminder',
              `Reminder: "${trip.name}" is starting in less than 1 hour!`,
              { entityType: 'Trip', entityId: trip._id }
            );
            console.log('✅ 1-hour reminder created!');
          }
        }
      }
    }

    // ===== FOR VENDORS: Check Bazaars and Booths =====
    if (userType === 'Vendor') {
      console.log('🏪 Checking vendor bazaar registrations...');
      
      // Check Bazaar registrations
      const bazaarRegs = await RegisterBazaar.find({
        VendorName: objectIdUserId,
        Pending: 'Accept', // Only accepted registrations
      }).populate('BazaarName').lean();

      console.log(`Found ${bazaarRegs.length} bazaar registrations`);

      for (const reg of bazaarRegs) {
        const bazaar = reg.BazaarName;
        console.log('Checking bazaar:', bazaar?.name);
        
        if (!bazaar || bazaar.isArchived) {
          console.log('⚠️ Bazaar not eligible for reminder');
          continue;
        }
        
        const eventStart = new Date(bazaar.start);
        const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);
        
        console.log(`⏰ Bazaar "${bazaar.name}" starts in ${hoursUntilEvent.toFixed(2)} hours`);

        if (hoursUntilEvent < 0) {
          console.log('⚠️ Event has already passed');
          continue;
        }

        // 24-hour reminder
        if (hoursUntilEvent < 24) {
          const existingReminder = await Notification.findOne({
            recipientType: 'Vendor',
            recipientId: objectIdUserId,
            type: 'event_reminder',
            'relatedEntity.entityType': 'Bazaar',
            'relatedEntity.entityId': bazaar._id,
            message: { $regex: '1 day' }
          });

          if (!existingReminder) {
            console.log('🔔 Creating 24-hour reminder notification...');
            await createNotification(
              'Vendor',
              objectIdUserId,
              'event_reminder',
              'Upcoming Bazaar Reminder',
              `Reminder: Bazaar "${bazaar.name}" is starting in less than 1 day!`,
              { entityType: 'Bazaar', entityId: bazaar._id }
            );
            console.log('✅ 24-hour reminder created!');
          }
        }

        // 1-hour reminder
        if (hoursUntilEvent < 1) {
          const existingReminder = await Notification.findOne({
            recipientType: 'Vendor',
            recipientId: objectIdUserId,
            type: 'event_reminder',
            'relatedEntity.entityType': 'Bazaar',
            'relatedEntity.entityId': bazaar._id,
            message: { $regex: '1 hour' }
          });

          if (!existingReminder) {
            console.log('🔔 Creating 1-hour reminder notification...');
            await createNotification(
              'Vendor',
              objectIdUserId,
              'event_reminder',
              'Upcoming Bazaar Reminder',
              `Reminder: Bazaar "${bazaar.name}" is starting in less than 1 hour!`,
              { entityType: 'Bazaar', entityId: bazaar._id }
            );
            console.log('✅ 1-hour reminder created!');
          }
        }
      }

      // Check Booth registrations
      console.log('🎪 Checking vendor booth registrations...');
      
      const boothRegs = await RegisterBooth.find({
        VendorID: objectIdUserId,
        Pending: 'Accept', // Only accepted registrations
      }).lean();

      console.log(`Found ${boothRegs.length} booth registrations`);

      for (const booth of boothRegs) {
        console.log('Checking booth at location:', booth.Location);
        
        if (booth.isArchived) {
          console.log('⚠️ Booth is archived');
          continue;
        }
        
        const eventStart = new Date(booth.StartDate);
        const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);
        
        console.log(`⏰ Booth at "${booth.Location}" starts in ${hoursUntilEvent.toFixed(2)} hours`);

        if (hoursUntilEvent < 0) {
          console.log('⚠️ Event has already passed');
          continue;
        }

        // 24-hour reminder
        if (hoursUntilEvent < 24) {
          const existingReminder = await Notification.findOne({
            recipientType: 'Vendor',
            recipientId: objectIdUserId,
            type: 'event_reminder',
            'relatedEntity.entityType': 'RegisterBooth',
            'relatedEntity.entityId': booth._id,
            message: { $regex: '1 day' }
          });

          if (!existingReminder) {
            console.log('🔔 Creating 24-hour reminder notification...');
            await createNotification(
              'Vendor',
              objectIdUserId,
              'event_reminder',
              'Upcoming Booth Reminder',
              `Reminder: Your booth at "${booth.Location}" is starting in less than 1 day!`,
              { entityType: 'RegisterBooth', entityId: booth._id }
            );
            console.log('✅ 24-hour reminder created!');
          }
        }

        // 1-hour reminder
        if (hoursUntilEvent < 1) {
          const existingReminder = await Notification.findOne({
            recipientType: 'Vendor',
            recipientId: objectIdUserId,
            type: 'event_reminder',
            'relatedEntity.entityType': 'RegisterBooth',
            'relatedEntity.entityId': booth._id,
            message: { $regex: '1 hour' }
          });

          if (!existingReminder) {
            console.log('🔔 Creating 1-hour reminder notification...');
            await createNotification(
              'Vendor',
              objectIdUserId,
              'event_reminder',
              'Upcoming Booth Reminder',
              `Reminder: Your booth at "${booth.Location}" is starting in less than 1 hour!`,
              { entityType: 'RegisterBooth', entityId: booth._id }
            );
            console.log('✅ 1-hour reminder created!');
          }
        }
      }
    }

    console.log(`✅ Finished reminder check for user ${userId}`);
  } catch (error) {
    console.error('❌ Error checking reminders:', error);
  }
};

// Get notifications for logged-in user
export const getMyNotifications = async (req, res) => {
  try {
    // ✅ Adapt to existing auth middleware format
    const userId = req.id || req.user._id || req.user.id;
    const role = req.role;
    
    // Map role to userType (notification model format)
    let userType;
    switch (role) {
      case 'student':
        userType = 'Student';
        break;
      case 'Staff':
      case 'Professor':
      case 'TA':
        userType = 'Staff';
        break;
      case 'admin':
        userType = 'Admin';
        break;
      case 'event-office':
        userType = 'EventOffice';
        break;
      case 'vendor':
        userType = 'Vendor';
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid user role' });
    }

    // ✅ CHECK FOR UPCOMING EVENT REMINDERS BEFORE FETCHING NOTIFICATIONS
    await checkAndCreateRemindersForUser(userId, userType);

    const notifications = await Notification.find({
      recipientType: userType,
      recipientId: userId,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount: notifications.filter(n => !n.isRead).length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.id || req.user._id || req.user.id;
    const role = req.role;
    
    console.log('🔍 Mark as read - userId:', userId, 'notificationId:', notificationId, 'role:', role);
    
    // Map role to userType
    let userType;
    switch (role) {
      case 'student': userType = 'Student'; break;
      case 'Staff':
      case 'Professor':
      case 'TA': userType = 'Staff'; break;
      case 'admin': userType = 'Admin'; break;
      case 'event-office': userType = 'EventOffice'; break;
      case 'vendor': userType = 'Vendor'; break;
      default: return res.status(400).json({ success: false, message: 'Invalid user role' });
    }

    // Convert to ObjectId if needed
    const mongoose = await import('mongoose');
    const objectIdUserId = new mongoose.default.Types.ObjectId(userId);

    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId,
        recipientId: objectIdUserId,
        recipientType: userType,
      },
      { 
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );

    console.log('🔍 Found notification:', !!notification);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('❌ Error marking as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message,
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.id || req.user._id || req.user.id;
    const role = req.role;
    
    // Map role to userType
    let userType;
    switch (role) {
      case 'student': userType = 'Student'; break;
      case 'Staff':
      case 'Professor':
      case 'TA': userType = 'Staff'; break;
      case 'admin': userType = 'Admin'; break;
      case 'event-office': userType = 'EventOffice'; break;
      case 'vendor': userType = 'Vendor'; break;
      default: return res.status(400).json({ success: false, message: 'Invalid user role' });
    }

    await Notification.updateMany(
      { 
        recipientId: userId,
        recipientType: userType,
        isRead: false,
      },
      { 
        isRead: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: error.message,
    });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.id || req.user._id || req.user.id;
    const role = req.role;
    
    console.log('🔍 Delete - userId:', userId, 'notificationId:', notificationId, 'role:', role);
    
    // Map role to userType
    let userType;
    switch (role) {
      case 'student': userType = 'Student'; break;
      case 'Staff':
      case 'Professor':
      case 'TA': userType = 'Staff'; break;
      case 'admin': userType = 'Admin'; break;
      case 'event-office': userType = 'EventOffice'; break;
      case 'vendor': userType = 'Vendor'; break;
      default: return res.status(400).json({ success: false, message: 'Invalid user role' });
    }

    // Convert to ObjectId if needed
    const mongoose = await import('mongoose');
    const objectIdUserId = new mongoose.default.Types.ObjectId(userId);

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipientId: objectIdUserId,
      recipientType: userType,
    });

    console.log('🔍 Found and deleted notification:', !!notification);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('❌ Error deleting:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message,
    });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.id || req.user._id || req.user.id;
    const role = req.role;
    
    // Map role to userType
    let userType;
    switch (role) {
      case 'student': userType = 'Student'; break;
      case 'Staff':
      case 'Professor':
      case 'TA': userType = 'Staff'; break;
      case 'admin': userType = 'Admin'; break;
      case 'event-office': userType = 'EventOffice'; break;
      case 'vendor': userType = 'Vendor'; break;
      default: return res.status(400).json({ success: false, message: 'Invalid user role' });
    }

    const count = await Notification.countDocuments({
      recipientId: userId,
      recipientType: userType,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
      error: error.message,
    });
  }
};

// ===== NOTIFICATION TRIGGER FUNCTIONS =====

// 1. Workshop request submitted
export const notifyWorkshopRequest = async (workshop) => {
  try {
    console.log('🔔 notifyWorkshopRequest called for workshop:', workshop.name);
    const count = await createNotificationsForAll(
      ['EventOffice'],
      'workshop_request',
      'New Workshop Request',
      `A new workshop "${workshop.name}" has been submitted by a professor and requires review.`,
      { entityType: 'Workshop', entityId: workshop._id }
    );
    console.log(`✅ Workshop request notifications created: ${count}`);
    return count;
  } catch (error) {
    console.error('❌ Error sending workshop request notification:', error);
    throw error;
  }
};

// 2. Workshop status changed
export const notifyWorkshopStatus = async (workshop, status) => {
  try {
    const statusText = status === 'confirmed' ? 'accepted' : 'rejected';
    await createNotification(
      'Staff',
      workshop.ProfCreator,
      'workshop_status',
      `Workshop ${statusText}`,
      `Your workshop "${workshop.name}" has been ${statusText}.${workshop.requestChange ? ` Feedback: ${workshop.requestChange}` : ''}`,
      { entityType: 'Workshop', entityId: workshop._id }
    );
  } catch (error) {
    console.error('Error sending workshop status notification:', error);
  }
};

// 3. New event added
export const notifyNewEvent = async (eventType, event) => {
  try {
    const eventNames = {
      'Bazaar': event.name,
      'Trip': event.name,
      'Workshop': event.name,
      'Confrence': event.name,
      'RegisterBooth': `New Booth at ${event.Location}`,
    };

    let targetRoles = [];

    // Determine which roles should receive notifications based on event type
    if (eventType === 'Trip' || eventType === 'Bazaar' || eventType === 'Confrence') {
      // For trips, bazaars, and conferences: use restrictedTo field
      if (event.restrictedTo && event.restrictedTo.length > 0) {
        targetRoles = [...event.restrictedTo];
      } else {
        // If restrictedTo is empty, send to everyone
        targetRoles = ['Student', 'Staff', 'TA', 'Professor'];
      }
      // Always include EventOffice
      targetRoles.push('EventOffice');
    } else if (eventType === 'Workshop' || eventType === 'RegisterBooth') {
      // For workshops and booths: always send to everyone
      targetRoles = ['Student', 'Staff', 'TA', 'Professor', 'EventOffice'];
    } else {
      // Default fallback for any other event types
      targetRoles = ['Student', 'Staff', 'TA', 'Professor', 'EventOffice'];
    }

    // Remove duplicates (in case EventOffice was already in restrictedTo)
    targetRoles = [...new Set(targetRoles)];

    console.log(`📢 Sending ${eventType} notification to roles:`, targetRoles);

    await createNotificationsForAll(
      targetRoles,
      'new_event',
      `New ${eventType} Available`,
      `Check out the new ${eventType.toLowerCase()}: "${eventNames[eventType]}"`,
      { entityType: eventType, entityId: event._id }
    );
  } catch (error) {
    console.error('Error sending new event notification:', error);
  }
};

// 4. Event reminder (called by scheduled job)
export const sendEventReminders = async (event, eventType, timeframe) => {
  try {
    let registrations = [];
    
    if (eventType === 'Trip') {
      registrations = await RegisterTrip.find({ TripName: event._id });
    } else if (eventType === 'Workshop') {
      registrations = await RegisterWorkshop.find({ WorkshopName: event._id });
    } else if (eventType === 'GymClass') {
      registrations = [
        ...event.studentParticipants.map(id => ({ StudentID: id })),
        ...event.staffParticipants.map(id => ({ StaffID: id })),
      ];
    } else if (eventType === 'Bazaar') {
      return;
    }

    for (const reg of registrations) {
      const recipientType = reg.StudentID ? 'Student' : 'Staff';
      const recipientId = reg.StudentID || reg.StaffID;

      if (!recipientId) continue;

      if (recipientType === 'Staff') {
        const staffMember = await Staff.findById(recipientId);
        if (!staffMember || !staffMember.role || staffMember.role === 'Not yet') {
          continue;
        }
      }

      await createNotification(
        recipientType,
        recipientId,
        'event_reminder',
        `Upcoming Event Reminder`,
        `Reminder: "${event.name || event.type}" is starting in ${timeframe}!`,
        { entityType: eventType, entityId: event._id }
      );
    }
  } catch (error) {
    console.error('Error sending event reminders:', error);
  }
};

// 5. New loyalty partner added
export const notifyNewPartner = async (partner) => {
  try {
    const vendor = await Vendor.findById(partner.vendorID);
    
    await createNotificationsForAll(
      ['Student', 'Staff', 'TA', 'Professor'],
      'new_partner',
      'New Loyalty Partner',
      `New partner "${vendor?.companyName}" joined the GUC Loyalty Program with ${partner.discountRate}% discount! Use code: ${partner.promoCode}`,
      { entityType: 'Wir', entityId: partner._id }
    );
  } catch (error) {
    console.error('Error sending new partner notification:', error);
  }
};

// 6. Vendor request pending
export const notifyVendorRequest = async (requestType, request) => {
  try {
    const messages = {
      'RegisterBazaar': `New bazaar booth request from vendor requires review.`,
      'RegisterBooth': `New booth request from vendor requires review.`,
    };

    await createNotificationsForAll(
      ['EventOffice', 'Admin'],
      'vendor_request',
      'Pending Vendor Request',
      messages[requestType],
      { entityType: requestType, entityId: request._id }
    );
  } catch (error) {
    console.error('Error sending vendor request notification:', error);
  }
};

export const checkAndCreateEventReminders = async (req, res) => {
  try {
    const userId = req.id || req.user._id || req.user.id;
    const role = req.role;
    
    // Map role to userType
    let userType;
    switch (role) {
      case 'student': userType = 'Student'; break;
      case 'Staff':
      case 'Professor':
      case 'TA': userType = 'Staff'; break;
      case 'admin': userType = 'Admin'; break;
      case 'event-office': userType = 'EventOffice'; break;
      case 'vendor': userType = 'Vendor'; break;
      default: return res.status(400).json({ success: false, message: 'Invalid user role' });
    }

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    let createdCount = 0;

    // Check Workshop registrations
    const workshopRegs = await RegisterWorkshop.find({
      [userType === 'Student' ? 'StudentID' : 'StaffID']: userId,
    }).populate('WorkshopName');

    for (const reg of workshopRegs) {
      const workshop = reg.WorkshopName;
      if (!workshop || workshop.isArchived || workshop.status !== 'confirmed') continue;
      
      const eventStart = new Date(workshop.start);
      const timeDiff = (eventStart - now) / (1000 * 60 * 60); // hours

      // Check if we need to create a reminder (within 1 day or 1 hour, with 10-minute buffer)
      const need24HourReminder = timeDiff <= 24 && timeDiff > 23.5;
      const need1HourReminder = timeDiff <= 1 && timeDiff > 0.5;

      if (need24HourReminder || need1HourReminder) {
        const timeframe = need24HourReminder ? '1 day' : '1 hour';
        
        // Check if reminder already exists
        const existingReminder = await Notification.findOne({
          recipientType: userType,
          recipientId: userId,
          type: 'event_reminder',
          'relatedEntity.entityType': 'Workshop',
          'relatedEntity.entityId': workshop._id,
          message: { $regex: timeframe }
        });

        if (!existingReminder) {
          await createNotification(
            userType,
            userId,
            'event_reminder',
            'Upcoming Event Reminder',
            `Reminder: "${workshop.name}" is starting in ${timeframe}!`,
            { entityType: 'Workshop', entityId: workshop._id }
          );
          createdCount++;
        }
      }
    }

    // Check Trip registrations
    const tripRegs = await RegisterTrip.find({
      [userType === 'Student' ? 'StudentID' : 'StaffID']: userId,
    }).populate('TripName');

    for (const reg of tripRegs) {
      const trip = reg.TripName;
      if (!trip || trip.isArchived) continue;
      
      const eventStart = new Date(trip.start);
      const timeDiff = (eventStart - now) / (1000 * 60 * 60);

      const need24HourReminder = timeDiff <= 24 && timeDiff > 23.5;
      const need1HourReminder = timeDiff <= 1 && timeDiff > 0.5;

      if (need24HourReminder || need1HourReminder) {
        const timeframe = need24HourReminder ? '1 day' : '1 hour';
        
        const existingReminder = await Notification.findOne({
          recipientType: userType,
          recipientId: userId,
          type: 'event_reminder',
          'relatedEntity.entityType': 'Trip',
          'relatedEntity.entityId': trip._id,
          message: { $regex: timeframe }
        });

        if (!existingReminder) {
          await createNotification(
            userType,
            userId,
            'event_reminder',
            'Upcoming Event Reminder',
            `Reminder: "${trip.name}" is starting in ${timeframe}!`,
            { entityType: 'Trip', entityId: trip._id }
          );
          createdCount++;
        }
      }
    }

    // Check Bazaar registrations (if students/staff register for bazaars)
    const bazaarRegs = await RegisterBazaar.find({
      // Assuming you have a way to track who registered - adjust based on your schema
    }).populate('BazaarName');

    for (const reg of bazaarRegs) {
      const bazaar = reg.BazaarName;
      if (!bazaar || bazaar.isArchived) continue;
      
      const eventStart = new Date(bazaar.start);
      const timeDiff = (eventStart - now) / (1000 * 60 * 60);

      const need24HourReminder = timeDiff <= 24 && timeDiff > 23.5;
      const need1HourReminder = timeDiff <= 1 && timeDiff > 0.5;

      if (need24HourReminder || need1HourReminder) {
        const timeframe = need24HourReminder ? '1 day' : '1 hour';
        
        const existingReminder = await Notification.findOne({
          recipientType: userType,
          recipientId: userId,
          type: 'event_reminder',
          'relatedEntity.entityType': 'Bazaar',
          'relatedEntity.entityId': bazaar._id,
          message: { $regex: timeframe }
        });

        if (!existingReminder) {
          await createNotification(
            userType,
            userId,
            'event_reminder',
            'Upcoming Event Reminder',
            `Reminder: "${bazaar.name}" is starting in ${timeframe}!`,
            { entityType: 'Bazaar', entityId: bazaar._id }
          );
          createdCount++;
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Checked for upcoming events. Created ${createdCount} new reminders.`,
      remindersCreated: createdCount
    });

  } catch (error) {
    console.error('❌ Error checking event reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking event reminders',
      error: error.message,
    });
  }
};