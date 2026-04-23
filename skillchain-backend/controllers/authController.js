const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const { geocodeAddress, geocodeWithRetry } = require('../utils/geocode');

exports.register = async (req, res) => {
    const { name, email, password, university, campus, city, region, dorm, country, useDeviceLocation, deviceLat, deviceLng } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }

    // Determine coordinates: prefer device coordinates if provided and allowed
    let coords = null;
    if (useDeviceLocation && deviceLat && deviceLng) {
        coords = { lat: Number(deviceLat), lon: Number(deviceLng) };
    } else {
        // Build address from provided fields
        const parts = [campus, dorm, city, region, country, university].filter(Boolean);
        const address = parts.join(', ');
        coords = await geocodeWithRetry(address, 3, 800);
    }

    if (!coords) {
        return res.status(400).json({ message: "We couldn't verify your location. Please check your details or enable location access." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        university,
        campus,
        city,
        region,
        dorm,
        country,
        coins: 20,
        rating: 5,
        totalReviews: 0,
        location: {
            type: 'Point',
            coordinates: [coords.lon, coords.lat]
        }
    });

    res.status(201).json({
        token: generateToken(user._id),
        user
    });
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
    });
};

// Update profile endpoint helper: updates address fields and regenerates coords
exports.updateProfileLocation = async (userId, { university, campus, city, region, dorm, country, useDeviceLocation, deviceLat, deviceLng }) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.university = university ?? user.university;
    user.campus = campus ?? user.campus;
    user.city = city ?? user.city;
    user.region = region ?? user.region;
    user.dorm = dorm ?? user.dorm;
    user.country = country ?? user.country;

    let coords = null;
    if (useDeviceLocation && deviceLat && deviceLng) {
        coords = { lat: Number(deviceLat), lon: Number(deviceLng) };
    } else {
        const parts = [user.campus, user.dorm, user.city, user.region, user.country, user.university].filter(Boolean);
        const address = parts.join(', ');
        coords = await geocodeWithRetry(address, 3, 800);
    }

    if (!coords) {
        const err = new Error("We couldn't verify your location. Please check your details or enable location access.");
        err.status = 400;
        throw err;
    }

    user.location = { type: 'Point', coordinates: [coords.lon, coords.lat] };
    await user.save();
    return user;
};

exports.getMe = async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
};
