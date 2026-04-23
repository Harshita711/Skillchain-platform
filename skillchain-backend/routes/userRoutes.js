const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const matchProviders = require('../utils/matchAlgorithm');
const { updateProfileLocation } = require('../controllers/authController');

const router = express.Router();

router.get('/match', protect, async (req, res) => {

    const { skill } = req.query;

    if (!skill) {
        return res.status(400).json({ message: 'Skill required' });
    }

    try {
        const providers = await matchProviders(skill, req.user);
        res.json(providers);
    } catch (err) {
        console.warn('⚠️  Match endpoint error, falling back:', err.message);
        res.status(500).json({ message: 'Error finding providers', error: err.message });
    }
});

// Update profile including address fields and regenerate coords
router.patch('/profile', protect, async (req, res) => {
    try {
        const updated = await updateProfileLocation(req.user._id, req.body);
        res.json({ user: updated });
    } catch (e) {
        res.status(e.status || 500).json({ message: e.message || 'Server error' });
    }
});

module.exports = router;
