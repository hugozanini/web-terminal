import { ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '../terminal/Terminal';

interface ContentShellProps {
  children: ReactNode;
  isTerminalOpen: boolean;
}

const MIN_DRAWER_HEIGHT = 150;
const DEFAULT_DRAWER_HEIGHT = 300;

export function ContentShell({ children, isTerminalOpen }: ContentShellProps) {
  const [drawerHeight, setDrawerHeight] = useState(DEFAULT_DRAWER_HEIGHT);
  const dragging = useRef(false);
  const shellRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !shellRef.current) return;
      const shellRect = shellRef.current.getBoundingClientRect();
      const newHeight = shellRect.bottom - e.clientY;
      setDrawerHeight(Math.max(MIN_DRAWER_HEIGHT, Math.min(newHeight, shellRect.height - 100)));
    };

    const handleMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div ref={shellRef} className="flex-1 flex flex-col h-screen overflow-hidden">
      <div
        className="flex-1 overflow-y-auto scrollbar-thin p-6"
        style={isTerminalOpen ? { height: `calc(100vh - ${drawerHeight}px)` } : undefined}
      >
        {children}
      </div>

      {isTerminalOpen && (
        <div
          className="bg-gray-900 border-t border-gray-700 flex flex-col shadow-drawer"
          style={{ height: drawerHeight }}
        >
          <div
            onMouseDown={handleMouseDown}
            className="h-2 cursor-row-resize flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <div className="w-8 h-0.5 rounded-full bg-gray-500" />
          </div>
          <div className="flex-1 overflow-hidden">
            <Terminal />
          </div>
        </div>
      )}
    </div>
  );
}
