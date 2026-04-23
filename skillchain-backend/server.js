require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const server = http.createServer(app);

/* ==========================
   SOCKET.IO SETUP
========================== */

const io = socketIO(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

/* ==========================
   DATABASE CONNECTION
========================== */

connectDB();
console.log("CLIENT_URL:", process.env.CLIENT_URL);

/* ==========================
   GLOBAL MIDDLEWARE
========================== */

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach io to every request
app.use((req, res, next) => {
    req.io = io;
    next();
});

/* ==========================
   ROUTES
========================== */

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/calendar', require('./routes/calendarRoutes'));

/* ==========================
   ROOT ROUTE
========================== */

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'SkillChain API is running 🚀',
        version: '1.0.0'
    });
});

/* ==========================
   SOCKET LOGIC
========================== */

// Improved multi-socket support
const onlineUsers = new Map(); // userId -> Set(socketIds)

io.on('connection', (socket) => {

    console.log('🔌 Connected:', socket.id);

    socket.on('join', (userId) => {

        socket.join(userId);

        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }

        onlineUsers.get(userId).add(socket.id);

        io.emit('userOnline', { userId });
    });

    socket.on('typing', (data) => {
        socket.to(data.recipientId).emit('userTyping', data);
    });

    socket.on('sendMessage', (data) => {
        io.to(data.recipientId).emit('newMessage', data);
    });

    socket.on('sendNotification', (notification) => {
        io.to(notification.userId).emit('notification', notification);
    });

    socket.on('postUpdate', (data) => {
        io.emit('postUpdated', data);
    });

    socket.on('serviceUpdate', (data) => {
        io.to(data.userId).emit('serviceUpdated', data);
    });

    socket.on('disconnect', () => {

        for (let [userId, sockets] of onlineUsers.entries()) {

            if (sockets.has(socket.id)) {

                sockets.delete(socket.id);

                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit('userOffline', { userId });
                }

                break;
            }
        }

        console.log('❌ Disconnected:', socket.id);
    });

});

/* ==========================
   ERROR HANDLING
========================== */

app.use(notFound);
app.use(errorHandler);

/* ==========================
   SERVER START
========================== */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║                                        ║
    ║   🚀 SkillChain Backend Server         ║
    ║                                        ║
    ║   📡 http://localhost:${PORT}           ║
    ║   🌐 ${process.env.NODE_ENV || 'development'}                ║
    ║   ⚡ Socket.IO Enabled                 ║
    ║                                        ║
    ╚════════════════════════════════════════╝
    `);
});


process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
});

// Export app and server for testing
module.exports = { app, server };
