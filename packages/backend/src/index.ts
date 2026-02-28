import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { handleTerminalWebSocket } from './terminal/websocket-handler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Happy Coffee Backend Server' });
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server for terminal
const wss = new WebSocketServer({ server, path: '/terminal' });

wss.on('connection', (ws) => {
  console.log('New terminal connection established');
  handleTerminalWebSocket(ws);
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket terminal available at ws://localhost:${PORT}/terminal`);
});
