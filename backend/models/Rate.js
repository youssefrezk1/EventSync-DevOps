import mongoose from 'mongoose';

const RateSchema = new mongoose.Schema(
  {
    StudentID: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        StaffID: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    rating: { type: Number, min: 1, max: 5, required: true },
  },
  { timestamps: true }
);

export const Rate = mongoose.model('Rate', RateSchema);
