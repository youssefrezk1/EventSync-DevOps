import { Workshop } from '../models/Workshop.js';
import { notifyWorkshopStatus, notifyNewEvent } from '../controllers/notificationController.js';
// 🔔 ADD THESE IMPORTS FOR SUBSCRIBER NOTIFICATIONS
import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';
import { NotificationPreferences } from '../models/NotificationPreferences.js';
import nodemailer from 'nodemailer';

// 🔔 ADD EMAIL TRANSPORTER FUNCTION
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL || process.env.USER_EMAIL,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// 🔔 FUNCTION TO NOTIFY WORKSHOP SUBSCRIBERS VIA EMAIL
async function notifyWorkshopSubscribersByEmail(workshopName, workshopData) {
  try {
    console.log('🔔 Starting EMAIL notification for workshop subscribers:', workshopName);
    
    // Find users who have enabled notifications AND selected "Workshops" in their event types
    const interestedPreferences = await NotificationPreferences.find({
      notificationsEnabled: true,
      selectedEventTypes: { $in: ["Workshops"] }
    }).populate('userId');

    console.log(`📊 Found ${interestedPreferences.length} users subscribed to workshop emails`);

    if (interestedPreferences.length === 0) {
      console.log('ℹ️ No users subscribed to workshop email notifications');
      
      // Debug: Check what preferences exist
      const allPrefs = await NotificationPreferences.find({});
      console.log('📋 All notification preferences in database:', 
        allPrefs.map(p => ({
          userId: p.userId,
          enabled: p.notificationsEnabled,
          gymClasses: p.selectedGymClasses,
          eventTypes: p.selectedEventTypes
        }))
      );
      return;
    }

    // Send emails to all interested users
    let successCount = 0;
    let failCount = 0;
    
    for (const preference of interestedPreferences) {
      const user = preference.userId;
      if (user && user.email) {
        console.log(`📤 Sending workshop email to: ${user.email}`);
        try {
          await sendNewWorkshopEmailNotification(user, workshopData);
          successCount++;
          console.log(`✅ Email sent successfully to: ${user.email}`);
        } catch (emailError) {
          failCount++;
          console.error(`❌ Failed to send email to ${user.email}:`, emailError.message);
        }
      } else {
        console.log(`⚠️ Skipping user without email:`, user?._id);
      }
    }

    console.log(`📊 Workshop email summary: ${successCount} sent, ${failCount} failed`);
  } catch (err) {
    console.error('❌ Error in notifyWorkshopSubscribersByEmail:', err);
    // Don't throw - we don't want to break workshop creation
  }
}

// 🔔 EMAIL TEMPLATE FOR NEW WORKSHOP
async function sendNewWorkshopEmailNotification(user, workshop) {
  try {
    console.log('📧 Preparing workshop email for:', user.email);
    
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: process.env.EMAIL || process.env.USER_EMAIL,
      to: user.email,
      subject: `🎓 New Workshop Available: ${workshop.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New Workshop Alert!</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 2px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi ${user.firstName || 'there'},</p>
            
            <p style="font-size: 16px; color: #333;">
              Great news! A new workshop <strong style="color: #667eea;">${workshop.name}</strong> has been approved and is now available for registration!
            </p>
            
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #333; font-size: 20px;">📋 Workshop Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Workshop Name:</td>
                  <td style="padding: 8px 0; color: #333;">${workshop.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Description:</td>
                  <td style="padding: 8px 0; color: #333;">${workshop.shortDescription || workshop.description || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Date:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date(workshop.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</td>
                </tr>
                ${workshop.time ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
                  <td style="padding: 8px 0; color: #333;">${workshop.time}</td>
                </tr>
                ` : ''}
                ${workshop.location ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Location:</td>
                  <td style="padding: 8px 0; color: #333;">${workshop.location}</td>
                </tr>
                ` : ''}
                ${workshop.capacity ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Available Spots:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; color: #667eea;">${workshop.capacity}</td>
                </tr>
                ` : ''}
                ${workshop.price ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Price:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; color: #667eea;">$${workshop.price}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboards/student/events" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 40px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block;
                        font-weight: bold;
                        font-size: 16px;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                View Workshop Details →
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 12px; margin: 5px 0; line-height: 1.6;">
                💡 <strong>Tip:</strong> Workshops fill up quickly! Register now to secure your spot and enhance your skills.
              </p>
              <p style="color: #999; font-size: 12px; margin: 5px 0; line-height: 1.6;">
                You're receiving this email because you subscribed to workshop notifications.
                You can manage your notification preferences in your dashboard.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Workshop email sent. Message ID:', info.messageId);
    
  } catch (error) {
    console.error(`❌ Failed to send workshop email to ${user.email}:`, error);
    throw error;
  }
}

// Accept and publish a workshop
export async function acceptAndPublishWorkshop(req, res, next) {
  try {
    if (req.role !== 'event-office') return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.params;
    const workshop = await Workshop.findById(id);
    if (!workshop) return res.status(404).json({ message: 'Workshop not found' });

    workshop.status = 'confirmed';
    workshop.requestChange = '';
    await workshop.save();

    // 🔔 SEND NOTIFICATION TO PROFESSOR
    try {
      console.log('📧 Sending workshop acceptance notification to professor...');
      await notifyWorkshopStatus(workshop, 'confirmed');
      console.log('✅ Workshop acceptance notification sent to professor!');
    } catch (notifError) {
      console.error('⚠️ Failed to send professor notification:', notifError);
    }

    // 🔔 KEEP ORIGINAL NOTIFICATION SYSTEM (in-app notifications to all users)
    try {
      console.log('📱 Sending in-app notification for new workshop...');
      await notifyNewEvent('Workshop', workshop);
      console.log('✅ In-app notification sent to all users!');
    } catch (notifError) {
      console.error('⚠️ Failed to send in-app notification:', notifError);
    }

    // 🔔 NEW: SEND EMAILS TO WORKSHOP SUBSCRIBERS
    try {
      console.log('📧 Sending email notifications to workshop subscribers...');
      await notifyWorkshopSubscribersByEmail(workshop.name, workshop);
      console.log('✅ Email notifications sent to subscribers!');
    } catch (emailError) {
      console.error('⚠️ Failed to send email notifications:', emailError);
    }

    res.json({ ok: true, workshop });
  } catch (err) { next(err); }
}

// Reject a workshop with optional reason
export async function rejectWorkshop(req, res, next) {
  try {
    if (req.role !== 'event-office') return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.params;
    const { reason } = req.body;
    const workshop = await Workshop.findById(id);
    if (!workshop) return res.status(404).json({ message: 'Workshop not found' });

    workshop.status = 'rejected';
    workshop.requestChange = reason || '';
    await workshop.save();

    // 🔔 SEND NOTIFICATION TO PROFESSOR
    try {
      console.log('📧 Sending workshop rejection notification to professor...');
      await notifyWorkshopStatus(workshop, 'rejected');
      console.log('✅ Workshop rejection notification sent!');
    } catch (notifError) {
      console.error('⚠️ Failed to send notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({ ok: true, workshop });
  } catch (err) { next(err); }
}

// Request edits on workshop details
export async function requestWorkshopEdits(req, res, next) {
  try {
    if (req.role !== 'event-office') return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.params;
    const { edits } = req.body; // free-text description of requested edits
    if (!edits || typeof edits !== 'string') return res.status(400).json({ message: 'Edits description required' });

    const workshop = await Workshop.findById(id);
    if (!workshop) return res.status(404).json({ message: 'Workshop not found' });

    workshop.requestChange = edits;
    // keep status as Pending so professor can revise
    if (workshop.status !== 'Pending') workshop.status = 'Pending';
    await workshop.save();

    // 🔔 OPTIONAL: You can also send a notification for edit requests if you want
    // For now, I'll skip this since the requirement only mentions accept/reject
    // But if you want it, uncomment below:
    /*
    try {
      console.log('📧 Sending edit request notification to professor...');
      const { createNotification } = await import('../controllers/notificationController.js');
      await createNotification(
        'Staff',
        workshop.ProfCreator,
        'workshop_status',
        'Workshop Edit Requested',
        `The Events Office has requested edits for your workshop "${workshop.name}". Message: ${edits}`,
        { entityType: 'Workshop', entityId: workshop._id }
      );
      console.log('✅ Edit request notification sent!');
    } catch (notifError) {
      console.error('⚠️ Failed to send notification:', notifError);
    }
    */

    res.json({ ok: true, workshop });
  } catch (err) { next(err); }
}

// Get all pending workshops
export async function getAllPendingWorkshops(req, res, next) {
  try {
    if (req.role !== 'event-office')
      return res.status(403).json({ message: 'Forbidden' });

    // Fetch all workshops with status 'pending'
    const workshops = await Workshop.find({ status: 'Pending' });

    res.status(200).json({ ok: true, count: workshops.length, workshops });
  } catch (err) {
    next(err);
  }
}