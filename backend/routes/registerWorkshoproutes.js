import express from 'express';
import { registerForWorkshop } from '../controllers/registerWorkshopcontroller.js';
import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';
import { Workshop } from '../models/Workshop.js';
import { Trip } from '../models/Trip.js';

const router = express.Router();

// ✅ Route to register for a workshop using WorkshopId from URL
router.post('/:workshopId/register', registerForWorkshop);


/*
router.post('/student', async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json({ student });
  } catch (err) {
    next(err);
  }
});


// ---------- Seed a Staff ----------
router.post('/staff', async (req, res, next) => {
  try {
    const staff = await Staff.create(req.body);
    res.status(201).json({ staff });
  } catch (err) {
    next(err);
  }
});

// ---------- Seed a Workshop ----------
router.post('/workshop', async (req, res, next) => {
  try {
    const workshop = await Workshop.create(req.body);
    res.status(201).json({ workshop });
  } catch (err) {
    next(err);
  }
});

// ---------- Seed a Trip ----------
router.post('/trip', async (req, res, next) => {
  try {
    const trip = await Trip.create(req.body);
    res.status(201).json({ trip });
  } catch (err) {
    next(err);
  }
});
*/
export default router;
