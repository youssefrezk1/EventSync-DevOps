import mongoose from 'mongoose';

const ConfrenceSchema = new mongoose.Schema(
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
  shortDescription: {
    type: String,
    required: true,
  },
  fullAgenda: {
    type: String,
    required: true,
  },
  conferenceWebsiteLink: {
    type: String,
    required: true,
  },
  requiredBudget: {
    type: Number,
    required: true,
  },
  sourceOfFunding: {
    type: String,
    enum: ['external', 'GUC'],
    required: true,
  },
  extraRequiredResources: {
    type: String,
    
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

export const Confrence = mongoose.model('Confrence', ConfrenceSchema);
