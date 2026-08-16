import { Router } from 'express';
import { requireAuth  } from '../middlewares/authMiddleware.js';
import{ createWir,deleteWir,getAllPartners,getMyWir  } from '../controllers/wircontroller.js';
const router = Router();

router.get('/', getAllPartners);
router.post('/', requireAuth, createWir);
router.delete('/:id', requireAuth, deleteWir);
router.get('/my-application', requireAuth, getMyWir);



export default router;