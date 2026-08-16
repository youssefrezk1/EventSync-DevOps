import mongoose from 'mongoose';
const tournamentSchema = new mongoose.Schema({
    // --- 1. Core Identification and Status ---
    name: {
        type: String,
        required: [true, 'Tournament name is required.'],
        trim: true
    },
    eventOfficeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Or 'OfficeUser' if you have a separate model
        required: true
    },
    sport: {
        type: String,
        required: [true, 'Sport is required.'],
        enum: ['tennis', 'football', 'basketball', 'volleyball', 'handball', 'pingpong', 'power lifting', 'cross fit', 'chess']
    },
    status: {
        type: String,
        required: true,
        enum: ['Draft', 'Open for Registration', 'Sponsorship Open', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Draft'
    },

    // --- 2. Schedule and Location Details ---
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationDeadline: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    address: { type: String, trim: true },

    // --- 3. Tournament Structure and Rules ---
    teamSize: { // Used for validation in the Team controller
        type: Number,
        required: true,
        min: [1, 'Team size must be at least 1.']
    },
    maxTeams: {
        type: Number,
        required: true,
        min: [1, 'Max teams must be at least 1.']
    },
    rules: { type: String },
    entryFee: {
        type: Number,
        required: true,
        default: 0
    },
    prize: {
        type: String,
        trim: true,
        default: ''
    },

    // --- 4. Participation Tracking (References the Team model) ---
    registeredTeams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }],

    // --- 5. Sponsorship/Vendor Details ---
    isSponsorshipOpen: {
        type: Boolean,
        default: false
    },
    sponsors: [{
        sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
        tier: String,
        logoUrl: String
    }],

    createdAt: { type: Date, default: Date.now }
});

// Virtual property for easy access to the current team count
tournamentSchema.virtual('currentTeams').get(function() {
    return this.registeredTeams.length;
});

export const Tournament = mongoose.model('Tournaments', tournamentSchema);
