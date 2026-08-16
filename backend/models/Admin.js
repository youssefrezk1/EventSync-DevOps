import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(

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

},{
timestamps:true
});
export const Admin = mongoose.model('Admin', adminSchema);
