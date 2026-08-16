import Joi from 'joi';
import { Rate } from '../models/Rate.js';
import { Comment } from '../models/Comment.js';
import { Workshop } from '../models/Workshop.js';
import { Trip } from '../models/Trip.js';
import { RegisterWorkshop } from '../models/RegisterWorkshop.js';
import { RegisterTrip } from '../models/RegisterTrip.js';
import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';


// ============================================
// HELPER FUNCTIONS
// ============================================

// Get Event Model by Type
function getEventModel(eventType) {
  const models = {
    'workshop': Workshop,
    'trip': Trip,
  };
  return models[eventType.toLowerCase()];
}

// Check if user attended/registered for an event
async function hasUserAttended(eventType, eventId, userId, userRole, userDoc) {
  try {
    let customUserId;
    if (userRole === 'student') {
      customUserId = userDoc.studentId;
    } else {
      customUserId = userDoc.staffId;
    }

    if (eventType === 'workshop') {
      const registration = await RegisterWorkshop.findOne({
        WorkshopName: eventId,
        ...(userRole === 'student'
          ? { StudentID: customUserId }
          : { StaffID: customUserId }
        )
      });
      return !!registration;
    }

    if (eventType === 'trip') {
      const registration = await RegisterTrip.findOne({
        TripName: eventId,
        ...(userRole === 'student'
          ? { StudentID: customUserId }
          : { StaffID: customUserId }
        )
      });
      return !!registration;
    }

    return false;
  } catch (err) {
    console.error('hasUserAttended Error:', err);
    return false;
  }
}

// Check if user has paid for the event
async function hasUserPaid(eventType, eventId, userRole, userDoc) {
  try {
    let customUserId;
    if (userRole === 'student') {
      customUserId = userDoc.studentId;
    } else {
      customUserId = userDoc.staffId;
    }

    if (eventType === 'workshop') {
      const registration = await RegisterWorkshop.findOne({
        WorkshopName: eventId,
        ...(userRole === 'student'
          ? { StudentID: customUserId }
          : { StaffID: customUserId }
        )
      });
      return registration && registration.PaymentStatus === 'Paid';
    }

    if (eventType === 'trip') {
      const registration = await RegisterTrip.findOne({
        TripName: eventId,
        ...(userRole === 'student'
          ? { StudentID: customUserId }
          : { StaffID: customUserId }
        )
      });
      return registration && registration.PaymentStatus === 'Paid';
    }

    return false;
  } catch (err) {
    console.error('hasUserPaid Error:', err);
    return false;
  }
}

// Normalize role to lowercase for consistent comparison
function normalizeRole(role) {
  return role ? role.toLowerCase() : '';
}

// Check if user is staff (TA, Professor, Staff, Events Office, Admin)
function isStaffRole(role) {
  const staffRoles = ['staff', 'ta', 'professor', 'events office', 'admin'];
  return staffRoles.includes(normalizeRole(role));
}

// Check if user owns a comment (without population)
function isCommentOwner(comment, userId, userRole) {
  if (!comment || !userId) return false;
  
  const userIdStr = userId.toString();
  
  if (normalizeRole(userRole) === 'student') {
    return comment.studentID && comment.studentID.toString() === userIdStr;
  } else if (isStaffRole(userRole)) {
    return comment.staffID && comment.staffID.toString() === userIdStr;
  }
  
  return false;
}

// Check if user owns a rating (without population)
function isRatingOwner(rating, userId, userRole) {
  if (!rating || !userId) return false;
  
  const userIdStr = userId.toString();
  
  if (normalizeRole(userRole) === 'student') {
    return rating.StudentID && rating.StudentID.toString() === userIdStr;
  } else if (isStaffRole(userRole)) {
    return rating.StaffID && rating.StaffID.toString() === userIdStr;
  }
  
  return false;
}

// ============================================
// 1. RATE AN EVENT (Student/Staff/TA/Professor)
// ============================================
export async function rateEvent(req, res) {
  try {
    const schema = Joi.object({
      eventType: Joi.string().valid('workshop', 'trip').required(),
      eventId: Joi.string().required(),
      rating: Joi.number().integer().min(1).max(5).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { eventType, eventId, rating } = value;
    const { role, id: userId } = req;

    if (!role || !userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const EventModel = getEventModel(eventType);
    if (!EventModel) {
      return res.status(400).json({ message: 'Invalid event type' });
    }

    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const hasAttended = await hasUserAttended(eventType, eventId, userId, role, req.user);
    if (!hasAttended) {
      return res.status(403).json({ 
        message: 'You must register for and attend this event to rate it.' 
      });
    }

    const hasPaid = await hasUserPaid(eventType, eventId, role, req.user);
    if (!hasPaid) {
      return res.status(403).json({
        message: 'You must complete your payment before rating this event.'
      });
    }

    const rateChecks = await Promise.all(
      event.rates.map(rateId => Rate.findById(rateId))
    );
    
    const userIdStr = userId.toString();
    const existingRate = rateChecks.find(rate => {
      if (!rate) return false;
      if (normalizeRole(role) === 'student') {
        return rate.StudentID && rate.StudentID.toString() === userIdStr;
      } else if (isStaffRole(role)) {
        return rate.StaffID && rate.StaffID.toString() === userIdStr;
      }
      return false;
    });

    if (existingRate) {
      return res.status(400).json({ message: 'You have already rated this event' });
    }

    const newRate = new Rate({
      rating,
      ...(normalizeRole(role) === 'student' ? { StudentID: userId } : { StaffID: userId }),
    });

    await newRate.save();
    event.rates.push(newRate._id);
    await event.save();

    return res.status(201).json({
      message: 'Event rated successfully',
      rate: newRate,
    });
  } catch (err) {
    console.error('Rate Event Error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ============================================
// 2. COMMENT ON AN EVENT (Student/Staff/TA/Professor)
// ============================================
export async function commentOnEvent(req, res) {
  try {
    const schema = Joi.object({
      eventType: Joi.string().valid('workshop', 'trip').required(),
      eventId: Joi.string().required(),
      content: Joi.string().min(1).max(1000).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { eventType, eventId, content } = value;
    const { role, id: userId } = req;

    if (!role || !userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const EventModel = getEventModel(eventType);
    if (!EventModel) {
      return res.status(400).json({ message: 'Invalid event type' });
    }

    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const hasAttended = await hasUserAttended(eventType, eventId, userId, role, req.user);
    if (!hasAttended) {
      return res.status(403).json({ 
        message: 'You must register for and attend this event to comment on it.' 
      });
    }

    const hasPaid = await hasUserPaid(eventType, eventId, role, req.user);
    if (!hasPaid) {
      return res.status(403).json({
        message: 'You must complete your payment before commenting on this event.'
      });
    }

    const commentChecks = await Promise.all(
      event.comments.map(commentId => Comment.findById(commentId))
    );
    
    const userIdStr = userId.toString();
    const existingComment = commentChecks.find(comment => {
      if (!comment) return false;
      if (normalizeRole(role) === 'student') {
        return comment.studentID && comment.studentID.toString() === userIdStr;
      } else if (isStaffRole(role)) {
        return comment.staffID && comment.staffID.toString() === userIdStr;
      }
      return false;
    });

    if (existingComment) {
      return res.status(400).json({ message: 'You have already commented on this event' });
    }

    const newComment = new Comment({
      content,
      ...(normalizeRole(role) === 'student' ? { studentID: userId } : { staffID: userId }),
    });

    await newComment.save();
    event.comments.push(newComment._id);
    await event.save();

    return res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment,
    });
  } catch (err) {
    console.error('Comment Event Error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ============================================
// 3. VIEW ALL RATINGS (Student/Staff/Events Office/TA/Professor/Admin)
// ============================================
export async function viewEventRatings(req, res) {
  try {
    const schema = Joi.object({
      eventType: Joi.string().valid('workshop', 'trip').required(),
      eventId: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { eventType, eventId } = value;

    const EventModel = getEventModel(eventType);
    if (!EventModel) {
      return res.status(400).json({ message: 'Invalid event type' });
    }

    const event = await EventModel.findById(eventId)
      .populate({
        path: 'rates',
        populate: [
          { path: 'StudentID', select: 'firstName lastName email' },
          { path: 'StaffID', select: 'firstName lastName email role' },
        ],
      });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const totalRatings = event.rates.length;
    const averageRating = totalRatings > 0
      ? event.rates.reduce((sum, rate) => sum + rate.rating, 0) / totalRatings
      : 0;

    return res.status(200).json({
      eventName: event.name,
      totalRatings,
      averageRating: averageRating.toFixed(2),
      ratings: event.rates,
    });
  } catch (err) {
    console.error('View Ratings Error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ============================================
// 4. VIEW ALL COMMENTS (Student/Staff/Events Office/TA/Professor/Admin)
// ============================================
export async function viewEventComments(req, res) {
  try {
    const schema = Joi.object({
      eventType: Joi.string().valid('workshop', 'trip').required(),
      eventId: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { eventType, eventId } = value;

    const EventModel = getEventModel(eventType);
    if (!EventModel) {
      return res.status(400).json({ message: 'Invalid event type' });
    }

    const event = await EventModel.findById(eventId)
      .populate({
        path: 'comments',
        populate: [
          { path: 'studentID', select: 'firstName lastName email' },
          { path: 'staffID', select: 'firstName lastName email role' },
        ],
      });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    return res.status(200).json({
      eventName: event.name,
      totalComments: event.comments.length,
      comments: event.comments,
    });
  } catch (err) {
    console.error('View Comments Error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ============================================
// 5. DELETE INAPPROPRIATE COMMENT (Admin Only)
// ============================================
import { sendInappropriateCommentEmail } from '../utils/emailService.js'; // adjust path as needed

export async function deleteComment(req, res) {
  try {
    if (!req.role || normalizeRole(req.role) !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const schema = Joi.object({
      commentId: Joi.string().required(),
      eventType: Joi.string().valid('workshop', 'trip').required(),
      eventId: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { commentId, eventType, eventId } = value;
    
    console.log('Delete Comment - Admin:', { commentId, eventType, eventId });
    
    const EventModel = getEventModel(eventType);
    if (!EventModel) {
      return res.status(400).json({ message: 'Invalid event type' });
    }

    // Find the comment first to get user details
    const comment = await Comment.findById(commentId)
      .populate('studentID', 'firstName lastName email')
      .populate('staffID', 'firstName lastName email');
    
    if (!comment) {
      console.log('Comment not found:', commentId);
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Find the event to get event name
    const event = await EventModel.findById(eventId);
    if (!event) {
      console.log('Event not found:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }

    // Determine who made the comment (student or staff)
    let user = null;
    let userName = '';
    let userEmail = '';

    if (comment.studentID) {
      user = comment.studentID;
      userName = `${user.firstName} ${user.lastName}`;
      userEmail = user.email;
    } else if (comment.staffID) {
      user = comment.staffID;
      userName = `${user.firstName} ${user.lastName}`;
      userEmail = user.email;
    }

    // Remove comment from event
    event.comments = event.comments.filter(
      (id) => id.toString() !== commentId.toString()
    );
    await event.save();

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    // Send email notification to the user
    if (user && userEmail) {
      try {
        await sendInappropriateCommentEmail(
          userName,
          comment.content,
          userEmail,
          event.name
        );
        console.log(`Inappropriate comment email sent to ${userEmail}`);
      } catch (emailError) {
        console.error('Failed to send inappropriate comment email:', emailError);
        // Don't fail the deletion if email fails
      }
    }

    console.log('Comment deleted successfully by admin');
    return res.status(200).json({
      message: 'Comment deleted successfully and user notified',
    });
  } catch (err) {
    console.error('Delete Comment Error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ============================================
// 6. DELETE INAPPROPRIATE RATING (Admin Only)
// ============================================
// ============================================
// 6. DELETE INAPPROPRIATE RATING (Admin Only)
// ============================================
export async function deleteRate(req, res) {
  try {
    if (!req.role || normalizeRole(req.role) !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const schema = Joi.object({
      ratingId: Joi.string().required(),
      eventType: Joi.string().valid('workshop', 'trip').required(),
      eventId: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { ratingId, eventType, eventId } = value;
    
    console.log('Delete Rating - Admin:', { ratingId, eventType, eventId });
    
    const EventModel = getEventModel(eventType);
    if (!EventModel) {
      return res.status(400).json({ message: 'Invalid event type' });
    }

    const rating = await Rate.findById(ratingId);
    if (!rating) {
      console.log('Rating not found:', ratingId);
      return res.status(404).json({ message: 'Rating not found' });
    }

    // Use findByIdAndUpdate to remove the rating from event's rates array
    // This avoids version conflicts
    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { $pull: { rates: ratingId } },
      { new: true }
    );

    if (!event) {
      console.log('Event not found:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }

    await Rate.findByIdAndDelete(ratingId);

    console.log('Rating deleted successfully by admin');
    return res.status(200).json({
      message: 'Rating deleted successfully',
    });
  } catch (err) {
    console.error('Delete Rating Error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
// ============================================
// USER EXPERIENCE FEATURES
// ============================================

// ============================================
// 7. EDIT OWN COMMENT (Student/Staff/TA/Professor)
// ============================================
export async function editComment(req, res) {
  try {
    const schema = Joi.object({
      commentId: Joi.string().required(),
      content: Joi.string().min(1).max(1000).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { commentId, content } = value;
    const { role, id: userId } = req;

    if (!role || !userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Edit Comment Request:', { commentId, userId, role });

    const comment = await Comment.findById(commentId);
    if (!comment) {
      console.log('Comment not found:', commentId);
      return res.status(404).json({ message: 'Comment not found' });
    }

    console.log('Comment found:', { 
      commentId: comment._id, 
      studentID: comment.studentID, 
      staffID: comment.staffID 
    });

    // Check ownership using helper function
    if (!isCommentOwner(comment, userId, role)) {
      console.log('Ownership check failed');
      return res.status(403).json({ 
        message: 'Access denied. You can only edit your own comments.' 
      });
    }

    comment.content = content;
    await comment.save();

    console.log('Comment updated successfully');
    return res.status(200).json({
      message: 'Comment updated successfully',
      comment: comment,
    });
  } catch (err) {
    console.error('Edit Comment Error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ============================================
// 8. EDIT OWN RATING (Student/Staff/TA/Professor)
// ============================================
export async function editRating(req, res) {
  try {
    const schema = Joi.object({
      ratingId: Joi.string().required(),
      rating: Joi.number().integer().min(1).max(5).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { ratingId, rating } = value;
    const { role, id: userId } = req;

    if (!role || !userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Edit Rating Request:', { ratingId, userId, role });

    const existingRating = await Rate.findById(ratingId);
    if (!existingRating) {
      console.log('Rating not found:', ratingId);
      return res.status(404).json({ message: 'Rating not found' });
    }

    console.log('Rating found:', { 
      ratingId: existingRating._id, 
      StudentID: existingRating.StudentID, 
      StaffID: existingRating.StaffID 
    });

    // Check ownership using helper function
    if (!isRatingOwner(existingRating, userId, role)) {
      console.log('Ownership check failed');
      return res.status(403).json({ 
        message: 'Access denied. You can only edit your own ratings.' 
      });
    }

    existingRating.rating = rating;
    await existingRating.save();

    console.log('Rating updated successfully');
    return res.status(200).json({
      message: 'Rating updated successfully',
      rating: existingRating,
    });
  } catch (err) {
    console.error('Edit Rating Error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// ============================================
// 9. DELETE OWN COMMENT (Student/Staff/TA/Professor)
// ============================================
export async function deleteOwnComment(req, res) {
  try {
    const schema = Joi.object({
      commentId: Joi.string().required(),
      eventType: Joi.string().valid('workshop', 'trip').required(),
      eventId: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { commentId, eventType, eventId } = value;
    const { role, id: userId } = req;

    if (!role || !userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Delete Own Comment Request:', { commentId, eventType, eventId, userId, role });

    const EventModel = getEventModel(eventType);
    if (!EventModel) {
      return res.status(400).json({ message: 'Invalid event type' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      console.log('Comment not found:', commentId);
      return res.status(404).json({ message: 'Comment not found' });
    }

    console.log('Comment found:', { 
      commentId: comment._id, 
      studentID: comment.studentID, 
      staffID: comment.staffID 
    });

    // Check ownership using helper function
    if (!isCommentOwner(comment, userId, role)) {
      console.log('Ownership check failed');
      return res.status(403).json({ 
        message: 'Access denied. You can only delete your own comments.' 
      });
    }

    // Use findByIdAndUpdate to remove the comment from event's comments array
    // This avoids version conflicts
    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { $pull: { comments: commentId } },
      { new: true }
    );

    if (!event) {
      console.log('Event not found:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete the comment document
    await Comment.findByIdAndDelete(commentId);

    console.log('Comment deleted successfully');
    return res.status(200).json({
      message: 'Comment deleted successfully',
    });
  } catch (err) {
    console.error('Delete Own Comment Error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
// ============================================
// 10. DELETE OWN RATING (Student/Staff/TA/Professor)
// ============================================
// ============================================
// 10. DELETE OWN RATING (Student/Staff/TA/Professor)
// ============================================
export async function deleteOwnRating(req, res) {
  try {
    const schema = Joi.object({
      ratingId: Joi.string().required(),
      eventType: Joi.string().valid('workshop', 'trip').required(),
      eventId: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { ratingId, eventType, eventId } = value;
    const { role, id: userId } = req;

    if (!role || !userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Delete Own Rating Request:', { ratingId, eventType, eventId, userId, role });

    const EventModel = getEventModel(eventType);
    if (!EventModel) {
      return res.status(400).json({ message: 'Invalid event type' });
    }

    const rating = await Rate.findById(ratingId);
    if (!rating) {
      console.log('Rating not found:', ratingId);
      return res.status(404).json({ message: 'Rating not found' });
    }

    console.log('Rating found:', { 
      ratingId: rating._id, 
      StudentID: rating.StudentID, 
      StaffID: rating.StaffID 
    });

    // Check ownership using helper function
    if (!isRatingOwner(rating, userId, role)) {
      console.log('Ownership check failed');
      return res.status(403).json({ 
        message: 'Access denied. You can only delete your own ratings.' 
      });
    }

    // Use findByIdAndUpdate to remove the rating from event's rates array
    // This avoids version conflicts
    const event = await EventModel.findByIdAndUpdate(
      eventId,
      { $pull: { rates: ratingId } },
      { new: true }
    );

    if (!event) {
      console.log('Event not found:', eventId);
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete the rating document
    await Rate.findByIdAndDelete(ratingId);

    console.log('Rating deleted successfully');
    return res.status(200).json({
      message: 'Rating deleted successfully',
    });
  } catch (err) {
    console.error('Delete Own Rating Error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}