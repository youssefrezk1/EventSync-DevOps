import { Bazaar } from "../models/Bazaar.js";
import { RegisterBazaar } from "../models/RegisterBazaar.js";
import { RegisterBooth } from "../models/RegisterBooth.js";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";
import { notifyVendorRequest } from '../controllers/notificationController.js';

/**
 * 59. GET all upcoming bazaars (start date strictly after now)
 * Returns bazaars with hasApplied flag for the authenticated vendor
 */
export const getUpcomingBazaars = async (req, res) => {
  try {
    const now = new Date();
    const vendorId = req.user._id; // Get vendor ID from auth middleware

    const upcomingBazaars = await Bazaar.find({ start: { $gt: now } }).sort({
      start: 1,
    });

    if (!upcomingBazaars.length) {
      return res.status(404).json({ message: "No upcoming bazaars found." });
    }

    // Check which bazaars the vendor has already applied to
    const bazaarIds = upcomingBazaars.map((b) => b._id);
    const applications = await RegisterBazaar.find({
      BazaarName: { $in: bazaarIds },
      VendorName: vendorId,
    }).select("BazaarName");

    const appliedBazaarIds = new Set(
      applications.map((app) => app.BazaarName.toString())
    );

    // Add hasApplied flag to each bazaar
    const bazaarsWithStatus = upcomingBazaars.map((bazaar) => ({
      ...bazaar.toObject(),
      hasApplied: appliedBazaarIds.has(bazaar._id.toString()),
    }));

    res.status(200).json(bazaarsWithStatus);
  } catch (error) {
    console.error("Error fetching upcoming bazaars:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching upcoming bazaars." });
  }
};

/**
 * 60. POST: Vendor applies to join a bazaar
 */
export const applyToBazaar = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { BazaarName, Attendees, BoothSize } = req.body;
    console.log("📩 Received applyToBazaar request:", req.body);

    // Parse attendees safely
    let parsedAttendees;
    try {
      parsedAttendees = JSON.parse(Attendees);
    } catch (err) {
      return res.status(400).json({ message: "Invalid Attendees format." });
    }

    console.log("👥 Parsed Attendees:", parsedAttendees);

    // 🔹 Validation
    if (!BazaarName || !parsedAttendees || !BoothSize)
      return res.status(400).json({ message: "All fields are required." });

    if (!Array.isArray(parsedAttendees) || parsedAttendees.length === 0)
      return res.status(400).json({ message: "Please provide at least one attendee." });

    if (parsedAttendees.length > 5)
      return res.status(400).json({ message: "Maximum 5 attendees are allowed." });

    if (!["2x2", "4x4"].includes(BoothSize))
      return res.status(400).json({ message: "Invalid booth size. Choose 2x2 or 4x4." });

    // 🔹 Check bazaar existence
    const bazaar = await Bazaar.findById(BazaarName);
    if (!bazaar)
      return res.status(404).json({ message: "Bazaar not found." });

    // 🔹 Prevent duplicate applications
    const existingApplication = await RegisterBazaar.findOne({
      BazaarName,
      VendorName: vendorId,
    });
    if (existingApplication)
      return res.status(400).json({ message: "You already applied for this bazaar." });

    // 🔹 Handle file uploads (PhotoIDs)
    let uploadedPhotos = [];
    if (req.files && req.files.PhotoIDs && req.files.PhotoIDs.length > 0) {
      console.log("🖼 Uploading PhotoIDs to Cloudinary...");

      for (const file of req.files.PhotoIDs) {
        try {
          const uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: "bazaar_photoIDs",
            resource_type: "auto",
          });

          uploadedPhotos.push({
            public_id: uploadResult.public_id,
            url: uploadResult.secure_url,
          });

          // Delete temp file
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch (uploadErr) {
          console.error("❌ Cloudinary upload error:", uploadErr);
          // Cleanup temp files
          req.files.PhotoIDs.forEach(f => {
            if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
          });
          return res.status(500).json({ message: "Photo upload failed.", error: uploadErr.message });
        }
      }

      console.log("✅ Uploaded PhotoIDs successfully.");
    } else {
      return res.status(400).json({ message: "At least one Photo ID is required." });
    }

    // 🔹 Save registration
    const registration = new RegisterBazaar({
      BazaarName,
      VendorName: vendorId,
      Attendees: parsedAttendees,
      BoothSize,
      PhotoIDs: uploadedPhotos,
      Pending: "Pending",
    });

    await registration.save();

    // 🔔 SEND NOTIFICATION TO EVENTS OFFICE & ADMIN
    try {
      console.log('📧 Sending bazaar vendor request notification to Events Office & Admin...');
      await notifyVendorRequest('RegisterBazaar', registration);
      console.log('✅ Bazaar vendor request notification sent!');
    } catch (notifError) {
      console.error('⚠️ Failed to send vendor request notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      message: "Successfully applied to join the bazaar.",
      registration,
    });
  } catch (error) {
    console.error("💥 Error applying to bazaar:", error);
    res.status(500).json({ message: "Server error while applying to bazaar.", error: error.message });
  }
};

//apply for a booth (61)
//apply for a booth with Cloudinary upload
export const applyForBooth = async (req, res) => {
  try {
    console.log("Received applyForBooth request:", req.body);
    console.log("Files:", req.files);
    
    const vendorId = req.user._id;
    const vendorName = req.user.name;

    const {
      Attendees,
      SetupDuration,
      Location,
      BoothSize,
      startDate,
    } = req.body;

    // Parse attendees safely
    let parsedAttendees;
    try {
      parsedAttendees = JSON.parse(Attendees);
    } catch (err) {
      return res.status(400).json({ message: "Invalid Attendees format." });
    }

    console.log("Parsed Attendees:", parsedAttendees);
    console.log("Start Date:", startDate);

    // 🔹 Validation
    if (!parsedAttendees || !SetupDuration || !Location || !BoothSize || !startDate) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!Array.isArray(parsedAttendees) || parsedAttendees.length === 0) {
      return res.status(400).json({ message: "Please provide at least one attendee." });
    }

    if (parsedAttendees.length > 5) {
      return res.status(400).json({ message: "Maximum 5 attendees are allowed." });
    }

    const validDurations = ["1 week", "2 weeks", "3 weeks", "4 weeks"];
    if (!validDurations.includes(SetupDuration)) {
      return res.status(400).json({ message: "Invalid setup duration (1–4 weeks)." });
    }

    if (!["2x2", "4x4"].includes(BoothSize)) {
      return res.status(400).json({ message: "Invalid booth size. Choose 2x2 or 4x4." });
    }

    // 🔹 Prevent duplicate pending applications at same location
    const existingApplication = await RegisterBooth.findOne({
      VendorID: vendorId,
      Location,
      Pending: "Pending",
    });
    
    if (existingApplication) {
      return res.status(400).json({
        message: "You already have a pending booth application at this location.",
      });
    }

    // 🔹 Handle file uploads (PhotoIDs) to Cloudinary
    let uploadedPhotos = [];
    if (req.files && req.files.photos && req.files.photos.length > 0) {
      console.log("🖼 Uploading photos to Cloudinary...");

      for (const file of req.files.photos) {
        try {
          const uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: "booth_photoIDs",
            resource_type: "auto",
          });

          uploadedPhotos.push({
            public_id: uploadResult.public_id,
            url: uploadResult.secure_url,
          });

          // Delete temp file after successful upload
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (uploadErr) {
          console.error("❌ Cloudinary upload error:", uploadErr);
          
          // Cleanup all temp files on error
          req.files.photos.forEach(f => {
            if (fs.existsSync(f.path)) {
              fs.unlinkSync(f.path);
            }
          });
          
          return res.status(500).json({ 
            message: "Photo upload failed.", 
            error: uploadErr.message 
          });
        }
      }

      console.log("✅ Uploaded photos successfully:", uploadedPhotos);
    } else {
      return res.status(400).json({ 
        message: "At least one Photo ID is required for all attendees." 
      });
    }

    // Validate that number of photos matches number of attendees
    if (uploadedPhotos.length !== parsedAttendees.length) {
      // Cleanup uploaded photos if validation fails
      for (const photo of uploadedPhotos) {
        try {
          await cloudinary.uploader.destroy(photo.public_id);
        } catch (err) {
          console.error("Error deleting photo from Cloudinary:", err);
        }
      }
      
      return res.status(400).json({ 
        message: `Please provide exactly ${parsedAttendees.length} photo(s) for ${parsedAttendees.length} attendee(s).` 
      });
    }

    // ✅ Create registration with StartDate and uploaded photos
    const registration = new RegisterBooth({
      VendorID: vendorId,
      VendorName: vendorName,
      Attendees: parsedAttendees,
      SetupDuration,
      Location,
      BoothSize,
      PhotoIDs: uploadedPhotos,
      StartDate: new Date(startDate),
      Pending: "Pending",
    });

    await registration.save();

    // 🔔 SEND NOTIFICATION TO EVENTS OFFICE & ADMIN
    try {
      console.log('📧 Sending booth vendor request notification to Events Office & Admin...');
      await notifyVendorRequest('RegisterBooth', registration);
      console.log('✅ Booth vendor request notification sent!');
    } catch (notifError) {
      console.error('⚠️ Failed to send vendor request notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      message: "Successfully applied for booth setup. Await admin approval.",
      registration,
    });
  } catch (error) {
    console.error("💥 Error applying for booth:", error);
    
    // Cleanup temp files if they exist
    if (req.files && req.files.photos) {
      req.files.photos.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ 
      message: "Server error while applying for booth.",
      error: error.message 
    });
  }
};

/**
 * 62. Upload vendor IDs
 */
export const uploadVendorIDs = async (req, res) => {
  try {
    const { type, registrationId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "attendee_IDs",
      });

      uploadedImages.push({
        public_id: result.public_id,
        url: result.secure_url,
      });

      fs.unlinkSync(file.path);
    }

    let updatedDoc;
    if (type === "bazaar") {
      updatedDoc = await RegisterBazaar.findByIdAndUpdate(
        registrationId,
        { $push: { PhotoIDs: { $each: uploadedImages } } },
        { new: true }
      );
    } else if (type === "booth") {
      updatedDoc = await RegisterBooth.findByIdAndUpdate(
        registrationId,
        { $push: { PhotoIDs: { $each: uploadedImages } } },
        { new: true }
      );
    } else {
      return res
        .status(400)
        .json({ message: 'Invalid type. Use "bazaar" or "booth".' });
    }

    if (!updatedDoc) {
      return res.status(404).json({ message: "Registration not found." });
    }

    res.status(200).json({
      message: "Photo IDs uploaded successfully.",
      data: updatedDoc,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Check if a booth location is available for the requested time period
 * Returns availability status based on overlapping registrations
 */
export const checkBoothAvailability = async (req, res) => {
  try {
    const { SetupDuration, Location, startDate } = req.body;

    // 🔹 Validation
    if (!SetupDuration || !Location || !startDate) {
      return res.status(400).json({ 
        message: "SetupDuration, Location, and startDate are required." 
      });
    }

    const validDurations = ["1 week", "2 weeks", "3 weeks", "4 weeks"];
    if (!validDurations.includes(SetupDuration)) {
      return res.status(400).json({ 
        message: "Invalid setup duration. Must be 1-4 weeks." 
      });
    }

    // 🔹 Calculate end date for the requested period
    const requestedStart = new Date(startDate);
    const weeks = parseInt(SetupDuration.split(' ')[0]);
    const requestedEnd = new Date(requestedStart);
    requestedEnd.setDate(requestedEnd.getDate() + weeks * 7);

    console.log("🔍 Checking availability for:", {
      Location,
      requestedStart,
      requestedEnd,
      SetupDuration
    });

    // 🔹 Find all accepted/pending booth registrations at this location
    const existingBooths = await RegisterBooth.find({
      Location,
      Pending: { $in: ['Pending', 'Accept'] }, // Only check non-rejected booths
      StartDate: { $exists: true },
      EndDate: { $exists: true }
    }).select('StartDate EndDate SetupDuration VendorName Pending');

    console.log(`📊 Found ${existingBooths.length} existing booth(s) at this location`);

    // 🔹 Check for overlaps
    const overlappingBooths = [];
    
    for (const booth of existingBooths) {
      const boothStart = new Date(booth.StartDate);
      const boothEnd = new Date(booth.EndDate);

      // Check if date ranges overlap
      // Overlap occurs if: (requestedStart < boothEnd) AND (requestedEnd > boothStart)
      const hasOverlap = requestedStart < boothEnd && requestedEnd > boothStart;

      if (hasOverlap) {
        overlappingBooths.push({
          startDate: boothStart,
          endDate: boothEnd,
          duration: booth.SetupDuration,
          status: booth.Pending
        });
      }
    }

    // 🔹 Determine availability
    if (overlappingBooths.length > 0) {
      console.log("❌ Location NOT available - overlaps found");
      return res.status(200).json({
        available: false,
        message: "This location is not available for the requested time period.",
        requestedPeriod: {
          start: requestedStart,
          end: requestedEnd,
          duration: SetupDuration
        },
        conflicts: overlappingBooths,
        conflictCount: overlappingBooths.length
      });
    }

    console.log("✅ Location is available!");
    return res.status(200).json({
      available: true,
      message: "This location is available for the requested time period.",
      requestedPeriod: {
        start: requestedStart,
        end: requestedEnd,
        duration: SetupDuration
      }
    });

  } catch (error) {
    console.error("💥 Error checking booth availability:", error);
    return res.status(500).json({ 
      message: "Server error while checking availability.",
      error: error.message 
    });
  }
};