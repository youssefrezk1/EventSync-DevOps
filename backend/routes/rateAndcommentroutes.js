import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import {
  rateEvent,
  commentOnEvent,
  viewEventRatings,
  viewEventComments,
  deleteComment,
  editComment,
  editRating,
  deleteOwnComment,
  deleteOwnRating,
  deleteRate,
} from '../controllers/rateAndcommentcontroller.js';

const router = express.Router();

// ============================================
// RATING & COMMENT ROUTES
// ============================================

/**
 * POST /api/feedback/rate
 * Rate an event (Student/Staff/TA/Professor only)
 * Body: { eventType, eventId, rating }
 */
router.post('/rate', requireAuth, rateEvent);

/**
 * POST /api/feedback/comment
 * Comment on an event (Student/Staff/TA/Professor only)
 * Body: { eventType, eventId, content }
 */
router.post('/comment', requireAuth, commentOnEvent);

/**
 * GET /api/feedback/ratings
 * View all ratings on an event
 * Query: ?eventType=workshop&eventId=123abc OR ?eventType=trip&eventId=456def
 * Access: Student/Staff/Events Office/TA/Professor/Admin
 */
router.get('/ratings', requireAuth, viewEventRatings);

/**
 * GET /api/feedback/comments
 * View all comments on an event
 * Query: ?eventType=workshop&eventId=123abc OR ?eventType=trip&eventId=456def
 * Access: Student/Staff/Events Office/TA/Professor/Admin
 */
router.get('/comments', requireAuth, viewEventComments);




/**
 * PATCH /api/feedback/comment
 * Edit own comment (Student/Staff/TA/Professor only)
 * Body: { commentId, content }
 */
router.patch('/comments', requireAuth, editComment);

/**
 * PATCH /api/feedback/rating
 * Edit own rating (Student/Staff/TA/Professor only)
 * Body: { ratingId, rating }
 */
router.patch('/rates', requireAuth, editRating);

/**
 * DELETE /api/feedback/comment
 * Delete inappropriate comment (Admin only)
 * Body: { commentId, eventType, eventId }
 */
router.delete('/comment', requireAuth, deleteComment);
router.delete('/rate', requireAuth, deleteRate);

/**
 * DELETE /api/feedback/own-comment
 * Delete own comment (Student/Staff/TA/Professor only)
 * Body: { commentId, eventType, eventId }
 */
router.delete('/own-comment', requireAuth, deleteOwnComment);

/**
 * DELETE /api/feedback/own-rating
 * Delete own rating (Student/Staff/TA/Professor only)
 * Body: { ratingId, eventType, eventId }
 */
router.delete('/own-rate', requireAuth, deleteOwnRating);


export default router;