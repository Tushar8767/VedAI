const http = require('http');
const app = require('./app');
const config = require('./config');
const { connectDB } = require('./config/db');
const { setupWebSocketServer } = require('./multiplayer/socketServer');

const startServer = async () => {
  // Connect to Database
  await connectDB();

  const server = http.createServer(app);

  // Mount WebSocket server on /ws/games
  setupWebSocketServer(server);

  // Listen on configured port
  server.listen(config.port, () => {
    console.log(`[VedAI 2.0 Backend] Server running in ${config.env} mode on http://localhost:${config.port}`);
    console.log(`[VedAI 2.0 Backend] Health check: http://localhost:${config.port}/api/health`);
    console.log(`[VedAI 2.0 Backend] Multiplayer WS: ws://localhost:${config.port}/ws/games`);
  });
};

startServer();
