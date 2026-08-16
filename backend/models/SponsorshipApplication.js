// models/SponsorshipApplication.js
import mongoose from 'mongoose';

const sponsorshipApplicationSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournaments',
        required: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor', // Your separate Vendor model
        required: true
    },
    proposedTier: {
        type: String,
        enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Standard'],
        required: true
    },
    proposedAmount: {
        type: Number,
        required: true,
        min: [0, 'Proposed amount must be positive']
    },
    message: {
        type: String,
        trim: true,
        maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['wallet', 'stripe'],
        required: true
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    stripeSessionId: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to prevent duplicate applications from same vendor to same tournament
sponsorshipApplicationSchema.index({ tournamentId: 1, vendorId: 1 }, { unique: true });

export const SponsorshipApplication = mongoose.model('SponsorshipApplication', sponsorshipApplicationSchema);