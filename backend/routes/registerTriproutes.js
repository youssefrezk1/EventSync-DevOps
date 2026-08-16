import express from 'express';
import { registerForTrip } from '../controllers/registerTripcontroller.js';

const router = express.Router();

// ✅ Route to register for a trip using TripId in URL
router.post('/:tripId/register', registerForTrip);

export default router;
