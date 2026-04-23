const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


/* ==============================
   GET USER NOTIFICATIONS
============================== */
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({
            user: req.user._id
        })
            .sort({ createdAt: -1 });

        res.json(notifications);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


/* ==============================
   MARK AS READ
============================== */
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!notification)
            return res.status(404).json({
                message: "Notification not found"
            });

        notification.read = true;
        await notification.save();

        res.json(notification);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


/* ==============================
   MARK ALL AS READ
============================== */
router.put('/mark-all/read', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { read: true }
        );

        res.json({ message: "All notifications marked as read" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
