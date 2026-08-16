import { RegisterBazaar } from '../models/RegisterBazaar.js';
import { RegisterBooth } from '../models/RegisterBooth.js';
import { Vendor } from '../models/Vendor.js';
import { Bazaar } from '../models/Bazaar.js';
import { sendAcceptedBazaarEmail, sendQRcodeforVisitorsBazaar,sendQRcodeforVisitorsBooth, sendRejectedBazaarEmail, sendAcceptedBoothEmail, sendRejectedBoothEmail } from '../utils/emailService.js';
import { notifyNewEvent } from '../controllers/notificationController.js';
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

// 🔔 FUNCTION TO NOTIFY BOOTH SUBSCRIBERS VIA EMAIL
async function notifyBoothSubscribersByEmail(boothData, vendorName) {
  try {
    console.log('🔔 Starting EMAIL notification for booth subscribers...');
    
    // Find users who have enabled notifications AND selected "Booths" in their event types
    const interestedPreferences = await NotificationPreferences.find({
      notificationsEnabled: true,
      selectedEventTypes: { $in: ["Booths"] }
    }).populate('userId');

    console.log(`📊 Found ${interestedPreferences.length} users subscribed to booth emails`);

    if (interestedPreferences.length === 0) {
      console.log('ℹ️ No users subscribed to booth email notifications');
      
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
        console.log(`📤 Sending booth email to: ${user.email}`);
        try {
          await sendNewBoothEmailNotification(user, boothData, vendorName);
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

    console.log(`📊 Booth email summary: ${successCount} sent, ${failCount} failed`);
  } catch (err) {
    console.error('❌ Error in notifyBoothSubscribersByEmail:', err);
    // Don't throw - we don't want to break booth creation
  }
}

// 🔔 EMAIL TEMPLATE FOR NEW BOOTH
async function sendNewBoothEmailNotification(user, boothData, vendorName) {
  try {
    console.log('📧 Preparing booth email for:', user.email);
    
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: process.env.EMAIL || process.env.USER_EMAIL,
      to: user.email,
      subject: `🏪 New Booth Available: ${vendorName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New Booth Alert!</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 2px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi ${user.firstName || 'there'},</p>
            
            <p style="font-size: 16px; color: #333;">
              Great news! A new booth by <strong style="color: #667eea;">${vendorName}</strong> has been approved and is now available for visitors!
            </p>
            
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #333; font-size: 20px;">📋 Booth Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Vendor:</td>
                  <td style="padding: 8px 0; color: #333;">${vendorName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Start Date:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date(boothData.StartDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">End Date:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date(boothData.EndDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</td>
                </tr>
                ${boothData.Location ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Location:</td>
                  <td style="padding: 8px 0; color: #333;">${boothData.Location}</td>
                </tr>
                ` : ''}
                ${boothData.BoothSize ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Booth Size:</td>
                  <td style="padding: 8px 0; color: #333;">${boothData.BoothSize}</td>
                </tr>
                ` : ''}
                ${boothData.SetupDuration ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Setup Duration:</td>
                  <td style="padding: 8px 0; color: #333;">${boothData.SetupDuration}</td>
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
                View Upcoming Events →
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 12px; margin: 5px 0; line-height: 1.6;">
                💡 <strong>Tip:</strong> Visit the booth to explore products and services from this vendor!
              </p>
              <p style="color: #999; font-size: 12px; margin: 5px 0; line-height: 1.6;">
                You're receiving this email because you subscribed to booth notifications.
                You can manage your notification preferences in your dashboard.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Booth email sent. Message ID:', info.messageId);
    
  } catch (error) {
    console.error(`❌ Failed to send booth email to ${user.email}:`, error);
    throw error;
  }
}

// ✅ GET all vendor participation requests (Admin / Event Office)
export const getAllParticipationRequests = async (req, res) => {
  try {
    // Optionally restrict roles:
    // if (!['admin', 'event-office'].includes(req.role)) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Access denied. Admin or Event Office only.',
    //   });
    // }

    // ✅ Fetch all pending Bazaar requests with valid future bazaars
    const bazaarRequests = await RegisterBazaar.find({
      Pending: 'Pending',
    })
      .populate({
        path: 'VendorName',
        select: 'companyName email status logo',
      })
      .populate({
        path: 'BazaarName',
        match: { start: { $gte: new Date() } }, // only upcoming bazaars
        select: 'name start endDate location Attendees PhotoIDs',
      })
      .sort({ createdAt: -1 })
      .lean();

    const validBazaarRequests = bazaarRequests.filter(
      (b) => b.BazaarName !== null
    );

    // ✅ Fetch all pending Booth requests (future only)
    const boothRequests = await RegisterBooth.find({
      Pending: 'Pending',
      StartDate: { $gte: new Date() },
    })
      .populate({
        path: 'VendorID',
        select: 'companyName email status logo',
      })
      .select(
        'VendorID StartDate EndDate Location BoothSize SetupDuration Pending createdAt Attendees PhotoIDs'
      )
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Combine & sort by date
    const allRequests = [...validBazaarRequests, ...boothRequests].sort(
      (a, b) => {
        const dateA = new Date(a.BazaarName?.start || a.StartDate);
        const dateB = new Date(b.BazaarName?.start || b.StartDate);
        return dateA - dateB;
      }
    );

    res.status(200).json({
      success: true,
      count: allRequests.length,
      data: allRequests,
    });
  } catch (error) {
    console.error('❌ Error in getAllParticipationRequests:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ✅ Accept or Reject Bazaar Request
export const updateBazaarRequestStatus = async (req, res) => {
  try {
    // if (!['admin', 'event-office'].includes(req.role)) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Access denied. Admin or Event Office only.',
    //   });
    // }

    const { requestId } = req.params;
    const { status } = req.body;

    if (!['Accept', 'Reject'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value (must be Accept or Reject)',
      });
    }

    const request = await RegisterBazaar.findById(requestId)
      .populate('VendorName', 'companyName email logo')
      .populate('BazaarName', 'name start endDate time location shortDescription registrationDeadline');

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: 'Bazaar request not found' });
    }

    request.Pending = status;
     if (status === 'Accept') {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      request.PaymentDueDate = dueDate;
    }
    await request.save();

    await (status === 'Accept'
      ? sendAcceptedBazaarEmail(request.VendorName, request.BazaarName)
      : sendRejectedBazaarEmail(request.VendorName, request.BazaarName));

     const emailers = [];

    if (status === 'Accept') {
      const attendees = request.Attendees || [];
      const photoIDs = request.PhotoIDs || [];

      for (let i = 0; i < attendees.length; i++) {
        const attendee = attendees[i];
        const photoObj = photoIDs[i]; // photo at same index
        const photoURL = photoObj ? photoObj.url : null;

        emailers.push(
          sendQRcodeforVisitorsBazaar(
            request.VendorName.companyName,
            photoURL,
            attendee.name,
            request.BazaarName,
            attendee.email
          )
        );
      }
    }
    await Promise.all(emailers);

    res.status(200).json({
      success: true,
      message: `Bazaar request ${status}ed successfully.`,
      data: request,
    });
  } catch (error) {
    console.error('❌ Error in updateBazaarRequestStatus:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ✅ Accept or Reject Booth Request
export const updateBoothRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!['Accept', 'Reject'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value (must be Accept or Reject)',
      });
    }

    const request = await RegisterBooth.findById(requestId)
      .populate('VendorID', 'companyName email logo');

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: 'Booth request not found' });
    }
    
    request.Pending = status;
     if (status === 'Accept') {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      request.PaymentDueDate = dueDate;
    }
    await request.save();

    await (status === 'Accept'
      ? sendAcceptedBoothEmail(request.VendorID, request)
      : sendRejectedBoothEmail(request.VendorID, request));

    const emailers = [];

    if (status === 'Accept') {
      const attendees = request.Attendees || [];
      const photoIDs = request.PhotoIDs || [];

      for (let i = 0; i < attendees.length; i++) {
        const attendee = attendees[i];
        const photoObj = photoIDs[i];
        const photoURL = photoObj ? photoObj.url : null;

        emailers.push(
          sendQRcodeforVisitorsBooth(
            request.VendorID.companyName,
            attendee.name,
            request,
            attendee.email,
            photoURL,
          )
        );
      }
    }
    await Promise.all(emailers);

    // 🔔 KEEP ORIGINAL NOTIFICATION SYSTEM (in-app notifications to all users)
    if (status === 'Accept') {
      try {
        console.log('📱 Sending in-app notification for new booth...');
        await notifyNewEvent('RegisterBooth', request);
        console.log('✅ In-app notification sent to all users!');
      } catch (notifError) {
        console.error('⚠️ Failed to send in-app notification:', notifError);
      }
    }

    // 🔔 NEW: SEND EMAILS TO BOOTH SUBSCRIBERS
    if (status === 'Accept') {
      try {
        console.log('📧 Sending email notifications to booth subscribers...');
        await notifyBoothSubscribersByEmail(request, request.VendorID.companyName);
        console.log('✅ Email notifications sent to subscribers!');
      } catch (emailError) {
        console.error('⚠️ Failed to send email notifications:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: `Booth request ${status}ed successfully.`,
      data: request,
    });
  } catch (error) {
    console.error('❌ Error in updateBoothRequestStatus:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};