import Joi from 'joi';
import { RegisterWorkshop } from '../models/RegisterWorkshop.js';
import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';
import { Workshop } from '../models/Workshop.js'; // ✅ make sure to import Workshop model

const RegisterWorkshopSchema = Joi.object({
  StudentID: Joi.string(),
  StaffID: Joi.string(),
  Name: Joi.string().required(),
  Email: Joi.string().email().required(),
}).xor('StudentID', 'StaffID'); // Require one of them, not both

// ✅ Register for a workshop using WorkshopId from URL
// ✅ Register for a workshop using WorkshopId from URL
export async function registerForWorkshop(req, res, next) {
  try {
    const { workshopId } = req.params;
    if (!workshopId)
      return res.status(400).json({ message: 'WorkshopId is required in the URL' });
    const { value, error } = RegisterWorkshopSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    
    // ✅ Check that the workshop exists and capacity is not exceeded
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      console.log("Workshop not found for ID:", workshopId);
      return res.status(404).json({ message: 'Workshop not found' });
    }
    if(workshop.registrationDeadline && new Date() > workshop.registrationDeadline) {
      return res.status(403).json({ message: 'Registration deadline has passed' });
    }
    const registrationCount = await RegisterWorkshop.countDocuments({ WorkshopName: workshopId });
    if (registrationCount >= workshop.capacity)
      return res.status(403).json({ message: 'Workshop capacity has been reached' });
    
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
      const existing = await RegisterWorkshop.findOne({
        WorkshopName: workshopId,
        StudentID: value.StudentID,
      });
      if (existing)
        return res.status(409).json({ message: 'Student already registered for this workshop' });
    } else {
      // ✅ If not found as student, try as Staff
      const staffExists = await Staff.findOne({ staffId: value.StudentID });
      if (staffExists) {
        isStaff = true;
        actualStaffID = value.StudentID;
        
        // ✅ Prevent duplicate registration for staff
        const existing = await RegisterWorkshop.findOne({
          WorkshopName: workshopId,
          StaffID: value.StudentID,
        });
        if (existing)
          return res.status(409).json({ message: 'Staff already registered for this workshop' });
      } else {
        // ✅ Not found as either student or staff
        return res.status(404).json({ message: 'Student or Staff not found' });
      }
    }
    
    // ✅ Create registration
    const doc = await RegisterWorkshop.create({
      WorkshopName: workshopId,
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