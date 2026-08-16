import { Student } from '../models/Student.js';
import { Staff } from '../models/Staff.js';
import { Trip } from '../models/Trip.js';
import { Workshop } from '../models/Workshop.js';
import { Bazaar } from '../models/Bazaar.js';
import { Confrence } from '../models/Confrence.js';
import { RegisterBooth } from '../models/RegisterBooth.js';

// Add event to favorites
export async function addToFavorites(req, res, next) {
  try {
    const { eventId, eventType } = req.body;
    const userId = req.id;
    const role = req.role;

    // Map eventType to model name
    const modelMap = {
      'trip': 'Trip',
      'workshop': 'Workshop',
      'bazaar': 'Bazaar',
      'conference': 'Confrence',
      'booth': 'RegisterBooth'
    };

    const itemModel = modelMap[eventType];
    if (!itemModel) {
      return res.status(400).json({ message: 'Invalid event type' });
    }

    // Verify event exists
    const models = {
      'Trip': Trip,
      'Workshop': Workshop,
      'Bazaar': Bazaar,
      'Confrence': Confrence,
      'RegisterBooth': RegisterBooth
    };

    const eventExists = await models[itemModel].findById(eventId);
    if (!eventExists) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get user model based on role
    let UserModel;
    if (role === 'student') {
      UserModel = Student;
    } else if (['Staff', 'TA', 'Professor'].includes(role)) {
      UserModel = Staff;
    } else {
      return res.status(403).json({ message: 'Only students and staff can favorite events' });
    }

    // Check if already favorited
    const user = await UserModel.findById(userId);
    const alreadyFavorited = user.favorites.some(
      fav => fav.item.toString() === eventId && fav.itemModel === itemModel
    );

    if (alreadyFavorited) {
      return res.status(400).json({ message: 'Event already in favorites' });
    }

    // Add to favorites
    await UserModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          favorites: {
            item: eventId,
            itemModel: itemModel
          }
        }
      }
    );

    res.json({ message: 'Added to favorites', success: true });
  } catch (err) {
    next(err);
  }
}

// Remove event from favorites
export async function removeFromFavorites(req, res, next) {
  try {
    const { eventId } = req.params;
    const userId = req.id;
    const role = req.role;

    // Get user model based on role
    let UserModel;
    if (role === 'student') {
      UserModel = Student;
    } else if (['Staff', 'TA', 'Professor'].includes(role)) {
      UserModel = Staff;
    } else {
      return res.status(403).json({ message: 'Only students and staff can favorite events' });
    }

    // Remove from favorites
    await UserModel.findByIdAndUpdate(
      userId,
      {
        $pull: {
          favorites: { item: eventId }
        }
      }
    );

    res.json({ message: 'Removed from favorites', success: true });
  } catch (err) {
    next(err);
  }
}

// Get all favorites for a user
export async function getFavorites(req, res, next) {
  try {
    const userId = req.id;
    const role = req.role;

    // Get user model based on role
    let UserModel;
    if (role === 'student') {
      UserModel = Student;
    } else if (['Staff', 'TA', 'Professor'].includes(role)) {
      UserModel = Staff;
    } else {
      return res.status(403).json({ message: 'Only students and staff can view favorites' });
    }

    // Get user with populated favorites
    const user = await UserModel.findById(userId).populate('favorites.item');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Manually populate nested fields based on item type
    const populatePromises = user.favorites.map(async (fav) => {
      if (!fav.item) return null;
      
      // Populate ProfCreator for workshops
      if (fav.itemModel === 'Workshop' && fav.item.ProfCreator) {
        await fav.item.populate('ProfCreator', 'firstName lastName');
      }
      
      // Populate VendorID for booths
      if (fav.itemModel === 'RegisterBooth' && fav.item.VendorID) {
        await fav.item.populate('VendorID', 'companyName email logo');
      }
      
      return fav;
    });

    await Promise.all(populatePromises);

    // Format favorites with event type - Filter out deleted/null events and items without _id
    const formattedFavorites = user.favorites
      .filter(fav => fav && fav.item && fav.item._id) // Filter out deleted events and ensure valid item with _id
      .map(fav => {
        const eventTypeMap = {
          'Trip': 'trip',
          'Workshop': 'workshop',
          'Bazaar': 'bazaar',
          'Confrence': 'conference',
          'RegisterBooth': 'booth'
        };

        return {
          ...fav.item.toObject(),
          eventType: eventTypeMap[fav.itemModel]
        };
      });

    res.json(formattedFavorites);
  } catch (err) {
    next(err);
  }
}

// Check if event is favorited
export async function checkFavorite(req, res, next) {
  try {
    const { eventId } = req.params;
    const userId = req.id;
    const role = req.role;

    let UserModel;
    if (role === 'student') {
      UserModel = Student;
    } else if (['Staff', 'TA', 'Professor'].includes(role)) {
      UserModel = Staff;
    } else {
      return res.status(403).json({ message: 'Only students and staff can check favorites' });
    }

    const user = await UserModel.findById(userId);
    const isFavorited = user.favorites.some(fav => fav.item.toString() === eventId);

    res.json({ isFavorited });
  } catch (err) {
    next(err);
  }
}
