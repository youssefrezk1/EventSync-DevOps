// models/Teams.js
import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: [true, 'Student ID is required for each team member.'],
        trim: true,
        match: [/^\d{2}-\d{4,5}$/, 'Please use a valid Student ID format']
    },
    name: {
        type: String,
        required: [true, 'Member name is required.'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required.'],
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@student\.guc\.edu\.eg$/, 'Email must be @student.guc.edu.eg']
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Disqualified'],
        default: 'Pending'
    }
});

const teamSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournaments',
        required: true
    },
    teamName: {
        type: String,
        required: [true, 'Team name is required.'],
        trim: true,
        // ❌ REMOVE: unique: true // Team names should be unique per tournament, not globally
    },
    captainId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student', // Changed from 'User' to 'Student'
        required: true
    },
    members: {
        type: [teamMemberSchema],
        required: true,
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: 'A team must have at least one member.'
        }
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Disqualified'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
     // Add this new field:
     paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
        default: 'Pending'
    },
});

// Add compound index for tournament-scoped unique team names
teamSchema.index({ tournamentId: 1, teamName: 1 }, { unique: true });

export const Team = mongoose.model('Team', teamSchema);