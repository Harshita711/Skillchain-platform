const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Session = require('../models/Session');

const router = express.Router();

router.get('/', protect, async (req, res) => {

    const sessions = await Session.find({
        $or: [
            { requester: req.user._id },
            { provider: req.user._id }
        ]
    }).sort({ scheduledAt: 1 });

    res.json(sessions);
});

module.exports = router;
