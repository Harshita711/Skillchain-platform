const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const Service = require('../models/Service');
const Session = require('../models/Session');
const { transferCoins } = require('../utils/coinManager');
const sendNotification = require('../utils/notificationHelper');

const router = express.Router();


// ================= REQUEST =================
router.post('/request', protect, async (req, res) => {
    try {

        const service = await Service.create({
            requester: req.user._id,
            provider: req.body.providerId,
            skillRequested: req.body.skillRequested,
            description: req.body.description,
            coinsOffered: req.body.coinsOffered,
            scheduledAt: new Date(req.body.scheduledAt),
            location: req.body.location
        });

        await sendNotification(
            req.io,
            service.provider,
            "service",
            "New service request received",
            service._id
        );

        res.status(201).json(service);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ================= ACCEPT =================
router.put('/:id/accept', protect, async (req, res) => {
    try {

        const service = await Service.findById(req.params.id);

        if (!service)
            return res.status(404).json({ message: "Service not found" });

        service.status = "accepted";
        await service.save();

        await Session.create({
            title: `${service.skillRequested} Session`,
            skill: service.skillRequested,
            requester: service.requester,
            provider: service.provider,
            scheduledAt: service.scheduledAt,
            location: service.location,
            coins: service.coinsOffered
        });

        await sendNotification(
            req.io,
            service.requester,
            "session",
            "Your service request was accepted",
            service._id
        );

        res.json(service);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ================= PROVIDER COMPLETE =================
router.put('/:id/provider-complete', protect, async (req, res) => {
    try {

        const service = await Service.findById(req.params.id);
        if (!service)
            return res.status(404).json({ message: "Service not found" });

        service.providerConfirmed = true;
        await service.save();

        await checkCompletion(service, req.io);

        res.json(service);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ================= REQUESTER COMPLETE =================
router.put('/:id/requester-complete', protect, async (req, res) => {
    try {

        const service = await Service.findById(req.params.id);
        if (!service)
            return res.status(404).json({ message: "Service not found" });

        service.requesterConfirmed = true;
        await service.save();

        await checkCompletion(service, req.io);

        res.json(service);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ================= COMPLETION LOGIC =================
async function checkCompletion(service, io) {

    if (
        service.providerConfirmed &&
        service.requesterConfirmed &&
        !service.coinsTransferred
    ) {

        await transferCoins(
            service.requester,
            service.provider,
            service.coinsOffered
        );

        service.coinsTransferred = true;
        service.status = "completed";
        await service.save();

        await sendNotification(
            io,
            service.provider,
            "service",
            "Coins transferred successfully",
            service._id
        );

        await sendNotification(
            io,
            service.requester,
            "service",
            "Session completed successfully",
            service._id
        );
    }
}

module.exports = router;
