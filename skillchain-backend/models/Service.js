const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({

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

    skillRequested: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    coinsOffered: {
        type: Number,
        required: true,
        min: 1
    },

    scheduledAt: {
        type: Date,
        required: true
    },

    location: String,

    status: {
        type: String,
        enum: ["pending", "accepted", "completed", "cancelled", "rejected"],
        default: "pending"
    },

    providerConfirmed: {
        type: Boolean,
        default: false
    },

    requesterConfirmed: {
        type: Boolean,
        default: false
    },

    coinsTransferred: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

serviceSchema.index({ requester: 1 });
serviceSchema.index({ provider: 1 });
serviceSchema.index({ status: 1 });

module.exports = mongoose.model('Service', serviceSchema);
