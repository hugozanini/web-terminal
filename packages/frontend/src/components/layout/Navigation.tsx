import { Link, useLocation } from 'react-router-dom';
import { Database, GitBranch, Play, FileText, DollarSign } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { path: '/', label: 'Data Samples', icon: Database },
  { path: '/lineage', label: 'Lineage', icon: GitBranch },
  { path: '/runs', label: 'Runs', icon: Play },
  { path: '/logs', label: 'Logs', icon: FileText },
  { path: '/costs', label: 'Costs', icon: DollarSign },
];

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex gap-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={clsx(
                  'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
                  isActive
                    ? 'border-amber-600 text-amber-700 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
