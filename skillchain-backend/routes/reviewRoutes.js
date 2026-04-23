const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Review = require('../models/Review');
const recalculateRating = require('../utils/ratingCalculator');
const sendNotification = require('../utils/notificationHelper');

const router = express.Router();

router.post('/', protect, async (req, res) => {

    const { reviewedUser, rating, comment } = req.body;

    const review = await Review.create({
        reviewer: req.user._id,
        reviewedUser,
        rating,
        comment
    });

    await recalculateRating(reviewedUser);

    await sendNotification(
        req.io,
        reviewedUser,
        "review",
        "You received a new review",
        review._id
    );

    res.json(review);
});

module.exports = router;
