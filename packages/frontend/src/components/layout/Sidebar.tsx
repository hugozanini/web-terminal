import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Database,
  GitBranch,
  Play,
  ShieldCheck,
  DollarSign,
  Terminal,
} from 'lucide-react';
import clsx from 'clsx';
import { useCatalogData } from '../../hooks/useCatalogData';
import { Logo } from '../ui/Logo';

interface SidebarProps {
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
}

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/datasets', label: 'Datasets', icon: Database, countKey: 'datasets' as const },
  { path: '/lineage', label: 'Lineage', icon: GitBranch },
  { path: '/pipelines', label: 'Pipelines', icon: Play, countKey: 'pipelineRuns' as const },
  { path: '/quality', label: 'Quality', icon: ShieldCheck, countKey: 'qualityChecks' as const },
  { path: '/costs', label: 'Costs', icon: DollarSign, countKey: 'costs' as const },
];

export function Sidebar({ isTerminalOpen, onToggleTerminal }: SidebarProps) {
  const location = useLocation();
  const data = useCatalogData();

  const getCounts = (key?: string) => {
    if (!key) return null;
    const arr = data[key as keyof typeof data];
    if (Array.isArray(arr)) return arr.length;
    return null;
  };

  return (
    <aside className="w-56 bg-brand-950 text-cream-300 flex flex-col flex-shrink-0 h-screen sticky top-0">
      <div className="px-4 py-5 border-b border-brand-800">
        <Link to="/" className="flex items-center gap-2.5 text-white" style={{ '--logo-inner': '#0a0a0a' } as React.CSSProperties}>
          <Logo size={48} />
          <div>
            <h1 className="text-base font-semibold text-white leading-tight">Happy Coffee</h1>
            <p className="text-xs text-cream-500 leading-tight">Data Catalog</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map(({ path, label, icon: Icon, countKey }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);
          const count = getCounts(countKey);

          return (
            <Link
              key={path}
              to={path}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-brand-800 text-white font-medium'
                  : 'text-cream-400 hover:bg-brand-900 hover:text-cream-200'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {count !== null && (
                <span className={clsx(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  isActive ? 'bg-brand-700 text-cream-300' : 'bg-brand-900 text-cream-500'
                )}>
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-brand-800">
        <button
          onClick={onToggleTerminal}
          className={clsx(
            'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors',
            isTerminalOpen
              ? 'bg-accent-700 text-white'
              : 'text-cream-400 hover:bg-brand-900 hover:text-cream-200'
          )}
        >
          <Terminal className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Terminal</span>
          <kbd className={clsx(
            'text-[10px] px-1.5 py-0.5 rounded',
            isTerminalOpen ? 'bg-accent-800 text-accent-200' : 'bg-brand-900 text-cream-600'
          )}>
            {navigator.platform?.includes('Mac') ? '\u2318' : 'Ctrl'}+`
          </kbd>
        </button>
      </div>
    </aside>
  );
}
