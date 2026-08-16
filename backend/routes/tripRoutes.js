import { Router } from 'express';
import multer from 'multer';
import { createTrip, getTrips, getTripById, updateTrip, deleteTrip, getTrip, createTrip2 } from '../controllers/tripController.js';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 50, // Maximum 50 files total
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Base: /trips
router.get('/', getTrips);
router.get('/:id', getTripById);
router.post('/', createTrip);
router.post('/2', upload.any(), createTrip2); // Add multer middleware here
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);
router.get('/trip/:id', getTrip);

export default router;