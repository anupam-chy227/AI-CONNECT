const { io } = require('socket.io-client');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Yzg5ZjM4YS01MmEyLTRlOWYtYjAyYy01YzczZGJkMWEzM2QiLCJ1c2VybmFtZSI6IndzdXNlcjIiLCJpYXQiOjE3NzM0OTQyODAsImV4cCI6MTc3MzU4MDY4MH0.qSO0fbD74IKoQtSUKYNehXeAQAFvLekHc-fa1JWvtk8';
const socket = io('http://localhost:3001', {
  auth: { token },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected to WS server');
  socket.emit('subscribe', 'feed');
  console.log('Subscribed to feed');
});

socket.on('post.created', (data) => {
  console.log('RECEIVED post.created EVENT:', JSON.stringify(data, null, 2));
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.error('WS Error:', err.message);
  process.exit(1);
});

// Timeout after 15s
setTimeout(() => {
  console.error('Timed out waiting for event');
  process.exit(1);
}, 15000);
