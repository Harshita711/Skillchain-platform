const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

router.post('/register', async (req, res) => {
    // Expecting: name, email, password, university, campus, city, region, dorm, country,
    // optionally: useDeviceLocation (bool), deviceLat, deviceLng
    const { name, email } = req.body;

    // Delegate to controller (which handles geocoding and validation)
    try {
        await require('../controllers/authController').register(req, res);
    } catch (e) {
        console.error('Register route error', e);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({
        token: generateToken(user._id),
        user
    });
});

router.get('/me', protect, async (req, res) => {
    res.json(req.user);
});

module.exports = router;
