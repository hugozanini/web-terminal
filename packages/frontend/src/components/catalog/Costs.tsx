import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, BarChart3, Database } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { SearchInput } from '../ui/SearchInput';
import { FilterChips } from '../ui/FilterChips';
import { DataTable, type Column } from '../ui/DataTable';
import { StatCard } from '../ui/StatCard';
import { useCatalogData } from '../../hooks/useCatalogData';
import type { CostEntry } from '../../data/types';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const categoryColors: Record<string, string> = {
  Storage: 'bg-blue-400',
  Compute: 'bg-purple-400',
  Query: 'bg-amber-400',
  Transfer: 'bg-teal-400',
  Licensing: 'bg-red-400',
  Infrastructure: 'bg-emerald-400',
};

const categoryOptions = [
  { value: 'Storage', label: 'Storage' },
  { value: 'Compute', label: 'Compute' },
  { value: 'Query', label: 'Query' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Licensing', label: 'Licensing' },
  { value: 'Infrastructure', label: 'Infrastructure' },
];

const columns: Column<CostEntry>[] = [
  {
    key: 'date',
    header: 'Date',
    width: '110px',
    sortable: true,
    sortValue: (row) => new Date(row.date).getTime(),
    render: (row) => <span className="text-xs text-cream-600">{new Date(row.date).toLocaleDateString()}</span>,
  },
  {
    key: 'category',
    header: 'Category',
    width: '120px',
    sortable: true,
    sortValue: (row) => row.category,
    render: (row) => (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${categoryColors[row.category] || 'bg-cream-400'}`} />
        {row.category}
      </span>
    ),
  },
  {
    key: 'subcategory',
    header: 'Subcategory',
    width: '160px',
    render: (row) => <span className="text-xs font-medium text-cream-800">{row.subcategory}</span>,
  },
  {
    key: 'entityType',
    header: 'Entity Type',
    width: '100px',
    sortable: true,
    sortValue: (row) => row.entityType,
    render: (row) => <span className="text-xs text-cream-500">{row.entityType}</span>,
  },
  {
    key: 'description',
    header: 'Description',
    render: (row) => <span className="text-xs text-cream-600 line-clamp-1">{row.description}</span>,
  },
  {
    key: 'amount',
    header: 'Amount',
    width: '120px',
    sortable: true,
    sortValue: (row) => row.amount,
    render: (row) => (
      <span className="text-xs font-semibold text-cream-900">
        ${row.amount.toLocaleString()}
      </span>
    ),
  },
];

export function Costs() {
  const { costs, datasets } = useCatalogData();
  useDocumentTitle('Costs');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const totalsByCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    costs.forEach((c) => { totals[c.category] = (totals[c.category] || 0) + c.amount; });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [costs]);

  const totalCost = totalsByCategory.reduce((s, [, v]) => s + v, 0);
  const maxCategory = totalsByCategory[0]?.[1] || 1;
  const costPerDataset = datasets.length ? Math.round(totalCost / datasets.length) : 0;

  const filtered = useMemo(() => {
    let result = costs;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.subcategory.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    if (categories.length > 0) {
      result = result.filter((c) => categories.includes(c.category));
    }
    return [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [costs, search, categories]);

  return (
    <div>
      <PageHeader
        title="Infrastructure Costs"
        subtitle={`${filtered.length} of ${costs.length} entries`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={DollarSign} label="Total Cost" value={`$${totalCost.toLocaleString()}`} />
        <StatCard
          icon={TrendingUp}
          label="Largest Category"
          value={totalsByCategory[0]?.[0] || '--'}
          detail={totalsByCategory[0] ? `$${totalsByCategory[0][1].toLocaleString()}` : undefined}
        />
        <StatCard
          icon={Database}
          label="Cost per Dataset"
          value={`$${costPerDataset.toLocaleString()}`}
          detail="Average"
        />
        <StatCard
          icon={BarChart3}
          label="Avg per Entry"
          value={costs.length ? `$${Math.round(totalCost / costs.length).toLocaleString()}` : '$0'}
        />
      </div>

      <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4 mb-6">
        <h3 className="text-sm font-semibold text-cream-800 mb-3">Cost by Category</h3>
        <div className="space-y-2.5">
          {totalsByCategory.map(([category, amount]) => (
            <div key={category}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-cream-700 font-medium">{category}</span>
                <span className="text-cream-500">${amount.toLocaleString()} ({((amount / totalCost) * 100).toFixed(1)}%)</span>
              </div>
              <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${categoryColors[category] || 'bg-cream-400'}`}
                  style={{ width: `${(amount / maxCategory) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search costs..."
        />
        <FilterChips options={categoryOptions} selected={categories} onChange={setCategories} />
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
