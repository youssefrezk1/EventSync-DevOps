// controllers/studentTournamentController.js
import mongoose from 'mongoose';
import Stripe from 'stripe';
import { Tournament } from '../models/Tournaments.js';
import { Team } from '../models/Teams.js';
import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';
import { calculatePointsEarned } from '../utils/pointsService.js';

// Lazy initialization of Stripe - initialized on first use to ensure env vars are loaded
let stripe = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

/**
 * @desc    Get all available tournaments for students (with filtering/search)
 * @route   GET /api/student/tournaments
 * @access  Private (Student)
 */
export const getAllTournamentsForStudent = async (req, res) => {
  try {
    const { sport, search } = req.query;
    const studentId = req.user.id;
    const studentEmail = req.user.email;
    const studentStudentId = req.user.studentId;

    // Base query for available tournaments
    let query = { 
      status: 'Open for Registration',
      registrationDeadline: { $gte: new Date() }
    };

    // Apply filters
    if (sport) query.sport = sport;
    if (search) query.name = { $regex: search, $options: 'i' };

    // Get all tournaments matching filters
    const tournaments = await Tournament.find(query)
      .select("name sport status startDate endDate registrationDeadline location address entryFee prize maxTeams teamSize rules registeredTeams")
      .lean();

    // Get ALL teams where student is registered (including rejected)
    const studentTeams = await Team.find({
      $or: [
        { captainId: studentId },
        { 'members.email': studentEmail },
        { 'members.studentId': studentStudentId }
      ]
    }).select('tournamentId status');

    // Create map: exclude tournaments where student has NON-REJECTED registration
    const registeredTournamentIds = studentTeams
      .filter(team => team.status !== 'Rejected') // Only exclude if not rejected
      .map(team => team.tournamentId.toString());

    // Filter out tournaments student is already registered in (non-rejected)
    const availableTournaments = tournaments.filter(tournament => 
      !registeredTournamentIds.includes(tournament._id.toString())
    );

    // Add currentTeams count
    const tournamentsWithCount = availableTournaments.map(t => ({
      ...t,
      currentTeams: t.registeredTeams.length
    }));

    res.json({ 
      success: true,
      count: tournamentsWithCount.length,
      tournaments: tournamentsWithCount 
    });
  } catch (err) {
    console.error('Error fetching tournaments:', err);
    res.status(500).json({ success: false, message: 'Server error fetching tournaments' });
  }
};

/**
 * @desc    Get single tournament details
 * @route   GET /api/student/tournaments/:id
 * @access  Private (Student)
 */
export const getTournamentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;
    const studentEmail = req.user.email;
    const studentStudentId = req.user.studentId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid tournament ID format" });
    }

    const tournament = await Tournament.findById(id)
      .select("-eventOfficeId -createdAt")
      .populate({ path: 'sponsors.sponsorId', select: 'companyName logo' })
      .lean();

    if (!tournament) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    // Check if student is already registered
    const existingTeam = await Team.findOne({
      tournamentId: id,
      $or: [
        { captainId: studentId },
        { 'members.email': studentEmail },
        { 'members.studentId': studentStudentId }
      ]
    }).lean();

    // Get student's team if registered
    const studentTeam = existingTeam ? await Team.findById(existingTeam._id).lean() : null;

    res.json({
      success: true,
      tournament: {
        ...tournament,
        currentTeams: tournament.registeredTeams.length,
        isRegistered: !!existingTeam,
        studentTeam: studentTeam,
        canRegister: tournament.status === 'Open for Registration' && 
                     new Date() <= tournament.registrationDeadline &&
                     !existingTeam
      }
    });
  } catch (err) {
    console.error('Error fetching tournament details:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get tournaments the student is registered in (with status)
 * @route   GET /api/student/tournaments/registered/me
 * @access  Private (Student)
 */
export const getRegisteredTournamentsForStudent = async (req, res) => {
  try {
    const studentId = req.user.id;
    const studentEmail = req.user.email;
    const studentStudentId = req.user.studentId;

    // Find ALL teams where student is captain or member (including rejected)
    const teams = await Team.find({
      $or: [
        { captainId: studentId },
        { 'members.email': studentEmail },
        { 'members.studentId': studentStudentId }
      ]
    })
    .populate({
      path: 'tournamentId',
      select: 'name sport status startDate endDate registrationDeadline location address entryFee teamSize'
    })
    .lean();

    // Map to tournament info with team details
    const registered = teams.map(team => ({
      tournament: team.tournamentId,
      team: {
        _id: team._id,
        teamName: team.teamName,
        status: team.status,
        paymentStatus: team.paymentStatus || 'Pending',
        members: team.members,
        createdAt: team.createdAt
      },
      canCancel: team.status === 'Pending' || team.status === 'Approved',
      // Add this for frontend to know if it should be hidden
      isRejected: team.status === 'Rejected'
    }));

    res.json({ 
      success: true,
      count: registered.length,
      registered 
    });
  } catch (err) {
    console.error('Error fetching registered tournaments:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Register for a tournament (create team)
 * @route   POST /api/student/tournaments/:id/register
 * @access  Private (Student)
 */
export const registerForTournament = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { teamName, members } = req.body;
    const studentId = req.user.id;
    const studentEmail = req.user.email;
    const studentStudentId = req.user.studentId;
    const studentName = `${req.user.firstName} ${req.user.lastName}`;

    // 1. Validate tournament
    const tournament = await Tournament.findById(id).session(session);
    if (!tournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Tournament not found." });
    }

    // 2. Check if tournament is open for registration
    if (tournament.status !== 'Open for Registration') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Tournament is not open for registration." });
    }

    // 3. Check registration deadline
    if (new Date() > tournament.registrationDeadline) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Registration deadline has passed." });
    }

    // 4. Check tournament capacity (only count APPROVED teams)
    const approvedTeamsCount = tournament.registeredTeams.length; // These are only approved teams
    if (approvedTeamsCount >= tournament.maxTeams) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Tournament has reached maximum capacity." });
    }

    // 5. Check if student is already registered
    const existingTeam = await Team.findOne({
      tournamentId: id,
      $or: [
        { captainId: studentId },
        { 'members.email': studentEmail },
        { 'members.studentId': studentStudentId }
      ]
    }).session(session);

    if (existingTeam) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "You are already registered for this tournament." });
    }

    let allMembers = [];
    let finalTeamName = teamName;

    // 6. Handle team composition
    if (tournament.teamSize > 1) {
      // TEAM tournament
      if (!teamName || !members || !Array.isArray(members)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: "Team name and members array are required." });
      }

      // Add captain as first member
      allMembers = [
        {
          studentId: studentStudentId,
          name: studentName,
          email: studentEmail,
          status: "Pending"
        },
        ...members
      ];

      // Validate team size
      if (allMembers.length !== tournament.teamSize) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `This tournament requires exactly ${tournament.teamSize} team members.`
        });
      }
    } else {
      // INDIVIDUAL tournament
      finalTeamName = `${studentName}-${Date.now()}`;
      allMembers = [
        {
          studentId: studentStudentId,
          name: studentName,
          email: studentEmail,
          status: "Pending"
        }
      ];
    }

    // 7. Validate team members within THIS tournament
    const memberStudentIds = allMembers.map(m => m.studentId);
    const memberEmails = allMembers.map(m => m.email);

    // Check for duplicates within the team
    const hasDuplicateStudentIds = new Set(memberStudentIds).size !== memberStudentIds.length;
    const hasDuplicateEmails = new Set(memberEmails).size !== memberEmails.length;

    if (hasDuplicateStudentIds) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Duplicate student IDs within the team." });
    }

    if (hasDuplicateEmails) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Duplicate emails within the team." });
    }

    // 8. Check if any member is already in another team for THIS tournament
    const existingMembersInTournament = await Team.findOne({
      tournamentId: id,
      $or: [
        { 'members.studentId': { $in: memberStudentIds } },
        { 'members.email': { $in: memberEmails } }
      ]
    }).session(session);

    if (existingMembersInTournament) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: "One or more team members are already registered in another team for this tournament." 
      });
    }

    // 9. Validate student ID and email formats
    const studentIdRegex = /^\d{2}-\d{4,5}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@student\.guc\.edu\.eg$/;

    for (const member of allMembers) {
      if (!studentIdRegex.test(member.studentId)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: `Invalid student ID format for ${member.name}. Use format: XX-XXXX or XX-XXXXX` 
        });
      }

      if (!emailRegex.test(member.email)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: `Invalid email for ${member.name}. Must be @student.guc.edu.eg` 
        });
      }
    }

    // 10. CHECK TEAM NAME UNIQUENESS - NEW IMPROVED VERSION
    // For TEAM tournaments only (not individual)
    if (tournament.teamSize > 1) {
      // Clean the team name: trim and remove extra spaces
      const cleanedTeamName = teamName.trim().replace(/\s+/g, ' ');
      finalTeamName = cleanedTeamName;
      
      console.log('Checking team name uniqueness...');
      console.log('Team name to check:', cleanedTeamName);
      console.log('Tournament ID:', id);
      
      // Fetch all existing team names in this tournament
      const existingTeams = await Team.find({
        tournamentId: id
      }).session(session);
      
      console.log('Existing teams in tournament:', existingTeams.map(t => t.teamName));
      
      // Check for exact match (case-insensitive)
      const exactMatch = existingTeams.some(team => 
        team.teamName.toLowerCase() === cleanedTeamName.toLowerCase()
      );
      
      if (exactMatch) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          success: false, 
          message: `Team name "${cleanedTeamName}" is already taken in this tournament. Please choose a different name.`,
          availableNames: await suggestTeamNames(cleanedTeamName, existingTeams) // Optional: suggest alternatives
        });
      }
      
      // Optional: Check for similar names (prevents confusion)
      const similarMatch = existingTeams.some(team => 
        team.teamName.toLowerCase().includes(cleanedTeamName.toLowerCase()) ||
        cleanedTeamName.toLowerCase().includes(team.teamName.toLowerCase())
      );
      
      if (similarMatch) {
        // Warn but don't block - just a suggestion
        console.log(`Warning: Team name "${cleanedTeamName}" is similar to existing team names`);
      }
    }

    // 11. Create the team
    const newTeam = await Team.create([{
      tournamentId: id,
      teamName: finalTeamName,
      captainId: studentId,
      members: allMembers,
      status: "Pending", // Waiting for payment
      paymentStatus: "Pending" // Add this
    }], { session });

    // 12. DO NOT add to tournament.registeredTeams - wait for approval from Event Office
    // This matches the Event Office logic in updateTeamStatus function

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: tournament.teamSize > 1 
        ? `Team "${finalTeamName}" registered successfully! Waiting for approval from Event Office.`
        : "Registration submitted successfully! Waiting for approval from Event Office.",
      team: newTeam[0]
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Registration error:', err);
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Team name already exists due to database constraints. Please choose a different team name." 
      });
    }
    
    res.status(500).json({ success: false, message: err.message });
  }
};

// Optional helper function to suggest alternative team names
async function suggestTeamNames(originalName, existingTeams) {
  const existingNames = existingTeams.map(t => t.teamName.toLowerCase());
  const suggestions = [];
  
  // Try adding numbers
  for (let i = 1; i <= 5; i++) {
    const suggestion = `${originalName} ${i}`;
    if (!existingNames.includes(suggestion.toLowerCase())) {
      suggestions.push(suggestion);
    }
  }
  
  // Try adding "Team" prefix/suffix
  const variations = [
    `Team ${originalName}`,
    `${originalName} Team`,
    `The ${originalName}`,
    `${originalName} Squad`
  ];
  
  for (const variation of variations) {
    if (!existingNames.includes(variation.toLowerCase())) {
      suggestions.push(variation);
    }
  }
  
  return suggestions.slice(0, 3); // Return top 3 suggestions
}
/**
 * @desc    Cancel tournament registration
 * @route   DELETE /api/student/tournaments/:id/cancel
 * @access  Private (Student)
 */
export const cancelRegistration = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const studentId = req.user.id;
    const studentEmail = req.user.email;
    const studentStudentId = req.user.studentId;

    // 1. Find the team where student is registered
    const team = await Team.findOne({
      tournamentId: id,
      $or: [
        { captainId: studentId },
        { 'members.email': studentEmail },
        { 'members.studentId': studentStudentId }
      ]
    }).session(session);

    if (!team) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Registration not found." });
    }

    // 2. Check if cancellation is allowed
    if (team.status === 'Rejected') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: "Cannot cancel a rejected registration. This tournament will not appear in your list anymore." 
      });
    }

    if (team.status === 'Disqualified') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        success: false, 
        message: "Cannot cancel a disqualified registration." 
      });
    }

    // 3. Handle refund if payment was made
    const tournament = await Tournament.findById(id).session(session);
    let refundAmount = 0;
    
    if (team.paymentStatus === 'Paid' && tournament && tournament.entryFee > 0) {
      refundAmount = tournament.entryFee;
      const studentCustomId = req.user.studentId;
      const staffCustomId = req.user.staffId;
      
      // Find the user and refund to wallet
      if (studentCustomId) {
        const pointsToDeduct = calculatePointsEarned(refundAmount);
        await Student.findOneAndUpdate(
          { studentId: studentCustomId },
          { 
            $inc: { 
              walletBalance: refundAmount,
              points: -pointsToDeduct 
            },
            $push: {
              refundHistory: {
                amount: refundAmount,
                reason: 'Tournament registration cancelled',
                tournamentId: id,
                teamId: team._id,
                createdAt: new Date()
              },
              pointsHistory: {
                points: -pointsToDeduct,
                action: 'deducted',
                source: 'refund',
                description: `Deducted ${pointsToDeduct} points due to tournament cancellation refund`,
                relatedPaymentAmount: refundAmount,
                createdAt: new Date()
              }
            }
          },
          { session }
        );
      } else if (staffCustomId) {
        const pointsToDeduct = calculatePointsEarned(refundAmount);
        await Staff.findOneAndUpdate(
          { staffId: staffCustomId },
          { 
            $inc: { 
              walletBalance: refundAmount,
              points: -pointsToDeduct 
            },
            $push: {
              refundHistory: {
                amount: refundAmount,
                reason: 'Tournament registration cancelled',
                tournamentId: id,
                teamId: team._id,
                createdAt: new Date()
              },
              pointsHistory: {
                points: -pointsToDeduct,
                action: 'deducted',
                source: 'refund',
                description: `Deducted ${pointsToDeduct} points due to tournament cancellation refund`,
                relatedPaymentAmount: refundAmount,
                createdAt: new Date()
              }
            }
          },
          { session }
        );
      }
    }

    // 4. Remove team from tournament.registeredTeams if it was approved
    if (team.status === 'Approved' && tournament) {
      tournament.registeredTeams = tournament.registeredTeams.filter(
        teamId => teamId.toString() !== team._id.toString()
      );
      await tournament.save({ session });
    }

    // 5. Delete the team
    await Team.findByIdAndDelete(team._id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: refundAmount > 0 
        ? `Registration cancelled! $${refundAmount.toFixed(2)} has been refunded to your wallet.`
        : "Registration cancelled successfully. Tournament is now available for registration again.",
      refundAmount: refundAmount
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Cancellation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Pay for tournament registration
 * @route   POST /api/student/tournaments/:teamId/pay
 * @access  Private (Student)
 */
export const payForTournament = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { paymentMethod } = req.body;
    const studentId = req.user.id;
    const studentCustomId = req.user.studentId;
    const staffCustomId = req.user.staffId;

    // 1. Find the team
    const team = await Team.findById(teamId).populate('tournamentId');
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team registration not found' });
    }

    // 2. Verify user is the captain
    if (team.captainId.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Only the team captain can make payment' });
    }

    // 3. Check if already paid
    if (team.paymentStatus === 'Paid') {
      return res.status(400).json({ success: false, message: 'Payment already completed' });
    }

    const tournament = team.tournamentId;
    const entryFee = tournament.entryFee || 0;

    if (entryFee <= 0) {
      return res.status(400).json({ success: false, message: 'No entry fee for this tournament' });
    }

    // 4. Handle payment based on method
    if (paymentMethod === 'wallet') {
      // Find user
      let user = null;
      if (studentCustomId) {
        user = await Student.findOne({ studentId: studentCustomId });
      } else if (staffCustomId) {
        user = await Staff.findOne({ staffId: staffCustomId });
      }

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if ((user.walletBalance || 0) < entryFee) {
        return res.status(400).json({ 
          success: false, 
          message: 'Insufficient wallet balance',
          required: entryFee,
          available: user.walletBalance || 0
        });
      }

      // Deduct from wallet and add points
      const pointsEarned = calculatePointsEarned(entryFee);
      
      if (studentCustomId) {
        await Student.findOneAndUpdate(
          { studentId: studentCustomId },
          { 
            $inc: { 
              walletBalance: -entryFee,
              points: pointsEarned 
            },
            $push: {
              pointsHistory: {
                points: pointsEarned,
                action: 'earned',
                source: 'payment',
                description: `Earned ${pointsEarned} points from tournament payment ($${entryFee})`,
                relatedPaymentAmount: entryFee,
                teamId: team._id,
                createdAt: new Date()
              }
            }
          }
        );
      } else if (staffCustomId) {
        await Staff.findOneAndUpdate(
          { staffId: staffCustomId },
          { 
            $inc: { 
              walletBalance: -entryFee,
              points: pointsEarned 
            },
            $push: {
              pointsHistory: {
                points: pointsEarned,
                action: 'earned',
                source: 'payment',
                description: `Earned ${pointsEarned} points from tournament payment ($${entryFee})`,
                relatedPaymentAmount: entryFee,
                teamId: team._id,
                createdAt: new Date()
              }
            }
          }
        );
      }

      // Update team payment status
      team.paymentStatus = 'Paid';
      team.paidAt = new Date();
      await team.save();

      return res.status(200).json({
        success: true,
        message: 'Payment successful! Your registration is now confirmed.',
        pointsEarned: pointsEarned
      });

    } else {
      // Stripe payment
      const stripeInstance = getStripe();
      if (!stripeInstance) {
        return res.status(500).json({ 
          success: false, 
          message: 'Stripe is not configured. Please use wallet payment or contact support.' 
        });
      }
      
      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tournament.name} - Tournament Entry`,
              description: `Entry fee for ${tournament.sport} tournament`
            },
            unit_amount: entryFee * 100
          },
          quantity: 1
        }],
        success_url: `${process.env.FRONTEND_URL}/sucess?session_id={CHECKOUT_SESSION_ID}&team_id=${teamId}&type=tournament`,
        cancel_url: `${process.env.FRONTEND_URL}/dashboards/student/tournaments`,
        metadata: {
          teamId: teamId,
          type: 'tournament',
          entryFee: entryFee.toString()
        }
      });

      return res.status(200).json({ 
        success: true,
        url: session.url, 
        sessionId: session.id 
      });
    }

  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Verify Stripe payment for tournament and update team status
 * @route   GET /api/student/tournaments/verify-payment
 * @access  Private (Student)
 */
export const verifyTournamentPayment = async (req, res) => {
  try {
    const { session_id, team_id } = req.query;

    if (!session_id || !team_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing session_id or team_id' 
      });
    }

    const stripeInstance = getStripe();
    if (!stripeInstance) {
      return res.status(500).json({ 
        success: false, 
        message: 'Stripe is not configured' 
      });
    }

    // Verify the Stripe session
    const session = await stripeInstance.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment not completed' 
      });
    }

    // Find the team and update payment status
    const team = await Team.findById(team_id);
    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found' 
      });
    }

    // Check if already processed
    if (team.paymentStatus === 'Paid') {
      return res.status(200).json({ 
        success: true, 
        message: 'Payment already verified',
        alreadyProcessed: true
      });
    }

    // Update team payment status
    team.paymentStatus = 'Paid';
    team.paidAt = new Date();
    team.stripeSessionId = session_id;
    await team.save();

    // Award points to the captain
    const tournament = await Tournament.findById(team.tournamentId);
    if (tournament && tournament.entryFee > 0) {
      const pointsEarned = calculatePointsEarned(tournament.entryFee);
      
      // Find the captain and add points
      const student = await Student.findById(team.captainId);
      if (student) {
        await Student.findByIdAndUpdate(team.captainId, {
          $inc: { points: pointsEarned },
          $push: {
            pointsHistory: {
              points: pointsEarned,
              action: 'earned',
              source: 'payment',
              description: `Earned ${pointsEarned} points from tournament payment ($${tournament.entryFee})`,
              relatedPaymentAmount: tournament.entryFee,
              teamId: team._id,
              createdAt: new Date()
            }
          }
        });
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Payment verified and team status updated!' 
    });

  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
