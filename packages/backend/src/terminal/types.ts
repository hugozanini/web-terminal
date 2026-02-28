export interface TerminalMessage {
  type: 'input' | 'output' | 'resize' | 'exit';
  data?: string;
  cols?: number;
  rows?: number;
  code?: number;
}

export interface TerminalSize {
  cols: number;
  rows: number;
}
