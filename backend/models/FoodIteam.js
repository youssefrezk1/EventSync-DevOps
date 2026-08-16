import mongoose from 'mongoose';

const FoodItemSchema = new mongoose.Schema(
{ 
  name: {
    type: String,
    required: true,
  },
  Price: {
    type: Number,
    required: true,
  },
  Photo: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],

  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    },  
  Availability: {
    type: Boolean,
    default: true,
    
  },

},{
  timestamps:true
  });

export const FoodItem = mongoose.model('FoodItem', FoodItemSchema);
