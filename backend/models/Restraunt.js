import mongoose from "mongoose";
const RestrauntSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
  }, passwordHash: {
    type: String,
    required: true,
  },
  logo: [
    {
      url: { type: String, required: true }
    }
  ],
}, {
  timestamps: true
});

export const Restraunt = mongoose.model('Restraunt', RestrauntSchema);