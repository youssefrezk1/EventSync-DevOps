import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  createInvitation, 
  getInvitationById, 
  getMyInvitations,
  markInvitationAsUsed,
  getAllInvitationRequests,
  updateInvitationStatus
} from '../controllers/invitationController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

// Ensure uploads/invitee-photos exists
const uploadPath = path.join(process.cwd(), 'uploads/invitee-photos');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath); // use absolute path
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'invitee-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.'));
    }
  }
});

const router = express.Router();

// ============================================
// STUDENT ROUTES
// ============================================

// Protected routes - require authentication
router.post(
  '/create',
  requireAuth,
  upload.single('photo'), // single file with field name 'photo'
  async (req, res) => {
    try {
      await createInvitation(req, res);
    } catch (error) {
      console.error("💥 File upload failed:", error);
      return res.status(500).json({ error: "File upload failed" });
    }
  }
);

router.get('/my-invitations', requireAuth, getMyInvitations);

// Public routes - for scanning QR codes
router.get('/:id', getInvitationById);
router.patch('/:id/use', markInvitationAsUsed);

// ============================================
// ADMIN ROUTES (Event Office)
// ============================================

// Get all invitation requests
router.get('/admin/all-requests', requireAuth, getAllInvitationRequests);

// Update invitation status (Accept/Reject)
router.put('/admin/:id/status', requireAuth, updateInvitationStatus);

export default router;