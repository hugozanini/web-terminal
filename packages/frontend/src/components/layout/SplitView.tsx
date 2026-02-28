import { ReactNode } from 'react';

interface SplitViewProps {
  catalog: ReactNode;
  terminal: ReactNode;
  isTerminalOpen: boolean;
}

export function SplitView({ catalog, terminal, isTerminalOpen }: SplitViewProps) {
  if (!isTerminalOpen) {
    return <>{catalog}</>;
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      {/* Catalog Section */}
      <div className="flex-1 overflow-y-auto">
        {catalog}
      </div>

      {/* Terminal Section */}
      <div className="w-[40%] min-w-[400px] bg-gray-900 rounded-lg shadow-xl overflow-hidden">
        {terminal}
      </div>
    </div>
  );
}
