// socket_test.js
// Lightweight test harness for Socket.IO + HTTP API
// Usage:
// 1) cd skillchain-backend (or workspace root)
// 2) npm install socket.io-client axios
// 3) node socket_test.js

const io = require('socket.io-client');
const axios = require('axios');

const SERVER = process.env.SERVER_URL || 'http://localhost:5000';
const TEST_USER_ID = 'test-user-1';

(async function main() {
  console.log('Starting Socket/API test against', SERVER);

  // Basic HTTP check: GET /api/posts
  try {
    const res = await axios.get(`${SERVER}/api/posts`);
    console.log('GET /api/posts status:', res.status, 'posts:', Array.isArray(res.data) ? res.data.length : 'unknown');
  } catch (err) {
    console.error('HTTP GET /api/posts failed:', err.message);
  }

  // Connect socket.io client
  const socket = io(SERVER, { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);

    // join a user room
    socket.emit('join', TEST_USER_ID);
    console.log('Emitted join for', TEST_USER_ID);

    // Emit a test postUpdate event (the server will re-broadcast as `postUpdated`)
    const testPost = {
      _id: 'test-post-123',
      author: { name: 'Tester', profileImage: '👤' },
      content: 'This is a test post from socket_test.js',
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
      media: null,
      mediaType: null
    };

    console.log('Emitting postUpdate...');
    socket.emit('postUpdate', testPost);
    
    // Emit a test notification targeted at TEST_USER_ID
    const testNotif = {
      userId: TEST_USER_ID,
      text: 'Hello test user! This is a server notification.',
      type: 'request',
      time: new Date().toLocaleTimeString()
    };

    console.log('Emitting sendNotification...');
    socket.emit('sendNotification', testNotif);
  });

  socket.on('postUpdated', (data) => {
    console.log('Received postUpdated:', data && data._id ? data._id : JSON.stringify(data).slice(0,120));
  });

  socket.on('notification', (n) => {
    console.log('Received notification:', n);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect_error:', err.message || err);
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });

  // Exit after 6 seconds
  setTimeout(() => {
    console.log('Test finished, disconnecting socket.');
    socket.disconnect();
    process.exit(0);
  }, 6000);

})();