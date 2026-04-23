const recalculateRating = async (userId) => {

    const reviews = await Review.find({ reviewedUser: userId });

    const user = await User.findById(userId);
    if (!user) return;

    if (!reviews.length) {
        user.rating = 5.0;
        user.totalReviews = 0;
    } else {
        const avg =
            reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

        user.rating = Number(avg.toFixed(2));
        user.totalReviews = reviews.length;
    }

    await user.save();
};
