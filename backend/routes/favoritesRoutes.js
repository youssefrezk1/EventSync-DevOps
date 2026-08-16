import { Router } from 'express';
import {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  checkFavorite
} from '../controllers/favoritesController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get all favorites
router.get('/', getFavorites);

// Check if specific event is favorited
router.get('/check/:eventId', checkFavorite);

// Add to favorites
router.post('/', addToFavorites);

// Remove from favorites
router.delete('/:eventId', removeFromFavorites);

export default router;
