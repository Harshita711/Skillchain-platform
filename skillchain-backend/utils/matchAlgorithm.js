const User = require('../models/User');

const matchProviders = async (skill, requester) => {

    // If requester has coordinates, try geoNear to get nearest providers then sort by rating
    if (requester && requester.location && Array.isArray(requester.location.coordinates)) {
        try {
            const [lng, lat] = requester.location.coordinates;
            const providers = await User.aggregate([
                {
                    $geoNear: {
                        near: { type: 'Point', coordinates: [lng, lat] },
                        distanceField: 'distanceMeters',
                        spherical: true,
                        query: { 'skills.name': skill, _id: { $ne: requester._id } }
                    }
                },
                { $sort: { distanceMeters: 1, rating: -1, totalReviews: -1 } }
            ]);

            return providers;
        } catch (err) {
            // If geospatial index is missing (e.g., in-memory DB test), fall back to campus/city/global
            console.warn('⚠️  Geospatial query failed, falling back to campus/city priority:', err.message);
            // Continue to fallback logic below
        }
    }

    // Fallback: prior behavior (campus -> city -> global) sorted by rating
    const baseQuery = {
        "skills.name": skill,
        _id: { $ne: requester._id }
    };

    // 1️⃣ Campus priority
    let providers = await User.find({
        ...baseQuery,
        university: requester.university,
        campus: requester.campus
    })
    .sort({ rating: -1, totalReviews: -1 });

    if (providers.length > 0) return providers;

    // 2️⃣ City fallback
    providers = await User.find({
        ...baseQuery,
        city: requester.city
    })
    .sort({ rating: -1, totalReviews: -1 });

    if (providers.length > 0) return providers;

    // 3️⃣ Global fallback
    providers = await User.find(baseQuery)
        .sort({ rating: -1, totalReviews: -1 });

    return providers;
};

module.exports = matchProviders;
