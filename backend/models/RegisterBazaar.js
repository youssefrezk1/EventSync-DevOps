import mongoose from 'mongoose';

const registerBazaarSchema = new mongoose.Schema({
    VendorName: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    BazaarName: { type: mongoose.Schema.Types.ObjectId, ref: 'Bazaar', required: true },
    Attendees: [
        {
            name: { type: String, required: true },
            email: { type: String, required: true }
        }
    ],
    BoothSize: { type: String, enum: ['2x2', '4x4'], required: true },
    PhotoIDs: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    Pending: { type: String, enum: ['Pending', 'Accept', 'Reject'], default: 'Pending' },
    PaymentStatus: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
    PaymentDueDate: { type: Date },
    PaymentFees:{type: Number, default: 0},
},{
  timestamps:true
  });


export const RegisterBazaar = mongoose.model('RegisterBazaar', registerBazaarSchema);