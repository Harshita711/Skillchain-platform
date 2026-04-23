const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    content: {
        type: String,
        required: true,
        trim: true
    },

    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    },

    read: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ service: 1 });

module.exports = mongoose.model('Message', messageSchema);
