import { Router } from 'express';
import { 
  createConference, 
  getConferences, 
  getConferenceById, 
  updateConference, 
  deleteConference 
} from '../controllers/conferenceController.js';

const router = Router();

// Base: /conferences
router.get('/', getConferences);
router.get('/:id', getConferenceById);
router.post('/', createConference);
router.put('/:id', updateConference);
router.delete('/:id', deleteConference);

export default router;
