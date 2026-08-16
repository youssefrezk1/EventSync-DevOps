import Joi from 'joi';
import { Trip } from '../models/Trip.js';
import { ItineraryItem } from '../models/ItineraryItem.js';
import { notifyNewEvent } from '../controllers/notificationController.js'; // KEEP THIS
import { RegisterTrip } from "../models/RegisterTrip.js";
import cloudinary from '../utils/cloudinary.js';
// 🔔 ADD THESE IMPORTS FOR SUBSCRIBER NOTIFICATIONS
import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';
import { NotificationPreferences } from '../models/NotificationPreferences.js';
import nodemailer from 'nodemailer';

const TripSchema = Joi.object({
  name: Joi.string().required(),
  location: Joi.string().required(),
  price: Joi.number().required(),
  start: Joi.date().required(),
  end: Joi.date().required(),
  time: Joi.string().required(),
  shortDescription: Joi.string().required(),
  capacity: Joi.number().integer().required(),
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

// Helper function to upload image to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'trip_itineraries',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// 🔔 FIXED FUNCTION: NOTIFY TRIP SUBSCRIBERS VIA EMAIL
async function notifyTripSubscribersByEmail(tripName, tripData) {
  try {
    console.log('🔔 Starting EMAIL notification for trip subscribers:', tripName);
    
    // 🔥 FIXED QUERY: Look for users who have "Trips" in selectedEventTypes array
    const interestedPreferences = await NotificationPreferences.find({
      notificationsEnabled: true,
      selectedEventTypes: { $in: ["Trips"] } // 🔥 CHANGED THIS
    }).populate('userId');

    console.log(`📊 Found ${interestedPreferences.length} users subscribed to trip emails`);

    if (interestedPreferences.length === 0) {
      console.log('ℹ️ No users subscribed to trip email notifications');
      
      // Debug: Check what preferences exist
      const allPrefs = await NotificationPreferences.find({});
      console.log('📋 All notification preferences in database:', 
        allPrefs.map(p => ({
          userId: p.userId,
          enabled: p.notificationsEnabled,
          gymClasses: p.selectedGymClasses,
          eventTypes: p.selectedEventTypes // 🔥 CHANGED THIS
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
        console.log(`📤 Sending trip email to: ${user.email}`);
        try {
          await sendNewTripEmailNotification(user, tripData);
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

    console.log(`📊 Trip email summary: ${successCount} sent, ${failCount} failed`);
  } catch (err) {
    console.error('❌ Error in notifyTripSubscribersByEmail:', err);
    // Don't throw - we don't want to break trip creation
  }
}

// 🔔 FUNCTION: SEND EMAIL FOR NEW TRIP
async function sendNewTripEmailNotification(user, trip) {
  try {
    console.log('📧 Preparing trip email for:', user.email);
    
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: process.env.EMAIL || process.env.USER_EMAIL,
      to: user.email,
      subject: `✈️ New Trip Available: ${trip.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New Trip Alert!</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 2px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi ${user.firstName || 'there'},</p>
            
            <p style="font-size: 16px; color: #333;">
              Great news! A new trip to <strong style="color: #667eea;">${trip.location}</strong> has just been posted and is now available for registration!
            </p>
            
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #333; font-size: 20px;">📋 Trip Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Trip Name:</td>
                  <td style="padding: 8px 0; color: #333;">${trip.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Location:</td>
                  <td style="padding: 8px 0; color: #333;">${trip.location}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Start Date:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date(trip.start).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">End Date:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date(trip.end).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td>
                  <td style="padding: 8px 0; color: #333;">${trip.time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Price:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; color: #667eea;">$${trip.price}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Available Spots:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold; color: #667eea;">${trip.capacity}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboards/student/trips" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 40px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block;
                        font-weight: bold;
                        font-size: 16px;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                View Trip Details →
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 12px; margin: 5px 0; line-height: 1.6;">
                💡 <strong>Tip:</strong> Trips fill up quickly! Register now to secure your spot.
              </p>
              <p style="color: #999; font-size: 12px; margin: 5px 0; line-height: 1.6;">
                You're receiving this email because you subscribed to trip notifications.
                You can manage your notification preferences in your dashboard.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Trip email sent. Message ID:', info.messageId);
    
  } catch (error) {
    console.error(`❌ Failed to send trip email to ${user.email}:`, error);
    throw error;
  }
}

export async function createTrip(req, res, next) {
  try {
    const { value, error } = TripSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });
    if(new Date(value.end) < new Date(value.start)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }
    if(new Date(value.start) < new Date()) {
      return res.status(400).json({ message: 'Start date must be in the future' });
    }
    if(new Date(value.registrationDeadline) > new Date(value.start)) {
      return res.status(400).json({ message: 'Registration deadline must be before start date' });
    }
    const doc = await Trip.create({ ...value });

    // 🔔 KEEP ORIGINAL NOTIFICATION SYSTEM (in-app notifications)
    try {
      console.log('📱 Sending in-app notification for new trip...');
      await notifyNewEvent('Trip', doc);
      console.log('✅ In-app notification sent!');
    } catch (notifError) {
      console.error('⚠️ Failed to send in-app notification:', notifError);
    }

    // 🔔 NEW: SEND EMAILS TO SUBSCRIBERS
    try {
      console.log('📧 Sending email notifications to trip subscribers...');
      await notifyTripSubscribersByEmail(doc.name, doc);
      console.log('✅ Email notifications sent to subscribers!');
    } catch (emailError) {
      console.error('⚠️ Failed to send email notifications:', emailError);
    }

    res.status(201).json({ trip: doc });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Duplicate trip' });
    next(err);
  }
}

export async function getTrips(req, res, next) {
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
    
    const docs = await Trip.find(query).sort(sort);
    res.json(docs);
  } catch (err) { next(err); }
}

export async function getTripById(req, res, next) {
  try {
    const doc = await Trip.findById(req.params.id).populate('itinerary');
    if (!doc) return res.status(404).json({ message: 'Trip not found' });
    res.json(doc);
  } catch (err) { next(err); }
}

export async function updateTrip(req, res, next) {
  try {
    // allow partial updates by making schema keys optional
    const optionalSchema = TripSchema.fork(Object.keys(TripSchema.describe().keys), (s) => s.optional());
    const { error, value } = optionalSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    // fetch existing trip to check start date
    const existing = await Trip.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Trip not found' });

    const now = new Date();
    if (existing.start && existing.start <= now) {
      return res.status(403).json({ message: 'Trip cannot be edited after its start date' });
    }

    const doc = await Trip.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    res.json({ trip: doc });
  } catch (err) { next(err); }
}

export async function deleteTrip(req, res, next) {
  try {
    const id = req.params.id;

    // check for existing registrations
    const registrations = await RegisterTrip.countDocuments({ TripName: id });
    if (registrations > 0) {
      return res.status(403).json({ message: 'Cannot delete trip with existing registrations' });
    }

    const doc = await Trip.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'Trip not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

export const getTrip = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the trip and populate itinerary items
    const trip = await Trip.findById(id)
      .populate({
        path: 'itinerary',
        options: { sort: { date: 1 } } // Sort by date ascending
      })
      .lean();

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Count number of registered students/staff who have PAID
    const registeredCount = await RegisterTrip.countDocuments({
      TripName: id,
      PaymentStatus: 'Paid'
    });

    // Attach count to the result
    trip.registeredCount = registeredCount;

    // Sort itinerary items by date and time within each date
    if (trip.itinerary && trip.itinerary.length > 0) {
      trip.itinerary.sort((a, b) => {
        // First sort by date
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        
        // Then sort by time (from/to for attractions, time for travel)
        const timeA = a.time || a.from || "00:00";
        const timeB = b.time || b.from || "00:00";
        return timeA.localeCompare(timeB);
      });
    }

    res.json(trip);

  } catch (err) {
    console.error("Error fetching trip:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export async function createTrip2(req, res, next) {
  try {
    if (req.body.restrictedTo && typeof req.body.restrictedTo === 'string') {
  try {
    req.body.restrictedTo = JSON.parse(req.body.restrictedTo);
  } catch (err) {
    return res.status(400).json({ message: 'Invalid restrictedTo array' });
  }
}

// Parse itinerary
if (req.body.itinerary && typeof req.body.itinerary === 'string') {
  try {
    req.body.itinerary = JSON.parse(req.body.itinerary);
  } catch (err) {
    return res.status(400).json({ message: 'Invalid itinerary array' });
  }
}
    const { itinerary: itineraryJSON, ...tripData } = req.body;
  // ✅ Fix: Log the correct variable name
  console.log(req.body);
  console.log(itineraryJSON);
    console.log('Itinerary JSON:', itineraryJSON);
    // Extract time from start datetime if not provided
    if (!tripData.time && tripData.start) {
      const startDate = new Date(tripData.start);
      tripData.time = startDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }

    // Validate trip data
    console.log("reachedddd");
    const { value, error } = TripSchema.validate(tripData, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });
console.log("reachedddddddd");
    // Date validations
    if (new Date(value.end) < new Date(value.start)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }
    if (new Date(value.start) < new Date()) {
      return res.status(400).json({ message: 'Start date must be in the future' });
    }
    if (new Date(value.registrationDeadline) > new Date(value.start)) {
      return res.status(400).json({ message: 'Registration deadline must be before start date' });
    }

    // Create the trip
    const doc = await Trip.create({ ...value });
console.log("india");
    // Handle itinerary with image uploads
    if (itineraryJSON) {
      const itineraryItems = itineraryJSON;

      // Create a map of uploaded files by fieldname
      const filesMap = {};
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach(file => {
          filesMap[file.fieldname] = file;
        });
      }

      const createdItems = await Promise.all(
        itineraryItems.map(async (item, index) => {
          let imageUrl = item.imageUrl || null;

          // Upload image to Cloudinary if present
          const fieldName = `itinerary_image_${index}`;
          if (item.hasImage && filesMap[fieldName]) {
            const file = filesMap[fieldName];

            try {
              const result = await uploadToCloudinary(file.buffer);
              imageUrl = result.secure_url;
              console.log(`✅ Uploaded image for itinerary item ${index}: ${imageUrl}`);
            } catch (uploadError) {
              console.error(`❌ Error uploading image for item ${index}:`, uploadError);
              // Continue without image if upload fails
            }
          }

          // Remove temporary fields
          const { hasImage, imageIndex, imageFile, id, ...itemData } = item;

          // Create itinerary item
          return await ItineraryItem.create({
            ...itemData,
            imageUrl,
            trip: doc._id,
          });
        })
      );

      // Update trip with itinerary items
      doc.itinerary = createdItems.map((i) => i._id);
      await doc.save();
    }

    // 🔔 KEEP ORIGINAL NOTIFICATION SYSTEM (in-app notifications)
    try {
      console.log('📱 Sending in-app notification for new trip...');
      await notifyNewEvent('Trip', doc);
      console.log('✅ In-app notification sent!');
    } catch (notifError) {
      console.error('⚠️ Failed to send in-app notification:', notifError);
    }

    // 🔔 NEW: SEND EMAILS TO SUBSCRIBERS
    try {
      console.log('📧 Sending email notifications to trip subscribers...');
      await notifyTripSubscribersByEmail(doc.name, doc);
      console.log('✅ Email notifications sent to subscribers!');
    } catch (emailError) {
      console.error('⚠️ Failed to send email notifications:', emailError);
    }

    // Populate itinerary items in response
    await doc.populate('itinerary');

    res.status(201).json({ trip: doc });

  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Duplicate trip' });
    console.error('Error creating trip:', err);
    next(err);
  }
}