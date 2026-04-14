import { useEffect, useRef } from 'react';
import { useCatalogTools } from './useCatalogTools';

// Connects to the backend /mcp-bridge WebSocket and executes tool calls
// forwarded from local AI CLIs (Claude Code, Gemini CLI) via the MCP server.
// Runs silently alongside WebMCPIntegration; only one transport is active at a time.

const BRIDGE_URL =
  (import.meta as unknown as { env: Record<string, string> }).env['VITE_MCP_BRIDGE_URL'] ??
  'ws://localhost:3001/mcp-bridge';

interface ToolCallMessage {
  type: 'tool_call';
  callId: string;
  name: string;
  args: Record<string, unknown>;
}

export function MCPBridgeClient() {
  const { executeTool } = useCatalogTools();

  // Keep a mutable ref so the WebSocket handler always uses the latest
  // executeTool closure (which captures fresh store data on every render).
  const executeToolRef = useRef(executeTool);
  useEffect(() => {
    executeToolRef.current = executeTool;
  });

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      ws = new WebSocket(BRIDGE_URL);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'register' }));
        console.log('MCP Bridge: connected to backend bridge');
      };

      ws.onmessage = async (event: MessageEvent) => {
        let msg: ToolCallMessage;
        try {
          msg = JSON.parse(event.data as string) as ToolCallMessage;
        } catch {
          return;
        }
        if (msg.type !== 'tool_call') return;

        try {
          const result = await executeToolRef.current(msg.name, msg.args);
          ws.send(JSON.stringify({ type: 'tool_result', callId: msg.callId, result }));
        } catch (err) {
          ws.send(
            JSON.stringify({
              type: 'tool_result',
              callId: msg.callId,
              error: (err as Error).message,
            }),
          );
        }
      };

      ws.onerror = () => {
        // Backend might not be running yet; retry silently
      };

      ws.onclose = () => {
        // Reconnect after 3 s so the bridge stays live if the backend restarts
        reconnectTimer = setTimeout(connect, 3_000);
      };
    }

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws.onclose = null; // prevent reconnect on intentional unmount
      ws.close();
    };
  }, []);

  return null;
}
