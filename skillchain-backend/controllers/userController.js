const User = require('../models/User');

exports.getUsers = async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
};

// Match users by skill, preferring nearest first then rating and reviews.
exports.getMatchUsers = async (req, res) => {
    const { skill } = req.query;

    if (!skill) return res.status(400).json({ message: 'Skill required' });

    // If requester has coords, try geoNear; otherwise fall back to campus/city groups.
    const requester = req.user;
    if (requester && requester.location && Array.isArray(requester.location.coordinates)) {
        try {
            const [lng, lat] = requester.location.coordinates;
            const users = await User.aggregate([
                {
                    $geoNear: {
                        near: { type: 'Point', coordinates: [lng, lat] },
                        distanceField: 'distanceMeters',
                        spherical: true,
                        query: { 'skills.name': skill, _id: { $ne: requester._id } }
                    }
                },
                { $sort: { distanceMeters: 1, rating: -1, totalReviews: -1 } },
                // Project distance in meters and standardize output shape similar to find()
                { $project: { password: 0 } }
            ]);

            return res.json(users);
        } catch (err) {
            // If geospatial index is missing (e.g., in-memory DB test), fall back to campus/city priority
            console.warn('⚠️  Geospatial query failed, falling back to campus/city priority:', err.message);
            // Continue to fallback logic below
        }
    }

    // Fallback: campus -> city -> global sorted by rating then reviews
    let users = await User.find({ 'skills.name': skill, university: requester.university, campus: requester.campus, _id: { $ne: requester._id } }).sort({ rating: -1, totalReviews: -1 });
    if (users.length > 0) return res.json(users);

    users = await User.find({ 'skills.name': skill, city: requester.city, _id: { $ne: requester._id } }).sort({ rating: -1, totalReviews: -1 });
    if (users.length > 0) return res.json(users);

    users = await User.find({ 'skills.name': skill, _id: { $ne: requester._id } }).sort({ rating: -1, totalReviews: -1 });
    res.json(users);
};

