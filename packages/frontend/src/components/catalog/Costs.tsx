import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, Database, Search, X, Calendar } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { PageHeader } from '../layout/PageHeader';
import { DataTable, type Column } from '../ui/DataTable';
import { StatCard } from '../ui/StatCard';
import { useCatalogData } from '../../hooks/useCatalogData';
import type { CostEntry } from '../../data/types';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import clsx from 'clsx';

const categoryColors: Record<string, string> = {
  Storage: 'bg-blue-400',
  Compute: 'bg-purple-400',
  Query: 'bg-amber-400',
  Transfer: 'bg-teal-400',
  Licensing: 'bg-red-400',
  Infrastructure: 'bg-emerald-400',
};

const columns: Column<CostEntry>[] = [
  {
    key: 'date', header: 'Date', width: '110px', sortable: true,
    sortValue: (row) => new Date(row.date).getTime(),
    render: (row) => <span className="text-xs text-cream-600">{new Date(row.date).toLocaleDateString()}</span>,
  },
  {
    key: 'category', header: 'Category', width: '120px', sortable: true,
    sortValue: (row) => row.category,
    render: (row) => (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${categoryColors[row.category] || 'bg-cream-400'}`} />
        {row.category}
      </span>
    ),
  },
  {
    key: 'subcategory', header: 'Subcategory', width: '160px',
    render: (row) => <span className="text-xs font-medium text-cream-800">{row.subcategory}</span>,
  },
  {
    key: 'entityType', header: 'Entity Type', width: '100px', sortable: true,
    sortValue: (row) => row.entityType,
    render: (row) => <span className="text-xs text-cream-500">{row.entityType}</span>,
  },
  {
    key: 'description', header: 'Description',
    render: (row) => <span className="text-xs text-cream-600 line-clamp-1">{row.description}</span>,
  },
  {
    key: 'amount', header: 'Amount', width: '120px', sortable: true,
    sortValue: (row) => row.amount,
    render: (row) => <span className="text-xs font-semibold text-cream-900">${row.amount.toLocaleString()}</span>,
  },
];

type DateRange = '7' | '15' | '30' | '60' | '90';

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: '7', label: 'Last 7 days' },
  { value: '15', label: 'Last 15 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '60', label: 'Last 60 days' },
  { value: '90', label: 'Last 90 days' },
];

export function Costs() {
  const { costs, datasets } = useCatalogData();
  useDocumentTitle('Costs');
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const entityType = searchParams.get('entityType') || '';
  const dateRange = (searchParams.get('range') as DateRange) || '90';

  const updateFilters = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    }
    setSearchParams(newParams);
  };

  const now = Date.now();
  const rangeDays = Number(dateRange);
  const rangeStart = now - rangeDays * 24 * 60 * 60 * 1000;

  const costsInRange = useMemo(() =>
    costs.filter((c) => new Date(c.date).getTime() >= rangeStart),
    [costs, rangeStart]
  );

  const totalCost = useMemo(() =>
    costsInRange.reduce((s, c) => s + c.amount, 0),
    [costsInRange]
  );

  const costPerDataset = datasets.length ? Math.round(totalCost / datasets.length) : 0;

  const totalStorage = useMemo(() =>
    costsInRange.filter((c) => c.category === 'Storage').reduce((s, c) => s + c.amount, 0),
    [costsInRange]
  );
  const totalCompute = useMemo(() =>
    costsInRange.filter((c) => c.category === 'Compute').reduce((s, c) => s + c.amount, 0),
    [costsInRange]
  );

  const trends = useMemo(() => {
    const recentCutoff = now - 15 * 24 * 60 * 60 * 1000;
    const prevCutoff = recentCutoff - 15 * 24 * 60 * 60 * 1000;

    const bucket = (entries: typeof costs) => {
      let recent = 0;
      let prev = 0;
      for (const c of entries) {
        const t = new Date(c.date).getTime();
        if (t >= recentCutoff && t <= now) recent += c.amount;
        else if (t >= prevCutoff && t < recentCutoff) prev += c.amount;
      }
      return prev > 0 ? ((recent - prev) / prev) * 100 : 0;
    };

    return {
      total: bucket(costsInRange),
      storage: bucket(costsInRange.filter((c) => c.category === 'Storage')),
      compute: bucket(costsInRange.filter((c) => c.category === 'Compute')),
    };
  }, [costsInRange, now]);

  const trendData = useMemo(() => {
    const storageInRange = costsInRange.filter((c) => c.category === 'Storage');
    const computeInRange = costsInRange.filter((c) => c.category === 'Compute');
    const byWeek: Record<string, { storage: number; compute: number; sortKey: number }> = {};

    for (const c of [...storageInRange, ...computeInRange]) {
      const d = new Date(c.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const key = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!byWeek[key]) byWeek[key] = { storage: 0, compute: 0, sortKey: weekStart.getTime() };
      if (c.category === 'Storage') byWeek[key].storage += c.amount;
      else byWeek[key].compute += c.amount;
    }

    return Object.entries(byWeek)
      .sort(([, a], [, b]) => a.sortKey - b.sortKey)
      .map(([week, vals]) => ({ week, storage: +vals.storage.toFixed(2), compute: +vals.compute.toFixed(2) }));
  }, [costsInRange]);

  const filtered = useMemo(() => {
    let result = costsInRange;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.subcategory.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    if (category) {
      result = result.filter((c) => c.category === category);
    }
    if (entityType) {
      result = result.filter((c) => c.entityType === entityType);
    }
    return [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [costsInRange, search, category, entityType]);

  const activeFilterCount = (category ? 1 : 0) + (entityType ? 1 : 0);

  return (
    <div>
      <PageHeader
        title="Infrastructure Costs"
        subtitle={`${filtered.length} entries`}
        actions={
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-cream-400" />
            <select
              value={dateRange}
              onChange={(e) => updateFilters({ range: e.target.value })}
              className="text-sm border border-cream-200 rounded-lg px-3 py-2 bg-white text-cream-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              {dateRangeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-cream-400" />
            <p className="text-xs text-cream-500">Total Cost</p>
          </div>
          <p className="text-xl font-bold text-cream-900">${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <div className="flex items-center gap-1 mt-1">
            {trends.total >= 0 ? (
              <TrendingUp className="w-3 h-3 text-red-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-emerald-500" />
            )}
            <span className={clsx('text-[10px] font-medium', trends.total >= 0 ? 'text-red-500' : 'text-emerald-500')}>
              {Math.abs(trends.total).toFixed(0)}% vs prev 15d
            </span>
          </div>
        </div>
        <StatCard icon={Database} label="Cost per Dataset" value={`$${costPerDataset.toLocaleString()}`} detail="Average" />
        <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <p className="text-xs text-cream-500">Storage</p>
          </div>
          <p className="text-lg font-bold text-cream-900">${totalStorage.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {trends.storage >= 0 ? <TrendingUp className="w-3 h-3 text-red-500" /> : <TrendingDown className="w-3 h-3 text-emerald-500" />}
            <span className={clsx('text-[10px] font-medium', trends.storage >= 0 ? 'text-red-500' : 'text-emerald-500')}>
              {Math.abs(trends.storage).toFixed(0)}% vs prev 15d
            </span>
          </div>
        </div>
        <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <p className="text-xs text-cream-500">Compute</p>
          </div>
          <p className="text-lg font-bold text-cream-900">${totalCompute.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {trends.compute >= 0 ? <TrendingUp className="w-3 h-3 text-red-500" /> : <TrendingDown className="w-3 h-3 text-emerald-500" />}
            <span className={clsx('text-[10px] font-medium', trends.compute >= 0 ? 'text-red-500' : 'text-emerald-500')}>
              {Math.abs(trends.compute).toFixed(0)}% vs prev 15d
            </span>
          </div>
        </div>
      </div>

      {trendData.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
            <h3 className="text-sm font-semibold text-cream-800 mb-3">Storage Cost Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#737373' }} />
                <YAxis tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e5e5' }}
                  formatter={(value) => [`$${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Storage']}
                />
                <Line type="monotone" dataKey="storage" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
            <h3 className="text-sm font-semibold text-cream-800 mb-3">Compute Cost Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#737373' }} />
                <YAxis tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e5e5' }}
                  formatter={(value) => [`$${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Compute']}
                />
                <Line type="monotone" dataKey="compute" stroke="#c084fc" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => updateFilters({ q: e.target.value })}
            placeholder="Search costs..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-cream-200 rounded-lg text-cream-950 placeholder-cream-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-colors"
          />
        </div>
        <select
          value={category}
          onChange={(e) => updateFilters({ category: e.target.value })}
          className={clsx(
            'text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-colors',
            category ? 'border-brand-300 text-brand-800' : 'border-cream-200 text-cream-600'
          )}
        >
          <option value="">All Categories</option>
          <option value="Storage">Storage</option>
          <option value="Compute">Compute</option>
          <option value="Query">Query</option>
          <option value="Transfer">Transfer</option>
          <option value="Licensing">Licensing</option>
          <option value="Infrastructure">Infrastructure</option>
        </select>
        <select
          value={entityType}
          onChange={(e) => updateFilters({ entityType: e.target.value })}
          className={clsx(
            'text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-colors',
            entityType ? 'border-brand-300 text-brand-800' : 'border-cream-200 text-cream-600'
          )}
        >
          <option value="">All Entity Types</option>
          <option value="Dataset">Dataset</option>
          <option value="Pipeline">Pipeline</option>
          <option value="Source">Source</option>
        </select>
        {activeFilterCount > 0 && (
          <button
            onClick={() => updateFilters({ category: null, entityType: null })}
            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 transition-colors px-2 py-2 rounded-lg border border-brand-200 bg-brand-50 flex-shrink-0"
          >
            <X className="w-3 h-3" />
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        pageSize={20}
        keyExtractor={(row) => row.id}
      />
    </div>
  );
}
