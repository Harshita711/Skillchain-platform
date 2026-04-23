const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({

    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    reviewedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    },

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },

    comment: {
        type: String,
        trim: true
    }

}, { timestamps: true });

reviewSchema.index({ reviewedUser: 1 });

module.exports = mongoose.model('Review', reviewSchema);
