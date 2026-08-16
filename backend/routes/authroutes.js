import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  registerStudent,
  registerStaff,
  registerVendor,
  login,
  verifyStudent,
  verifyStaff
} from '../controllers/authcontroller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
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

const router = Router();

// Student signup
router.post('/signup/student', registerStudent);

// Staff signup
router.post('/signup/staff', registerStaff);

// Vendor signup — with multer upload + error handling
router.post(
  '/signup/vendor',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'taxCard', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      await registerVendor(req, res);
    } catch (error) {
      console.error('File upload failed:', error);
      return res.status(500).json({ error: 'File upload failed' });
    }
  }
);

// Login route
router.post('/login', login);

// Verify student route
router.get('/verify/student', verifyStudent);

// Verify staff route
router.get('/verify/staff', verifyStaff);

router.get("/me", requireAuth, async (req, res) => {
  res.json({
    message: "Authenticated",
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.role,
    },
  });
});

export default router;
