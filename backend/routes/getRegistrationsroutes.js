import express from 'express';
import { getMyRegistrations, getMyRegistrations2} from '../controllers/getRegistrationscontroller.js';
import { requireAuth } from '../middlewares/authMiddleware.js'; // your middleware

const router = express.Router();

// ✅ Route to get all registrations for the logged-in user
router.get('/my-registrations', requireAuth, getMyRegistrations);
router.get('/my-registrations2', requireAuth, getMyRegistrations2);
export default router;
