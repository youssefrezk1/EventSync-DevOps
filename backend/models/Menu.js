import mongoose from 'mongoose';

const MenuSchema = new mongoose.Schema(
{ 
    Restraunt:
        { type: mongoose.Schema.Types.ObjectId, ref: 'Restraunt', required: true },
    FoodItems: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
    ],
},{
  timestamps:true
  });

export const Menu = mongoose.model('Menu', MenuSchema);