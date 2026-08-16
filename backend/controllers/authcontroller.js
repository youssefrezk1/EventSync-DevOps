import jwt from "jsonwebtoken";
import Joi from "joi";

import { Admin } from '../models/Admin.js';
import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';
import { Vendor } from '../models/Vendor.js';
import { EventOffice } from '../models/EventOffice.js';
import { Restraunt } from '../models/Restraunt.js';
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendStudentVerificationEmail } from "../utils/emailService.js";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";
import 'dotenv/config'; 

const createToken = (user, role) => {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const registerStudentSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(3).max(30).required(),
    lastName: Joi.string().min(3).max(30).required(),
    studentId: Joi.string().min(3).max(30).required(),
});

const registerStaffSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(3).max(30).required(),
    lastName: Joi.string().min(3).max(30).required(),
    staffId: Joi.string().min(3).max(30).required(),
    dummyrole: Joi.string().valid('Staff', 'TA', 'Professor').required(),
});

const registerVendorSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    companyName: Joi.string().min(3).max(100).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export async function registerStudent(req, res, next) {
  try {
    const { value, error } = registerStudentSchema.validate(req.body);
     if (error) {
      // Return field-specific validation errors
      return res.status(400).json({ 
        message: error.message,
        field: error.details[0]?.path[0] // e.g., 'email', 'password'
      });
    }

    const existing = await Student.findOne({ email: value.email });
    if (existing) {
      return res.status(400).json({ 
        message: 'Email already in use',
        field: 'email'
      });
    }
    
    const existing2 = await Student.findOne({ studentId: value.studentId });
    if (existing2) {
      return res.status(400).json({ 
        message: 'Student ID already in use',
        field: 'studentId'
      });
    }


    const passwordHash = await bcrypt.hash(value.password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const user = await Student.create({ 
      firstName: value.firstName, 
      lastName: value.lastName, 
      email: value.email, 
      passwordHash, 
      studentId: value.studentId, 
      verificationToken 
    });
    
    await sendStudentVerificationEmail(user, verificationToken);
    res.status(201).json({ message: 'Registration successful! Please check your email to verify your account.' });
  } catch (err) { 
    next(err); 
  }
}

export async function registerStaff(req, res, next) {
  try {
    const { value, error } = registerStaffSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: error.message,
        field: error.details[0]?.path[0]
      });
    }

    const existing = await Staff.findOne({ email: value.email });
    if (existing) {
      return res.status(400).json({ 
        message: 'Email already in use',
        field: 'email'
      });
    }
    
    const existing2 = await Staff.findOne({ staffId: value.staffId });
    if (existing2) {
      return res.status(400).json({ 
        message: 'Staff ID already in use',
        field: 'staffId'
      });
    }

    const passwordHash = await bcrypt.hash(value.password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const user = await Staff.create({ 
      firstName: value.firstName, 
      lastName: value.lastName, 
      email: value.email, 
      passwordHash, 
      staffId: value.staffId,
      verificationToken,
      dummyrole: value.dummyrole,
    });
    
    return res.status(201).json({ message: 'Staff registered successfully! Awaiting admin approval.' });
  } catch (err) { 
    next(err); 
  }
}

export async function registerVendor(req, res, next) {
  console.log("🟢 Vendor signup hit");

  try {
    console.log("STEP 1️⃣: Validating vendor data...");
    const { value, error } = registerVendorSchema.validate(req.body);
    if (error) {
      console.error("❌ Validation Error:", error.message);
      return res.status(400).json({ message: error.message });
    }

    console.log("STEP 2️⃣: Checking file uploads...");
    if (!req.files || !req.files.logo || !req.files.taxCard) {
      console.error("❌ Missing files:", req.files);
      return res.status(400).json({ message: "Logo and tax card are required" });
    }

    console.log("STEP 3️⃣: Checking for existing vendor...");
    const existing = await Vendor.findOne({ email: value.email });
   if (existing) {
  return res.status(400).json({ 
    message: 'Email already in use',
    field: 'email'
  });
}



    const existing2 = await Vendor.findOne({ companyName: value.companyName });
   if (existing2) {
  return res.status(400).json({ 
    message: 'Company Name already in use',
    field: 'companyName'
  });
}

    console.log("STEP 4️⃣: Hashing password...");
    const passwordHash = await bcrypt.hash(value.password, 10);

    console.log("STEP 5️⃣: Uploading files to Cloudinary...");
    let logoData = null;
    let taxCardData = null;

    try {
      console.log("   ↳ Uploading logo...");
      const logoResult = await cloudinary.uploader.upload(req.files.logo[0].path, {
        folder: "vendor_logos",
        resource_type: "auto",
      });
      logoData = {
        public_id: logoResult.public_id,
        url: logoResult.secure_url,
      };
      console.log("   ✅ Logo uploaded successfully.");

      if (fs.existsSync(req.files.logo[0].path)) fs.unlinkSync(req.files.logo[0].path);

      console.log("   ↳ Uploading tax card...");
      const taxCardResult = await cloudinary.uploader.upload(req.files.taxCard[0].path, {
        folder: "vendor_taxcards",
        resource_type: "auto",
      });
      taxCardData = {
        public_id: taxCardResult.public_id,
        url: taxCardResult.secure_url,
      };
      console.log("   ✅ Tax card uploaded successfully.");

      if (fs.existsSync(req.files.taxCard[0].path)) fs.unlinkSync(req.files.taxCard[0].path);

    } catch (uploadErr) {
      console.error("❌ STEP 5️⃣ Upload Error:", uploadErr);
      // Cleanup temp files
      if (req.files.logo?.[0]?.path && fs.existsSync(req.files.logo[0].path)) fs.unlinkSync(req.files.logo[0].path);
      if (req.files.taxCard?.[0]?.path && fs.existsSync(req.files.taxCard[0].path)) fs.unlinkSync(req.files.taxCard[0].path);
      return res.status(500).json({ message: "File upload failed", error: uploadErr.message });
    }

    console.log("STEP 6️⃣: Creating vendor document in MongoDB...");
    const user = await Vendor.create({
      companyName: value.companyName,
      email: value.email,
      passwordHash,
      logo: [logoData],
      taxCard: [taxCardData],
    });

    console.log("STEP 7️⃣: Generating JWT...");
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: "vendor" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    console.log("✅ Vendor registered successfully:", user.email);
    res.status(201).json({
      message: "Vendor registered successfully! Please wait for admin verification.",
      token,
      role: "vendor",
      email: user.email,
      companyName: user.companyName,
    });

  } catch (error) {
    console.error("💥 CRITICAL ERROR in registerVendor:", error);
    return res.status(500).json({
      message: "Vendor registration failed at an unexpected step.",
      error: error.message,
    });
  }
}


export async function login(req, res, next) {
  try {
    const { value, error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const email = value.email.toLowerCase();
    const password = value.password;

    let existingUser = null;
    let role = "";

    // Try finding user in each collection
    if ((existingUser = await Student.findOne({ email }))) {
      role = "student";
    } else if ((existingUser = await Staff.findOne({ email }))) {
      console.log("Staff user found during login");
      role = "staff";
    } else if ((existingUser = await Vendor.findOne({ email }))) {
      role = "vendor";
    } else if ((existingUser = await Admin.findOne({ email }))) {
      role = "admin";
    } else if ((existingUser = await EventOffice.findOne({ email }))) {
      role = "event-office";
    } else if ((existingUser = await Restraunt.findOne({ email }))) {
      role = "restaurant";
    }

    if (!existingUser) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if staff is verified by admin
    if (role === "staff" && existingUser.isPending === "isPending") {
      return res.status(403).json({ message: "Your account is pending approval by an admin." });
    }

    // Check if user is verified (for Student, Staff and Vendor roles)
    if ((role === "student" || role === "staff" || role === "vendor") && !existingUser.isVerified) {
      return res.status(403).json({ message: "Please verify your email or wait for admin verification before logging in." });
    }

    if(existingUser.status=="Blocked"){
      return  res.status(403).json({ message: "Your account has been blocked. Please contact support." });
    }
    if(role==="staff"){
      role=existingUser.role; 
      console.log(role);// Use the specific role assigned to the staff member
    }
 
    const token = createToken(existingUser, role);
       console.log(token);
    res.status(200).json({
      message: "Login successful",
      token,
      role,
      email: existingUser.email,
      firstName: existingUser.firstName,
  lastName: existingUser.lastName,
  studentId: existingUser.studentId || null,
  staffId: existingUser.staffId || null,
    });
  } catch (err) {
    next(err);
  }
}

export const verifyStudent = async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ message: "Token missing" });

    const user = await Student.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.isVerified = true; 
    user.verificationToken = undefined;
    await user.save();

    // ✅ No redirect needed now
    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const verifyStaff = async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ message: "Token missing" });

    const user = await Staff.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.isVerified = true; 
    user.verificationToken = undefined;
    await user.save();

    // ✅ No redirect needed now
    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
