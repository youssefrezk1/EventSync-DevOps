import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  inviteeName: {
    type: String,
    required: true
  },
  inviteePhoto: {
    type: String, // URL to uploaded photo
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  expirationDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'used', 'rejected'], // Added 'pending' and 'rejected'
    default: 'pending' // Changed default to 'pending'
  }
}, { 
  timestamps: true 
});

// Auto-expire check
invitationSchema.methods.isExpired = function() {
  return new Date() > this.expirationDate;
};

export const Invitation = mongoose.model('Invitation', invitationSchema);