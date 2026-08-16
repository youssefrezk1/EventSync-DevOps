import express from "express";
import { getAvailableSlots, reserveCourt, getAvailableSlotsByCourtId ,reserveCourtByNumericId} from "../controllers/courtcontroller.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get all courts with available slots for a specific date
router.get('/availablebycourt/:id', (req, res, next) => {
  console.log('Route hit! ID:', req.params.id, 'Date:', req.query.date);
  next();
}, getAvailableSlotsByCourtId);
router.post('/reserveCourtByNumericId',requireAuth,reserveCourtByNumericId);

export default router;