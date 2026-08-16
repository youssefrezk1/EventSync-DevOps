import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';
import {
  getAllParticipationRequests,
  updateBazaarRequestStatus,
  updateBoothRequestStatus
} from '../controllers/vendorRequestsController.js';

const router = express.Router();

// Admin / Event Office only
router.get('/participation-requests', requireAuth, getAllParticipationRequests);
router.put('/bazaar-request/:requestId/status', requireAuth, updateBazaarRequestStatus);
router.put('/booth-request/:requestId/status', requireAuth, updateBoothRequestStatus);

export default router;
