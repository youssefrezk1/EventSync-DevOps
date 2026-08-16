import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';
import { Vendor } from '../models/Vendor.js';
import { Admin } from '../models/Admin.js';
import { EventOffice } from '../models/EventOffice.js';

export async function getAllUsers(req, res, next) {
  try {
    // Query each collection using the same pattern as other admin controller functions
    const [admins, students, staff, eventOffices] = await Promise.all([
      Admin.find().sort({ createdAt: -1 }).lean(),
      Student.find().sort({ createdAt: -1 }).lean(),
      Staff.find().sort({ createdAt: -1 }).lean(),
      EventOffice.find().sort({ createdAt: -1 }).lean(),
    ]);

    const normalizeAdmin = (a) => ({
      _id: a._id,
      name: a.adminName || '',
      email: a.email || '',
      role: 'admin',
      blocked: a.status === 'Blocked' || false,
      isVerified: a.isVerified !== undefined ? a.isVerified : true,
      createdAt: a.createdAt || null,
    });

    const normalizeStudent = (s) => ({
      _id: s._id,
      name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
      email: s.email || '',
      role: 'student',
      blocked: s.status === 'Blocked' || false,
      isVerified: s.isVerified !== undefined ? s.isVerified : false,
      createdAt: s.createdAt || null,
    });

    const normalizeStaff = (st) => ({
      _id: st._id,
      name: `${st.firstName || ''} ${st.lastName || ''}`.trim(),
      email: st.email || '',
      role: st.role || 'staff',
      blocked: st.status === 'Blocked' || false,
      isVerified: st.isVerified !== undefined ? st.isVerified : false,
      createdAt: st.createdAt || null,
    });

    // const normalizeVendor = (v) => ({
    //   _id: v._id,
    //   name: v.companyName || '',
    //   email: v.email || '',
    //   role: 'vendor',
    //   blocked: v.status === 'Blocked' || false,
    //   isVerified: v.isVerified !== undefined ? v.isVerified : false,
    //   createdAt: v.createdAt || null,
    // });

    const normalizeEventOffice = (e) => ({
      _id: e._id,
      name: e.adminName || '',
      email: e.email || '',
      role: 'eventoffice',
      blocked: e.status === 'Blocked' || false,
      isVerified: e.isVerified !== undefined ? e.isVerified : true,
      createdAt: e.createdAt || null,
    });

    let users = [
      ...admins.map(normalizeAdmin),
      ...students.map(normalizeStudent),
      ...staff.map(normalizeStaff),
      // ...vendors.map(normalizeVendor),
      ...eventOffices.map(normalizeEventOffice),
    ];

    // Optionally sort combined users by createdAt desc
    users = users.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    res.status(200).json({ success: true, users });
    console.log('Returned users count:', users.length);
  } catch (err) {
    next(err);
  }
}

export async function blockuser(req, res, next) {
  try {
    const userId = req.params.id;
    let user =
      (await Student.findById(userId)) ||
      (await Staff.findById(userId)) ||
      // (await Vendor.findById(userId)) ||
      (await Admin.findById(userId)) ||
      (await EventOffice.findById(userId));

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'Blocked';
    await user.save();

    res.status(200).json({ message: 'User blocked successfully' });
  } catch (err) {
    next(err);
  }
}

export async function unblockuser(req, res, next) {
  try {
    const userId = req.params.id;
    let user =
      (await Student.findById(userId)) ||
      (await Staff.findById(userId)) ||
      // (await Vendor.findById(userId)) ||
      (await Admin.findById(userId)) ||
      (await EventOffice.findById(userId));

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'Active';
    await user.save();

    res.status(200).json({ message: 'User unblocked successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getAllVendors(req, res, next) {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 }).lean();
        const normalizeVendor = (v) => ({
          _id: v._id,
          name: v.companyName || '',
          email: v.email || '',
          role: 'vendor',
          blocked: v.status === 'Blocked' || false,
          isVerified: v.isVerified !== undefined ? v.isVerified : false,
          createdAt: v.createdAt || null,
          logo: v.logo || '',
          taxcard: v.taxCard || '',
        });
    res.status(200).json({ success: true, users: vendors.map(normalizeVendor) });
  } catch (err) {
    next(err);
  }
}
export async function blockVendor(req, res, next) {
  try {
    const vendorId = req.params.id;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    vendor.status = 'Blocked';
    await vendor.save();
    res.status(200).json({ message: 'Vendor blocked successfully' });
  } catch (err) {
    next(err);
  }
}
export async function unblockVendor(req, res, next) {
  try {
    const vendorId = req.params.id;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    vendor.status = 'Active';
    await vendor.save();
    res.status(200).json({ message: 'Vendor unblocked successfully' });
  } catch (err) {
    next(err);
  }
}