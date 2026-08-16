import mongoose from 'mongoose';
import { type } from 'node:os';

const courtSchema = new mongoose.Schema({
  id: {
    type: Number,
    required:true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['basketball', 'tennis', 'football'],
    required: true
  }
}, {
  timestamps: true
});

export const Court = mongoose.model('Court', courtSchema);