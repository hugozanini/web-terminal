import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Database,
  Play,
  DollarSign,
  Terminal,
  TrendingUp,
  TrendingDown,
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
  { path: '/pipelines', label: 'Pipelines', icon: Play, countKey: 'pipelines' as const },
  { path: '/costs', label: 'Costs', icon: DollarSign },
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

  const costTrendUp = (() => {
    const costs = data.costs;
    if (!costs || costs.length < 2) return null;
    const now = Date.now();
    const cutoff15 = now - 15 * 24 * 60 * 60 * 1000;
    const cutoff30 = cutoff15 - 15 * 24 * 60 * 60 * 1000;
    const recent = costs.filter(c => { const t = new Date(c.date).getTime(); return t >= cutoff15 && t <= now; }).reduce((s, c) => s + c.amount, 0);
    const prev = costs.filter(c => { const t = new Date(c.date).getTime(); return t >= cutoff30 && t < cutoff15; }).reduce((s, c) => s + c.amount, 0);
    if (prev === 0 && recent === 0) return null;
    return recent >= prev;
  })();

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
              {path === '/costs' && costTrendUp !== null ? (
                costTrendUp ? (
                  <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                )
              ) : count !== null ? (
                <span className={clsx(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  isActive ? 'bg-brand-700 text-cream-300' : 'bg-brand-900 text-cream-500'
                )}>
                  {count}
                </span>
              ) : null}
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
