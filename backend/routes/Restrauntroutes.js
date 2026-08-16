import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { addanIteam ,deleteFoodItem,updateFoodItemAvailability,updateFoodItem,getAllFoodItems, getMenuByRestraunt, getMyMenu } from '../controllers/RestrauntController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/requireRole.js';
import { listRestaurants, submitOrder, restaurantGetConfirmedOrders, restaurantUpdateOrderStatus } from '../controllers/foodCartController.js';
import { AddtoCart, GetCart, RemoveFromCart, ClearCart, UpdateCartItemQuantity } from '../controllers/userRestraunt.js';


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



// Vendor signup — with multer upload + error handling
router.post(
  '/restraunt/additeam',
  requireAuth,
  upload.fields([
    { name: 'Photo', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      await addanIteam(req, res);
    } catch (error) {
      console.error('File upload failed:', error);
      return res.status(500).json({ error: 'File upload failed' });
    }
  }
);

router. put('/restraunt/updateiteam/:id', requireAuth, updateFoodItem);
router. delete('/restraunt/deleteiteam/:id', requireAuth, deleteFoodItem);
router. get('/restraunt/fooditems', requireAuth, getAllFoodItems);
// Protected: return menu for the authenticated restaurant (derived from token)
router.get('/restraunt/menu/mine', requireAuth, getMyMenu);
// Public: get menu by restaurant id
router.get('/restraunt/menu/:restrauntId', getMenuByRestraunt);
router. put('/restraunt/updateavailability/:id', requireAuth, updateFoodItemAvailability);

// Public: list restaurants
router.get('/restraunt/list', listRestaurants);

// User: submit order from cart (select pickup location)
router.post('/cart/:cartId/submit', requireAuth, submitOrder);

// User cart actions (students/staff)
router.post('/cart/add', requireAuth, AddtoCart);
router.get('/cart/:studentId', requireAuth, GetCart);
router.post('/cart/remove', requireAuth, RemoveFromCart);
router.post('/cart/clear', requireAuth, ClearCart);
router.post('/cart/update', requireAuth, UpdateCartItemQuantity);

// Restaurant routes: view confirmed orders and mark completed
router.get('/restraunt/orders', requireAuth, requireRole(['restaurant','admin']), restaurantGetConfirmedOrders);
router.patch('/restraunt/order/:cartId/complete', requireAuth, requireRole(['restaurant','admin']), restaurantUpdateOrderStatus);

export default router;
