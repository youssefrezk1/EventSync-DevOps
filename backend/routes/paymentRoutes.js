import express from 'express';
import { 
  payForWorkshop,  
  payForTrip,
  verifyPayment,
  payForCart,
  verifyCartPayment,
  cancelWorkshopRegistration,
  cancelTripRegistration,viewMyWallet,cancelBoothRegistration, 
  cancelBazaarRegistration,
  payForBooth, 
  payForBazaar,
  verifyVendorPayment,
  deleteRegistration,
  deleteTripRegistration,
  getTripPrice,
    getBazaarPrice,  // ✅ Add this import
    getBoothPrice,
    redeemPoints

} from '../controllers/paymentController.js';
import { requireAuth } from '../middlewares/authMiddleware.js'; // ✅ import auth middleware

const router = express.Router();

// Protect payment route with JWT auth
router.post('/payforworkshop/:registrationId', requireAuth, payForWorkshop);
router.post('/payfortrip/:registrationId', requireAuth, payForTrip);
router.post('/payforcart/:cartId', requireAuth, payForCart);
router.get('/payment/verify',requireAuth ,verifyPayment);
router.get('/payment/verifyCart', requireAuth, verifyCartPayment);
router.get('/getmyWallet',requireAuth,viewMyWallet);
router.post('/redeemPoints', requireAuth, redeemPoints);

// Cancel registration and refund routes
router.post('/workshops/:registrationId/cancel', requireAuth, cancelWorkshopRegistration);
router.post('/trips/:registrationId/cancel', requireAuth, cancelTripRegistration);

// Cancel vendor request
router.post('/booths/:registrationId/cancel', requireAuth, cancelBoothRegistration);
router.post('/bazaar/:registrationId/cancel', requireAuth, cancelBazaarRegistration);

// Pay vendor
router.post('/booths/:registrationId/pay', requireAuth, payForBooth);
router.post('/bazaar/:registrationId/pay', requireAuth, payForBazaar);
router.get('/payment/verifyVendor', requireAuth, verifyVendorPayment);
router.get("/trip-price/:registrationId", requireAuth, getTripPrice);
router.get("/bazaar-price", requireAuth, getBazaarPrice);  // ✅ Add this route
router.get("/booth-price", requireAuth, getBoothPrice);  // ✅ Add this route
router.delete('/workshops/registration/:registrationId', deleteRegistration);
router.delete('/trips/registration/:registrationId', deleteTripRegistration);
export default router;

