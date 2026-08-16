import { Restraunt } from '../models/Restraunt.js';
import { FoodCart } from '../models/FoodCart.js';
import { FoodItem } from '../models/FoodIteam.js';

// List all restaurants (public)
export async function listRestaurants(req, res) {
  try {
    const restaurants = await Restraunt.find({}, 'name email logo isVerified');
    return res.status(200).json({ restaurants });
  } catch (err) {
    console.error('Error listing restaurants:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Submit order from cart: set pickupLocation and mark Confirmed; also set cart Restraunt from first item
export async function submitOrder(req, res) {
  try {
    const { cartId } = req.params;
    const { pickupLocation } = req.body; // expected values: 'UC','UD','UB','N'

    if (!cartId) return res.status(400).json({ message: 'cartId is required' });
    if (!pickupLocation || !['UC', 'UD', 'UB', 'N', 'Restaurant'].includes(pickupLocation)) {
      return res.status(400).json({ message: 'Invalid pickupLocation' });
    }

    const cart = await FoodCart.findById(cartId).populate('items.foodItem');
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    // Ownership: allow Student/Staff owner or admin
    const requesterId = req.id;
    const requesterRole = req.role;
    const isOwner = (cart.Student && cart.Student.toString() === requesterId) || (cart.Staff && cart.Staff.toString() === requesterId) || requesterRole === 'admin';
    if (!isOwner) return res.status(403).json({ message: 'Not allowed to submit this cart' });

    // Determine restaurant for this cart from first item
    let restaurantId = cart.Restraunt;
    if ((!restaurantId || restaurantId == null) && cart.items && cart.items.length) {
      const firstItem = cart.items[0].foodItem;
      if (firstItem && firstItem.Restraunt) restaurantId = firstItem.Restraunt;
    }

    cart.pickupLocation = pickupLocation;
    if (restaurantId) cart.Restraunt = restaurantId;
    cart.status = 'Confirmed';
    cart.finished = false; // waiting for restaurant to complete
    await cart.save();

    return res.status(200).json({ message: 'Order submitted', cart });
  } catch (err) {
    console.error('submitOrder error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Restaurant: get all confirmed orders for this restaurant
export async function restaurantGetConfirmedOrders(req, res) {
  try {
    const restaurantId = req.id;
    const role = req.role;
    if (role !== 'restaurant' && role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    console.log('🔍 Looking for orders for restaurant:', restaurantId);

    // First, get the menu for this restaurant
    const { Menu } = await import('../models/Menu.js');
    const menu = await Menu.findOne({ Restraunt: restaurantId });

    if (!menu || !menu.FoodItems || menu.FoodItems.length === 0) {
      console.log('⚠️ No menu or food items found for this restaurant');
      return res.status(200).json({ orders: [] });
    }

    console.log('📋 Found menu with', menu.FoodItems.length, 'food items');

    // Get all food item IDs for this restaurant
    const restaurantFoodItemIds = menu.FoodItems.map(id => id.toString());

    // Get all confirmed orders and populate
    // Get all confirmed and completed orders and populate
    const allOrders = await FoodCart.find({ status: { $in: ['Confirmed', 'Completed'] } })
      .populate('items.foodItem')
      .populate('Student')
      .populate('Staff');

    console.log('📦 Found', allOrders.length, 'confirmed orders total');

    // Filter orders that contain items from this restaurant's menu
    const orders = allOrders.filter(order => {
      // Debug log for each order
      // console.log(`\n🔍 Checking Order ${order._id}:`);
      // console.log(`   - Order Restaurant: ${order.Restraunt}`);
      // console.log(`   - Current Restaurant ID: ${restaurantId}`);

      // Check if Restraunt field is set and matches (legacy orders)
      if (order.Restraunt && order.Restraunt.toString() === restaurantId) {
        // console.log('   ✅ Match by Order.Restraunt');
        return true;
      }

      // Check if any item in the order is from this restaurant's menu
      console.log('   - order.items type:', typeof order.items);
      console.log('   - order.items length:', order.items?.length);

      if (order.items && order.items.length > 0) {
        const hasRestaurantItem = order.items.some(item => {
          if (!item.foodItem || !item.foodItem._id) {
            // console.log('   ⚠️ Item missing foodItem or _id');
            return false;
          }
          const itemId = item.foodItem._id.toString();
          const matches = restaurantFoodItemIds.includes(itemId);
          // console.log(`   - Item ${itemId} in menu? ${matches}`);
          return matches;
        });
        if (hasRestaurantItem) {
          //console.log('   ✅ Match by item content');
          return true;
        }
      }

      //console.log('   ❌ No match found');
      return false;
    });

    console.log('✅ Found', orders.length, 'orders for this restaurant');

    return res.status(200).json({ orders });
  } catch (err) {
    console.error('restaurantGetConfirmedOrders error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Restaurant: update order status to Completed
export async function restaurantUpdateOrderStatus(req, res) {
  try {
    const restaurantId = req.id;
    const role = req.role;
    const { cartId } = req.params;

    if (role !== 'restaurant' && role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    if (!cartId) return res.status(400).json({ message: 'cartId is required' });

    const cart = await FoodCart.findById(cartId).populate('items.foodItem');
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    // Check if this restaurant owns this order
    // Either Restraunt field matches OR items belong to this restaurant
    let isAuthorized = false;

    if (role === 'admin') {
      isAuthorized = true;
    } else if (cart.Restraunt && cart.Restraunt.toString() === restaurantId) {
      isAuthorized = true;
    } else if (cart.items && cart.items.length > 0) {
      // Get the restaurant's menu to check if items belong to this restaurant
      const { Menu } = await import('../models/Menu.js');
      const menu = await Menu.findOne({ Restraunt: restaurantId });

      if (menu && menu.FoodItems) {
        const restaurantFoodItemIds = menu.FoodItems.map(id => id.toString());

        // Check if all items in the cart belong to this restaurant's menu
        isAuthorized = cart.items.every(item => {
          if (!item.foodItem || !item.foodItem._id) return false;
          return restaurantFoodItemIds.includes(item.foodItem._id.toString());
        });
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    cart.status = 'Completed';
    cart.finished = true;
    await cart.save();

    // ---------------------------------------------------------
    // SEND COMPLETION EMAIL WITH QR TICKET
    // ---------------------------------------------------------
    try {
      // Re-populate student data to ensure we have email and names
      const populatedCart = await FoodCart.findById(cart._id).populate('Student');
      if (populatedCart && populatedCart.Student) {
        console.log('📧 Sending completion email to student:', populatedCart.Student.email);
        const { sendFoodOrderCompletedEmail } = await import('../utils/emailService.js');
        await sendFoodOrderCompletedEmail(populatedCart.Student, populatedCart);
      }
    } catch (emailErr) {
      console.error('⚠️ Failed to send order completion email:', emailErr);
      // We do NOT fail the request if email fails, just log it
    }

    return res.status(200).json({ message: 'Order marked as completed', cart });
  } catch (err) {
    console.error('restaurantUpdateOrderStatus error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
