import mongoose from 'mongoose';

const eventofficeSchema = new mongoose.Schema(

{ 
  adminName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
     match: /.+@(student\.)?guc\.edu\.eg$/,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  isVerified: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['Active', 'Blocked'],
    default: 'Active',
  },
  walletBalance: {
    type: Number,
    default: 0,
  }
}, {
    timestamps: true
  });
  export const EventOffice = mongoose.model('EventOffice', eventofficeSchema);