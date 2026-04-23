const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },

    skill: {
        type: String,
        required: true
    },

    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    scheduledAt: {
        type: Date,
        required: true
    },

    location: {
        type: String,
        trim: true
    },

    coins: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: ["scheduled", "completed", "cancelled"],
        default: "scheduled"
    }

}, { timestamps: true });

sessionSchema.index({ requester: 1 });
sessionSchema.index({ provider: 1 });

module.exports = mongoose.model('Session', sessionSchema);
