import { Router } from 'express';
import { 
  getAllEvents, 
  getEventsByType, 
  getBazaarVendors,
  archiveEvent,
  unarchiveEvent,
  getArchivedEvents
} from '../controllers/eventsController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Base: /events
router.get('/', requireAuth ,getAllEvents);
router.get('/type/:type', requireAuth,getEventsByType);
router.get('/bazaars/:bazaarId/vendors', getBazaarVendors);
// Get all archived events (only event-office or admin)
router.get('/archived', requireAuth, getArchivedEvents);
// Archive an event (only event-office or admin, and only after it has passed)
router.post('/:type/:id/archive', requireAuth, archiveEvent);
// Unarchive an event (only event-office or admin)
router.post('/:type/:id/unarchive', requireAuth, unarchiveEvent);

export default router;
