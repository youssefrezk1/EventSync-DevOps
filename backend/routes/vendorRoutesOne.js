import express from "express";

import multer from 'multer';
import path from 'path';
import fs from 'fs';

import {
  getUpcomingBazaars,
  applyToBazaar,
  applyForBooth,
  uploadVendorIDs,
  checkBoothAvailability,
} from "../controllers/vendorControllerOne.js";

import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/requireRole.js";

// Ensure uploads/temp exists
const uploadPath = path.join(process.cwd(), 'uploads/temp');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath); // use absolute path
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'));
    }
  }
});


const router = express.Router();

// ✅ Only logged-in vendors can access these routes
router.get(
  "/upcoming-bazaars",
  requireAuth,
  getUpcomingBazaars
);

router.post(
  "/apply-to-bazaar",
  requireAuth,
  upload.fields([{ name: "PhotoIDs", maxCount: 5 }]), // accept up to 5 photos
  async (req, res) => {
    try {
      await applyToBazaar(req, res);
    } catch (error) {
      console.error("💥 File upload failed:", error);
      return res.status(500).json({ error: "File upload failed" });
    }
  }
);



router.post(
  "/apply-for-booth",
  requireAuth,
  upload.fields([{ name: "photos", maxCount: 5 }]), // accept up to 5 photos
  async (req, res) => {
    try {
      await applyForBooth(req, res);
    } catch (error) {
      console.error("💥 File upload failed:", error);
      return res.status(500).json({ error: "File upload failed" });
    }
  }
);
// 🆕 Check booth availability before applying
router.post(
  "/check-booth-availability",
  requireAuth,
  checkBoothAvailability
);


// If you later re-enable ID uploads:
/// router.post(
//   "/upload-ids",
//   requireAuth,
//   requireRole(["vendor"]),
//   upload.array("ids", 5),
//   uploadVendorIDs
// );

export default router;
