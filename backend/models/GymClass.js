import mongoose from 'mongoose';

const GymClassSchema = new mongoose.Schema(
  { 
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['yoga', 'pilates', 'aerobics', 'Zumba', 'cross circuit', 'kick-boxing'],
      required: true,
    },
    maxParticipants: {
      type: Number,
      required: true,
    },
    counter: {
      type: Number,
      default: 0,
    },
    // 🟩 Array of students (ObjectIds referencing Student model)
    studentParticipants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: [],
    }],
    // 🟩 Array of staff (ObjectIds referencing Staff model)
    staffParticipants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: [],
    }],
  },
  {
    timestamps: true,
  }
);

export const GymClass = mongoose.model('GymClass', GymClassSchema);
