import { RegisterWorkshop } from '../models/RegisterWorkshop.js';
import { RegisterTrip } from '../models/RegisterTrip.js';

export async function getMyRegistrations(req, res, next) {
  try {
    const userId = req.user.studentId || req.user._id;
    const role = req.role;

    let field;
    if (role === 'student') field = 'StudentID';
    else field = 'StaffID';

    const workshopRegs = await RegisterWorkshop.find({ [field]: userId })
      .populate('WorkshopName')
      .sort({ createdAt: -1 });

    const tripRegs = await RegisterTrip.find({ [field]: userId })
      .populate('TripName')
      .sort({ createdAt: -1 });

    const now = new Date();

    const workshops = workshopRegs.map(reg => {
      const start = reg.WorkshopName.start;
      return {
        registrationId: reg._id,
        type: 'Workshop',
        name: reg.WorkshopName.name,
        location: reg.WorkshopName.location,
        start,
        end: reg.WorkshopName.end,
        time: reg.WorkshopName.time,
        shortDescription: reg.WorkshopName.shortDescription,
        registrationStatus: start < now ? 'Past' : 'Upcoming',
        eventID: reg.WorkshopName._id
      };
    });

    const trips = tripRegs.map(reg => {
      const start = reg.TripName.start;
      return {
        registrationId: reg._id,
        type: 'Trip',
        name: reg.TripName.name,
        location: reg.TripName.location,
        start,
        end: reg.TripName.end,
        time: reg.TripName.time,
        shortDescription: reg.TripName.shortDescription,
        registrationStatus: start < now ? 'Past' : 'Upcoming',
        eventID: reg.TripName._id
      };
    });

    const allRegistrations = [...workshops, ...trips].sort((a, b) => a.start - b.start);
    res.json({ registrations: allRegistrations });
  } catch (err) {
    next(err);
  }
}
export async function getMyRegistrations2(req, res, next) {
  try {
    const userId = req.user.staffId;
    const role = req.role;
    console.log("User ID:", userId);
    console.log("Role:", role);
    let field;
    if (role === 'Professor'|| role === 'Staff'|| role === 'TA') field = 'StaffID';
    else field = 'StudentID';

    const workshopRegs = await RegisterWorkshop.find({ [field]: userId })
      .populate('WorkshopName')
      .sort({ createdAt: -1 });

    const tripRegs = await RegisterTrip.find({ [field]: userId })
      .populate('TripName')
      .sort({ createdAt: -1 });

    const now = new Date();

    // Filter out registrations where WorkshopName is null and map
    const workshops = workshopRegs
      .filter(reg => reg.WorkshopName != null)
      .map(reg => {
        const start = reg.WorkshopName.start;
        return {
          registrationId: reg._id,
          type: 'Workshop',
          name: reg.WorkshopName.name,
          location: reg.WorkshopName.location,
          start,
          end: reg.WorkshopName.end,
          time: reg.WorkshopName.time,
          shortDescription: reg.WorkshopName.shortDescription,
          registrationStatus: start < now ? 'Past' : 'Upcoming',
          eventID: reg.WorkshopName._id
        };
      });

    // Filter out registrations where TripName is null and map
    const trips = tripRegs
      .filter(reg => reg.TripName != null)
      .map(reg => {
        const start = reg.TripName.start;
        return {
          registrationId: reg._id,
          type: 'Trip',
          name: reg.TripName.name,
          location: reg.TripName.location,
          start,
          end: reg.TripName.end,
          time: reg.TripName.time,
          shortDescription: reg.TripName.shortDescription,
          registrationStatus: start < now ? 'Past' : 'Upcoming',
          eventID: reg.TripName._id
        };
      });

    const allRegistrations = [...workshops, ...trips].sort((a, b) => a.start - b.start);
    res.json({ registrations: allRegistrations });
  } catch (err) {
    next(err);
  }
}
