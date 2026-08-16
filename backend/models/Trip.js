import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
    name: {
    type: String,
    required: true,
  },
location: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
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
    itinerary: [{ type: mongoose.Schema.Types.ObjectId, ref: "ItineraryItem" }],
},{
  timestamps:true
  });

export const Trip = mongoose.model('Trip', TripSchema);
