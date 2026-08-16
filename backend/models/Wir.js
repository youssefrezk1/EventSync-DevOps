import mongoose from 'mongoose';
const wirSchema = new mongoose.Schema(
{ 
  vendorID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  discountRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  
  },
  promoCode : {
    type: String,
    required: true
    },
termsAndConditions : {
    type: String,
    required: true
    },
},{
  timestamps:true
  });
export const Wir = mongoose.model('Wir', wirSchema);