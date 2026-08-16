import mongoose from 'mongoose';

const RegisterWorkshopSchema = new mongoose.Schema(
  {
    // Reference to Workshop (still uses ObjectId since workshops likely use default _id)
    WorkshopName: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },

    // Store studentId or staffId that YOU set (not MongoDB's _id)
    StudentID: { type: String, ref: 'Student', required: false },
    StaffID: { type: String, ref: 'Staff', required: false },

    Name: { type: String, required: true },
    Email: { type: String, required: true },
    PaymentStatus: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' }
  },
  { timestamps: true }
);

export const RegisterWorkshop = mongoose.model('RegisterWorkshop', RegisterWorkshopSchema);
