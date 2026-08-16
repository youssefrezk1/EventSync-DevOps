// routes/eventOfficeRoutes.js
import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { getEventOfficeRevenueReport, getEventOfficeAttendeeReport } from '../controllers/reportsController.js';

const router = express.Router();

router.get('/revenue', requireAuth, getEventOfficeRevenueReport);
router.get('/attendees', requireAuth, getEventOfficeAttendeeReport);

export default router;
