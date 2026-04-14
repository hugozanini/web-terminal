import type { WebSocket } from 'ws';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface PendingCall {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

interface ToolCallMessage {
  type: 'tool_call';
  callId: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResultMessage {
  type: 'tool_result';
  callId: string;
  result?: unknown;
  error?: string;
}

// ------------------------------------------------------------------
// BridgeManager: singleton that owns the active browser WS connection
// and routes pending MCP tool calls through it.
// ------------------------------------------------------------------
class BridgeManager {
  private browserWs: WebSocket | null = null;
  private pendingCalls = new Map<string, PendingCall>();

  register(ws: WebSocket): void {
    if (this.browserWs) {
      console.log('MCP Bridge: replacing existing browser connection');
    }
    this.browserWs = ws;
    console.log('MCP Bridge: browser tab registered');

    ws.on('close', () => {
      if (this.browserWs === ws) {
        this.browserWs = null;
        console.log('MCP Bridge: browser tab disconnected');
        for (const [callId, { reject }] of this.pendingCalls) {
          this.pendingCalls.delete(callId);
          reject(new Error('Browser tab disconnected during tool call'));
        }
      }
    });
  }

  handleToolResult(msg: ToolResultMessage): void {
    const pending = this.pendingCalls.get(msg.callId);
    if (!pending) return;
    this.pendingCalls.delete(msg.callId);
    if (msg.error) {
      pending.reject(new Error(msg.error));
    } else {
      pending.resolve(msg.result);
    }
  }

  isConnected(): boolean {
    return this.browserWs !== null && this.browserWs.readyState === 1; // OPEN
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
    timeoutMs = 30_000,
  ): Promise<unknown> {
    if (!this.isConnected()) {
      throw new Error(
        'No browser tab connected to the data portal. ' +
          'Open http://localhost:5173 first, then retry.',
      );
    }

    const callId = Math.random().toString(36).slice(2, 10);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingCalls.delete(callId);
        reject(new Error(`Tool call "${name}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingCalls.set(callId, {
        resolve: (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });

      const message: ToolCallMessage = { type: 'tool_call', callId, name, args };
      this.browserWs!.send(JSON.stringify(message));
    });
  }
}

export const bridgeManager = new BridgeManager();

// ------------------------------------------------------------------
// WebSocket connection handler for /mcp-bridge
// ------------------------------------------------------------------
export function handleMCPBridgeWebSocket(ws: WebSocket): void {
  ws.on('message', (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      if (msg['type'] === 'register') {
        bridgeManager.register(ws);
        ws.send(JSON.stringify({ type: 'registered' }));
      } else if (msg['type'] === 'tool_result' && typeof msg['callId'] === 'string') {
        bridgeManager.handleToolResult(msg as unknown as ToolResultMessage);
      }
    } catch (err) {
      console.error('MCP Bridge WS parse error:', err);
    }
  });

  ws.on('error', (err) => {
    console.error('MCP Bridge WS connection error:', err);
  });
}
