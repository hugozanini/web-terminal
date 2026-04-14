import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { handleTerminalWebSocket } from './terminal/websocket-handler.js';
import { handleSSEConnection, handleMCPMessage } from './mcp/mcp-server.js';
import { handleMCPBridgeWebSocket } from './mcp/bridge-handler.js';

export const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Happy Coffee Backend Server' });
});

// MCP over SSE — used by Claude Code and Gemini CLI
app.get('/mcp/sse', handleSSEConnection);
app.post('/mcp/messages', handleMCPMessage);

export const server = createServer(app);

// Terminal WebSocket
const wss = new WebSocketServer({ server, path: '/terminal' });
wss.on('connection', (ws) => {
  console.log('New terminal connection established');
  handleTerminalWebSocket(ws);
});

// MCP bridge WebSocket — browser tab registers here so CLI tool calls reach the UI
const mcpBridgeWss = new WebSocketServer({ server, path: '/mcp-bridge' });
mcpBridgeWss.on('connection', (ws) => {
  handleMCPBridgeWebSocket(ws);
});

export function startServer() {
  return new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`WebSocket terminal available at ws://localhost:${PORT}/terminal`);
      resolve();
    });
  });
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  startServer();
}
