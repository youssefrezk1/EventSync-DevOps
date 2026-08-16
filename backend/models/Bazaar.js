import mongoose from 'mongoose';

const BazaarSchema = new mongoose.Schema(
    {  
name: {
    type: String,
    required: true,
  },
  start: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
    required: true,
  },
  registrationDeadline: {
    type: Date,
    required: true,
  },
  comments: {
  type: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }
  ],
  default: []
},
    rates: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Rate'
        }
      ],
      default: []
    },
    isArchived: { type: Boolean, default: false },
      restrictedTo: {
    type: [
      {
        type: String,
        enum: ['Student', 'TA', 'Staff', 'Professor'],
      }
    ],
    default: []
  },
},{
  timestamps:true
  });

export const Bazaar = mongoose.model('Bazaar', BazaarSchema);