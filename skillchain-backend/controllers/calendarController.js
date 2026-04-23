const Session = require('../models/Session');

exports.getSessions = async (req, res) => {

    const sessions = await Session.find({
        $or: [
            { requester: req.user._id },
            { provider: req.user._id }
        ]
    })
    .populate("requester", "name")
    .populate("provider", "name")
    .sort({ date: 1 });

    res.json(sessions);
};

exports.completeSession = async (req, res) => {
    const session = await Session.findById(req.params.id);
    session.status = "completed";
    await session.save();
    res.json(session);
};
