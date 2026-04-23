const Post = require('../models/Post');
const cloudinary = require('../config/cloudinary');

exports.createPost = async (req, res) => {

    let mediaUrl = null;
    let mediaType = null;

    if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "auto"
        });

        mediaUrl = result.secure_url;
        mediaType = result.resource_type === "video" ? "video" : "image";
    }

    const post = await Post.create({
        author: req.user._id,
        content: req.body.content,
        media: mediaUrl,
        mediaType
    });

    req.io.emit("postUpdated", post);

    res.status(201).json(post);
};

exports.getPosts = async (req, res) => {
    const posts = await Post.find()
        .populate("author", "name")
        .sort({ createdAt: -1 });

    res.json(posts);
};

exports.likePost = async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post.likes.includes(req.user._id)) {
        post.likes.push(req.user._id);
    } else {
        post.likes.pull(req.user._id);
    }

    await post.save();
    res.json(post);
};
