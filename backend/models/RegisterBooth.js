import mongoose from 'mongoose';

const RegisterBoothSchema = new mongoose.Schema(
  {
    VendorID: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    Attendees: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true }
      }
    ],
    SetupDuration: {
      type: String,
      enum: ['1 week', '2 weeks', '3 weeks', '4 weeks'],
      required: true
    },
    Location: { type: String, required: true },
    BoothSize: { type: String, enum: ['2x2', '4x4'], required: true },
    PhotoIDs: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      }
    ],
    StartDate: { type: Date },

    // Will be calculated automatically before saving
    EndDate: { type: Date },

    Pending: { type: String, enum: ['Pending', 'Accept', 'Reject'], default: 'Pending' },
    PaymentStatus: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
    PaymentDueDate: { type: Date },
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
    PaymentFees:{type: Number, default: 0},
  },
  { timestamps: true }
);

// 🧮 Auto-calculate EndDate based on StartDate + SetupDuration
RegisterBoothSchema.pre('save', function (next) {
  if (this.StartDate && this.SetupDuration) {
    const weeks = parseInt(this.SetupDuration.split(' ')[0]); // e.g., "2 weeks" → 2
    const calculatedEnd = new Date(this.StartDate);
    calculatedEnd.setDate(calculatedEnd.getDate() + weeks * 7);
    this.EndDate = calculatedEnd;
  }
  next();
});

// Also handle updates where StartDate or SetupDuration may change
RegisterBoothSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  if (update.StartDate && update.SetupDuration) {
    const weeks = parseInt(update.SetupDuration.split(' ')[0]);
    const calculatedEnd = new Date(update.StartDate);
    calculatedEnd.setDate(calculatedEnd.getDate() + weeks * 7);
    update.EndDate = calculatedEnd;
    this.setUpdate(update);
  }

  next();
});

export const RegisterBooth = mongoose.model('RegisterBooth', RegisterBoothSchema);
