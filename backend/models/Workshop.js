import mongoose from 'mongoose';

const WorkshopSchema = new mongoose.Schema(
    {
name: { type: String, required: true },
location: { type: String, enum: ['GUC Cairo', 'GUC Berlin'], required: true },
start : { type: Date, required: true },
end : { type: Date, required: true },
shortDescription : { type: String, required: true },
fullagenda : { type: String, required: true },
facultyResponsible: { type: String, required: true },
professorsParticipating: { type: [String], required: true },
requiredBudget: { type: Number, required: true },
fundingSource: { type: String, enum: ['external', 'GUC'], required: true },
extraRequiredResources: { type: String, required: true },
capacity: { type: Number, required: true },
registrationDeadline: { type: Date, required: true },
status: { type: String, enum: ['Pending', 'confirmed', 'rejected'], default: 'Pending' },
requestChange: { type: String, default: '' },
ProfCreator: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
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
         restrictedTo: {
      type: [
        {
          type: String,
          enum: ['Student', 'TA', 'Staff', 'Professor'],
        }
      ],
      default: []
    },
    isArchived: { type: Boolean, default: false },
    
    },{
    timestamps:true
    });

export const Workshop = mongoose.model('Workshop', WorkshopSchema);