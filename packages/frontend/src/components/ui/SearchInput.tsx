import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showShortcut?: boolean;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  showShortcut = false,
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-cream-200 rounded-lg text-cream-950 placeholder-cream-400 focus:outline-none focus:ring-2 focus:ring-coffee-300 focus:border-coffee-300 transition-colors"
      />
      {showShortcut && !value && (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-cream-400 bg-cream-100 px-1.5 py-0.5 rounded border border-cream-200">
          {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+K
        </kbd>
      )}
    </div>
  );
}
