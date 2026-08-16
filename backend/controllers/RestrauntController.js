import Joi from 'joi';
import { FoodItem } from '../models/FoodIteam.js';
import { Menu } from '../models/Menu.js';
import cloudinary from '../utils/cloudinary.js';
import { FoodCart } from '../models/FoodCart.js';
// token verification is done via middleware; use req.id and req.role
export const addanIteam = async (req, res) => {
  // Define Joi schema for validation
  const schema = Joi.object({
    name: Joi.string().required(),
    Price: Joi.number().required(),
    description: Joi.string().required(),
    category: Joi.string().required(),
    Availability: Joi.boolean().optional(),
  });

  // Validate request body
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    // Auth middleware sets req.id and req.role
    const ownerId = req.id;
    const role = req.role;
    if (!ownerId) return res.status(401).json({ error: 'Missing authentication' });
    if (role !== 'restaurant' && role !== 'admin') {
      return res.status(403).json({ error: 'Only restaurants can add food items' });
    }
    // Upload photo to Cloudinary
    let photoData = [];
    if (req.files && req.files['Photo']) {
      const file = req.files['Photo'][0];
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'food_items',
      });
      photoData.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }
    // Create new FoodItem and set owner (Restraunt)
    const newFoodItem = new FoodItem({
      name: value.name,
      Price: value.Price,
      Photo: photoData,
      description: value.description,
      category: value.category,
      Availability: value.Availability,
      Restraunt: ownerId,
    });
    await newFoodItem.save();
    // Ensure the restaurant has a Menu document and add this item to it
    try {
      let menu = await Menu.findOne({ Restraunt: ownerId });
      if (!menu) {
        menu = new Menu({ Restraunt: ownerId, FoodItems: [newFoodItem._id] });
      } else {
        // avoid duplicates
        if (!menu.FoodItems.some(id => id.toString() === newFoodItem._id.toString())) {
          menu.FoodItems.push(newFoodItem._id);
        }
      }
      await menu.save();
    } catch (menuErr) {
      console.error('Error updating menu with new item:', menuErr);
      // don't fail the request if menu update fails; item was created
    }
    return res.status(201).json({ message: 'Food item added successfully', foodItem: newFoodItem });
  } catch (err) {
    console.error('Error adding food item:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMenuByRestraunt = async (req, res) => {
  const { restrauntId } = req.params;
  try {
    const menu = await Menu.findOne({ Restraunt: restrauntId }).populate('FoodItems');
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found for this restaurant' });
    }
    return res.status(200).json({ menu });
  } catch (err) {
    console.error('Error fetching menu:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllFoodItems = async (req, res) => {
  try {
    const foodItems = await FoodItem.find();
    return res.status(200).json({ foodItems });
  } catch (err) {
    console.error('Error fetching food items:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
export const deleteFoodItem = async (req, res) => {
  const { id: foodItemId } = req.params;
  try {
    // use req.id / req.role from middleware
    const ownerId = req.id;
    const role = req.role;

    // fetch item and check ownership
    const item = await FoodItem.findById(foodItemId);
    if (!item) return res.status(404).json({ error: 'Food item not found' });

    // allow if owner matches or admin
    if (role !== 'admin' && item.Restraunt?.toString() !== ownerId) {
      return res.status(403).json({ error: 'Not authorized to delete this item' });
    }

    await item.remove();
    return res.status(200).json({ message: 'Food item deleted successfully' });
  } catch (err) {
    console.error('Error deleting food item:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
export const updateFoodItem = async (req, res) => {
  const { id: foodItemId } = req.params;
  // Define Joi schema for validation
  const schema = Joi.object({
    name: Joi.string().optional(),
    Price: Joi.number().optional(),
    description: Joi.string().optional(),
    category: Joi.string().optional(),
    Availability: Joi.boolean().optional(),
  });
  // Validate request body
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    // use req.id / req.role from middleware
    const ownerId = req.id;
    const role = req.role;

    // fetch item and check ownership
    const item = await FoodItem.findById(foodItemId);
    if (!item) return res.status(404).json({ error: 'Food item not found' });

    if (role !== 'admin' && item.Restraunt?.toString() !== ownerId) {
      return res.status(403).json({ error: 'Not authorized to update this item' });
    }

    // apply updates
    Object.assign(item, value);
    const saved = await item.save();
    return res.status(200).json({ message: 'Food item updated successfully', foodItem: saved });
  } catch (err) {
    console.error('Error updating food item:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


export const updateFoodItemAvailability = async (req, res) => {
  const { id: foodItemId } = req.params;
  const { Availability } = req.body;
  try {
    // use req.id / req.role from middleware
    const ownerId = req.id;
    const role = req.role;

    console.log('🔍 updateFoodItemAvailability - Auth Debug:');
    console.log('  - Role:', role);
    console.log('  - Owner ID:', ownerId);
    console.log('  - Food Item ID:', foodItemId);

    // fetch item and check ownership
    const item = await FoodItem.findById(foodItemId);
    if (!item) return res.status(404).json({ error: 'Food item not found' });

    console.log('  - Item Restraunt:', item.Restraunt?.toString());

    // Check authorization: admin can update any item
    let isAuthorized = false;
    if (role === 'admin') {
      isAuthorized = true;
      console.log('  - Admin access granted');
    } else if (role === 'restaurant') {
      // First check if item.Restraunt matches (for items created with Restraunt field)
      if (item.Restraunt?.toString() === ownerId) {
        isAuthorized = true;
        console.log('  - Direct ownership match');
      } else {
        // Check if item belongs to this restaurant's menu
        const menu = await Menu.findOne({ Restraunt: ownerId });
        if (menu && menu.FoodItems) {
          const itemInMenu = menu.FoodItems.some(id => id.toString() === foodItemId);
          if (itemInMenu) {
            isAuthorized = true;
            console.log('  - Item found in restaurant menu');
          }
        }
      }
    }

    if (!isAuthorized) {
      console.log('  ❌ AUTHORIZATION FAILED');
      return res.status(403).json({ error: 'Not authorized to update availability for this item' });
    }

    console.log('  ✅ AUTHORIZATION PASSED');
    item.Availability = Availability;
    const saved = await item.save();
    return res.status(200).json({ message: 'Food item availability updated successfully', foodItem: saved });
  } catch (err) {
    console.error('Error updating food item availability:', err);
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

// Return menu for the authenticated restaurant (uses requireAuth middleware)
export const getMyMenu = async (req, res) => {
  const ownerId = req.id;
  if (!ownerId) return res.status(401).json({ error: 'Missing authentication' });
  try {
    const menu = await Menu.findOne({ Restraunt: ownerId }).populate('FoodItems');
    if (!menu) return res.status(404).json({ error: 'Menu not found for this restaurant' });
    return res.status(200).json({ menu });
  } catch (err) {
    console.error('Error fetching my menu:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
