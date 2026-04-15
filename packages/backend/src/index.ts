import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { URL } from 'url';
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

// Use noServer mode for both WebSocket servers and route manually.
// Sharing a single HTTP server with multiple WebSocketServer instances
// that each use the `path` option causes upgrade-event conflicts in ws v8
// where one server can consume or discard connections destined for the other.
const terminalWss = new WebSocketServer({ noServer: true });
terminalWss.on('connection', (ws) => {
  console.log('New terminal connection established');
  handleTerminalWebSocket(ws);
});

const mcpBridgeWss = new WebSocketServer({ noServer: true });
mcpBridgeWss.on('connection', (ws) => {
  handleMCPBridgeWebSocket(ws);
});

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url ?? '/', `http://${request.headers.host}`);

  if (pathname === '/terminal') {
    terminalWss.handleUpgrade(request, socket, head, (ws) => {
      terminalWss.emit('connection', ws, request);
    });
  } else if (pathname === '/mcp-bridge') {
    mcpBridgeWss.handleUpgrade(request, socket, head, (ws) => {
      mcpBridgeWss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
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
