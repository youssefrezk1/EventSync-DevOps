import Joi from 'joi';
import { Confrence } from '../models/Confrence.js';
import { notifyNewEvent } from '../controllers/notificationController.js';
// 🔔 ADD THESE IMPORTS FOR SUBSCRIBER NOTIFICATIONS
import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';
import { NotificationPreferences } from '../models/NotificationPreferences.js';
import nodemailer from 'nodemailer';

const ConferenceSchema = Joi.object({
  name: Joi.string().required(),
  start: Joi.date().required(),
  endDate: Joi.date().required(),
  time: Joi.string().required(),
  shortDescription: Joi.string().required(),
  fullAgenda: Joi.string().required(),
  conferenceWebsiteLink: Joi.string().required(),
  requiredBudget: Joi.number().required(),
  sourceOfFunding: Joi.string().valid('external', 'GUC').required(),
  extraRequiredResources: Joi.string().optional().allow(''),
  restrictedTo: Joi.array()
    .items(Joi.string().valid('Student', 'TA', 'Staff', 'Professor'))
    .min(1)
    .required()
    .messages({
      'array.min': 'Please select at least one group',
      'any.required': 'Restricted to field is required'
    })
}).unknown(true); // This allows unknown fields to pass through (they'll be ignored)

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

// 🔔 FUNCTION TO NOTIFY CONFERENCE SUBSCRIBERS VIA EMAIL
async function notifyConferenceSubscribersByEmail(conferenceName, conferenceData) {
  try {
    console.log('🔔 Starting EMAIL notification for conference subscribers:', conferenceName);
    
    // Find users who have enabled notifications AND selected "Conferences" in their event types
    const interestedPreferences = await NotificationPreferences.find({
      notificationsEnabled: true,
      selectedEventTypes: { $in: ["Conferences"] }
    }).populate('userId');

    console.log(`📊 Found ${interestedPreferences.length} users subscribed to conference emails`);

    if (interestedPreferences.length === 0) {
      console.log('ℹ️ No users subscribed to conference email notifications');
      
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
        console.log(`📤 Sending conference email to: ${user.email}`);
        try {
          await sendNewConferenceEmailNotification(user, conferenceData);
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

    console.log(`📊 Conference email summary: ${successCount} sent, ${failCount} failed`);
  } catch (err) {
    console.error('❌ Error in notifyConferenceSubscribersByEmail:', err);
    // Don't throw - we don't want to break conference creation
  }
}

// 🔔 EMAIL TEMPLATE FOR NEW CONFERENCE
async function sendNewConferenceEmailNotification(user, conference) {
  try {
    console.log('📧 Preparing conference email for:', user.email);
    
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: process.env.EMAIL || process.env.USER_EMAIL,
      to: user.email,
      subject: `🎤 New Conference Available: ${conference.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New Conference Alert!</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 2px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi ${user.firstName || 'there'},</p>
            
            <p style="font-size: 16px; color: #333;">
              Great news! A new conference <strong style="color: #667eea;">${conference.name}</strong> has been scheduled and is now open for attendance!
            </p>
            
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #333; font-size: 20px;">📋 Conference Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Conference Name:</td>
                  <td style="padding: 8px 0; color: #333;">${conference.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Description:</td>
                  <td style="padding: 8px 0; color: #333;">${conference.shortDescription}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Start Date:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date(conference.start).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">End Date:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date(conference.endDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
                  <td style="padding: 8px 0; color: #333;">${conference.time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Funding Source:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; color: #667eea;">
                    ${conference.sourceOfFunding === 'GUC' ? 'GUC-Funded' : 'Externally Funded'}
                  </td>
                </tr>
                ${conference.conferenceWebsiteLink ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Website:</td>
                  <td style="padding: 8px 0; color: #333;">
                    <a href="${conference.conferenceWebsiteLink}" style="color: #667eea; text-decoration: none;">
                      Visit Conference Website
                    </a>
                  </td>
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
                View Conference Details →
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 12px; margin: 5px 0; line-height: 1.6;">
                💡 <strong>Tip:</strong> Conferences are great opportunities for networking and learning. Register early to secure your spot!
              </p>
              <p style="color: #999; font-size: 12px; margin: 5px 0; line-height: 1.6;">
                You're receiving this email because you subscribed to conference notifications.
                You can manage your notification preferences in your dashboard.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Conference email sent. Message ID:', info.messageId);
    
  } catch (error) {
    console.error(`❌ Failed to send conference email to ${user.email}:`, error);
    throw error;
  }
}

export async function createConference(req, res, next) {
  try {
    console.log("pss");
    const { value, error } = ConferenceSchema.validate(req.body);
    console.log("pssq");
    console.log(error);
    if (error) return res.status(400).json({ message: error.message });
    console.log("pss2");
    if(new Date(value.endDate) < new Date(value.start)) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }
    console.log("pss18");
    if(new Date(value.start) < new Date()) {
      
      return res.status(400).json({ message: 'Start date cannot be in the past' });
    }
    console.log("pss2");
    console.log("pss");
    const doc = await Confrence.create({ ...value });

    // 🔔 KEEP ORIGINAL NOTIFICATION SYSTEM (in-app notifications)
    try {
      console.log('📱 Sending in-app notification for new conference...');
      await notifyNewEvent('Confrence', doc);
      console.log('✅ In-app notification sent!');
    } catch (notifError) {
      console.error('⚠️ Failed to send in-app notification:', notifError);
    }

    // 🔔 NEW: SEND EMAILS TO SUBSCRIBERS
    try {
      console.log('📧 Sending email notifications to conference subscribers...');
      await notifyConferenceSubscribersByEmail(doc.name, doc);
      console.log('✅ Email notifications sent to subscribers!');
    } catch (emailError) {
      console.error('⚠️ Failed to send email notifications:', emailError);
    }

    res.status(201).json({ conference: doc });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Duplicate conference' });
    next(err);
  }
}

export async function getConferences(req, res, next) {
  try {
    const { search, type, location, date, sortBy = 'start', sortOrder = 'asc' } = req.query;
    
    let query = {};
    
    // Search by name or professor name
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } }
        
      ];
    }
    
    // Filter by type (source of funding)
    if (type) {
      query.sourceOfFunding = type;
    }
    
    // Filter by date range
    if (date) {
      const dateFilter = new Date(date);
      query.start = { $gte: dateFilter };
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const docs = await Confrence.find(query).sort(sort);
    res.json(docs);
  } catch (err) { 
    next(err); 
  }
}

export async function getConferenceById(req, res, next) {
  try {
    const doc = await Confrence.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Conference not found' });
    res.json(doc);
  } catch (err) { 
    next(err); 
  }
}

export async function updateConference(req, res, next) {
  try {
    const optionalSchema = ConferenceSchema.fork(Object.keys(ConferenceSchema.describe().keys), (s) => s.optional());
    const { error, value } = optionalSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const existing = await Confrence.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Conference not found' });

    const now = new Date();
    if (existing.start && existing.start <= now) {
      return res.status(403).json({ message: 'Conference cannot be edited after its start date' });
    }

    const doc = await Confrence.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    res.json({ conference: doc });
  } catch (err) { 
    next(err); 
  }
}

export async function deleteConference(req, res, next) {
  try {
    const id = req.params.id;

    // If a RegisterConference model exists, prevent deletion when registrations exist.
    try {
      const mod = await import('../models/RegisterConference.js');
      const RegisterConference = mod.RegisterConference || mod.default || null;
      if (RegisterConference) {
        const count = await RegisterConference.countDocuments({ ConferenceName: id });
        if (count > 0) {
          return res.status(403).json({ message: 'Cannot delete conference with existing registrations' });
        }
      }
    } catch (e) {
      // No RegisterConference model present — skip registration check.
    }

    const doc = await Confrence.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'Conference not found' });
    res.json({ ok: true });
  } catch (err) { 
    next(err); 
  }
}