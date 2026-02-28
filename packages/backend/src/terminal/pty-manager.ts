import * as pty from 'node-pty';
import * as os from 'os';
import type { TerminalSize } from './types.js';

export class PTYManager {
  private ptyProcess: pty.IPty | null = null;

  spawn(onData: (data: string) => void, onExit: (code: number) => void): void {
    // Detect user's shell
    const shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : '/bin/bash');

    // Get user's home directory
    const cwd = process.env.HOME || process.env.USERPROFILE || os.homedir();

    console.log(`Spawning terminal: ${shell} in ${cwd}`);

    // Spawn PTY with user's shell
    this.ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 30,
      cwd,
      env: process.env as { [key: string]: string },
    });

    // Handle data from PTY
    this.ptyProcess.onData((data) => {
      onData(data);
    });

    // Handle PTY exit
    this.ptyProcess.onExit(({ exitCode }) => {
      console.log(`Terminal exited with code: ${exitCode}`);
      onExit(exitCode);
    });
  }

  write(data: string): void {
    if (this.ptyProcess) {
      this.ptyProcess.write(data);
    }
  }

  resize(size: TerminalSize): void {
    if (this.ptyProcess) {
      this.ptyProcess.resize(size.cols, size.rows);
    }
  }

  kill(): void {
    if (this.ptyProcess) {
      this.ptyProcess.kill();
      this.ptyProcess = null;
    }
  }
}
