import mongoose from 'mongoose';

const VoteSchema = new mongoose.Schema({
  poll: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true,
  },
  userType: {
    type: String,
    enum: ['Student', 'Staff'],
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userType', 
    required: true,
  },
  booth: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegisterBooth',
    required: true,
  },
  votedAt: {
    type: Date,
    default: Date.now,
  },
},
{
  timestamps: true,
});

// Compound index to ensure one vote per user per poll
VoteSchema.index({ poll: 1, user: 1, userType: 1 }, { unique: true });

export const Vote = mongoose.model('Vote', VoteSchema);