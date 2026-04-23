const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    type: {
        type: String,
        enum: ["service", "review", "session", "announcement"],
        required: true
    },

    message: {
        type: String,
        required: true,
        trim: true
    },

    relatedId: {
        type: mongoose.Schema.Types.ObjectId
    },

    read: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
