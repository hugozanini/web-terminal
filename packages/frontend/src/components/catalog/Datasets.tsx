import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Database, Clock, User, Layers } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { SearchInput } from '../ui/SearchInput';
import { FilterChips } from '../ui/FilterChips';
import { Pagination } from '../ui/Pagination';
import { TagPill, getTagVariant, getDatasetTypeVariant } from '../ui/TagPill';
import { useCatalogData } from '../../hooks/useCatalogData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import clsx from 'clsx';

const PAGE_SIZE = 12;

type SortKey = 'quality' | 'updated' | 'name' | 'size';

function qualityColor(score: number) {
  if (score >= 90) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (score >= 75) return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

function qualityBorder(score: number) {
  if (score >= 90) return 'border-l-emerald-400';
  if (score >= 75) return 'border-l-blue-400';
  return 'border-l-amber-400';
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

function freshnessLabel(lastUpdated: Date): string {
  const hours = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function Datasets() {
  const { datasets } = useCatalogData();
  const navigate = useNavigate();
  useDocumentTitle('Datasets');
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') || '';
  const types = searchParams.getAll('type');
  const tags = searchParams.getAll('tag');
  const sortKey = (searchParams.get('sort') as SortKey) || 'quality';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const updateFilters = (updates: Record<string, string | string[] | null>) => {
    const newParams = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || (Array.isArray(value) && value.length === 0) || value === '') {
        newParams.delete(key);
      } else if (Array.isArray(value)) {
        newParams.delete(key);
        value.forEach(v => newParams.append(key, v));
      } else {
        newParams.set(key, value);
      }
    }
    setSearchParams(newParams);
  };

  const typeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    datasets.forEach((d) => { counts[d.type] = (counts[d.type] || 0) + 1; });
    return Object.entries(counts).map(([v, c]) => ({ value: v, label: v, count: c }));
  }, [datasets]);

  const tagOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    datasets.forEach((d) => d.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([v, c]) => ({ value: v, label: v, count: c }));
  }, [datasets]);

  const filtered = useMemo(() => {
    let result = datasets;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((d) =>
        d.displayName.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.owner.toLowerCase().includes(q)
      );
    }
    if (types.length > 0) {
      result = result.filter((d) => types.includes(d.type));
    }
    if (tags.length > 0) {
      result = result.filter((d) => d.tags.some((t) => tags.includes(t)));
    }

    const sorted = [...result];
    switch (sortKey) {
      case 'quality':
        sorted.sort((a, b) => b.qualityScore - a.qualityScore);
        break;
      case 'updated':
        sorted.sort((a, b) => new Date(b.freshness.lastUpdated).getTime() - new Date(a.freshness.lastUpdated).getTime());
        break;
      case 'name':
        sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
        break;
      case 'size':
        sorted.sort((a, b) => b.sizeBytes - a.sizeBytes);
        break;
    }
    return sorted;
  }, [datasets, search, types, tags, sortKey]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);



  return (
    <div>
      <PageHeader
        title="Datasets"
        subtitle={`${filtered.length} of ${datasets.length} datasets`}
        actions={
          <div className="flex items-center gap-3">
            <select
              value={sortKey}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="text-sm border border-cream-200 rounded-lg px-3 py-2 bg-white text-cream-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="quality">Sort by Quality Score</option>
              <option value="updated">Sort by Last Updated</option>
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
            </select>
          </div>
        }
      />

      <div className="space-y-4 mb-6">
        <SearchInput
          value={search}
          onChange={(v) => { updateFilters({ q: v, page: '1' }); }}
          placeholder="Search by name, description, or owner..."
        />
        <div className="flex flex-wrap gap-4">
          <FilterChips options={typeOptions} selected={types} onChange={(v) => { updateFilters({ type: v, page: '1' }); }} />
          <div className="w-px bg-cream-200" />
          <FilterChips options={tagOptions} selected={tags} onChange={(v) => { updateFilters({ tag: v, page: '1' }); }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pageData.map((dataset) => (
          <button
            key={dataset.id}
            onClick={() => navigate(`/datasets/${dataset.id}`)}
            className={clsx(
              'bg-white rounded-xl border border-cream-200 shadow-card hover:shadow-card-hover transition-all text-left p-4 border-l-4',
              qualityBorder(dataset.qualityScore)
            )}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cream-400 flex-shrink-0" />
                  <h3 className="font-semibold text-cream-900 text-sm truncate">{dataset.displayName}</h3>
                </div>
                <p className="text-xs text-cream-500 mt-0.5 font-mono">{dataset.schema.database}.{dataset.schema.schema}</p>
              </div>
              <span className={clsx(
                'text-xs font-semibold px-2 py-1 rounded-full border flex-shrink-0',
                qualityColor(dataset.qualityScore)
              )}>
                {dataset.qualityScore}
              </span>
            </div>

            <p className="text-xs text-cream-600 mb-3 line-clamp-2">{dataset.description}</p>

            <div className="space-y-1.5 text-xs mb-3">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cream-400 flex-shrink-0" />
                <span className="text-cream-600">{dataset.columns} cols / {dataset.rows.toLocaleString()} rows / {formatBytes(dataset.sizeBytes)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cream-400 flex-shrink-0" />
                <span className="text-cream-600">{freshnessLabel(dataset.freshness.lastUpdated)} ({dataset.freshness.updateFrequency})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cream-400 flex-shrink-0" />
                <span className="text-cream-600">{dataset.owner}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              <TagPill label={dataset.type} variant={getDatasetTypeVariant(dataset.type)} />
              {dataset.tags.map((tag) => (
                <TagPill key={tag} label={tag} variant={getTagVariant(tag)} />
              ))}
            </div>

            <div className="mt-3 pt-2 border-t border-cream-100 text-[10px] text-cream-400">
              Source: {dataset.source}
            </div>
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => updateFilters({ page: String(p) })} />
        </div>
      )}
    </div>
  );
}
