const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const Post = require('../models/Post');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/* ==============================
   Cloudinary Storage Setup
============================== */
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'skillchain_posts',
        resource_type: 'auto'
    }
});

const upload = multer({ storage });


/* ==============================
   CREATE POST
============================== */
router.post('/', protect, upload.single('media'), async (req, res) => {
    try {
        const { content } = req.body;

        if (!content && !req.file) {
            return res.status(400).json({
                message: "Post must contain text or media"
            });
        }

        const post = await Post.create({
            author: req.user._id,
            content,
            media: req.file ? req.file.path : null,
            mediaType: req.file
                ? req.file.mimetype.startsWith('video')
                    ? 'video'
                    : 'image'
                : null
        });

        const populatedPost = await Post.findById(post._id)
            .populate('author', 'name profileImage');

        req.io.emit('postUpdated', populatedPost);

        res.status(201).json(populatedPost);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


/* ==============================
   GET ALL POSTS
============================== */
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'name profileImage')
            .sort({ createdAt: -1 });

        res.json(posts);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


/* ==============================
   LIKE / UNLIKE POST
============================== */
router.post('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post)
            return res.status(404).json({ message: "Post not found" });

        const index = post.likes.indexOf(req.user._id);

        if (index === -1) {
            post.likes.push(req.user._id);
        } else {
            post.likes.splice(index, 1);
        }

        await post.save();

        req.io.emit('postUpdated', post);

        res.json(post);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


/* ==============================
   COMMENT ON POST
============================== */
router.post('/:id/comment', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post)
            return res.status(404).json({ message: "Post not found" });

        if (!req.body.text)
            return res.status(400).json({ message: "Comment text required" });

        post.comments.push({
            user: req.user._id,
            text: req.body.text
        });

        await post.save();

        const populatedPost = await Post.findById(post._id)
            .populate('author', 'name profileImage')
            .populate('comments.user', 'name profileImage');

        req.io.emit('postUpdated', populatedPost);

        res.json(populatedPost);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
