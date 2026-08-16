// routes/notificationPreferences.js
import express from 'express';
import { 
  getNotificationPreferences, 
  updateNotificationPreferences 
} from '../controllers/notificationPreferencesController.js';
import { requireAuth } from '../middlewares/authMiddleware.js'; // your auth middleware

const router = express.Router();

router.get('/', requireAuth, getNotificationPreferences);
router.put('/', requireAuth, updateNotificationPreferences);

export default router;