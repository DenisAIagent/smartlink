const http = require('http');
const app = require('../src/app.js');
const { initWebSocket } = require('./services/websocket.js');

// --- Server Setup ---
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// --- Initialize WebSocket Server ---
initWebSocket(server);

// --- Start Listening ---
server.listen(PORT, () => {
  console.log(`🎵 MDMC SmartLinks Service running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});

module.exports = server;
