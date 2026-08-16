// controllers/tournamentController.js
import Joi from 'joi';

import {Tournament} from '../models/Tournaments.js';
import {Team }from '../models/Teams.js';
import {SponsorshipApplication }from '../models/SponsorshipApplication.js';
import mongoose from 'mongoose';
// (We will use req.user.id for the eventOfficeId)


/**
 * @desc    Create a new tournament
 * @route   POST /api/tournaments
 * @access  Private (Event Office Only)
 */
export const createTournament = async (req, res) => {
    try {
        // 1. Destructure necessary data from the request body
        const {
            name, sport, startDate, endDate, registrationDeadline, location,
            format, teamSize, maxTeams, rules, entryFee, address, prize
        } = req.body;
        
        // 2. Create the new tournament document
        const tournament = await Tournament.create({
            name,
            eventOfficeId: req.user.id, // Set the creator's ID
            sport,
            startDate,
            endDate,
            registrationDeadline,
            location,
            format,
            teamSize,
            maxTeams,
            rules,
            entryFee,
            address,
            prize,
            status: 'Open for Registration' // Default status upon creation
        });

        res.status(201).json({
            success: true,
            data: tournament
        });
    } catch (error) {
        // Handle validation errors (Mongoose required fields, enum errors, etc.)
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.status(500).json({ success: false, error: 'Server Error: Could not create tournament.' });
    }
};


/**
 * @desc    Get all tournaments created by the Event Office
 * @route   GET /api/tournaments
 * @access  Private (Event Office Only)
 */
export const getAllTournaments = async (req, res) => {
    try {
        // 1. Find all tournaments created by the logged-in Event Office
        const tournaments = await Tournament.find({ eventOfficeId: req.user.id })
            .sort({ startDate: 1 })
            .lean(); // Use lean for better performance

        // 2. Get actual team counts for each tournament (all teams, not just approved)
        const Team = mongoose.model('Team');
        const tournamentsWithTeamCounts = await Promise.all(
            tournaments.map(async (tournament) => {
                const totalTeams = await Team.countDocuments({ tournamentId: tournament._id });
                return {
                    ...tournament,
                    totalRegisteredTeams: totalTeams, // Actual count of all teams
                };
            })
        );

        res.status(200).json({
            success: true,
            count: tournamentsWithTeamCounts.length,
            data: tournamentsWithTeamCounts
        });
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        res.status(500).json({ success: false, error: 'Server Error: Could not fetch tournaments.' });
    }
};

/**
 * @desc    Get a single tournament by ID
 * @route   GET /api/tournaments/:id
 * @access  Private (Event Office Only)
 */
export const getTournamentById = async (req, res) => { // <-- CORRECT: export const
    try {
        // Check if the provided ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, error: 'Invalid Tournament ID format.' });
        }

        const tournament = await Tournament.findOne({
            _id: req.params.id,
            eventOfficeId: req.user.id // Crucial: ensure office can only view THEIR tournaments
        }).populate('registeredTeams'); // Populate registered teams for detailed view

        if (!tournament) {
            return res.status(404).json({ success: false, error: 'Tournament not found or you do not have permission.' });
        }

        res.status(200).json({
            success: true,
            data: tournament
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: Could not fetch tournament details.' });
    }
};


/**
 * @desc    Update a tournament by ID
 * @route   PUT /api/tournaments/:id
 * @access  Private (Event Office Only)
 */
export const updateTournament = async (req, res) => {
    try {
        // ID validation
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, error: 'Invalid Tournament ID format.' });
        }

        // Find and update the tournament, ensuring ownership
        const tournament = await Tournament.findOneAndUpdate(
            { _id: req.params.id, eventOfficeId: req.user.id }, // Find by ID AND creator ID
            req.body, // The update data from the request body
            { new: true, runValidators: true } // Return the updated document and run Mongoose validators
        );

        if (!tournament) {
            return res.status(404).json({ success: false, error: 'Tournament not found or you do not have permission to update it.' });
        }

        res.status(200).json({
            success: true,
            data: tournament
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.status(500).json({ success: false, error: 'Server Error: Could not update tournament.' });
    }
};


/**
 * @desc    Delete a tournament by ID
 * @route   DELETE /api/tournaments/:id
 * @access  Private (Event Office Only)
 */
export const deleteTournament = async (req, res) => {
    try {
        // ID validation
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, error: 'Invalid Tournament ID format.' });
        }

        // 1. Find the tournament, ensuring ownership
        const tournament = await Tournament.findOneAndDelete({
            _id: req.params.id,
            eventOfficeId: req.user.id
        });

        if (!tournament) {
            return res.status(404).json({ success: false, error: 'Tournament not found or you do not have permission to delete it.' });
        }

        // 2. Cascade Delete: Delete all associated Teams for this tournament
        await Team.deleteMany({ tournamentId: req.params.id });

        res.status(200).json({
            success: true,
            data: {},
            message: `Tournament "${tournament.name}" and all ${tournament.registeredTeams.length} registered teams have been deleted.`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: Could not delete tournament.' });
    }
};


/**
 * @desc    Get all teams registered for a specific tournament (for office review)
 * @route   GET /api/tournaments/:tournamentId/teams
 * @access  Private (Event Office Only)
 */
export const getTeamsByTournament = async (req, res) => {
    try {
        const { tournamentId } = req.params;

        // 1. Authorization check: Ensure the office owns the tournament
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament || tournament.eventOfficeId.toString() !== req.user.id) {
            return res.status(404).json({ success: false, error: 'Tournament not found or unauthorized access.' });
        }

        // 2. Fetch all teams associated with that tournament ID
        const teams = await Team.find({ tournamentId: tournamentId }).populate('captainId', 'name email');

        res.status(200).json({
            success: true,
            count: teams.length,
            data: teams
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: Could not fetch teams.' });
    }
};


/**
 * @desc    Approve, Reject, or Disqualify a team
 * @route   PUT /api/teams/:teamId/status
 * @access  Private (Event Office Only)
 * @body    { "newStatus": "Approved" }
 */
export const updateTeamStatus = async (req, res) => {
    const { teamId } = req.params;
    const { newStatus } = req.body;

    // Check if the new status is valid
    if (!['Approved', 'Rejected', 'Disqualified'].includes(newStatus)) {
        return res.status(400).json({ success: false, error: 'Invalid team status provided.' });
    }

    // Use a Mongoose Transaction for consistency (recommended for multi-document updates)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Find the Team
        const team = await Team.findById(teamId).session(session);

        if (!team) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, error: 'Team not found.' });
        }

        // 2. Authorization Check: Ensure the office owns the parent tournament
        const tournament = await Tournament.findById(team.tournamentId).session(session);
        if (!tournament || tournament.eventOfficeId.toString() !== req.user.id) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ success: false, error: 'Unauthorized: You do not manage this tournament.' });
        }
        
        const oldStatus = team.status;
        
        // 3. Update Team Status
        team.status = newStatus;
        await team.save({ session });

        // 4. Update Tournament's registeredTeams array (ONLY when status changes)
        if (newStatus === 'Approved' && oldStatus !== 'Approved') {
            // Add team ID to the tournament's list if it was approved
            if (tournament.registeredTeams.length >= tournament.maxTeams) {
                 await session.abortTransaction();
                 session.endSession();
                 return res.status(409).json({ success: false, error: 'Cannot approve team: Tournament capacity reached.' });
            }
            tournament.registeredTeams.push(teamId);
            await tournament.save({ session });
        } else if (oldStatus === 'Approved' && newStatus !== 'Approved') {
            // Remove team ID from the tournament's list if it was un-approved/rejected/disqualified
            tournament.registeredTeams = tournament.registeredTeams.filter(id => id.toString() !== teamId);
            await tournament.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            data: team,
            message: `Team status updated to ${newStatus}.`
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ success: false, error: 'Server Error during status update: ' + error.message });
    }
};

/**
 * @desc    Event Office views all pending sponsorship applications for their tournaments
 * @route   GET /api/applications/pending
 * @access  Private (Event Office Only)
 */
export const viewPendingSponsorApplications = async (req, res) => {
    try {
        // 1. Find all tournaments managed by the current Event Office
        const managedTournaments = await Tournament.find({ eventOfficeId: req.user.id }).select('_id');
        const tournamentIds = managedTournaments.map(t => t._id);

        // 2. Find applications associated with those tournaments that are 'Pending'
        const applications = await SponsorshipApplication.find({
            tournamentId: { $in: tournamentIds },
            status: 'Pending'
        })
        .populate('tournamentId', 'name sport') // Show tournament name
        .populate('vendorId', 'name email'); // Show vendor name/contact

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: Could not fetch pending applications.' });
    }
};
/**
 * @desc    Event Office accepts or rejects a sponsorship application
 * @route   PUT /api/applications/:applicationId/status
 * @access  Private (Event Office Only)
 * @body    { "newStatus": "Approved", "tier": "Gold", "logoUrl": "..." } OR { "newStatus": "Rejected", "rejectionReason": "..." }
 */
export const manageSponsorshipApplication = async (req, res) => {
    const { applicationId } = req.params;
    const { newStatus, tier, logoUrl, rejectionReason } = req.body;
    
    if (!['Approved', 'Rejected'].includes(newStatus)) {
        return res.status(400).json({ success: false, error: 'Invalid status provided.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Find the application and ensure the office manages the tournament
        const application = await SponsorshipApplication.findById(applicationId).session(session);
        if (!application) {
            await session.abortTransaction(); session.endSession();
            return res.status(404).json({ success: false, error: 'Application not found.' });
        }

        const tournament = await Tournament.findById(application.tournamentId).session(session);
        // Authorization Check
        if (!tournament || tournament.eventOfficeId.toString() !== req.user.id) {
            await session.abortTransaction(); session.endSession();
            return res.status(403).json({ success: false, error: 'Unauthorized: You do not manage this tournament.' });
        }
        
        // 2. Process Approval/Rejection
        if (newStatus === 'Approved') {
            if (!tier || !logoUrl) { 
                throw new Error("Tier and Logo URL are required to approve a sponsorship.");
            }
            
            // A. Update Application Status
            application.status = 'Approved';
            application.rejectionReason = undefined; 
            await application.save({ session });

            // B. Add sponsor to the Tournament's 'sponsors' array
            tournament.sponsors.push({
                sponsorId: application.vendorId,
                tier: tier,
                logoUrl: logoUrl 
            });
            await tournament.save({ session });
            
        } else if (newStatus === 'Rejected') {
            // A. Update Application Status
            application.status = 'Rejected';
            application.rejectionReason = rejectionReason || 'Not specified.';
            await application.save({ session });
            
            // B. Remove sponsor from the main list (for safety)
            tournament.sponsors = tournament.sponsors.filter(s => s.sponsorId.toString() !== application.vendorId.toString());
            await tournament.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: `Sponsorship application has been successfully ${newStatus}.`,
            data: application
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ success: false, error: 'Server Error during sponsorship management: ' + error.message });
    }
};