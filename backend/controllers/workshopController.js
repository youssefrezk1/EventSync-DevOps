import Joi from 'joi';
import {Workshop} from '../models/Workshop.js';
import { RegisterWorkshop } from '../models/RegisterWorkshop.js';
import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';

const WorkshopSchema = Joi.object({
  name: Joi.string().min(3).max(200).required(),
  location: Joi.string().valid('GUC Cairo', 'GUC Berlin').required(),
  start: Joi.date().iso().required(),
  end: Joi.date().iso().required(),
  shortDescription: Joi.string().allow('', null),
  fullagenda: Joi.string().allow('', null),
  facultyResponsible: Joi.string().valid('MGT','BI','MET','IET','EMS','CIVIL','ARCH','AA','PH/BIO','LAW').required(),
  professorsParticipating: Joi.array().items(Joi.string().min(3).messages({
    "string.base": "Professor name must be a string.",
    "string.min": "Each professor name must be at least 3 characters long.",
  }))
  .required()
  .messages({
    "array.base": "Professors Participating must be a list of names.",
    "any.required": "Please specify at least one participating professor.",
  }),
  requiredBudget: Joi.number().min(0).optional(),
  fundingSource: Joi.string().valid('external', 'GUC').required(),
  extraRequiredResources: Joi.string().allow('', null),
  capacity: Joi.number().integer().min(0).required(),
  registrationDeadline: Joi.date().iso().required()
});



export const createWorkshop = async (req, res) => {
  try {
    console.log("Incoming workshop body:", req.body);
    const { error, value } = WorkshopSchema.validate(req.body, { abortEarly: false });
    if (error)
      return res.status(400).json({ errors: error.details.map(d => d.message) });

    const { start, end, registrationDeadline, capacity } = value;

    if (new Date(end) <= new Date(start))
      return res.status(400).json({ message: 'end must be after start' });

    if (new Date(registrationDeadline) > new Date(start))
      return res.status(400).json({ message: 'registrationDeadline must be before start' });

    if (capacity < 1)
      return res.status(400).json({ message: 'capacity must be >= 1' });

    const ProfCreator = req.user.id;

    const workshop = await Workshop.create({ 
      ...value, 
      ProfCreator,
      status: 'Pending'
    });
    
    console.log('✅ Workshop created successfully:', workshop._id);

    // SEND NOTIFICATION - Import dynamically to avoid circular deps
    const { notifyWorkshopRequest } = await import('../controllers/notificationController.js');
    await notifyWorkshopRequest(workshop);

    res.status(201).json(workshop);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const editWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // ✅ reuse WorkshopSchema for partial validation
    const partialSchema = WorkshopSchema.fork(
      Object.keys(WorkshopSchema.describe().keys),
      s => s.optional()
    );

    const { error } = partialSchema.validate(updates, { abortEarly: false });
    if (error)
      return res.status(400).json({ errors: error.details.map(d => d.message) });

    const workshop = await Workshop.findById(id);
    if (!workshop)
      return res.status(404).json({ message: 'Workshop not found' });

    // ✅ only creator can edit
    if (String(workshop.ProfCreator) !== String(req.user.id))
      return res.status(403).json({ message: 'Only the creator can edit this workshop' });

    // ✅ recheck logical constraints if date fields provided
    if (updates.start && updates.end && new Date(updates.end) <= new Date(updates.start))
      return res.status(400).json({ message: 'end must be after start' });

    if (updates.registrationDeadline && updates.start && new Date(updates.registrationDeadline) > new Date(updates.start))
      return res.status(400).json({ message: 'registrationDeadline must be before start' });

    Object.assign(workshop, updates);
    await workshop.save();

    res.json(workshop);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getMyWorkshops = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Get all workshops created by this professor
    const workshops = await Workshop.find({ ProfCreator: userId })
      .sort({ start: -1 })
      .lean();

    // 2️⃣ Extract all workshop IDs
    const workshopIds = workshops.map(w => w._id);

    // 3️⃣ Aggregate registration counts grouped by WorkshopName
    const registrations = await RegisterWorkshop.aggregate([
      { $match: { WorkshopName: { $in: workshopIds } } },
      { $group: { _id: "$WorkshopName", count: { $sum: 1 } } }
    ]);

    // 4️⃣ Convert aggregation result to a lookup map
    const countsMap = {};
    registrations.forEach(r => {
      countsMap[r._id.toString()] = r.count;
    });

    // 5️⃣ Attach count to each workshop
    const workshopsWithCounts = workshops.map(w => ({
      ...w,
      registeredCount: countsMap[w._id.toString()] || 0
    }));

    // 6️⃣ Send response
    res.json(workshopsWithCounts);
  } catch (err) {
    console.error("Error in getMyWorkshops:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getAllWorkshops = async (req, res) => {
  try {
    const { search, location,  date, sortBy = 'start', sortOrder = 'asc',faculty} = req.query;
    
    let query = {};
    
    // Search by name or professor name
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { facultyResponsible: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by location
    if (location) {
      query.location = location;
    }
    
    // Filter by faculty
    if (faculty) {
      query.facultyResponsible = faculty;
    }
    if (role !== 'event-office') {
      query.status = 'confirmed';
    }

    // Filter by date range
    if (date) {
      const dateFilter = new Date(date);
      query.start = { $gte: dateFilter };
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const workshops = await Workshop.find(query)
      .populate('ProfCreator', 'firstName lastName')
      .sort(sort)
      .lean();
    res.json(workshops);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteWorkshop = async (req, res) => {
  try {
    const id = req.params.id;

    // check for existing registrations
    const { RegisterWorkshop } = await import('../models/RegisterWorkshop.js');
    const registrations = await RegisterWorkshop.countDocuments({ WorkshopName: id });
    if (registrations > 0) {
      return res.status(403).json({ message: 'Cannot delete workshop with existing registrations' });
    }

    const doc = await Workshop.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'Workshop not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllattendeesForWorkshop = async (req, res) => {
  try {
    const workshopId = req.params.id;

    // Find all registrations for the workshop
    const registrations = await RegisterWorkshop.find({ WorkshopName: workshopId }).lean();

    // Manually fetch student and staff details
    const enrichedRegistrations = await Promise.all(
      registrations.map(async (reg) => {
        let attendee = null;
        let type = null;

        if (reg.StudentID) {
          // Find student by studentId field
          attendee = await Student.findOne({ studentId: reg.StudentID })
            .select('firstName lastName email studentId')
            .lean();
          type = 'Student';
        } else if (reg.StaffID) {
          // Find staff by staffId field
          attendee = await Staff.findOne({ staffId: reg.StaffID })
            .select('firstName lastName email staffId')
            .lean();
          type = 'Staff';
        }

        return {
          ...reg,
          attendee,
          type,
        };
      })
    );

    res.json(enrichedRegistrations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



export const getWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the workshop normally
    const workshop = await Workshop.findById(id)
      .populate("ProfCreator", "firstName lastName")
      .lean();

    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    // 🔥 Count number of registered students manually
    const registeredCount = await RegisterWorkshop.countDocuments({
      WorkshopName: id
    });

    // Attach it to the result
    workshop.registeredCount = registeredCount;

    res.json(workshop);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}



export const getAllParticipatingProfessors = async (req, res) => {
  try {
    const now = new Date();

    // Fetch only upcoming workshops
    const workshops = await Workshop.find(
      { start: { $gte: now } },  // adjust field name if needed
      { professorsParticipating: 1 }
    ).lean();

    // Flatten and dedupe
    const allProfessors = [
      ...new Set(
        workshops.flatMap(w => w.professorsParticipating || [])
      )
    ];

    res.json(allProfessors);
  } catch (err) {
    console.error("Error in getAllParticipatingProfessors:", err);
    res.status(500).json({ message: "Server error" });
  }
};
