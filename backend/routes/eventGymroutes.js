import { Router } from 'express';
import {createGymClass, getAllGymClasses,deleteGymClass,updateGymClass,registerGymMember } from '../controllers/eventGymcontrollers.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
const router = Router();

router.get('/',getAllGymClasses);
router.post('/', createGymClass);
router.delete('/:id', deleteGymClass);
router.patch('/:id',updateGymClass);
router.post('/register/:id',requireAuth,registerGymMember);


export default router;