import express from 'express';
import { getMyApplications, cancelApplication } from '../controllers/vendorTournamentController.js';

const router = express.Router();

/**
 * @route   GET /api/vendor/applications
 * @desc    Get all sponsorship applications for the logged-in vendor (alias route)
 * @access  Private (Vendor only)
 */
router.get('/', getMyApplications);

/**
 * @route   DELETE /api/vendor/applications/:applicationId
 * @desc    Cancel a pending sponsorship application (alias route)
 * @access  Private (Vendor only)
 */
router.delete('/:applicationId', cancelApplication);

export default router;
