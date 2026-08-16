import Stripe from 'stripe';
import { RegisterWorkshop } from '../models/RegisterWorkshop.js';
import { Workshop } from '../models/Workshop.js';
import { Staff } from '../models/Staff.js';
import { Student } from '../models/Student.js';
import { Trip } from '../models/Trip.js';
import { RegisterTrip } from '../models/RegisterTrip.js';

import { RegisterBooth } from '../models/RegisterBooth.js';
import { RegisterBazaar } from '../models/RegisterBazaar.js';
import { Vendor } from '../models/Vendor.js';
import { sendPaymentReceiptCardEmail, } from '../utils/emailService.js';
import { sendAttendanceCertificate} from '../utils/emailService.js';
import { FoodCart } from '../models/FoodCart.js';
import { FoodItem } from '../models/FoodIteam.js';
import { Restraunt } from '../models/Restraunt.js';

import { addPointsToUser, deductPointsFromUser, calculatePointsEarned } from '../utils/pointsService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WORKSHOP_PRICE = 100;

// ✅ Update wallet payment methods to also send receipts
export async function payForWorkshop(req, res, next) {
  try {
    const { registrationId } = req.params;
    const { paymentMethod } = req.body;

    if (!registrationId) return res.status(400).json({ message: 'registrationId is required' });

    const registration = await RegisterWorkshop.findById(registrationId).populate({
      path: 'WorkshopName',
      populate: { path: 'ProfCreator', model: 'Staff', select: 'firstName lastName email staffId' }
    });

    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    const studentCustomId = registration.StudentID;
    const staffCustomId = registration.StaffID;

    const isOwner = (studentCustomId && studentCustomId === req.userCustomId) || (staffCustomId && staffCustomId === req.userCustomId);
    if (!isOwner) return res.status(403).json({ message: 'Not allowed to pay for this registration' });

    if (registration.PaymentStatus === 'Paid') return res.status(400).json({ message: 'Payment already completed for this workshop' });

    const workshop = registration.WorkshopName;

    // WALLET
    if (paymentMethod === 'wallet') {
      let user = null;
      if (studentCustomId) user = await Student.findOne({ studentId: studentCustomId });
      else if (staffCustomId) user = await Staff.findOne({ staffId: staffCustomId });

      if (!user) return res.status(404).json({ message: 'User not found' });
      if ((user.walletBalance || 0) < WORKSHOP_PRICE) return res.status(400).json({ message: 'Insufficient wallet balance', required: WORKSHOP_PRICE, available: user.walletBalance });


      if (user.walletBalance < WORKSHOP_PRICE) {
        return res.status(400).json({
          message: 'Insufficient wallet balance',
          required: WORKSHOP_PRICE,
          available: user.walletBalance
        });
      }

      // Update wallet balance and add points
      const pointsEarned = calculatePointsEarned(WORKSHOP_PRICE);
      let updatedUser;
      if (studentCustomId) {
        updatedUser = await Student.findOneAndUpdate(
          { studentId: studentCustomId },
          { 
            $inc: { 
              walletBalance: -WORKSHOP_PRICE,
              points: pointsEarned 
            },
            $push: {
              pointsHistory: {
                points: pointsEarned,
                action: 'earned',
                source: 'payment',
                description: `Earned ${pointsEarned} points from workshop payment ($${WORKSHOP_PRICE})`,
                relatedPaymentAmount: WORKSHOP_PRICE,
                registrationId: registration._id,
                createdAt: new Date()
              }
            }
          },
          { new: true }
        );
      } else if (staffCustomId) {
        updatedUser = await Staff.findOneAndUpdate(
          { staffId: staffCustomId },
          { 
            $inc: { 
              walletBalance: -WORKSHOP_PRICE,
              points: pointsEarned 
            },
            $push: {
              pointsHistory: {
                points: pointsEarned,
                action: 'earned',
                source: 'payment',
                description: `Earned ${pointsEarned} points from workshop payment ($${WORKSHOP_PRICE})`,
                relatedPaymentAmount: WORKSHOP_PRICE,
                registrationId: registration._id,
                createdAt: new Date()
              }
            }
          },
          { new: true }
        );
      }

      if (!updatedUser) {
        return res.status(404).json({ message: 'Failed to update user wallet' });
      }

      registration.PaymentStatus = 'Paid';
      await registration.save();

      try { await sendPaymentReceiptCardEmail(registration.Name, 'Wallet', `$${WORKSHOP_PRICE.toFixed(2)}`, registration.Email, workshop?.name || 'Workshop', new Date().toLocaleDateString(), 'Wallet'); } catch (e) { console.warn('Receipt failed:', e.message); }


      return res.status(200).json({
        message: 'Payment successful using wallet',
        registration,
        newBalance: updatedUser.walletBalance,
        pointsEarned: pointsEarned,
        totalPoints: updatedUser.points
      });

    }

    // STRIPE
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price_data: { currency: 'usd', product_data: { name: workshop?.name || 'Workshop', description: `Payment for ${workshop?.name || 'workshop'}` }, unit_amount: WORKSHOP_PRICE * 100 }, quantity: 1 }],
      customer_email: registration.Email,
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&registration_id=${registrationId}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
      metadata: { registrationId: registration._id.toString(), type: 'workshop' }
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Payment error:', err);
    next(err);
  }
}

export async function payForTrip(req, res, next) {
  try {
    const { registrationId } = req.params;
    const { paymentMethod } = req.body;

    if (!registrationId) return res.status(400).json({ message: 'registrationId is required' });

    const registration = await RegisterTrip.findById(registrationId).populate('TripName');
    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    const studentCustomId = registration.StudentID;
    const staffCustomId = registration.StaffID;

    const isOwner = (studentCustomId && studentCustomId === req.userCustomId) || (staffCustomId && staffCustomId === req.userCustomId);
    if (!isOwner) return res.status(403).json({ message: 'Not allowed to pay for this registration' });

    const trip = registration.TripName;
    const tripPrice = trip?.price ?? trip?.Price ?? 0;
    if (tripPrice <= 0) return res.status(400).json({ message: 'Invalid trip price' });

    // WALLET
    if (paymentMethod === 'wallet') {
      let user = null;
      if (studentCustomId) user = await Student.findOne({ studentId: studentCustomId });
      else if (staffCustomId) user = await Staff.findOne({ staffId: staffCustomId });

      if (!user) return res.status(404).json({ message: 'User not found' });
      if ((user.walletBalance || 0) < tripPrice) return res.status(400).json({ message: 'Insufficient wallet balance', required: tripPrice, available: user.walletBalance });


      if (user.walletBalance < tripPrice) {
        return res.status(400).json({
          message: 'Insufficient wallet balance',
          required: tripPrice,
          available: user.walletBalance
        });
      }

      // Update wallet balance and add points
      const pointsEarned = calculatePointsEarned(tripPrice);
      let updatedUser;
      if (studentCustomId) {
        updatedUser = await Student.findOneAndUpdate(
          { studentId: studentCustomId },
          { 
            $inc: { 
              walletBalance: -tripPrice,
              points: pointsEarned 
            },
            $push: {
              pointsHistory: {
                points: pointsEarned,
                action: 'earned',
                source: 'payment',
                description: `Earned ${pointsEarned} points from trip payment ($${tripPrice})`,
                relatedPaymentAmount: tripPrice,
                registrationId: registration._id,
                createdAt: new Date()
              }
            }
          },
          { new: true }
        );
      } else if (staffCustomId) {
        updatedUser = await Staff.findOneAndUpdate(
          { staffId: staffCustomId },
          { 
            $inc: { 
              walletBalance: -tripPrice,
              points: pointsEarned 
            },
            $push: {
              pointsHistory: {
                points: pointsEarned,
                action: 'earned',
                source: 'payment',
                description: `Earned ${pointsEarned} points from trip payment ($${tripPrice})`,
                relatedPaymentAmount: tripPrice,
                registrationId: registration._id,
                createdAt: new Date()
              }
            }
          },
          { new: true }
        );
      }

      if (!updatedUser) {
        return res.status(404).json({ message: 'Failed to update user wallet' });
      }


      registration.PaymentStatus = 'Paid';
      await registration.save();

      try { await sendPaymentReceiptCardEmail(registration.Name, 'Wallet', `$${tripPrice.toFixed(2)}`, registration.Email, trip?.name || 'Trip', new Date().toLocaleDateString(), 'Wallet'); } catch (e) { console.warn('Receipt failed:', e.message); }


      return res.status(200).json({
        message: 'Payment successful using wallet',
        registration,
        newBalance: updatedUser.walletBalance,
        pointsEarned: pointsEarned,
        totalPoints: updatedUser.points
      });

    }

    // STRIPE
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price_data: { currency: 'usd', product_data: { name: trip?.name || 'Trip', description: `Payment for ${trip?.name || 'trip'}` }, unit_amount: Math.round(tripPrice * 100) }, quantity: 1 }],
      customer_email: registration.Email,
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&registration_id=${registrationId}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
      metadata: { registrationId: registration._id.toString(), type: 'trip' }
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Trip payment error:', err);
    next(err);
  }
}

// ----------------- NEW: Pay for FoodCart -----------------
export async function payForCart(req, res, next) {
  try {
    const { cartId } = req.params;
    const { paymentMethod, phone, buyerName, pickupLocation } = req.body;

    if (!cartId) return res.status(400).json({ message: 'cartId is required' });

    const cart = await FoodCart.findById(cartId).populate('items.foodItem');
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    // Ownership check: allow Student/Staff owner or admin
    const requesterId = req.id; // set by requireAuth
    const requesterRole = req.role;

    const isOwner = (cart.Student && cart.Student.toString() === requesterId) || (cart.Staff && cart.Staff.toString() === requesterId) || requesterRole === 'admin';
    if (!isOwner) return res.status(403).json({ message: 'Not allowed to pay for this cart' });

    // Determine price: use stored price or calculate from items
    let total = cart.price && cart.price > 0 ? cart.price : 0;
    if ((!cart.price || cart.price === 0) && cart.items && cart.items.length) {
      total = 0;
      for (const it of cart.items) {
        let price = 0;
        try {
          if (it.foodItem && (it.foodItem.Price || it.foodItem.price)) {
            price = it.foodItem.Price || it.foodItem.price;
          } else if (it.foodItem) {
            // not populated, try to fetch
            const fi = await FoodItem.findById(it.foodItem).lean();
            price = fi?.Price || fi?.price || 0;
          }
        } catch (errPrice) {
          console.warn('Failed to resolve food item price for', it.foodItem, errPrice.message);
          price = 0;
        }
        total += (price || 0) * (it.quantity || 1);
      }
    }

    // Add 8% service fee on top of item total
    const serviceFee = Math.round((total * 0.08 + Number.EPSILON) * 100) / 100;
    const finalTotal = Math.round((total + serviceFee + Number.EPSILON) * 100) / 100;

    if (finalTotal <= 0) {
      // Build debug info per item to help identify why price is zero
      const itemsDebug = [];
      for (const it of cart.items || []) {
        try {
          if (it.foodItem && typeof it.foodItem === 'object') {
            itemsDebug.push({
              id: it.foodItem._id?.toString() || null,
              name: it.foodItem.name || null,
              Price: it.foodItem.Price ?? it.foodItem.price ?? null,
              raw: it.foodItem,
              quantity: it.quantity || 0,
            });
          } else {
            // not populated, try fetch
            const fi = await FoodItem.findById(it.foodItem).lean();
            itemsDebug.push({
              id: it.foodItem?.toString?.() || null,
              name: fi?.name || null,
              Price: fi?.Price ?? fi?.price ?? null,
              raw: fi || null,
              quantity: it.quantity || 0,
            });
          }
        } catch (e) {
          itemsDebug.push({ id: it.foodItem?.toString?.() || null, error: e.message, quantity: it.quantity || 0 });
        }
      }

      console.warn('payForCart: invalid total', { cartId: cart._id.toString(), itemsLength: cart.items?.length || 0, computedFinal: finalTotal, items: itemsDebug });
      return res.status(400).json({ message: 'Invalid cart total', items: cart.items?.length || 0, computedFinal: finalTotal, items: itemsDebug });
    }

    // Save buyer info and pickup location if provided
    try {
      if (phone) cart.phone = phone;
      if (buyerName) cart.buyerName = buyerName;
      if (pickupLocation) cart.pickupLocation = pickupLocation;
      await cart.save();
    } catch (errSave) {
      console.warn('Could not save buyer info to cart:', errSave.message);
    }

    // WALLET payment
    if (paymentMethod === 'wallet') {
      // find user doc
      let userDoc = null;
      let userCustomId = null;
      if (cart.Student) {
        userDoc = await Student.findById(cart.Student);
        userCustomId = userDoc?.studentId;
      } else if (cart.Staff) {
        userDoc = await Staff.findById(cart.Staff);
        userCustomId = userDoc?.staffId;
      }

      if (!userDoc) return res.status(404).json({ message: 'User not found' });
      if ((userDoc.walletBalance || 0) < finalTotal) return res.status(400).json({ message: 'Insufficient wallet balance', required: finalTotal, available: userDoc.walletBalance });

      // Calculate points earned
      const pointsEarned = calculatePointsEarned(finalTotal);
      
      // Update wallet balance and add points atomically
      let updatedUser = null;
      if (cart.Student && userCustomId) {
        updatedUser = await Student.findOneAndUpdate(
          { studentId: userCustomId },
          { 
            $inc: { 
              walletBalance: -finalTotal,
              points: pointsEarned 
            },
            $push: {
              pointsHistory: {
                points: pointsEarned,
                action: 'earned',
                source: 'payment',
                description: `Earned ${pointsEarned} points from restaurant order payment ($${finalTotal.toFixed(2)})`,
                relatedPaymentAmount: finalTotal,
                cartId: cart._id,
                createdAt: new Date()
              }
            }
          },
          { new: true }
        );
      } else if (cart.Staff && userCustomId) {
        updatedUser = await Staff.findOneAndUpdate(
          { staffId: userCustomId },
          { 
            $inc: { 
              walletBalance: -finalTotal,
              points: pointsEarned 
            },
            $push: {
              pointsHistory: {
                points: pointsEarned,
                action: 'earned',
                source: 'payment',
                description: `Earned ${pointsEarned} points from restaurant order payment ($${finalTotal.toFixed(2)})`,
                relatedPaymentAmount: finalTotal,
                cartId: cart._id,
                createdAt: new Date()
              }
            }
          },
          { new: true }
        );
      }

      if (!updatedUser) {
        return res.status(404).json({ message: 'Failed to update user wallet' });
      }

      cart.status = 'Confirmed';
      cart.finished = true;
      // persist final price and serviceFee
      try {
        cart.price = finalTotal;
        cart.serviceFee = serviceFee;
        await cart.save();
      } catch (e) {
        console.warn('Could not persist cart price/serviceFee:', e.message);
      }

      // Send simple receipt via email if email exists on requestor (optional)
      try {
        const email = updatedUser.email || req.user?.email;
        if (email) {
          await sendPaymentReceiptCardEmail(
            'Food Order',
            'Wallet',
            `$${finalTotal.toFixed(2)}`,
            email,
            'Food Order',
            new Date().toLocaleDateString(),
            'Wallet'
          );
        }
      } catch (e) {
        console.warn('Receipt send failed:', e.message);
      }

      return res.status(200).json({ 
        message: 'Payment successful (wallet)', 
        cart, 
        newBalance: updatedUser.walletBalance,
        pointsEarned: pointsEarned,
        totalPoints: updatedUser.points
      });
    }

    // STRIPE payment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Food Order', description: `Payment for food cart ${cartId}` },
            unit_amount: Math.round(finalTotal * 100),
          },
          quantity: 1,
        }
      ],
      customer_email: req.user?.email || undefined,
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&cart_id=${cartId}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
      metadata: {
        cartId: cart._id.toString(),
        type: 'foodcart'
      }
    });

    // persist final price and serviceFee
    try {
      cart.price = finalTotal;
      cart.serviceFee = serviceFee;
      await cart.save();
    } catch (e) {
      console.warn('Could not persist cart price/serviceFee:', e.message);
    }

    return res.status(200).json({ url: session.url, sessionId: session.id, serviceFee, finalTotal });
  } catch (err) {
    console.error('Cart payment error:', err);
    next(err);
  }
}

// Verify stripe payment for cart
export async function verifyCartPayment(req, res, next) {
  try {
    const { session_id, cart_id } = req.query;
    if (!session_id || !cart_id) return res.status(400).json({ message: 'Missing session_id or cart_id' });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === 'paid') {
      const cart = await FoodCart.findByIdAndUpdate(cart_id, { status: 'Confirmed', finished: true }, { new: true });
      if (!cart) return res.status(404).json({ message: 'Cart not found' });

      // Send receipt (attempt to get last4)
      let lastFour = '****';
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
        const chargeId = paymentIntent.latest_charge;
        if (chargeId) {
          const charge = await stripe.charges.retrieve(chargeId);
          lastFour = charge.payment_method_details?.card?.last4 || lastFour;
        }
      } catch (err) {
        console.warn('Could not retrieve card last4:', err.message);
      }

      try {
        const email = session.customer_email;
        if (email) {
          await sendPaymentReceiptCardEmail('Food Order', lastFour, `$${(cart.price || 0).toFixed(2)}`, email, 'Food Order', new Date().toLocaleDateString(), 'Card');
        }
      } catch (e) {
        console.warn('Failed to send receipt email:', e.message);
      }

      return res.redirect(`${process.env.FRONTEND_URL}/payment-success?cart_id=${cart_id}`);
    }

    return res.redirect(`${process.env.FRONTEND_URL}/payment-failed`);
  } catch (err) {
    console.error('verifyCartPayment error:', err);
    next(err);
  }
}
// âœ… NEW: Verify payment status after user returns from Stripe
export async function verifyPayment(req, res, next) {
  try {
    const { session_id, registration_id, cart_id } = req.query;

    if (!session_id || (!registration_id && !cart_id)) {
      return res.status(400).json({ message: 'Missing session_id or registration_id' });
    }

    // Retrieve the Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      // If this verify call is for a cart (food order), handle it here and return JSON
      if (cart_id && !registration_id) {
        try {
          const cart = await FoodCart.findByIdAndUpdate(cart_id, { status: 'Confirmed', finished: true }, { new: true });
          if (!cart) return res.status(404).json({ message: 'Cart not found' });

          // Attempt to get card last4 and send receipt
          let lastFour = '****';
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
            const chargeId = paymentIntent.latest_charge;
            if (chargeId) {
              const charge = await stripe.charges.retrieve(chargeId);
              lastFour = charge.payment_method_details?.card?.last4 || lastFour;
            }
          } catch (err) {
            console.warn('Could not retrieve card last4 for cart verify:', err.message);
          }

          try {
            const email = session.customer_email || req.user?.email;
            if (email) {
              await sendPaymentReceiptCardEmail('Food Order', lastFour, `$${(cart.price || 0).toFixed(2)}`, email, 'Food Order', new Date().toLocaleDateString(), 'Card');
            }
          } catch (e) {
            console.warn('Failed to send receipt email for cart verify:', e.message);
          }

          return res.status(200).json({ success: true, message: 'Cart payment verified', cart });
        } catch (errCart) {
          console.error('Cart verify error:', errCart);
          return res.status(500).json({ message: 'Cart verification failed' });
        }
      }

      // Else, fall through to registration handling
      const type = session.metadata.type;
      let userName = '';
      let email = '';
      let eventName = '';
      let amount = 0;
      let paymentMethod = 'Card';

      if (type === 'workshop') {
        const registration = await RegisterWorkshop.findByIdAndUpdate(
          registration_id,
          { PaymentStatus: 'Paid' },
          { new: true }
        ).populate({
    path: 'WorkshopName',
    populate: {
      path: 'ProfCreator',
      model: 'Staff',
      select: 'firstName lastName email staffId'
    }
  });

        if (registration) {
          userName = registration.Name;
          email = registration.Email;
          eventName = registration.WorkshopName?.name || 'Workshop';
          amount = WORKSHOP_PRICE;

          // Award points for the payment
          const pointsEarned = calculatePointsEarned(amount);
          const studentCustomId = registration.StudentID;
          const staffCustomId = registration.StaffID;

          if (studentCustomId) {
            await Student.findOneAndUpdate(
              { studentId: studentCustomId },
              { 
                $inc: { points: pointsEarned },
                $push: {
                  pointsHistory: {
                    points: pointsEarned,
                    action: 'earned',
                    source: 'payment',
                    description: `Earned ${pointsEarned} points from workshop payment ($${amount})`,
                    relatedPaymentAmount: amount,
                    registrationId: registration._id,
                    createdAt: new Date()
                  }
                }
              }
            );
          } else if (staffCustomId) {
            await Staff.findOneAndUpdate(
              { staffId: staffCustomId },
              { 
                $inc: { points: pointsEarned },
                $push: {
                  pointsHistory: {
                    points: pointsEarned,
                    action: 'earned',
                    source: 'payment',
                    description: `Earned ${pointsEarned} points from workshop payment ($${amount})`,
                    relatedPaymentAmount: amount,
                    registrationId: registration._id,
                    createdAt: new Date()
                  }
                }
              }
            );
          }

          // Get last 4 digits of card from Stripe session
    
          let lastFourDigits = '****';

const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

// SAFELY get charge
const chargeId = paymentIntent.latest_charge;

if (chargeId) {
  const charge = await stripe.charges.retrieve(chargeId);
  lastFourDigits = charge.payment_method_details?.card?.last4 || '****';
}

          // Send payment receipt email
          await sendPaymentReceiptCardEmail(
            userName,
            lastFourDigits,
            `$${amount.toFixed(2)}`,
            email,
            eventName,
            new Date().toLocaleDateString(),
            paymentMethod
          );

         const workshop = registration.WorkshopName;
let professorFullName = 'Unknown Professor';
if (workshop?.ProfCreator) {
  professorFullName = `${workshop.ProfCreator.firstName} ${workshop.ProfCreator.lastName}`;
}
    if (workshop) {
      await sendAttendanceCertificate({
        studentName: registration.Name,
        bazaarName: workshop.name,
        professorName: professorFullName,
        startDate: new Date(workshop.start).toLocaleDateString(),
        endDate: new Date(workshop.end).toLocaleDateString(),
        campus: workshop.location,
        email: registration.Email
      });
    }

        }

      } else if (type === 'trip') {
        const registration = await RegisterTrip.findByIdAndUpdate(
          registration_id,
          { PaymentStatus: 'Paid' },
          { new: true }
        ).populate('TripName');

        if (registration) {
          userName = registration.Name;
          email = registration.Email;
          eventName = registration.TripName?.name || 'Trip';
          amount = registration.TripName?.price || 0;

          // Award points for the payment
          const pointsEarned = calculatePointsEarned(amount);
          const studentCustomId = registration.StudentID;
          const staffCustomId = registration.StaffID;

          if (studentCustomId) {
            await Student.findOneAndUpdate(
              { studentId: studentCustomId },
              { 
                $inc: { points: pointsEarned },
                $push: {
                  pointsHistory: {
                    points: pointsEarned,
                    action: 'earned',
                    source: 'payment',
                    description: `Earned ${pointsEarned} points from trip payment ($${amount})`,
                    relatedPaymentAmount: amount,
                    registrationId: registration._id,
                    createdAt: new Date()
                  }
                }
              }
            );
          } else if (staffCustomId) {
            await Staff.findOneAndUpdate(
              { staffId: staffCustomId },
              { 
                $inc: { points: pointsEarned },
                $push: {
                  pointsHistory: {
                    points: pointsEarned,
                    action: 'earned',
                    source: 'payment',
                    description: `Earned ${pointsEarned} points from trip payment ($${amount})`,
                    relatedPaymentAmount: amount,
                    registrationId: registration._id,
                    createdAt: new Date()
                  }
                }
              }
            );
          }

          // Get last 4 digits of card from Stripe session
     let lastFourDigits = '****';

const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

// SAFELY get charge
const chargeId = paymentIntent.latest_charge;

if (chargeId) {
  const charge = await stripe.charges.retrieve(chargeId);
  lastFourDigits = charge.payment_method_details?.card?.last4 || '****';
}

          // Send payment receipt email
          await sendPaymentReceiptCardEmail(
            userName,
            lastFourDigits,
            `$${amount.toFixed(2)}`,
            email,
            eventName,
            new Date().toLocaleDateString(),
            paymentMethod
          );
        }

      } else if (type === 'booth') {
        const registration = await RegisterBooth.findById(registration_id).populate('VendorID');

        if (registration) {
          const boothPrice = calculateBoothPrice(registration.BoothSize, registration.SetupDuration);
          
          registration.PaymentStatus = 'Paid';
          registration.PaymentFees = boothPrice;
          await registration.save();

          const vendor = registration.VendorID;
          userName = vendor?.companyName || 'Vendor';
          email = vendor?.email || '';
          eventName = `Booth ${registration.BoothSize} - ${registration.Location}`;
          amount = boothPrice;

          // Get last 4 digits of card from Stripe session

          let lastFourDigits = '****';

const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

// SAFELY get charge
const chargeId = paymentIntent.latest_charge;

if (chargeId) {
  const charge = await stripe.charges.retrieve(chargeId);
  lastFourDigits = charge.payment_method_details?.card?.last4 || '****';
}

          // Send payment receipt email
          await sendPaymentReceiptCardEmail(
            userName,
            lastFourDigits,
            `$${amount.toFixed(2)}`,
            email,
            eventName,
            new Date().toLocaleDateString(),
            paymentMethod
          );
        }

      } else if (type === 'bazaar') {
        const registration = await RegisterBazaar.findById(registration_id)
          .populate('VendorName')
          .populate('BazaarName');

        if (registration) {
          const bazaarPrice = calculateBazaarPrice(registration.BoothSize);
          
          registration.PaymentStatus = 'Paid';
          registration.PaymentFees = bazaarPrice;
          await registration.save();

          const vendor = registration.VendorName;
          userName = vendor?.companyName || 'Vendor';
          email = vendor?.email || '';
          eventName = `Bazaar ${registration.BoothSize} - ${registration.BazaarName?.name || 'Bazaar'}`;
          amount = bazaarPrice;

  let lastFourDigits = '****';

const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

// SAFELY get charge
const chargeId = paymentIntent.latest_charge;

if (chargeId) {
  const charge = await stripe.charges.retrieve(chargeId);
  lastFourDigits = charge.payment_method_details?.card?.last4 || '****';
}

          // Send payment receipt email
          await sendPaymentReceiptCardEmail(
            userName,
            lastFourDigits,
            `$${amount.toFixed(2)}`,
            email,
            eventName,
            new Date().toLocaleDateString(),
            paymentMethod
          );

          
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Payment verified and updated. Receipt sent via email.'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed',
        status: session.payment_status
      });
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    next(err);
  }
}

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

// Helper function to check if cancellation is allowed
function canCancelEvent(eventDate) {
  const now = new Date();
  const timeDifference = eventDate.getTime() - now.getTime();
  return timeDifference >= TWO_WEEKS_MS;
}

// Helper function to get formatted time remaining
function getTimeRemaining(eventDate) {
  const now = new Date();
  const timeDifference = eventDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDifference / (24 * 60 * 60 * 1000));
  return daysRemaining;
}

// ✅ Cancel Workshop Registration and Refund
export async function cancelWorkshopRegistration(req, res, next) {
  try {
    const { registrationId } = req.params;

    if (!registrationId) {
      return res.status(400).json({ message: 'registrationId is required' });
    }

    const registration = await RegisterWorkshop.findById(registrationId).populate('WorkshopName');
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Verify ownership
    const studentCustomId = registration.StudentID;
    const staffCustomId = registration.StaffID;

    const isOwner =
      (studentCustomId && studentCustomId === req.userCustomId) ||
      (staffCustomId && staffCustomId === req.userCustomId);

    if (!isOwner) {
      return res.status(403).json({ 
        message: 'Not allowed to cancel this registration'
      });
    }

    // Only paid registrations can be cancelled
    if (registration.PaymentStatus !== 'Paid') {
      return res.status(400).json({ 
        message: 'Only paid registrations can be cancelled'
      });
    }

    const workshop = registration.WorkshopName;
    
    if (!workshop || !workshop.start) {
      return res.status(500).json({ 
        message: 'Workshop data not found or invalid'
      });
    }

    const workshopDate = new Date(workshop.start);

    // Check if cancellation is within 2 weeks
    if (!canCancelEvent(workshopDate)) {
      const daysRemaining = getTimeRemaining(workshopDate);
      return res.status(400).json({ 
        message: 'Cancellation not allowed',
        detail: `Cancellations must be made at least 2 weeks before the event. Only ${daysRemaining} days remaining.`,
        daysRemaining
      });
    }

    const refundAmount = 100; // WORKSHOP_PRICE
    const pointsToDeduct = calculatePointsEarned(refundAmount);

    // Update user wallet, refund history, and deduct points using findOneAndUpdate
    let updatedUser;
    if (studentCustomId) {
      updatedUser = await Student.findOneAndUpdate(
        { studentId: studentCustomId },
        {
          $inc: { 
            walletBalance: refundAmount,
            points: -pointsToDeduct
          },
          $push: {
            refundHistory: {
              amount: refundAmount,
              source: 'workshop',
              sourceName: workshop.name,
              sourceId: workshop._id,
              registrationId: registration._id,
              refundedAt: new Date(),
            },
            pointsHistory: {
              points: -pointsToDeduct,
              action: 'deducted',
              source: 'cancellation',
              description: `Deducted ${pointsToDeduct} points due to workshop cancellation refund ($${refundAmount})`,
              relatedPaymentAmount: refundAmount,
              registrationId: registration._id,
              createdAt: new Date()
            }
          }
        },
        { new: true }
      );
    } else if (staffCustomId) {
      updatedUser = await Staff.findOneAndUpdate(
        { staffId: staffCustomId },
        {
          $inc: { 
            walletBalance: refundAmount,
            points: -pointsToDeduct
          },
          $push: {
            refundHistory: {
              amount: refundAmount,
              source: 'workshop',
              sourceName: workshop.name,
              sourceId: workshop._id,
              registrationId: registration._id,
              refundedAt: new Date(),
            },
            pointsHistory: {
              points: -pointsToDeduct,
              action: 'deducted',
              source: 'cancellation',
              description: `Deducted ${pointsToDeduct} points due to workshop cancellation refund ($${refundAmount})`,
              relatedPaymentAmount: refundAmount,
              registrationId: registration._id,
              createdAt: new Date()
            }
          }
        },
        { new: true }
      );
    }

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete registration from database
    await RegisterWorkshop.findByIdAndDelete(registrationId);

    return res.status(200).json({ 
      message: 'Workshop registration cancelled successfully',
      refund: {
        amount: refundAmount,
        newBalance: updatedUser.walletBalance
      }
    });

  } catch (err) {
    console.error('Workshop cancellation error:', err);
    next(err);
  }
}

// ✅ Cancel Trip Registration and Refund
export async function cancelTripRegistration(req, res, next) {
  try {
    const { registrationId } = req.params;

    if (!registrationId) {
      return res.status(400).json({ message: 'registrationId is required' });
    }

    const registration = await RegisterTrip.findById(registrationId).populate('TripName');
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Verify ownership
    const studentCustomId = registration.StudentID;
    const staffCustomId = registration.StaffID;

    const isOwner =
      (studentCustomId && studentCustomId === req.userCustomId) ||
      (staffCustomId && staffCustomId === req.userCustomId);

    if (!isOwner) {
      return res.status(403).json({ 
        message: 'Not allowed to cancel this registration'
      });
    }

    // Only paid registrations can be cancelled
    if (registration.PaymentStatus !== 'Paid') {
      return res.status(400).json({ 
        message: 'Only paid registrations can be cancelled'
      });
    }

    const trip = registration.TripName;
    
    if (!trip || !trip.start) {
      return res.status(500).json({ 
        message: 'Trip data not found or invalid'
      });
    }

    const tripDate = new Date(trip.start);
    const tripPrice = trip.price;

    // Check if cancellation is within 2 weeks
    if (!canCancelEvent(tripDate)) {
      const daysRemaining = getTimeRemaining(tripDate);
      return res.status(400).json({ 
        message: 'Cancellation not allowed',
        detail: `Cancellations must be made at least 2 weeks before the event. Only ${daysRemaining} days remaining.`,
        daysRemaining
      });
    }

    // Update user wallet, refund history, and deduct points using findOneAndUpdate
    const pointsToDeduct = calculatePointsEarned(tripPrice);
    let updatedUser;
    if (studentCustomId) {
      updatedUser = await Student.findOneAndUpdate(
        { studentId: studentCustomId },
        {
          $inc: { 
            walletBalance: tripPrice,
            points: -pointsToDeduct
          },
          $push: {
            refundHistory: {
              amount: tripPrice,
              source: 'trip',
              sourceName: trip.name,
              sourceId: trip._id,
              registrationId: registration._id,
              refundedAt: new Date(),
            },
            pointsHistory: {
              points: -pointsToDeduct,
              action: 'deducted',
              source: 'cancellation',
              description: `Deducted ${pointsToDeduct} points due to trip cancellation refund ($${tripPrice})`,
              relatedPaymentAmount: tripPrice,
              registrationId: registration._id,
              createdAt: new Date()
            }
          }
        },
        { new: true }
      );
    } else if (staffCustomId) {
      updatedUser = await Staff.findOneAndUpdate(
        { staffId: staffCustomId },
        {
          $inc: { 
            walletBalance: tripPrice,
            points: -pointsToDeduct
          },
          $push: {
            refundHistory: {
              amount: tripPrice,
              source: 'trip',
              sourceName: trip.name,
              sourceId: trip._id,
              registrationId: registration._id,
              refundedAt: new Date(),
            },
            pointsHistory: {
              points: -pointsToDeduct,
              action: 'deducted',
              source: 'cancellation',
              description: `Deducted ${pointsToDeduct} points due to trip cancellation refund ($${tripPrice})`,
              relatedPaymentAmount: tripPrice,
              registrationId: registration._id,
              createdAt: new Date()
            }
          }
        },
        { new: true }
      );
    }

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete registration from database
    await RegisterTrip.findByIdAndDelete(registrationId);

    return res.status(200).json({ 
      message: 'Trip registration cancelled successfully',
      refund: {
        amount: tripPrice,
        newBalance: updatedUser.walletBalance
      }
    });

  } catch (err) {
    console.error('Trip cancellation error:', err);
    next(err);
  }
}

export async function viewMyWallet(req, res) {
  const user = req.user;   // safe
  const role = req.role;

  if (!user.walletBalance && user.walletBalance !== 0) {
    return res.status(400).json({ message: "This user type does not have a wallet." });
  }

  // Vendors don't have refundHistory, only students and staff
  const refundHistory = user.refundHistory || [];
  
  // sort refund history by refundedAt (newest first)
  const sortedRefundHistory = [...refundHistory].sort(
    (a, b) => new Date(b.refundedAt) - new Date(a.refundedAt)
  );

  // sort points history by createdAt (newest first)
  const sortedPointsHistory = user.pointsHistory ? [...user.pointsHistory].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  ) : [];

  return res.status(200).json({
    walletBalance: user.walletBalance,
    refundHistory: sortedRefundHistory,
    points: user.points || 0,
    pointsHistory: sortedPointsHistory
  });
}

export async function cancelBoothRegistration(req, res, next) {
  try {
    const { registrationId } = req.params;
    const vendorId = req.id; // Vendor MongoDB ID from auth middleware

    if (!registrationId) {
      return res.status(400).json({ message: 'registrationId is required' });
    }

    const registration = await RegisterBooth.findById(registrationId);
    
    if (!registration) {
      return res.status(404).json({ message: 'Booth registration not found' });
    }

    // RegisterBooth uses VendorID field
    if (registration.VendorID.toString() !== vendorId) {
      return res.status(403).json({ 
        message: 'Not allowed to cancel this registration'
      });
    }

    // Check if already paid
    if (registration.PaymentStatus === 'Paid') {
      return res.status(400).json({ 
        message: 'Cannot cancel paid registrations',
        detail: 'This booth registration has already been paid for. Contact support if you need to cancel.'
      });
    }

    // Check if registration is rejected
    if (registration.Pending === 'Reject') {
      return res.status(400).json({ 
        message: 'Cannot cancel rejected registrations'
      });
    }

    // Delete the registration
    await RegisterBooth.findByIdAndDelete(registrationId);

    return res.status(200).json({ 
      message: 'Booth registration cancelled successfully',
      cancelledRegistration: {
        boothSize: registration.BoothSize,
        setupDuration: registration.SetupDuration,
        startDate: registration.StartDate
      }
    });

  } catch (err) {
    console.error('Booth cancellation error:', err);
    next(err);
  }
}

// âœ… Cancel Bazaar Registration (only if not paid)
export async function cancelBazaarRegistration(req, res, next) {
  try {
    const { registrationId } = req.params;
    const vendorId = req.id; // Vendor MongoDB ID from auth middleware

    if (!registrationId) {
      return res.status(400).json({ message: 'registrationId is required' });
    }

    const registration = await RegisterBazaar.findById(registrationId);
    
    if (!registration) {
      return res.status(404).json({ message: 'Bazaar registration not found' });
    }

    // RegisterBazaar uses VendorName field (despite the name, it's a vendor ID)
    if (registration.VendorName.toString() !== vendorId) {
      return res.status(403).json({ 
        message: 'Not allowed to cancel this registration'
      });
    }

    // Check if already paid
    if (registration.PaymentStatus === 'Paid') {
      return res.status(400).json({ 
        message: 'Cannot cancel paid registrations',
        detail: 'This bazaar registration has already been paid for. Contact support if you need to cancel.'
      });
    }

    // Check if registration is rejected
    if (registration.Pending === 'Reject') {
      return res.status(400).json({ 
        message: 'Cannot cancel rejected registrations'
      });
    }

    // Delete the registration
    await RegisterBazaar.findByIdAndDelete(registrationId);

    return res.status(200).json({ 
      message: 'Bazaar registration cancelled successfully',
      cancelledRegistration: {
        boothSize: registration.BoothSize,
        paymentFees: registration.PaymentFees
      }
    });

  } catch (err) {
    console.error('Bazaar cancellation error:', err);
    next(err);
  }
}

function calculateBoothPrice(boothSize, setupDuration) {
  const basePrice = boothSize === '2x2' ? 100 : 200;
  const weeks = parseInt(setupDuration.split(' ')[0]); // e.g., "2 weeks" â†’ 2
  return basePrice * weeks;
}

// Helper function to calculate bazaar price
function calculateBazaarPrice(boothSize, location) {
  // Base price based on booth size
  let basePrice = 0;
  
  if (boothSize === '2x2') {
    basePrice = 100;
  } else if (boothSize === '3x3') {
    basePrice = 200;
  }
  
  // Additional price based on location
  let locationPrice = 0;
  
  if (location === 'Admission') {
    locationPrice = 100;
  } else if (location === 'Green Area') {
    locationPrice = 200;
  } else {
    locationPrice = 300; // For any other location
  }
  
  // Total price is base price + location price
  return basePrice + locationPrice;
}
export const getBoothPrice = async (req, res) => {
  try {
    const { boothSize } = req.query;

    if (!boothSize) {
      return res.status(400).json({ 
        message: 'boothSize is required' 
      });
    }

    // Calculate price based only on booth size
    let basePrice = 0;
    
    if (boothSize === '2x2') {
      basePrice = 100;
    } else if (boothSize === '4x4') {
      basePrice = 200;
    } else {
      return res.status(400).json({ 
        message: 'Invalid booth size. Must be 2x2 or 3x3' 
      });
    }

    res.status(200).json({
      success: true,
      boothSize,
      price: basePrice
    });

  } catch (error) {
    console.error('Error getting booth price:', error);
    res.status(500).json({ 
      message: 'Error calculating booth price',
      error: error.message 
    });
  }
};
export const getBazaarPrice = async (req, res) => {
  try {
    const { boothSize, location } = req.query;

    if (!boothSize || !location) {
      return res.status(400).json({ 
        message: 'Both boothSize and location are required' 
      });
    }

    // Calculate base price based on booth size
    let basePrice = 0;
    if (boothSize === '2x2') {
      basePrice = 100;
    } else if (boothSize === '4x4') {
      basePrice = 200;
    } else {
      return res.status(400).json({ 
        message: 'Invalid booth size. Must be 2x2 or 3x3' 
      });
    }

    // Calculate location price
    let locationPrice = 0;
    if (location === 'Admission') {
      locationPrice = 100;
    } else if (location === 'Green Area') {
      locationPrice = 200;
    } else {
      locationPrice = 300; // For any other location
    }

    // Total price
    const totalPrice = basePrice + locationPrice;

    res.status(200).json({
      success: true,
      boothSize,
      location,
      basePrice,
      locationPrice,
      totalPrice
    });

  } catch (error) {
    console.error('Error calculating bazaar price:', error);
    res.status(500).json({ 
      message: 'Error calculating price',
      error: error.message 
    });
  }
};
// âœ… Pay for Booth Registration
export async function payForBooth(req, res, next) {
  try {
    const { registrationId } = req.params;
    const { paymentMethod } = req.body;
    const vendorId = req.id;

    if (!registrationId) {
      return res.status(400).json({ message: 'registrationId is required' });
    }

    const registration = await RegisterBooth.findById(registrationId).populate('VendorID');
    if (!registration) {
      return res.status(404).json({ message: 'Booth registration not found' });
    }

    // Verify ownership
    if (registration.VendorID._id.toString() !== vendorId) {
      return res.status(403).json({ message: 'Not allowed to pay for this registration' });
    }

    // Check if already paid
    if (registration.PaymentStatus === 'Paid') {
      return res.status(400).json({ message: 'Payment already completed for this booth' });
    }

    // Check if registration is accepted
    if (registration.Pending !== 'Accept') {
      return res.status(400).json({ 
        message: 'Cannot pay for booth registration that is not accepted', 
        status: registration.Pending 
      });
    }

    // Check payment deadline
    const now = new Date();
    if (registration.PaymentDueDate && now > registration.PaymentDueDate) {
      return res.status(400).json({ 
        message: 'Payment deadline has passed', 
        deadline: registration.PaymentDueDate 
      });
    }

    // Calculate price based on booth size and setup duration
    const boothPrice = calculateBoothPrice(registration.BoothSize, registration.SetupDuration);

    const vendor = registration.VendorID;
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // ---- WALLET PAYMENT ----
    if (paymentMethod === 'wallet') {
      if (vendor.walletBalance < boothPrice) {
        return res.status(400).json({ 
          message: 'Insufficient wallet balance', 
          required: boothPrice, 
          available: vendor.walletBalance 
        });
      }

      // Update vendor wallet using findOneAndUpdate
      const updatedVendor = await Vendor.findOneAndUpdate(
        { _id: vendorId },
        { $inc: { walletBalance: -boothPrice } },
        { new: true }
      );

      if (!updatedVendor) {
        return res.status(404).json({ message: 'Failed to update vendor wallet' });
      }

      registration.PaymentStatus = 'Paid';
      registration.PaymentFees = boothPrice;
      await registration.save();

      // 📧 Send wallet payment receipt
      await sendPaymentReceiptCardEmail(
        vendor.companyName,
        'Wallet',
        `$${boothPrice.toFixed(2)}`,
        vendor.email,
        `Booth ${registration.BoothSize} - ${registration.Location}`,
        new Date().toLocaleDateString(),
        'Wallet'
      );

      return res.status(200).json({ 
        message: 'Booth payment successful using wallet', 
        registration, 
        newBalance: updatedVendor.walletBalance 
      });
    }

    // ---- STRIPE PAYMENT ----
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Booth ${registration.BoothSize}`,
              description: `Booth payment for ${registration.SetupDuration} at ${registration.Location}`,
            },
            unit_amount: boothPrice * 100,
          },
          quantity: 1,
        },
      ],
      customer_email: vendor.email,
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&registration_id=${registrationId}&type=booth`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
      metadata: {
        registrationId: registration._id.toString(),
        type: 'booth'
      },
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Booth payment error:', err);
    next(err);
  }
}

// âœ… Pay for Bazaar Registration
export async function payForBazaar(req, res, next) {
  try {
    const { registrationId } = req.params;
    const { paymentMethod } = req.body;
    const vendorId = req.id;

    if (!registrationId) {
      return res.status(400).json({ message: 'registrationId is required' });
    }

    const registration = await RegisterBazaar.findById(registrationId)
      .populate('VendorName')
      .populate('BazaarName');
      
    if (!registration) {
      return res.status(404).json({ message: 'Bazaar registration not found' });
    }

    // Verify ownership - RegisterBazaar uses VendorName field
    if (registration.VendorName._id.toString() !== vendorId) {
      return res.status(403).json({ message: 'Not allowed to pay for this registration' });
    }

    // Check if already paid
    if (registration.PaymentStatus === 'Paid') {
      return res.status(400).json({ message: 'Payment already completed for this bazaar' });
    }

    // Check if registration is accepted
    if (registration.Pending !== 'Accept') {
      return res.status(400).json({ 
        message: 'Cannot pay for bazaar registration that is not accepted', 
        status: registration.Pending 
      });
    }

    // Check payment deadline
    const now = new Date();
    if (registration.PaymentDueDate && now > registration.PaymentDueDate) {
      return res.status(400).json({ 
        message: 'Payment deadline has passed', 
        deadline: registration.PaymentDueDate 
      });
    }

    // Calculate price based on bazaar booth size
    const bazaarPrice = calculateBazaarPrice(registration.BoothSize);

    const vendor = registration.VendorName;
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // ---- WALLET PAYMENT ----
    if (paymentMethod === 'wallet') {
      if (vendor.walletBalance < bazaarPrice) {
        return res.status(400).json({ 
          message: 'Insufficient wallet balance', 
          required: bazaarPrice, 
          available: vendor.walletBalance 
        });
      }

      // Update vendor wallet using findOneAndUpdate
      const updatedVendor = await Vendor.findOneAndUpdate(
        { _id: vendorId },
        { $inc: { walletBalance: -bazaarPrice } },
        { new: true }
      );

      if (!updatedVendor) {
        return res.status(404).json({ message: 'Failed to update vendor wallet' });
      }

      registration.PaymentStatus = 'Paid';
      registration.PaymentFees = bazaarPrice;
      await registration.save();

      // 📧 Send wallet payment receipt
      await sendPaymentReceiptCardEmail(
        vendor.companyName,
        'Wallet',
        `$${bazaarPrice.toFixed(2)}`,
        vendor.email,
        `Bazaar Booth ${registration.BoothSize} - ${registration.BazaarName?.name || 'Bazaar'}`,
        new Date().toLocaleDateString(),
        'Wallet'
      );

      return res.status(200).json({ 
        message: 'Bazaar payment successful using wallet', 
        registration, 
        newBalance: updatedVendor.walletBalance 
      });
    }

    // ---- STRIPE PAYMENT ----
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Bazaar Booth ${registration.BoothSize}`,
              description: `Bazaar booth payment at ${registration.BazaarName?.name || 'Bazaar'}`,
            },
            unit_amount: bazaarPrice * 100,
          },
          quantity: 1,
        },
      ],
      customer_email: vendor.email,
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&registration_id=${registrationId}&type=bazaar`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
      metadata: {
        registrationId: registration._id.toString(),
        type: 'bazaar'
      },
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Bazaar payment error:', err);
    next(err);
  }
}
export async function deleteRegistration(req, res, next) {
  try {
    const { registrationId } = req.params;

    if (!registrationId) {
      return res.status(400).json({ message: 'Registration ID is required' });
    }

    const result = await RegisterWorkshop.findByIdAndDelete(registrationId);

    if (!result) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.status(200).json({ message: 'Registration cancelled successfully' });
  } catch (err) {
    next(err);
  }
}

// âœ… Verify payment status after user returns from Stripe
// âœ… Verify payment status after user returns from Stripe
export async function verifyVendorPayment(req, res, next) {
  try {
    const { session_id, registration_id, type } = req.query;
    console.log('Verify called with:', { session_id, registration_id, type });

    if (!session_id || !registration_id || !type) {
      return res.status(400).json({ 
        message: 'Missing session_id, registration_id, or type' 
      });
    }

    // Retrieve the Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log('Stripe session payment_status:', session.payment_status);

    if (session.payment_status === 'paid') {
      if (type === 'booth') {
        console.log('Processing booth payment for ID:', registration_id);
        const registration = await RegisterBooth.findById(registration_id).populate('VendorID');
        
        if (!registration) {
          return res.status(404).json({ message: 'Booth registration not found' });
        }

        // Calculate and set payment fees
        const boothPrice = calculateBoothPrice(registration.BoothSize, registration.SetupDuration);
        console.log('Calculated booth price:', boothPrice);
        
        registration.PaymentStatus = 'Paid';
        registration.PaymentFees = boothPrice;
        await registration.save();

        // 📧 Get card details and send receipt
        const vendor = registration.VendorID;
        let lastFourDigits = '****';
        
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
          const chargeId = paymentIntent.latest_charge;
          
          if (chargeId) {
            const charge = await stripe.charges.retrieve(chargeId);
            lastFourDigits = charge.payment_method_details?.card?.last4 || '****';
          }
        } catch (err) {
          console.error('Error retrieving card details:', err);
        }

        await sendPaymentReceiptCardEmail(
          vendor.companyName,
          lastFourDigits,
          `$${boothPrice.toFixed(2)}`,
          vendor.email,
          `Booth ${registration.BoothSize} - ${registration.Location}`,
          new Date().toLocaleDateString(),
          'Card'
        );

        console.log('Booth updated successfully with email sent');
        
      } else if (type === 'bazaar') {
        console.log('Processing bazaar payment for ID:', registration_id);
        const registration = await RegisterBazaar.findById(registration_id)
          .populate('VendorName')
          .populate('BazaarName');
        
        if (!registration) {
          return res.status(404).json({ message: 'Bazaar registration not found' });
        }

        // Calculate and set payment fees
        const bazaarPrice = calculateBazaarPrice(registration.BoothSize);
        console.log('Calculated bazaar price:', bazaarPrice);
        
        registration.PaymentStatus = 'Paid';
        registration.PaymentFees = bazaarPrice;
        await registration.save();

        // 📧 Get card details and send receipt
        const vendor = registration.VendorName;
        let lastFourDigits = '****';
        
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
          const chargeId = paymentIntent.latest_charge;
          
          if (chargeId) {
            const charge = await stripe.charges.retrieve(chargeId);
            lastFourDigits = charge.payment_method_details?.card?.last4 || '****';
          }
        } catch (err) {
          console.error('Error retrieving card details:', err);
        }

        await sendPaymentReceiptCardEmail(
          vendor.companyName,
          lastFourDigits,
          `$${bazaarPrice.toFixed(2)}`,
          vendor.email,
          `Bazaar Booth ${registration.BoothSize} - ${registration.BazaarName?.name || 'Bazaar'}`,
          new Date().toLocaleDateString(),
          'Card'
        );

        console.log('Bazaar updated successfully with email sent');
        
      } else {
        console.log('Invalid type:', type);
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Payment verified and updated. Receipt sent via email.' 
      });
      
    } else {
      console.log('Payment status is NOT paid, it is:', session.payment_status);
      return res.status(400).json({ 
        success: false, 
        message: 'Payment not completed', 
        status: session.payment_status 
      });
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    next(err);
  }
}
export async function deleteTripRegistration(req, res, next) {
  try {
    const { registrationId } = req.params;

    if (!registrationId) {
      return res.status(400).json({ message: 'Registration ID is required' });
    }

    const result = await RegisterTrip.findByIdAndDelete(registrationId);

    if (!result) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.status(200).json({ message: 'Trip registration cancelled successfully' });
  } catch (err) {
    next(err);
  }
}
export async function getTripPrice(req, res, next) {
  try {
    const { registrationId } = req.params;

    if (!registrationId) {
      return res.status(400).json({ message: "Registration ID is required" });
    }

    // 1ï¸âƒ£ Find the registration document
    const registration = await RegisterTrip.findById(registrationId);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // 2ï¸âƒ£ Query the Trip using the stored TripName (which is a Trip ObjectId)
    const tripId = registration.TripName; // <-- this is ObjectId of Trip
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // 3ï¸âƒ£ Return price
    return res.status(200).json({
      price: trip.price,
    });

  } catch (err) {
    next(err);
  }
}

// Redeem points for wallet credit
export async function redeemPoints(req, res, next) {
  try {
    const { pointsToRedeem } = req.body;
    const userCustomId = req.userCustomId;
    const role = req.role;

    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return res.status(400).json({ message: 'Invalid points amount' });
    }

    // Points must be in multiples of 500
    if (pointsToRedeem % 500 !== 0) {
      return res.status(400).json({ 
        message: 'Points must be redeemed in multiples of 500',
        validAmounts: [500, 1000, 1500, 2000, 2500]
      });
    }

    // Calculate dollar value: 500 points = $10
    const dollarValue = (pointsToRedeem / 500) * 10;

    // Check if user has any cancellable registrations (more than 2 weeks before event start)
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));

    let cancellableWorkshops = [];
    let cancellableTrips = [];

    if (role === 'student') {
      cancellableWorkshops = await RegisterWorkshop.find({
        StudentID: userCustomId,
        PaymentStatus: 'Paid'
      }).populate('WorkshopName');

      cancellableTrips = await RegisterTrip.find({
        StudentID: userCustomId,
        PaymentStatus: 'Paid'
      }).populate('TripName');
    } else if (role === 'Staff' || role === 'TA' || role === 'Professor') {
      cancellableWorkshops = await RegisterWorkshop.find({
        StaffID: userCustomId,
        PaymentStatus: 'Paid'
      }).populate('WorkshopName');

      cancellableTrips = await RegisterTrip.find({
        StaffID: userCustomId,
        PaymentStatus: 'Paid'
      }).populate('TripName');
    }

    // Check if any workshop can still be cancelled
    const hasCancellableWorkshop = cancellableWorkshops.some(reg => {
      if (reg.WorkshopName && reg.WorkshopName.start) {
        const workshopDate = new Date(reg.WorkshopName.start);
        return workshopDate > twoWeeksFromNow;
      }
      return false;
    });

    // Check if any trip can still be cancelled
    const hasCancellableTrip = cancellableTrips.some(reg => {
      if (reg.TripName && reg.TripName.start) {
        const tripDate = new Date(reg.TripName.start);
        return tripDate > twoWeeksFromNow;
      }
      return false;
    });

    if (hasCancellableWorkshop || hasCancellableTrip) {
      return res.status(400).json({ 
        message: 'Cannot redeem points while you have cancellable registrations',
        detail: 'You have paid registrations for events that start more than 2 weeks from now. Please wait until the cancellation period has passed or cancel your registrations before redeeming points.',
        hasCancellableWorkshop,
        hasCancellableTrip
      });
    }

    let updatedUser;
    
    if (role === 'student') {
      // First check if user has enough points
      const student = await Student.findOne({ studentId: userCustomId });
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      if ((student.points || 0) < pointsToRedeem) {
        return res.status(400).json({ 
          message: 'Insufficient points balance',
          available: student.points || 0,
          required: pointsToRedeem
        });
      }

      // Update points and wallet
      updatedUser = await Student.findOneAndUpdate(
        { studentId: userCustomId },
        {
          $inc: { 
            points: -pointsToRedeem,
            walletBalance: dollarValue
          },
          $push: {
            pointsHistory: {
              points: -pointsToRedeem,
              action: 'redeemed',
              source: 'redemption',
              description: `Redeemed ${pointsToRedeem} points for $${dollarValue.toFixed(2)}`,
              createdAt: new Date()
            }
          }
        },
        { new: true }
      );

    } else if (role === 'Staff' || role === 'TA' || role === 'Professor') {
      // First check if user has enough points
      const staff = await Staff.findOne({ staffId: userCustomId });
      
      if (!staff) {
        return res.status(404).json({ message: 'Staff not found' });
      }

      if ((staff.points || 0) < pointsToRedeem) {
        return res.status(400).json({ 
          message: 'Insufficient points balance',
          available: staff.points || 0,
          required: pointsToRedeem
        });
      }

      // Update points and wallet
      updatedUser = await Staff.findOneAndUpdate(
        { staffId: userCustomId },
        {
          $inc: { 
            points: -pointsToRedeem,
            walletBalance: dollarValue
          },
          $push: {
            pointsHistory: {
              points: -pointsToRedeem,
              action: 'redeemed',
              source: 'redemption',
              description: `Redeemed ${pointsToRedeem} points for $${dollarValue.toFixed(2)}`,
              createdAt: new Date()
            }
          }
        },
        { new: true }
      );

    } else {
      return res.status(400).json({ message: 'User type does not support points redemption' });
    }

    if (!updatedUser) {
      return res.status(404).json({ message: 'Failed to update user' });
    }

    return res.status(200).json({
      message: `Successfully redeemed ${pointsToRedeem} points for $${dollarValue.toFixed(2)}`,
      pointsRedeemed: pointsToRedeem,
      dollarValue: dollarValue,
      newPoints: updatedUser.points,
      newWalletBalance: updatedUser.walletBalance
    });

  } catch (err) {
    console.error('Points redemption error:', err);
    next(err);
  }
}

