import { FoodCart } from '../models/FoodCart.js';
import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';
import { Menu } from '../models/Menu.js';
import { Restraunt } from '../models/Restraunt.js';
import Joi from 'joi';

export const AddtoCart = async (req, res) => {
    const { studentId, staffId, foodItemId, quantity, restrauntId } = req.body;
    try {
        // Get the restaurant ID from the food item's menu
        let restaurantId = restrauntId;
        if (!restaurantId) {
            const menu = await Menu.findOne({ FoodItems: foodItemId });
            if (menu) {
                restaurantId = menu.Restraunt;
            }
        }

        let cart = await FoodCart.findOne({
            $or: [
                { Student: studentId },
                { Staff: staffId }
            ],
            status: 'Pending'
        })
        
        // If cart exists but belongs to a different restaurant, clear it
        if (cart && restaurantId && cart.Restraunt && cart.Restraunt.toString() !== restaurantId.toString()) {
            cart.items = [];
            cart.Restraunt = restaurantId;
        }
        
        if (!cart) {
            cart = new FoodCart({
                Student: studentId,
                Staff: staffId,
                items: [],
                Restraunt: restaurantId
            });
        } else if (!cart.Restraunt && restaurantId) {
            // Set restaurant if not already set
            cart.Restraunt = restaurantId;
        }
        
        const itemIndex = cart.items.findIndex(item => item.foodItem.toString() === foodItemId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({ foodItem: foodItemId, quantity });
        }
        await cart.save();
        return res.status(200).json({ message: 'Item added to cart successfully', cart });
    }
    catch (err) {
        console.error('Error adding to cart:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const GetCart = async (req, res) => {
    const { studentId, staffId } = req.params;
    try {
        const cart = await FoodCart.findOne({
            $or: [
                { Student: studentId },
                { Staff: staffId }
            ],
            status: 'Pending'
        }).populate('items.foodItem').populate('Restraunt');
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        return res.status(200).json({ cart });
    } catch (err) {
        console.error('Error fetching cart:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
export const RemoveFromCart = async (req, res) => {
    const { studentId, staffId, foodItemId } = req.body;
    try {
        const cart = await FoodCart.findOne({
            $or: [
                { Student: studentId },
                { Staff: staffId }
            ],
            status: 'Pending'
        });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        cart.items = cart.items.filter(item => item.foodItem.toString() !== foodItemId);
        await cart.save();
        return res.status(200).json({ message: 'Item removed from cart successfully', cart });
    } catch (err) {
        console.error('Error removing from cart:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
export const ClearCart = async (req, res) => {
    let { studentId, staffId } = req.body || {};
    // fallback to authenticated user id when body doesn't provide studentId/staffId
    try {
        if (!studentId && !staffId && req && req.id) {
            // treat req.id as Student by default; controller is protected by requireAuth
            studentId = req.id;
        }
    } catch (e) {
        // ignore
    }
    try {
        const cart = await FoodCart.findOne({
            $or: [
                { Student: studentId },
                { Staff: staffId }
            ],
            status: 'Pending'
        });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        cart.items = [];
        await cart.save();
        return res.status(200).json({ message: 'Cart cleared successfully', cart });
    } catch (err) {
        console.error('Error clearing cart:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const UpdateCartItemQuantity = async (req, res) => {
    const { studentId, staffId, foodItemId, quantity } = req.body;
    try {
        const cart = await FoodCart.findOne({
            $or: [
                { Student: studentId },
                { Staff: staffId }
            ],
            status: 'Pending'
        });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        const itemIndex = cart.items.findIndex(item => item.foodItem.toString() === foodItemId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
            await cart.save();
            return res.status(200).json({ message: 'Cart item quantity updated successfully', cart });
        } else {
            return res.status(404).json({ error: 'Food item not found in cart' });
        }
    } catch (err) {
        console.error('Error updating cart item quantity:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
export const viewMenuResytraunt = async (req, res) => {
    const { restrauntId } = req.params;

    try {
        const menu = await Menu.findOne({ Restraunt: restrauntId })
            .populate({
                path: 'FoodItems',
                match: { Availability: true },   // Only available items
            });

        if (!menu) {
            return res.status(404).json({ error: 'Menu not found for this restaurant' });
        }

        return res.status(200).json({ menu });
    } catch (err) {
        console.error('Error fetching menu:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};