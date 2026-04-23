// Demo script: create sample users and call the match endpoint to show ordering
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
    if (!process.env.MONGO_URI) {
        console.error('Set MONGO_URI in .env before running demo');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected DB');

    // Clear users
    await User.deleteMany({});

    // Requester
    const requester = await User.create({ name: 'Requester', email: 'req@demo', password: 'password123', location: { type: 'Point', coordinates: [77.5946, 12.9716] } });

    const a = await User.create({ name: 'NearbyLow', email: 'a@demo', password: 'password123', location: { type: 'Point', coordinates: [77.5950, 12.9718] }, skills: [{ name: 'Guitar' }], rating: 4.2, totalReviews: 5 });
    const b = await User.create({ name: 'FarHigh', email: 'b@demo', password: 'password123', location: { type: 'Point', coordinates: [77.60, 12.98] }, skills: [{ name: 'Guitar' }], rating: 4.9, totalReviews: 20 });

    console.log('Created demo users');
    console.log('Requester id:', requester._id.toString());
    console.log('Now run the server and call /api/users/match?skill=Guitar as the requester (with JWT).');
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
