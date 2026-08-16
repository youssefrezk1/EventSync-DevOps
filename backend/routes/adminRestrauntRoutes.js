
import { Router } from 'express';

import { requireAuth } from '../middlewares/authMiddleware.js';
import { GetRestraunts, CreateRestraunt, DeleteRestraunt } from '../controllers/adminRestrauntController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads/temp exists
const uploadPath = path.join(process.cwd(), 'uploads/temp');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
        }
    }
});

const router = Router();
router.get('/admin/restraunts', requireAuth, GetRestraunts);
router.post('/admin/restraunts', requireAuth, upload.single('logo'), CreateRestraunt);
router.delete('/admin/restraunts/:id', requireAuth, DeleteRestraunt);
export default router;