import { Router } from 'express';
import { 
  createBooth, 
  getBooths, 
  getBoothById, 
  updateBooth, 
  deleteBooth 
} from '../controllers/boothController.js';
import { createPoll, deletePoll, getAllPolls, voteOnPoll } from '../controllers/pollcontroller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Base: /booths
router.get('/', getBooths);
router.get('/polls', getAllPolls);
router.post('/poll/vote',requireAuth,voteOnPoll) 
router.post('/poll', createPoll);
router.get('/:id', getBoothById);
router.post('/', createBooth);
router.put('/:id', updateBooth);
router.delete('/:id', deleteBooth);
router.delete('/poll/:id', deletePoll); 

export default router;
