import mongoose from 'mongoose';

const PollSchema = new mongoose.Schema({
  Events: [
    {
      booth: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RegisterBooth',
        required: true,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  ],
},
{
  timestamps: true,
});
export const Poll = mongoose.model('Poll', PollSchema);
