import { useEffect, useRef, useState } from 'react';
import { Terminal as XTermTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useTerminal } from './useTerminal';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  className?: string;
}

export function Terminal({ className = '' }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<XTermTerminal | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);
  const { isConnected, error } = useTerminal(terminal);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const term = new XTermTerminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
      },
      allowProposedApi: true,
    });

    // Add addons
    const fit = new FitAddon();
    const webLinks = new WebLinksAddon();

    term.loadAddon(fit);
    term.loadAddon(webLinks);

    // Open terminal in DOM
    term.open(terminalRef.current);

    // Fit terminal to container after a small delay to ensure DOM is ready
    setTimeout(() => {
      try {
        fit.fit();
      } catch (err) {
        console.warn('Initial fit failed:', err);
      }
    }, 0);

    setTerminal(term);
    setFitAddon(fit);

    // Handle window resize
    const handleResize = () => {
      try {
        fit.fit();
      } catch (err) {
        console.warn('Resize fit failed:', err);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  // Refit when container size changes
  useEffect(() => {
    if (fitAddon && terminalRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        try {
          fitAddon.fit();
        } catch (err) {
          // Ignore resize errors - terminal might not be ready yet
        }
      });

      resizeObserver.observe(terminalRef.current);

      return () => resizeObserver.disconnect();
    }
  }, [fitAddon]);

  return (
    <div className={`relative h-full ${className}`}>
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white px-4 py-2 text-sm z-10">
          {error}
        </div>
      )}

      {!isConnected && !error && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-sm z-10">
          Connecting to terminal...
        </div>
      )}

      <div ref={terminalRef} className="h-full" />
    </div>
  );
}
