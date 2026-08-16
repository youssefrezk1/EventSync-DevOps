import { Router } from 'express';
import { exportRegistrations} from '../controllers/eventOfficeExportController.js';

const router = Router();

router.get("/:type/:id", exportRegistrations);


export default router;