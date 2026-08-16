import Joi from 'joi';
import {GymClass} from '../models/GymClass.js';
import { now } from 'mongoose';
import { sendCancelledGymSessionEmail } from '../utils/emailService.js';
import { sendUpdatedGymSessionEmail } from '../utils/emailService.js';
import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';
import { NotificationPreferences } from '../models/NotificationPreferences.js';
import nodemailer from 'nodemailer';

const GymClassSchema = Joi.object({
  date: Joi.date().required(),
  time: Joi.string().required(),
  duration: Joi.string().required(),
  type: Joi.string().valid('yoga', 'pilates', 'aerobics', 'Zumba', 'cross circuit', 'kick-boxing').required(),
  maxParticipants: Joi.number().integer().required()
});

const updateGymClassSchema = Joi.object({
  date: Joi.date(),
  time: Joi.string(),
  duration: Joi.string(),
});

// 🔔 CONFIGURE EMAIL TRANSPORTER (reusable)
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL || process.env.USER_EMAIL,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

export async function createGymClass(req, res, next) {
  try {
    // validate request body against schema
    const { value, error } = GymClassSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    
    console.log('🏋️ Creating gym class:', value);
    
    // ...value spreads the validated fields
    const doc = await GymClass.create({ ...value });
    
    console.log('✅ Gym class created successfully:', doc._id);
    
    // 🔔 NOTIFY SUBSCRIBED USERS ABOUT NEW GYM CLASS
    console.log('📧 Starting notification process...');
    await notifyGymClassSubscribers(doc.type, doc);
    
    res.status(201).json({ gymClass: doc });
  } catch (err) {
    console.error('❌ Error creating gym class:', err);
    if (err.code === 11000) return res.status(409).json({ message: 'Duplicate gym class for this date and time' });
    next(err);
  }
}

// 🔔 FUNCTION TO NOTIFY SUBSCRIBED USERS
async function notifyGymClassSubscribers(gymClassType, gymClassData) {
  try {
    console.log('🔍 Starting notification process for:', gymClassType);
    
    // Normalize gym class type to match preference format
    const typeMap = {
      'yoga': 'Yoga',
      'zumba': 'Zumba',
      'kick-boxing': 'Kick-boxing',
      'pilates': 'Pilates',
      'aerobics': 'Aerobics',
      'cross circuit': 'Cross Circuit'
    };

    const preferenceType = typeMap[gymClassType.toLowerCase()];
    
    if (!preferenceType) {
      console.log('⚠️ Unknown gym class type:', gymClassType);
      return;
    }

    console.log(`🔍 Looking for users interested in: ${preferenceType}`);

    // Find users interested in this gym class type
    const interestedPreferences = await NotificationPreferences.find({
      notificationsEnabled: true,
      selectedGymClasses: preferenceType
    }).populate('userId');

    console.log(`📊 Query results:`, {
      totalFound: interestedPreferences.length,
      preferenceType: preferenceType
    });

    if (interestedPreferences.length === 0) {
      console.log('ℹ️ No users subscribed to this gym class type');
      
      // Debug: Check what preferences exist
      const allPrefs = await NotificationPreferences.find({});
      console.log('📋 All notification preferences in database:', 
        allPrefs.map(p => ({
          userId: p.userId,
          enabled: p.notificationsEnabled,
          classes: p.selectedGymClasses
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
        console.log(`📤 Attempting to send email to: ${user.email}`);
        try {
          await sendNewGymClassNotification(user, gymClassData);
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

    console.log(`📊 Email summary: ${successCount} sent, ${failCount} failed`);
  } catch (err) {
    console.error('❌ Error in notifyGymClassSubscribers:', err);
  }
}

// 🔔 EMAIL TEMPLATE FOR NEW GYM CLASS
async function sendNewGymClassNotification(user, gymClass) {
  try {
    console.log('📧 Preparing email for:', user.email);
    
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: process.env.EMAIL || process.env.USER_EMAIL,
      to: user.email,
      subject: `🏋️ New ${gymClass.type} Class Available!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New Class Alert!</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 2px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi ${user.firstName || 'there'},</p>
            
            <p style="font-size: 16px; color: #333;">
              Great news! A new <strong style="color: #667eea;">${gymClass.type}</strong> class has just been posted and is now available for registration!
            </p>
            
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #333; font-size: 20px;">📋 Class Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Type:</td>
                  <td style="padding: 8px 0; color: #333;">${gymClass.type}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Date:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date(gymClass.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
                  <td style="padding: 8px 0; color: #333;">${gymClass.time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Duration:</td>
                  <td style="padding: 8px 0; color: #333;">${gymClass.duration}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Available Spots:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; color: #667eea;">${gymClass.maxParticipants}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboards/student/gym" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 40px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block;
                        font-weight: bold;
                        font-size: 16px;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Register Now →
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 12px; margin: 5px 0; line-height: 1.6;">
                💡 <strong>Tip:</strong> Classes fill up quickly! Register now to secure your spot.
              </p>
              <p style="color: #999; font-size: 12px; margin: 5px 0; line-height: 1.6;">
                You're receiving this email because you subscribed to notifications for <strong>${gymClass.type}</strong> classes.
                You can manage your notification preferences in your dashboard.
              </p>
            </div>
          </div>
        </div>
      `
    };

    console.log('📤 Sending email via transporter...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully. Message ID:', info.messageId);
    
  } catch (error) {
    console.error(`❌ Failed to send email to ${user.email}:`, error);
    throw error; // Re-throw so we can track failures
  }
}

export async function getAllGymClasses(req, res, next) {
  try {
    const GymClasses = await GymClass.find();
    res.json(GymClasses);
  } catch (err) { next(err); }
}

export async function deleteGymClass(req, res, next) {
  try {
    const doc = await GymClass.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Gym class not found' });
    res.json({ ok: true });
    const usersToNotify = [];

    for (const studentId of doc.studentParticipants) {
      usersToNotify.push({ id: studentId, role: 'student' });
    }
    for (const staffId of doc.staffParticipants) {
      usersToNotify.push({ id: staffId, role: 'staff' });
    }
    for (const user of usersToNotify) {
      let userDetails;  
      if (user.role === 'student') {
        userDetails = await Student.findById(user.id);
      } else {
        userDetails = await Staff.findById(user.id);
      }
      await sendCancelledGymSessionEmail(userDetails, doc);
    }
  } catch (err) { next(err); }
}

export async function updateGymClass(req, res, next) {
  try {
    const { value, error } = updateGymClassSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const allowedUpdates = {
      date: value.date,
      time: value.time,
      duration: value.duration
    };

    const oldy = await GymClass.findById(req.params.id);

    const doc = await GymClass.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ message: 'Gym class not found' });
    
    res.json({ gymClass: doc });
    const usersToNotify = [];

    for (const studentId of doc.studentParticipants) {
      console.log('studentId:', studentId);
      usersToNotify.push({ id: studentId, role: 'student' });
    }
    for (const staffId of doc.staffParticipants) {
      usersToNotify.push({ id: staffId, role: 'staff' });
    }
    for (const user of usersToNotify) {
      let userDetails;
      if (user.role === 'student') {
        userDetails = await Student.findById(user.id);
      } else {
        userDetails = await Staff.findById(user.id);
      }
      await sendUpdatedGymSessionEmail(userDetails, doc, oldy);
    }
  } catch (err) { 
    next(err); 
  }
}

export async function registerGymMember(req, res, next) {
  try {
    const gymClassId = req.params.id;
    const id = req.id;
    const role = req.role;
    
    if (!id || !role) {
      return res.status(400).json({ message: 'id and role are required' });
    }

    if (!['student', 'Staff', 'Professor', 'TA'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const gymClass = await GymClass.findById(gymClassId);
    if (!gymClass) {
      return res.status(404).json({ message: 'Gym class not found' });
    }

    // Check if user is already registered
    const isStudentRegistered = gymClass.studentParticipants.some(
      participant => participant.toString() === id.toString()
    );
    const isStaffRegistered = gymClass.staffParticipants.some(
      participant => participant.toString() === id.toString()
    );

    if (isStudentRegistered || isStaffRegistered) {
      return res.status(409).json({ 
        message: 'You are already registered for this gym class' 
      });
    }

    // CHECK CAPACITY BEFORE REGISTERING
    if (gymClass.counter >= gymClass.maxParticipants) {
      return res.status(404).json({ message: 'Gym class is full' });
    }

    // Register the member based on their role
    if (role === 'student') {
      gymClass.studentParticipants.push(id);
    } else {
      gymClass.staffParticipants.push(id);
    }
    
    gymClass.counter++;
    await gymClass.save();
    
    res.status(201).json({ message: 'Member registered successfully' });
  } catch (err) {
    next(err);
  }
}