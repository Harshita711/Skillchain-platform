const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    const notifications = await Notification.find({
        user: req.user._id
    }).sort({ createdAt: -1 });

    res.json(notifications);
};

exports.markAsRead = async (req, res) => {
    const notification = await Notification.findById(req.params.id);
    notification.read = true;
    await notification.save();
    res.json(notification);
};
