import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import {
  acceptAndPublishWorkshop,
  rejectWorkshop,
  requestWorkshopEdits,
  getAllPendingWorkshops
} from '../controllers/eventOfficeWorkshop.controller.js';

const router = express.Router();

// Get all pending workshops
router.get('/workshops', requireAuth, getAllPendingWorkshops);

// Require EventOffice token
router.patch('/workshops/:id/accept', requireAuth, acceptAndPublishWorkshop);
router.patch('/workshops/:id/reject', requireAuth, rejectWorkshop);
router.patch('/workshops/:id/request-edits', requireAuth, requestWorkshopEdits);

export default router;
