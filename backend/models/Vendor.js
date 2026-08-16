import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
{ 
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Blocked'],
    default: 'Active',
  },
  taxCard: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
  logo: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    isVerified: { type: Boolean, default: true },
verificationToken: { type: String },
  walletBalance: {
    type: Number,
    default: 0,
  }
},{
  timestamps:true
  });

export const Vendor = mongoose.model('Vendor', vendorSchema);