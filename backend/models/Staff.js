import mongoose from 'mongoose';

const refundHistorySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  source: {
    type: String,
    required: true,
    enum: ['workshop', 'trip'],
  },
  sourceName: {
    type: String,
    required: true, // e.g., "Workshop A", "Trip B"
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true, // Reference to the Workshop or Trip
  },
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true, // Reference to the Registration that was cancelled
  },
  refundedAt: {
    type: Date,
    default: Date.now,
  },
});

// Points History Schema
const pointsHistorySchema = new mongoose.Schema({
  points: {
    type: Number,
    required: true, // Positive for earned, negative for deducted/redeemed
  },
  action: {
    type: String,
    required: true,
    enum: ['earned', 'deducted', 'redeemed'],
  },
  source: {
    type: String,
    required: true, // e.g., "payment", "cancellation", "redemption"
  },
  description: {
    type: String,
    required: true, // e.g., "Earned from $100 payment", "Redeemed 500 points for $10"
  },
  relatedPaymentAmount: {
    type: Number, // The payment amount that triggered the points
  },
  registrationId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the related registration if applicable
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const staffSchema = new mongoose.Schema(
    {
      email: {
        type: String,
        required: true,
        unique: true,
        // match: /.+@(student\.)?guc\.edu\.eg$/,
      },
      passwordHash: {
        type: String,
        required: true,
      },
      firstName: {
        type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  staffId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Blocked'],
    default: 'Active',
  },
  isPending: {
    type: String,
    enum: ['Pending', 'Confirmed'],
    default: 'Pending',
  },
  role: {
    type: String,
    enum: ['Staff', 'TA', 'Professor', 'Not yet'],
    default: 'Not yet',
  },
  dummyrole: {
    type: String,
    enum: ['Staff', 'TA', 'Professor'],
    required: true,
  },
  isVerified: { type: Boolean, default: false },
verificationToken: { type: String },

  walletBalance: {
    type: Number,
    default: 0,
  },
  refundHistory: [refundHistorySchema],
  points: {
    type: Number,
    default: 0,
  },
  pointsHistory: [pointsHistorySchema],
   favorites: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: 'favorites.itemModel', // dynamic model reference
        },
        itemModel: {
          type: String,
          required: true,
          enum: ['Bazaar', 'RegisterBooth', 'Confrence', 'Trip', 'Workshop'],
        },
      },
    ], 
},{
  timestamps:true
  });


export const Staff = mongoose.model('Staff', staffSchema);