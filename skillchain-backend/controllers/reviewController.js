const Review = require('../models/Review');
const User = require('../models/User');

exports.createReview = async (req, res) => {

    const { reviewedUserId, rating, comment } = req.body;

    await Review.create({
        reviewer: req.user._id,
        reviewedUser: reviewedUserId,
        rating,
        comment
    });

    const reviews = await Review.find({ reviewedUser: reviewedUserId });

    const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    const user = await User.findById(reviewedUserId);
    user.rating = avg;
    user.totalReviews = reviews.length;

    await user.save();
    await recalculateRating(reviewedUserId);

    res.json({ message: "Review added" });
};
