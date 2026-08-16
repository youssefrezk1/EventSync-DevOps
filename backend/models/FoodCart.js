import mongoose from 'mongoose';
import { Student } from './Student.js';
import { Staff } from './Staff.js';

const FoodCartSchema = new mongoose.Schema({
  Student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  Staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  Restraunt: { type: mongoose.Schema.Types.ObjectId, ref: 'Restraunt' },

  items: [
    {
      foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
      quantity: { type: Number, required: true, default: 1 },
    },
  ],
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed'],
    default: 'Pending',
  },
  pickupLocation: {
    type: String,
    enum: ['UC', 'UD', 'UB', 'N', 'Restaurant'],
    default: 'UC'
  },
  buyerName: { type: String },
  phone: { type: String },
  finished: { type: Boolean, default: false },
  price: {
    type: Number,
    default: 0,
  },
  serviceFee: {
    type: Number,
    default: 0,
  },
}
  , {
    timestamps: true
  });

export const FoodCart = mongoose.model('FoodCart', FoodCartSchema);