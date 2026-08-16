import Joi from 'joi';
import { Bazaar } from '../models/Bazaar.js';
import { notifyNewEvent } from '../controllers/notificationController.js';
// 🔔 ADD THESE IMPORTS FOR SUBSCRIBER NOTIFICATIONS
import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';
import { NotificationPreferences } from '../models/NotificationPreferences.js';
import nodemailer from 'nodemailer';

const BazaarSchema = Joi.object({
  name: Joi.string().required(),
  start: Joi.date().required(),
  endDate: Joi.date().required(),
  time: Joi.string().required(),
  location: Joi.string().required(),
  shortDescription: Joi.string().required(),
  registrationDeadline: Joi.date().required(),
   restrictedTo: Joi.array().items(Joi.string()),
});

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

// 🔔 FUNCTION TO NOTIFY BAZAAR SUBSCRIBERS VIA EMAIL
async function notifyBazaarSubscribersByEmail(bazaarName, bazaarData) {
  try {
    console.log('🔔 Starting EMAIL notification for bazaar subscribers:', bazaarName);
    
    // Find users who have enabled notifications AND selected "Bazaars" in their event types
    const interestedPreferences = await NotificationPreferences.find({
      notificationsEnabled: true,
      selectedEventTypes: { $in: ["Bazaars"] }
    }).populate('userId');

    console.log(`📊 Found ${interestedPreferences.length} users subscribed to bazaar emails`);

    if (interestedPreferences.length === 0) {
      console.log('ℹ️ No users subscribed to bazaar email notifications');
      
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
        console.log(`📤 Sending bazaar email to: ${user.email}`);
        try {
          await sendNewBazaarEmailNotification(user, bazaarData);
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

    console.log(`📊 Bazaar email summary: ${successCount} sent, ${failCount} failed`);
  } catch (err) {
    console.error('❌ Error in notifyBazaarSubscribersByEmail:', err);
    // Don't throw - we don't want to break bazaar creation
  }
}

// 🔔 EMAIL TEMPLATE FOR NEW BAZAAR
async function sendNewBazaarEmailNotification(user, bazaar) {
  try {
    console.log('📧 Preparing bazaar email for:', user.email);
    
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: process.env.EMAIL || process.env.USER_EMAIL,
      to: user.email,
      subject: `🛍️ New Bazaar Available: ${bazaar.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New Bazaar Alert!</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 2px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi ${user.firstName || 'there'},</p>
            
            <p style="font-size: 16px; color: #333;">
              Great news! A new bazaar event <strong style="color: #667eea;">${bazaar.name}</strong> has just been posted!
            </p>
            
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #333; font-size: 20px;">📋 Bazaar Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Bazaar Name:</td>
                  <td style="padding: 8px 0; color: #333;">${bazaar.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Location:</td>
                  <td style="padding: 8px 0; color: #333;">${bazaar.location}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Start Date:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date(bazaar.start).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">End Date:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date(bazaar.endDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
                  <td style="padding: 8px 0; color: #333;">${bazaar.time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Description:</td>
                  <td style="padding: 8px 0; color: #333;">${bazaar.shortDescription}</td>
                </tr>
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
                View Bazaar Details →
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 12px; margin: 5px 0; line-height: 1.6;">
                💡 <strong>Tip:</strong> Great opportunity to shop unique items from student vendors!
              </p>
              <p style="color: #999; font-size: 12px; margin: 5px 0; line-height: 1.6;">
                You're receiving this email because you subscribed to bazaar notifications.
                You can manage your notification preferences in your dashboard.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Bazaar email sent. Message ID:', info.messageId);
    
  } catch (error) {
    console.error(`❌ Failed to send bazaar email to ${user.email}:`, error);
    throw error;
  }
}

// ✅ Create a new bazaar
export async function createBazaar(req, res, next) {
  try {
    // validate request body
    const { value, error } = BazaarSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    if(new Date(value.endDate) < new Date(value.start)) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }
    if(new Date(value.start) < new Date()) {
      return res.status(400).json({ message: 'Start date cannot be in the past' });
    }
    if(new Date(value.registrationDeadline) > new Date(value.start)) {
      return res.status(400).json({ message: 'Registration deadline cannot be after bazaar start date' });
    } 
    const doc = await Bazaar.create({ ...value });

    // 🔔 KEEP ORIGINAL NOTIFICATION SYSTEM (in-app notifications)
    try {
      console.log('📱 Sending in-app notification for new bazaar...');
      await notifyNewEvent('Bazaar', doc);
      console.log('✅ In-app notification sent!');
    } catch (notifError) {
      console.error('⚠️ Failed to send in-app notification:', notifError);
    }

    // 🔔 NEW: SEND EMAILS TO SUBSCRIBERS
    try {
      console.log('📧 Sending email notifications to bazaar subscribers...');
      await notifyBazaarSubscribersByEmail(doc.name, doc);
      console.log('✅ Email notifications sent to subscribers!');
    } catch (emailError) {
      console.error('⚠️ Failed to send email notifications:', emailError);
    }

    res.status(201).json({ bazaar: doc });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate bazaar entry detected' });
    }
    next(err);
  }
}

// ✅ Get all bazaars with search and filter
export async function getBazaars(req, res, next) {
  try {
    const { search, location, date, sortBy = 'start', sortOrder = 'asc' } = req.query;
    
    let query = {};
    
    // Search by name
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    // Filter by date range
    if (date) {
      const dateFilter = new Date(date);
      query.start = { $gte: dateFilter };
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const docs = await Bazaar.find(query).sort(sort);
    res.json(docs);
  } catch (err) { 
    next(err); 
  }
}

// ✅ Get bazaar by ID
export async function getBazaarById(req, res, next) {
  try {
    const doc = await Bazaar.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Bazaar not found' });
    res.json(doc);
  } catch (err) { 
    next(err); 
  }
}


// ✅ Update an existing bazaar (only if not started)
export async function updateBazaar(req, res, next) {
  try {
    // use .fork to make all fields optional for updates
    const UpdateSchema = BazaarSchema.fork(
      Object.keys(BazaarSchema.describe().keys),
      (field) => field.optional()
    );

    const { value, error } = UpdateSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: error.message });

    // First, find the bazaar to check if it has started
    const existingBazaar = await Bazaar.findById(req.params.id);
    if (!existingBazaar) {
      return res.status(404).json({ message: 'Bazaar not found' });
    }

    // Check if the bazaar has already started
    const now = new Date();
    if (existingBazaar.start <= now) {
      return res.status(403).json({ 
        message: 'Cannot update bazaar that has already started' 
      });
    }

    // Proceed with the update
    const updatedBazaar = await Bazaar.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    );

    res.json({ bazaar: updatedBazaar });
  } catch (err) {
    next(err);
  }
}

export async function deleteBazaar(req, res, next) {
  try {
    
    const existingBazaar = await Bazaar.findById(req.params.id);
    if (!existingBazaar) {
      return res.status(404).json({ message: 'Bazaar not found' });
    }


    const now = new Date();
    if (existingBazaar.start <= now) {
      return res.status(403).json({ 
        message: 'Cannot delete bazaar that has already started' 
      });
    }

    // Prevent deletion if vendors have registered for this bazaar
    const { RegisterBazaar } = await import('../models/RegisterBazaar.js');
    const registrations = await RegisterBazaar.countDocuments({ BazaarName: req.params.id });
    if (registrations > 0) {
      return res.status(403).json({ message: 'Cannot delete bazaar with existing vendor registrations' });
    }

    await Bazaar.findByIdAndDelete(req.params.id);

    res.json({ message: 'Bazaar deleted successfully' });
  } catch (err) {
    next(err);
  }
}