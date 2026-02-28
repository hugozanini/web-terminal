import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail?: string;
}

export function StatCard({ icon: Icon, label, value, detail }: StatCardProps) {
  return (
    <div className="bg-white border border-cream-200 rounded-xl p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-coffee-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-coffee-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-cream-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-xl font-semibold text-cream-950 leading-tight">{value}</p>
          {detail && <p className="text-xs text-cream-500 mt-0.5">{detail}</p>}
        </div>
      </div>
    </div>
  );
}
