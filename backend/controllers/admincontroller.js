import Joi from 'joi';
import { Admin } from '../models/Admin.js';
import { EventOffice } from '../models/EventOffice.js';
import { Staff } from '../models/Staff.js';
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import {sendStaffVerificationEmail} from '../utils/emailService.js';

export const createAdminSchema = Joi.object({
  adminName: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
     password: Joi.string().min(6).required(),
});
export async function registerAdmin(req, res, next) {
  try {
    const { value, error } = createAdminSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const existing = await Admin.findOne({ email: value.email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    // Check if studentId is already in use


    const passwordHash = await bcrypt.hash(value.password, 10);
    const user = await Admin.create({ adminName: value.adminName, email: value.email, passwordHash });
    res.status(201).json({ message: 'Admin registered successfully', adminId: user._id });

  } catch (err) { next(err); }
}
// get all admins
export async function getAllAdmins(req, res, next) {
  try {
    

    const admins = await Admin
      .find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });
 

    res.status(200).json({ 
      success: true,
      admins 
    });
    console.log(admins); // <-- match frontend shape
  } catch (err) {
    next(err);
  }
}
// get all admins
export async function getAllEventOffices(req, res, next) {
  try {


    const admins = await EventOffice
      .find()
      .sort({ createdAt: -1 })
      .lean();

     res.status(200).json({ eventOffices: admins }); // <-- match frontend shape
  } catch (err) {
    next(err);
  }
}
export async function registerEventOffice(req, res, next) {
  try {
    const { value, error } = createAdminSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const existing = await EventOffice.findOne({ email: value.email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    // Check if studentId is already in use


    const passwordHash = await bcrypt.hash(value.password, 10);
    const user = await EventOffice.create({ adminName: value.adminName, email: value.email, passwordHash });
    res.status(201).json({ message: 'Event office registered successfully', eventOfficeId: user._id });
  } catch (err) { next(err); }
}
export async function deleteAdmins(req, res, next) {
  try {
    const doc = await Admin.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Admin not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
export async function deleteEventOffices(req, res, next) {
  try {
    const doc = await EventOffice.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Event office not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

export async function updateStaffRole(req, res, next) {
  try {
    const { role } = req.body;
    const validRoles = ['Professor', 'TA', 'Staff'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    staff.role = role;
    staff.isPending = "Confirmed";

    // ✅ Generate and SAVE the token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    staff.verificationToken = verificationToken;
    staff.isVerified = false; // optional, ensure re-verification

    await staff.save();

    console.log('Email user:', process.env.EMAIL);
    console.log('Email pass:', process.env.EMAIL_PASSWORD ? 'Loaded' : 'Missing');

    // ✅ Now the token in DB matches the one sent in the email
    await sendStaffVerificationEmail(staff, verificationToken);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}


export async function getstaffPending(req, res, next) {
  try {
    

    const staff = await Staff
      .find({ isPending:"Pending" })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ staff }); // <-- match frontend shape
  } catch (err) {
    next(err);
  }
}
