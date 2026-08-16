import { RegisterBazaar } from '../models/RegisterBazaar.js';
import { RegisterBooth } from '../models/RegisterBooth.js';
import { Vendor } from '../models/Vendor.js';
import { Bazaar } from '../models/Bazaar.js';

// ✅ GET Upcoming Events (using token)
export const getUpcomingEvents = async (req, res) => {
  try {
    const vendorId = req.id; // ✅ Extracted from token

    // ✅ Verify vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // ✅ Fetch all accepted bazaar registrations for this vendor
    const bazaars = await RegisterBazaar.find({
      VendorName: vendorId,
      Pending: 'Accept',
    })
      .populate({
        path: 'BazaarName',
        match: { start: { $gte: new Date() } }, // Only upcoming bazaars
        select: 'name start endDate location',
      })
      .lean();

    // ✅ Filter out nulls (in case some bazaar dates are in the past)
    const upcomingBazaars = bazaars
      .filter(b => b.BazaarName !== null)
      .map(b => ({
        _id: b._id,
        type: 'Bazaar',
        name: b.BazaarName.name,
        start: b.BazaarName.start,
        status:b.Pending ,
        paymentStatus:b.PaymentStatus,
         PaymentFees:b.PaymentFees,
         deadline:b.PaymentDueDate,
        endDate: b.BazaarName.endDate,
        location: b.BazaarName.location,
        boothSize: b.BoothSize,
        attendees: b.Attendees,
        photos: b.PhotoIDs,
      }));

    // ✅ Fetch all accepted booth setups with upcoming start date
    const booths = await RegisterBooth.find({
      VendorID: vendorId,
      Pending: 'Accept',
      StartDate: { $gte: new Date() },
    }).lean();

    const upcomingBooths = booths.map(b => ({
      _id: b._id,
      type: 'Booth',
      start: b.StartDate,
      status:b.Pending,
      paymentStatus:b.PaymentStatus,
      deadline:b.PaymentDueDate,
       PaymentFees:b.PaymentFees,
      endDate: b.EndDate,
      location: b.Location,
      boothSize: b.BoothSize,
      duration:b.SetupDuration,
      attendees: b.Attendees,
      photos: b.PhotoIDs,
    }));

    // ✅ Combine and sort by start date (bazaar.start vs booth.StartDate)
    const upcomingEvents = [...upcomingBazaars, ...upcomingBooths].sort(
      (a, b) => new Date(a.start) - new Date(b.start)
    );

    res.status(200).json({
      success: true,
      vendorCompanyName: vendor.companyName,
      count: upcomingEvents.length,
      data: upcomingEvents,
    });
  } catch (error) {
    console.error('Error in getUpcomingEvents:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// ✅ GET Requested Events (using token)
export const getRequestedEvents = async (req, res) => {
  try {
    const vendorId = req.id; // ✅ From token

    // ✅ Verify vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // ✅ Fetch bazaar requests with Pending or Rejected status
    const bazaars = await RegisterBazaar.find({
      VendorName: vendorId,
      Pending: { $in: ['Pending', 'Reject'] },
    })
      .populate({
        path: 'BazaarName',
        match: { start: { $gte: new Date() } }, // ✅ match actual 'start' field
        select: 'name start endDate location',
      })
      .lean();

    // ✅ Filter valid bazaars and shape data
    const requestedBazaars = bazaars
      .filter(b => b.BazaarName !== null)
      .map(b => ({
        _id: b._id,
        type: 'Bazaar',
        status: b.Pending,
        paymentStatus:b.PaymentStatus,
         PaymentFees:b.PaymentFees,
        name: b.BazaarName.name,
        start: b.BazaarName.start,
        endDate: b.BazaarName.endDate,
        location: b.BazaarName.location,
        boothSize: b.BoothSize,
        attendees: b.Attendees,
        photos: b.PhotoIDs,
      }));

    // ✅ Fetch booth requests with Pending or Rejected status
    const booths = await RegisterBooth.find({
      VendorID: vendorId,
      Pending: { $in: ['Pending', 'Reject'] },
      StartDate: { $gte: new Date() },
    }).lean();

    const requestedBooths = booths.map(b => ({
      _id: b._id,
      type: 'Booth',
      status: b.Pending,
      paymentStatus:b.PaymentStatus,
      PaymentFees:b.PaymentFees,
      start: b.StartDate,
      endDate: b.EndDate,
      location: b.Location,
      boothSize: b.BoothSize,
      attendees: b.Attendees,
      photos: b.PhotoIDs,
    }));

    // ✅ Combine and sort by start date
    const requestedEvents = [...requestedBazaars, ...requestedBooths].sort(
      (a, b) => new Date(a.start) - new Date(b.start)
    );

    res.status(200).json({
      success: true,
      vendorCompanyName: vendor.companyName,
      count: requestedEvents.length,
      data: requestedEvents,
    });
  } catch (error) {
    console.error('Error in getRequestedEvents:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
