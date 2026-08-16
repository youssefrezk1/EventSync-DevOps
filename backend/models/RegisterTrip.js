import mongoose from 'mongoose';

const RegisterTripSchema = new mongoose.Schema(
  {
    // Reference to Trip (_id stays as ObjectId)
    TripName: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Trip', 
      required: true 
    },

    // Custom IDs that you define (not MongoDB’s ObjectId)
    StudentID: { 
      type: String, 
      ref: 'Student', 
      required: false 
    },
    StaffID: { 
      type: String, 
      ref: 'Staff', 
      required: false 
    },

    Name: { 
      type: String, 
      required: true 
    },
    Email: { 
      type: String, 
      required: true 
    },
    PaymentStatus: { 
      type: String, 
      enum: ['Unpaid', 'Paid'],
      default: 'Unpaid' }
  },
  { timestamps: true }
);

export const RegisterTrip = mongoose.model('RegisterTrip', RegisterTripSchema);
