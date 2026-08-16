import { Router } from 'express';
import { generateAndSendExternalQrCode,generateAndSendExternalQrCode2 } from '../controllers/eventOfficeQrController.js';
const router = Router();

router.post('/generate/:bazaarId', generateAndSendExternalQrCode);
router.post('/generateBooth/:boothId', generateAndSendExternalQrCode2);
export default router;
