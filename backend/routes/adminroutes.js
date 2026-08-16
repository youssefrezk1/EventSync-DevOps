import { Router } from 'express';
import { registerEventOffice , getAllEventOffices,updateStaffRole, deleteAdmins , deleteEventOffices , registerAdmin,getAllAdmins,getstaffPending } from '../controllers/admincontroller.js';
import { getAllUsers ,blockuser,unblockuser, unblockVendor,blockVendor} from '../controllers/adminUsersController.js';
import { getRevenueReport, getAttendeeReport } from '../controllers/adminReportsController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();
router.get('/getAdmins', getAllAdmins);
router.get('/all-users', getAllUsers);
router.get('/getEventOffices', getAllEventOffices);
router.post('/createAdmins', registerAdmin);
router.post('/createEventOffices', registerEventOffice);
router.delete('/deleteAdmins/:id', deleteAdmins);
router.delete('/deleteEventOffices/:id', deleteEventOffices);
router.patch('/updateStaffRole/:id',updateStaffRole);
router.get('/pendingStaff',getstaffPending);
router.patch('/blockUser/:id', blockuser);
router.patch('/blockVendor/:id', blockVendor);
router.patch('/unblockUser/:id', unblockuser);
router.patch('/unblockVendor/:id', unblockVendor);



//report revenue 

router.get('/reports/revenue',requireAuth,  getRevenueReport);
router.get('/reports/attendees', requireAuth,getAttendeeReport);


export default router;