import type { WebSocket } from 'ws';
import { PTYManager } from './pty-manager.js';
import type { TerminalMessage } from './types.js';

export function handleTerminalWebSocket(ws: WebSocket): void {
  const ptyManager = new PTYManager();

  // Spawn terminal when connection is established
  ptyManager.spawn(
    // onData callback
    (data: string) => {
      const message: TerminalMessage = {
        type: 'output',
        data,
      };
      ws.send(JSON.stringify(message));
    },
    // onExit callback
    (code: number) => {
      const message: TerminalMessage = {
        type: 'exit',
        code,
      };
      ws.send(JSON.stringify(message));
      ws.close();
    }
  );

  // Handle messages from client
  ws.on('message', (data: Buffer) => {
    try {
      const message: TerminalMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'input':
          if (message.data) {
            ptyManager.write(message.data);
          }
          break;

        case 'resize':
          if (message.cols && message.rows) {
            ptyManager.resize({ cols: message.cols, rows: message.rows });
          }
          break;

        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  // Handle connection close
  ws.on('close', () => {
    console.log('Terminal connection closed');
    ptyManager.kill();
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    ptyManager.kill();
  });
}
