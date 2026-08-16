import { Router } from 'express';
import {createWorkshop, editWorkshop, getMyWorkshops, getAllWorkshops,getAllattendeesForWorkshop,getWorkshop, getAllParticipatingProfessors } from '../controllers/workshopController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', requireAuth,getAllWorkshops);
router.get('/professor',getAllParticipatingProfessors)
router.get('/workshop/:id', requireAuth,getWorkshop);
router.get('/mine',requireAuth,getMyWorkshops);
router.post('/',requireAuth,createWorkshop);
router.put('/:id',requireAuth,editWorkshop);
// allow deleting a workshop by id (only for authenticated users)
router.delete('/:id', requireAuth, async (req, res, next) => {
	try {
		// lazy-load controller's delete implementation if exported
		// to keep route file simple we call controller function if available
		// but prefer to import a named function in controller; however,
		// to avoid circular edits we implement via controller export below.
		const { deleteWorkshop } = await import('../controllers/workshopController.js');
		return deleteWorkshop(req, res, next);
	} catch (err) {
		next(err);
	}
});
router.get('/getworkshopattendees/:id',getAllattendeesForWorkshop);

export default router;