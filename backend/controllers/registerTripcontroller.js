import Joi from 'joi';
import { RegisterTrip } from '../models/RegisterTrip.js';
import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';
import { Trip } from '../models/Trip.js'; // ✅ make sure you import your Trip model

const RegisterTripSchema = Joi.object({
  StudentID: Joi.string(),
  StaffID: Joi.string(),
  Name: Joi.string().required(),
  Email: Joi.string().email().required(),
}).xor('StudentID', 'StaffID'); // require one of them, not both

// ✅ Register for a trip using TripId from URL
export async function registerForTrip(req, res, next) {
  try {
    const { tripId } = req.params;
    if (!tripId)
      return res.status(400).json({ message: 'TripId is required in the URL' });

    const { value, error } = RegisterTripSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    // ✅ Check that the trip exists and capacity not exceeded
    const trip = await Trip.findById(tripId);
    if (!trip) {
      console.log("Trip not found for ID:", tripId);
      return res.status(404).json({ message: 'Trip not found' });
    }

    if(trip.registrationDeadline && new Date() > trip.registrationDeadline) {
      return res.status(403).json({ message: 'Registration deadline has passed' });
    }

    const registrationCount = await RegisterTrip.countDocuments({ TripName: tripId });
    if (registrationCount >= trip.capacity)
      return res.status(403).json({ message: 'Trip capacity has been reached' });

    // ✅ Check if StudentID is provided
    if (!value.StudentID) {
      return res.status(400).json({ message: 'StudentID is required' });
    }

    let isStudent = false;
    let isStaff = false;
    let actualStudentID = null;
    let actualStaffID = null;

    // ✅ Try to find as Student first
    const studentExists = await Student.findOne({ studentId: value.StudentID });
    if (studentExists) {
      isStudent = true;
      actualStudentID = value.StudentID;

      // ✅ Prevent duplicate registration for student
      const existing = await RegisterTrip.findOne({
        TripName: tripId,
        StudentID: value.StudentID,
      });
      if (existing)
        return res.status(409).json({ message: 'Student already registered for this trip' });
    } else {
      // ✅ If not found as student, try as Staff
      const staffExists = await Staff.findOne({ staffId: value.StudentID });
      if (staffExists) {
        isStaff = true;
        actualStaffID = value.StudentID;

        // ✅ Prevent duplicate registration for staff
        const existing = await RegisterTrip.findOne({
          TripName: tripId,
          StaffID: value.StudentID,
        });
        if (existing)
          return res.status(409).json({ message: 'Staff already registered for this trip' });
      } else {
        // ✅ Not found as either student or staff
        return res.status(404).json({ message: 'Student or Staff not found' });
      }
    }

    // ✅ Create registration
    const doc = await RegisterTrip.create({
      TripName: tripId,
      StudentID: actualStudentID,
      StaffID: actualStaffID,
      Name: value.Name,
      Email: value.Email,
    });

    res.status(201).json({
      message: 'Registered successfully',
      registration: doc,
      registeredAs: isStudent ? 'student' : 'staff'
    });
  } catch (err) {
    next(err);
  }
}
