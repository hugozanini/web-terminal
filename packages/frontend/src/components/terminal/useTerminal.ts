import { useEffect, useRef, useState } from 'react';
import type { Terminal as XTermTerminal } from '@xterm/xterm';

interface TerminalMessage {
  type: 'input' | 'output' | 'resize' | 'exit';
  data?: string;
  cols?: number;
  rows?: number;
  code?: number;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/terminal';

export function useTerminal(terminal: XTermTerminal | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!terminal) return;

    // Connect to WebSocket
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Terminal WebSocket connected');
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const message: TerminalMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'output':
            if (message.data) {
              terminal.write(message.data);
            }
            break;

          case 'exit':
            terminal.write('\r\n\r\n[Terminal process exited]\r\n');
            ws.close();
            break;

          default:
            console.warn('Unknown message type:', message.type);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Failed to connect to terminal server');
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('Terminal WebSocket disconnected');
      setIsConnected(false);
    };

    // Handle terminal input
    const handleData = (data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        const message: TerminalMessage = {
          type: 'input',
          data,
        };
        ws.send(JSON.stringify(message));
      }
    };

    const dataDisposable = terminal.onData(handleData);

    // Cleanup
    return () => {
      dataDisposable.dispose();
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [terminal]);

  const resize = (cols: number, rows: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: TerminalMessage = {
        type: 'resize',
        cols,
        rows,
      };
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return { isConnected, error, resize };
}
