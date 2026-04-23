const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

const postSchema = new mongoose.Schema({

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    content: {
        type: String,
        trim: true
    },

    media: {
        type: String
    },

    mediaType: {
        type: String,
        enum: ["image", "video"]
    },

    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    comments: [commentSchema]

}, { timestamps: true });

postSchema.index({ author: 1 });

module.exports = mongoose.model('Post', postSchema);
