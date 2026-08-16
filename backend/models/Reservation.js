import mongoose from "mongoose";
const reservationSchema = new mongoose.Schema({
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,  // e.g., "14:00-15:00"
    required: true
  }
});

export const Reservation = mongoose.model('Reservation', reservationSchema);
