import { Invitation } from '../models/Invitation.js';
import { Student } from '../models/Student.js';
import { sendInvitationQRCode, sendInvitationRejectionEmail } from '../utils/emailService.js';

export const createInvitation = async (req, res) => {
  try {
    const { inviteeName } = req.body;
    const studentId = req.id; // from requireAuth middleware
    const role = req.role;

    // Ensure only students can create invitations
    if (role !== 'student') {
      return res.status(403).json({ message: 'Only students can send invitations' });
    }

    // Get student details
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.isVerified) {
      return res.status(403).json({ message: 'Please verify your account first' });
    }

    if (student.status === 'Blocked') {
      return res.status(403).json({ message: 'Your account is blocked' });
    }

    // Validate input
    if (!inviteeName) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Photo is required' });
    }

    // Construct photo URL (file is already saved by multer)
    const inviteePhoto = `${req.protocol}://${req.get('host')}/uploads/invitee-photos/${req.file.filename}`;

    // Calculate expiration date (1 week from now)
    const issueDate = new Date();
    const expirationDate = new Date(issueDate);
    expirationDate.setDate(expirationDate.getDate() + 7);

    // Create invitation record with pending status
    const invitation = new Invitation({
      studentId,
      inviteeName,
      inviteePhoto,
      issueDate,
      expirationDate,
      status: 'pending' // Will be approved by Event Office
    });

    await invitation.save();

    res.status(201).json({
      success: true,
      message: 'Invitation request submitted successfully. Awaiting Event Office approval.',
      invitation: {
        id: invitation._id,
        inviteeName: invitation.inviteeName,
        issueDate: invitation.issueDate,
        expirationDate: invitation.expirationDate,
        status: invitation.status
      }
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create invitation',
      error: error.message 
    });
  }
};

export const getInvitationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const invitation = await Invitation.findById(id)
      .populate('studentId', 'firstName lastName email studentId');
    
    if (!invitation) {
      return res.status(404).json({ 
        success: false,
        message: 'Invitation not found' 
      });
    }

    // Check and update expiration status
    if (invitation.isExpired() && invitation.status === 'active') {
      invitation.status = 'expired';
      await invitation.save();
    }

    res.json({
      success: true,
      invitation: {
        id: invitation._id,
        inviteeName: invitation.inviteeName,
        inviteePhoto: invitation.inviteePhoto,
        issueDate: invitation.issueDate,
        expirationDate: invitation.expirationDate,
        status: invitation.status,
        student: invitation.studentId ? {
          name: `${invitation.studentId.firstName} ${invitation.studentId.lastName}`,
          studentId: invitation.studentId.studentId
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch invitation',
      error: error.message 
    });
  }
};

export const getMyInvitations = async (req, res) => {
  try {
    const studentId = req.id;
    const role = req.role;

    if (role !== 'student') {
      return res.status(403).json({ message: 'Only students can view invitations' });
    }

    const invitations = await Invitation.find({ studentId })
      .sort({ createdAt: -1 });

    // Update expired invitations
    for (let invitation of invitations) {
      if (invitation.isExpired() && invitation.status === 'active') {
        invitation.status = 'expired';
        await invitation.save();
      }
    }

    res.json({
      success: true,
      count: invitations.length,
      invitations: invitations.map(inv => ({
        id: inv._id,
        inviteeName: inv.inviteeName,
        issueDate: inv.issueDate,
        expirationDate: inv.expirationDate,
        status: inv.status,
        isExpired: inv.isExpired()
      }))
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch invitations',
      error: error.message 
    });
  }
};

export const markInvitationAsUsed = async (req, res) => {
  try {
    const { id } = req.params;
    
    const invitation = await Invitation.findById(id);
    
    if (!invitation) {
      return res.status(404).json({ 
        success: false,
        message: 'Invitation not found' 
      });
    }

    if (invitation.isExpired()) {
      return res.status(400).json({ 
        success: false,
        message: 'This invitation has expired' 
      });
    }

    if (invitation.status === 'used') {
      return res.status(400).json({ 
        success: false,
        message: 'This invitation has already been used' 
      });
    }

    invitation.status = 'used';
    await invitation.save();

    res.json({
      success: true,
      message: 'Invitation marked as used',
      invitation: {
        id: invitation._id,
        status: invitation.status
      }
    });
  } catch (error) {
    console.error('Error marking invitation as used:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update invitation',
      error: error.message 
    });
  }
};

// ============================================
// ADMIN FUNCTIONS (Event Office)
// ============================================

// Get all invitation requests (for Event Office)
export const getAllInvitationRequests = async (req, res) => {
  try {
    const invitations = await Invitation.find()
      .populate('studentId', 'firstName lastName email studentId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (error) {
    console.error('Error fetching invitation requests:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch invitation requests',
      error: error.message 
    });
  }
};

// Update invitation status (Accept/Reject)
export const updateInvitationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "Accept" or "Reject"

    if (!['Accept', 'Reject'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status. Must be "Accept" or "Reject"' 
      });
    }

    const invitation = await Invitation.findById(id)
      .populate('studentId', 'firstName lastName email');

    if (!invitation) {
      return res.status(404).json({ 
        success: false,
        message: 'Invitation not found' 
      });
    }

    const student = invitation.studentId;

    if (status === 'Accept') {
      // Update status to active
      invitation.status = 'active';
      await invitation.save();

      // Format dates for email
      const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      };

      // Send QR code email
      await sendInvitationQRCode({
        inviteeName: invitation.inviteeName,
        inviteePhoto: invitation.inviteePhoto,
        studentName: `${student.firstName} ${student.lastName}`,
        studentEmail: student.email,
        issueDate: formatDate(invitation.issueDate),
        expirationDate: formatDate(invitation.expirationDate),
        invitationId: invitation._id.toString()
      });

      res.json({
        success: true,
        message: 'Invitation accepted and QR code sent to student',
        invitation
      });
    } else {
      // Update status to rejected
      invitation.status = 'rejected';
      await invitation.save();

      // Send rejection email (NO QR code)
      await sendInvitationRejectionEmail({
        studentName: `${student.firstName} ${student.lastName}`,
        studentEmail: student.email,
        inviteeName: invitation.inviteeName,
        reason: 'Your invitation request has been reviewed and rejected by the Event Office.'
      });

      res.json({
        success: true,
        message: 'Invitation rejected and notification sent to student',
        invitation
      });
    }
  } catch (error) {
    console.error('Error updating invitation status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update invitation status',
      error: error.message 
    });
  }
};