const mongoose = require('mongoose');
const User = require('../models/User');

const transferCoins = async (fromUserId, toUserId, amount) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const sender = await User.findById(fromUserId).session(session);
        const receiver = await User.findById(toUserId).session(session);

        if (!sender || !receiver)
            throw new Error("User not found");

        if (sender.coins < amount)
            throw new Error("Insufficient coins");

        sender.coins -= amount;
        receiver.coins += amount;

        await sender.save({ session });
        await receiver.save({ session });

        await session.commitTransaction();
        session.endSession();

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const refundCoins = async (fromUserId, toUserId, amount) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const sender = await User.findById(fromUserId).session(session);
        const receiver = await User.findById(toUserId).session(session);

        if (!sender || !receiver)
            throw new Error("User not found");

        receiver.coins -= amount;
        sender.coins += amount;

        await sender.save({ session });
        await receiver.save({ session });

        await session.commitTransaction();
        session.endSession();

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

module.exports = {
    transferCoins,
    refundCoins
};
