// Example migration script: reads CSV or JSON of users with address and updates their location
// This is a template; adapt to your data source and run once.

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { geocodeAddress } = require('../utils/geocode');
require('dotenv').config();

const MONGO = process.env.MONGO_URI;
if (!MONGO) {
    console.error('Set MONGO_URI in .env');
    process.exit(1);
}

mongoose.connect(MONGO).then(async () => {
    console.log('Connected');

    // Example: file users_to_geocode.json
    const file = path.join(__dirname, 'users_to_geocode.json');
    if (!fs.existsSync(file)) {
        console.error('Create migrations/users_to_geocode.json with array of { email, campus, dorm, city, region, country }');
        process.exit(1);
    }

    const batch = JSON.parse(fs.readFileSync(file, 'utf8'));

    for (const u of batch) {
        const user = await User.findOne({ email: u.email });
        if (!user) continue;
        const parts = [u.campus, u.dorm, u.city, u.region, u.country].filter(Boolean);
        const addr = parts.join(', ');
        console.log('Geocoding', u.email, addr);
        const coords = await geocodeAddress(addr);
        if (coords) {
            user.location = { type: 'Point', coordinates: [coords.lon, coords.lat] };
            await user.save();
            console.log('Saved coords for', u.email);
        } else {
            console.warn('Failed to geocode', u.email);
        }
    }

    console.log('Done');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
