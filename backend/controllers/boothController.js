import Joi from 'joi';
import { RegisterBooth } from '../models/RegisterBooth.js';

const BoothSchema = Joi.object({
  VendorID: Joi.string().required(),
  Attendees: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required()
    })
  ).required(),
  SetupDuration: Joi.string().valid('1 week', '2 weeks', '3 weeks', '4 weeks').required(),
  Location: Joi.string().required(),
  BoothSize: Joi.string().valid('2x2', '4x4').required(),
  PhotoIDs: Joi.array().items(
    Joi.object({
      public_id: Joi.string().required(),
      url: Joi.string().required()
    })
  ).required(),
  StartDate: Joi.date().required() // ✅ Added start date
});

export async function createBooth(req, res, next) {
  try {
    const { value, error } = BoothSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    // ✅ Calculate EndDate based on SetupDuration
    const durationWeeks = parseInt(value.SetupDuration); // "1 week" → 1
    const startDate = new Date(value.StartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + durationWeeks * 7);

    const doc = await RegisterBooth.create({
      ...value,
      StartDate: startDate,
      EndDate: endDate
    });

    res.status(201).json({ booth: doc });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: 'Duplicate booth registration' });
    next(err);
  }
}

export async function getBooths(req, res, next) {
  try {
    const { search, location, boothSize, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    let query = {};

    const role=req.role;
    // Search by vendor name or location



    if (search) {
      query.$or = [
        { Location: { $regex: search, $options: 'i' } }
      ];
    }

    if (location) {
      query.Location = { $regex: location, $options: 'i' };
    }

    if (boothSize) {
      query.BoothSize = boothSize;
    }


    if (status) {
      query.Pending = status;
    } else if (req.role !== 'event-office') {
      // Only show accepted booths for non-event-office users
      query.Pending = 'Accept';
    }

 
    
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const docs = await RegisterBooth.find(query)
      .populate('VendorID', 'companyName email logo')
      .sort(sort)
      .select('-__v'); // cleaner output

    res.json(docs);
  } catch (err) {
    next(err);
  }
}

export async function getBoothById(req, res, next) {
  try {
    const doc = await RegisterBooth.findById(req.params.id)
      .populate('VendorID', 'companyName email logo');
    if (!doc) return res.status(404).json({ message: 'Booth not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

export async function updateBooth(req, res, next) {
  try {
    const optionalSchema = BoothSchema.fork(Object.keys(BoothSchema.describe().keys), (s) => s.optional());
    const { error, value } = optionalSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    // ✅ Recalculate EndDate if StartDate or SetupDuration changed
    let updates = { ...value };
    if (value.StartDate || value.SetupDuration) {
      const booth = await RegisterBooth.findById(req.params.id);
      if (!booth) return res.status(404).json({ message: 'Booth not found' });

      const startDate = value.StartDate ? new Date(value.StartDate) : booth.StartDate;
      const durationWeeks = value.SetupDuration ? parseInt(value.SetupDuration) : parseInt(booth.SetupDuration);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + durationWeeks * 7);
      updates.StartDate = startDate;
      updates.EndDate = endDate;
    }

    const doc = await RegisterBooth.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('VendorID', 'companyName email logo');

    if (!doc) return res.status(404).json({ message: 'Booth not found' });
    res.json({ booth: doc });
  } catch (err) {
    next(err);
  }
}

export async function deleteBooth(req, res, next) {
  try {
    const booth = await RegisterBooth.findById(req.params.id);
    if (!booth) return res.status(404).json({ message: 'Booth not found' });

    // prevent deleting a booth that already has attendees
    if (Array.isArray(booth.Attendees) && booth.Attendees.length > 0) {
      return res.status(403).json({ message: 'Cannot delete booth with registered attendees' });
    }

    await RegisterBooth.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
