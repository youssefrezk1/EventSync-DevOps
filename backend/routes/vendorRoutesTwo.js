import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';
import { getUpcomingEvents, getRequestedEvents } from '../controllers/vendorControllerTwo.js';

const router = express.Router();

// Vendor-only routes
router.get('/upcoming-events', requireAuth, requireRole(['vendor']), getUpcomingEvents);
router.get('/requested-events', requireAuth, requireRole(['vendor']), getRequestedEvents);

export default router;
