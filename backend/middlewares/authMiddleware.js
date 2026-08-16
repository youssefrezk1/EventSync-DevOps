import jwt from 'jsonwebtoken';
import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';
import { Vendor } from '../models/Vendor.js';
import { Admin } from '../models/Admin.js';
import { EventOffice } from '../models/EventOffice.js';
import { Restraunt } from '../models/Restraunt.js';
//import { User } from '../models/Users.js';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' '); // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { id, role } = payload;

    let user = null;

    // Find user based on their role
    switch (role) {
      case 'student':
        user = await Student.findById(id);
        break;
      case 'Staff':
        user = await Staff.findById(id);
        break;
      case 'Professor':
        user = await Staff.findById(id);
        break;
      case 'TA':
        user = await Staff.findById(id);
        break;
      case 'vendor':
        user = await Vendor.findById(id);
        break;
      case 'admin':
        user = await Admin.findById(id);
        break;
      case 'event-office':
        user = await EventOffice.findById(id);
        break;
      case 'restaurant':
        user = await Restraunt.findById(id);
        break;
      default:
        return res.status(403).json({ message: 'Invalid user role in token' });
    }

    // Separate “user not found” vs “unauthorized” clearly
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check verification or block status if applicable
    if (user.isVerified === false) {
      return res.status(403).json({ message: 'Account not verified' });
    }

    if (user.status && user.status === 'Blocked') {
      return res.status(403).json({ message: 'Account is blocked' });
    }

    // Attach user and role for next middleware or controller
    req.user = user;
    req.role = role;
    req.id = id;

    if (role === 'student') req.userCustomId = user.studentId;
    if (role === 'Staff' || role === 'Professor' || role === 'TA') req.userCustomId = user.staffId;
    if (role === 'vendor') req.vendorId = id; // Add vendor ID for vendor-specific routes

    next();
  } catch (err) {
    console.error('Auth Error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}



