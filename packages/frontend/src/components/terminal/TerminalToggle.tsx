import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function TerminalToggle({ isOpen, onToggle }: TerminalToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed bottom-6 right-6 bg-amber-700 hover:bg-amber-800 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 z-50"
      title={isOpen ? 'Close Terminal' : 'Open Terminal'}
    >
      <TerminalIcon className="w-6 h-6" />
    </button>
  );
}
