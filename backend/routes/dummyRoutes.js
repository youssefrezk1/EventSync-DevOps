import express from "express";
const router = express.Router();
import { sendCertificate,sendPayment ,sendQrCode,sendQrCodeBooth,sendQrCodeExternal,sendQrCodeExternal2} from "../controllers/dummyController.js";


router.post("/test", sendCertificate);
router.post("/test2", sendPayment);
router.post("/test3", sendQrCode);
router.post("/test4", sendQrCodeBooth);
router.post("/test5", sendQrCodeExternal);
router.post("/test6", sendQrCodeExternal2);

export default router;