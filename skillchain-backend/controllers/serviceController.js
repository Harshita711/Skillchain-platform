const Service = require('../models/Service');
const Session = require('../models/Session');
const { transferCoins } = require('../utils/coinManager');
const sendNotification = require('../utils/notificationHelper');


// ========================================
// REQUEST SERVICE
// ========================================
exports.requestService = async (req, res) => {
    try {

        const {
            providerId,
            skillRequested,
            description,
            coinsOffered,
            scheduledAt,
            location
        } = req.body;

        const service = await Service.create({
            requester: req.user._id,
            provider: providerId,
            skillRequested,
            description,
            coinsOffered,
            scheduledAt,
            location
        });

        await sendNotification(
            req.io,
            providerId,
            "service",
            "New service request received",
            service._id
        );

        res.status(201).json(service);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// ========================================
// ACCEPT SERVICE (NO COIN TRANSFER HERE)
// ========================================
exports.acceptService = async (req, res) => {
    try {

        const service = await Service.findById(req.params.id);

        if (!service)
            return res.status(404).json({ message: "Service not found" });

        service.status = "accepted";
        await service.save();

        // Create session
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

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// ========================================
// PROVIDER MARK COMPLETE
// ========================================
exports.providerComplete = async (req, res) => {
    try {

        const service = await Service.findById(req.params.id);

        if (!service)
            return res.status(404).json({ message: "Service not found" });

        service.providerConfirmed = true;
        await service.save();

        await checkAndTransfer(service, req.io);

        res.json(service);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// ========================================
// REQUESTER MARK COMPLETE
// ========================================
exports.requesterComplete = async (req, res) => {
    try {

        const service = await Service.findById(req.params.id);

        if (!service)
            return res.status(404).json({ message: "Service not found" });

        service.requesterConfirmed = true;
        await service.save();

        await checkAndTransfer(service, req.io);

        res.json(service);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// ========================================
// CHECK BOTH CONFIRMATIONS → TRANSFER COINS
// ========================================
const checkAndTransfer = async (service, io) => {

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

        await Session.updateOne(
            { requester: service.requester, provider: service.provider, scheduledAt: service.scheduledAt },
            { status: "completed" }
        );

        await sendNotification(
            io,
            service.provider,
            "service",
            "Coins have been transferred for completed session",
            service._id
        );

        await sendNotification(
            io,
            service.requester,
            "service",
            "Session successfully completed",
            service._id
        );
    }
};
