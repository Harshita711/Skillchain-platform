const sendNotification = async (io, userId, type, message, relatedId = null) => {

    const notification = await Notification.create({
        user: userId,
        type,
        message,
        relatedId
    });

    if (io) {
        io.to(userId.toString()).emit('notification', notification);
    }

    return notification;
};
