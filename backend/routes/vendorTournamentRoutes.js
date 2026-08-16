import express from 'express';
import {
  getAllTournaments,
  getTournamentById,
  applyForSponsorship,
  getMyApplications,
  verifyStripePayment,
  cancelApplication
} from '../controllers/vendorTournamentController.js';

const router = express.Router();

/**
 * @route   GET /api/vendor/tournaments
 * @desc    Get all tournaments with sponsorship open
 * @access  Private (Vendor only)
 */
router.get('/', getAllTournaments);

/**
 * @route   GET /api/vendor/tournaments/my-applications
 * @desc    Get all sponsorship applications for the logged-in vendor
 * @access  Private (Vendor only)
 */
router.get('/my-applications', getMyApplications);

/**
 * @route   GET /api/vendor/tournaments/:tournamentId
 * @desc    Get a single tournament by ID with details
 * @access  Private (Vendor only)
 */
router.get('/:tournamentId', getTournamentById);

/**
 * @route   POST /api/vendor/tournaments/:tournamentId/apply
 * @desc    Apply for tournament sponsorship with payment
 * @access  Private (Vendor only)
 * @body    { paymentMethod: 'wallet' | 'stripe', tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum', message: string }
 */
router.post('/:tournamentId/apply', applyForSponsorship);

/**
 * @route   POST /api/vendor/tournaments/verify-payment
 * @desc    Verify Stripe payment for sponsorship application
 * @access  Private (Vendor only)
 * @body    { session_id: string }
 */
router.post('/verify-payment', verifyStripePayment);

/**
 * @route   DELETE /api/vendor/tournaments/applications/:applicationId
 * @desc    Cancel a pending sponsorship application
 * @access  Private (Vendor only)
 */
router.delete('/applications/:applicationId', cancelApplication);

export default router;
