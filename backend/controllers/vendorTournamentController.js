import Stripe from 'stripe';
import { Tournament } from '../models/Tournaments.js';
import { SponsorshipApplication } from '../models/SponsorshipApplication.js';
import { Vendor } from '../models/Vendor.js';
import { sendPaymentReceiptCardEmail } from '../utils/emailService.js';

// Lazy initialization of Stripe - initialized on first use to ensure env vars are loaded
let stripe = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

const SPONSORSHIP_FEE = 50;

/**
 * Get all tournaments with sponsorship open
 * GET /api/vendor/tournaments
 */
export async function getAllTournaments(req, res) {
  try {
    const tournaments = await Tournament.find({
      status: { $in: ['Sponsorship Open', 'Open for Registration', 'In Progress'] },
      isSponsorshipOpen: true
    })
      .select('name sport status startDate endDate location address isSponsorshipOpen registeredTeams maxTeams entryFee')
      .sort({ startDate: 1 });

    console.log(`Found ${tournaments.length} tournaments with sponsorship open`);

    // Add computed field for available teams
    const tournamentsWithDetails = tournaments.map(tournament => ({
      ...tournament.toObject(),
      availableSlots: tournament.maxTeams - tournament.registeredTeams.length,
      currentTeams: tournament.registeredTeams.length
    }));

    return res.status(200).json({
      success: true,
      count: tournaments.length,
      tournaments: tournamentsWithDetails
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tournaments',
      error: error.message
    });
  }
}

/**
 * Get a single tournament by ID
 * GET /api/vendor/tournaments/:tournamentId
 */
export async function getTournamentById(req, res) {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findById(tournamentId)
      .populate('registeredTeams', 'teamName members')
      .populate('sponsors.sponsorId', 'companyName logo');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    return res.status(200).json({
      success: true,
      tournament
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tournament',
      error: error.message
    });
  }
}

/**
 * Apply for tournament sponsorship with payment
 * POST /api/vendor/tournaments/:tournamentId/apply
 */
export async function applyForSponsorship(req, res) {
  try {
    const { tournamentId } = req.params;
    const { paymentMethod, tier, message } = req.body;
    const vendorId = req.vendorId; // Set by isVendor middleware

    // Validate payment method
    if (!paymentMethod || !['wallet', 'stripe'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment method is required (wallet or stripe)'
      });
    }

    // Validate tier
    if (!tier || !['Bronze', 'Silver', 'Gold', 'Platinum', 'Standard'].includes(tier)) {
      return res.status(400).json({
        success: false,
        message: 'Valid tier is required (Bronze, Silver, Gold, Platinum)'
      });
    }

    // Check if tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if sponsorship is open
    if (!tournament.isSponsorshipOpen) {
      return res.status(400).json({
        success: false,
        message: 'Sponsorship is not currently open for this tournament'
      });
    }

    // Check if vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if vendor is blocked
    if (vendor.status === 'Blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account is blocked. Cannot apply for sponsorship.'
      });
    }

    // Check if vendor already applied
    const existingApplication = await SponsorshipApplication.findOne({
      tournamentId,
      vendorId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this tournament',
        existingApplication
      });
    }

    // ---------------- WALLET PAYMENT ----------------
    if (paymentMethod === 'wallet') {
      // Check wallet balance
      if (vendor.walletBalance < SPONSORSHIP_FEE) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance',
          required: SPONSORSHIP_FEE,
          available: vendor.walletBalance
        });
      }

      // Deduct from wallet
      const updatedVendor = await Vendor.findByIdAndUpdate(
        vendorId,
        { $inc: { walletBalance: -SPONSORSHIP_FEE } },
        { new: true }
      );

      if (!updatedVendor) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update vendor wallet'
        });
      }

      // Create sponsorship application - AUTO APPROVED since payment is complete
      const application = await SponsorshipApplication.create({
        tournamentId,
        vendorId,
        proposedTier: tier,
        proposedAmount: SPONSORSHIP_FEE,
        message: message || '',
        status: 'Approved', // Auto-approve on payment
        paymentStatus: 'Paid',
        paymentMethod: 'wallet',
        paidAmount: SPONSORSHIP_FEE
      });

      // Add vendor to tournament sponsors automatically
      await Tournament.findByIdAndUpdate(
        tournamentId,
        {
          $push: {
            sponsors: {
              sponsorId: vendorId,
              tier: tier,
              logoUrl: vendor.logo?.[0]?.url || ''
            }
          }
        }
      );

      // Send payment receipt (don't fail the request if email fails)
      try {
        await sendPaymentReceiptCardEmail(
          vendor.companyName,
          'Wallet',
          `$${SPONSORSHIP_FEE.toFixed(2)}`,
          vendor.email,
          `${tournament.name} - Sponsorship Application`,
          new Date().toLocaleDateString(),
          'Wallet'
        );
      } catch (emailError) {
        console.error('Failed to send payment receipt email:', emailError);
        // Continue anyway - email failure shouldn't fail the whole request
      }

      return res.status(201).json({
        success: true,
        message: 'Sponsorship application submitted successfully using wallet',
        application,
        newBalance: updatedVendor.walletBalance
      });
    }

    // ---------------- STRIPE PAYMENT ----------------
    if (paymentMethod === 'stripe') {
      const stripeInstance = getStripe();
      if (!stripeInstance) {
        return res.status(500).json({
          success: false,
          message: 'Stripe is not configured. Please use wallet payment or contact support.'
        });
      }

      // Create a pending application first
      const application = await SponsorshipApplication.create({
        tournamentId,
        vendorId,
        proposedTier: tier,
        proposedAmount: SPONSORSHIP_FEE,
        message: message || '',
        status: 'Pending',
        paymentStatus: 'Pending',
        paymentMethod: 'stripe'
      });

      // Create Stripe checkout session
      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${tournament.name} Sponsorship`,
                description: `${tier} tier sponsorship application for ${tournament.name}`,
              },
              unit_amount: SPONSORSHIP_FEE * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        metadata: {
          applicationId: application._id.toString(),
          vendorId: vendorId.toString(),
          tournamentId: tournamentId.toString(),
          type: 'sponsorship'
        },
        success_url: `${process.env.FRONTEND_URL}/dashboards/vendor/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/dashboards/vendor/tournaments?payment=cancelled`,
      });

      return res.status(200).json({
        success: true,
        message: 'Stripe checkout session created',
        sessionId: session.id,
        sessionUrl: session.url,
        applicationId: application._id
      });
    }

  } catch (error) {
    console.error('Error applying for sponsorship:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this tournament'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to apply for sponsorship',
      error: error.message
    });
  }
}

/**
 * Get all sponsorship applications for the logged-in vendor
 * GET /api/vendor/tournaments/my-applications
 */
export async function getMyApplications(req, res) {
  try {
    const vendorId = req.vendorId;

    const applications = await SponsorshipApplication.find({ vendorId })
      .populate('tournamentId', 'name sport status startDate endDate location')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
}

/**
 * Verify Stripe payment for sponsorship application
 * POST /api/vendor/tournaments/verify-payment
 */
export async function verifyStripePayment(req, res) {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const stripeInstance = getStripe();
    if (!stripeInstance) {
      return res.status(500).json({
        success: false,
        message: 'Stripe is not configured'
      });
    }

    // Retrieve the Stripe session
    const session = await stripeInstance.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
        paymentStatus: session.payment_status
      });
    }

    const { applicationId, vendorId, tournamentId } = session.metadata;

    // Update the application - AUTO APPROVE since payment is complete
    const application = await SponsorshipApplication.findByIdAndUpdate(
      applicationId,
      {
        status: 'Approved', // Auto-approve on payment
        paymentStatus: 'Paid',
        paidAmount: SPONSORSHIP_FEE,
        stripeSessionId: session_id
      },
      { new: true }
    ).populate('tournamentId', 'name sport startDate endDate location');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Get vendor and tournament details for email
    const vendor = await Vendor.findById(vendorId);
    const tournament = await Tournament.findById(tournamentId);

    // Add vendor to tournament sponsors automatically (if not already added)
    if (vendor && tournament) {
      const alreadySponsor = tournament.sponsors?.some(
        s => s.sponsorId?.toString() === vendorId.toString()
      );
      
      if (!alreadySponsor) {
        await Tournament.findByIdAndUpdate(
          tournamentId,
          {
            $push: {
              sponsors: {
                sponsorId: vendorId,
                tier: application.proposedTier,
                logoUrl: vendor.logo?.[0]?.url || ''
              }
            }
          }
        );
      }
    }

    if (!vendor || !tournament) {
      console.warn('Vendor or tournament not found for email, but payment was verified successfully');
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        application
      });
    }

    // Get card details from payment intent
    let lastFourDigits = 'Card';
    try {
      if (session.payment_intent && stripeInstance) {
        const paymentIntent = await stripeInstance.paymentIntents.retrieve(session.payment_intent);
        if (paymentIntent.charges && paymentIntent.charges.data.length > 0) {
          const chargeId = paymentIntent.charges.data[0].id;
          const charge = await stripeInstance.charges.retrieve(chargeId);
          if (charge.payment_method_details?.card?.last4) {
            lastFourDigits = charge.payment_method_details.card.last4;
          }
        }
      }
    } catch (err) {
      console.error('Error retrieving card details:', err);
    }

    // Send payment receipt (only if vendor has email)
    if (vendor.email) {
      try {
        await sendPaymentReceiptCardEmail(
          vendor.companyName,
          lastFourDigits,
          `$${SPONSORSHIP_FEE.toFixed(2)}`,
          vendor.email,
          `${tournament.name} - Sponsorship Application`,
          new Date().toLocaleDateString(),
          'Credit Card'
        );
      } catch (emailErr) {
        console.error('Error sending payment receipt email:', emailErr);
        // Don't fail the whole request if email fails
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      application
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
}

/**
 * Cancel a pending sponsorship application (only if payment failed or not yet paid)
 * DELETE /api/vendor/tournaments/applications/:applicationId
 */
export async function cancelApplication(req, res) {
  try {
    const { applicationId } = req.params;
    const vendorId = req.vendorId;

    const application = await SponsorshipApplication.findOne({
      _id: applicationId,
      vendorId
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Allow cancellation if application is Pending or if payment was made (Paid)
    // Disallow for already final/irreversible statuses
    const disallowedStatuses = ['cancelled', 'completed', 'rejected'];
    if (disallowedStatuses.includes(application.status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${application.status.toLowerCase()} applications. Please contact support.`
      });
    }

    if (!(application.status === 'Pending' || application.paymentStatus === 'Paid')) {
      // e.g. application is Approved but not paid — not cancellable from vendor side
      return res.status(400).json({
        success: false,
        message: `Only pending or paid applications can be cancelled by the vendor.`
      });
    }

    // If payment was made (either wallet or stripe), refund to wallet
    if (application.paymentStatus === 'Paid' && application.paidAmount > 0) {
      const vendor = await Vendor.findByIdAndUpdate(
        vendorId,
        { $inc: { walletBalance: application.paidAmount } },
        { new: true }
      );

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }
    }

    await SponsorshipApplication.findByIdAndDelete(applicationId);

    return res.status(200).json({
      success: true,
      message: application.paymentStatus === 'Paid' 
        ? 'Application cancelled and refunded to your wallet successfully' 
        : 'Application cancelled successfully',
      refunded: application.paymentStatus === 'Paid',
      refundAmount: application.paidAmount || 0
    });

  } catch (error) {
    console.error('Error cancelling application:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel application',
      error: error.message
    });
  }
}
