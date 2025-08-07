const { WebSocketServer } = require('ws');

let wss;

function initWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected.');
    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected.');
    });
    ws.on('error', console.error);
  });

  console.log('🚀 WebSocket server initialized.');
}

function broadcast(data) {
  if (!wss) {
    console.warn('[WebSocket] Server not initialized. Cannot broadcast.');
    return;
  }

  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

module.exports = {
  initWebSocket,
  broadcast,
};
