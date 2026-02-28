import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Hash, Zap, Calendar, ChevronRight } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { SearchInput } from '../ui/SearchInput';
import { FilterChips } from '../ui/FilterChips';
import { Pagination } from '../ui/Pagination';
import { useCatalogData } from '../../hooks/useCatalogData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import clsx from 'clsx';

const PAGE_SIZE = 12;

type SortKey = 'name' | 'lastRun' | 'runs';

const statusColors: Record<string, { badge: string; border: string; dot: string }> = {
  Success:   { badge: 'bg-emerald-100 text-emerald-700', border: 'border-l-emerald-400', dot: 'bg-emerald-400' },
  Failed:    { badge: 'bg-red-100 text-red-700',         border: 'border-l-red-400',     dot: 'bg-red-400' },
  Running:   { badge: 'bg-blue-100 text-blue-700',       border: 'border-l-blue-400',    dot: 'bg-blue-400' },
  Cancelled: { badge: 'bg-cream-100 text-cream-600',     border: 'border-l-cream-400',   dot: 'bg-cream-400' },
  Never:     { badge: 'bg-cream-100 text-cream-500',     border: 'border-l-cream-300',   dot: 'bg-cream-300' },
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function Pipelines() {
  const { pipelines, pipelineRuns } = useCatalogData();
  const navigate = useNavigate();
  useDocumentTitle('Pipelines');
  const [search, setSearch] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('lastRun');
  const [page, setPage] = useState(1);

  const typeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    pipelines.forEach((p) => { counts[p.type] = (counts[p.type] || 0) + 1; });
    return Object.entries(counts).map(([t, c]) => ({ value: t, label: t, count: c }));
  }, [pipelines]);

  const statusOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    pipelines.forEach((p) => { counts[p.lastRunStatus] = (counts[p.lastRunStatus] || 0) + 1; });
    return Object.entries(counts).map(([s, c]) => ({ value: s, label: s, count: c }));
  }, [pipelines]);

  const runCounts = useMemo(() => {
    const map: Record<string, number> = {};
    pipelineRuns.forEach((r) => { map[r.pipelineId] = (map[r.pipelineId] || 0) + 1; });
    return map;
  }, [pipelineRuns]);

  const filtered = useMemo(() => {
    let result = pipelines;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.displayName.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    if (types.length > 0) {
      result = result.filter((p) => types.includes(p.type));
    }
    if (statuses.length > 0) {
      result = result.filter((p) => statuses.includes(p.lastRunStatus));
    }

    const sorted = [...result];
    switch (sortKey) {
      case 'name': sorted.sort((a, b) => a.displayName.localeCompare(b.displayName)); break;
      case 'lastRun': sorted.sort((a, b) => {
        const ta = a.lastRunTime ? new Date(a.lastRunTime).getTime() : 0;
        const tb = b.lastRunTime ? new Date(b.lastRunTime).getTime() : 0;
        return tb - ta;
      }); break;
      case 'runs': sorted.sort((a, b) => (runCounts[b.id] || 0) - (runCounts[a.id] || 0)); break;
    }
    return sorted;
  }, [pipelines, search, types, statuses, sortKey, runCounts]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Pipelines"
        subtitle={`${filtered.length} of ${pipelines.length} pipelines`}
        actions={
          <select
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value as SortKey); setPage(1); }}
            className="text-sm border border-cream-200 rounded-lg px-3 py-2 bg-white text-cream-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            <option value="lastRun">Sort by Last Run</option>
            <option value="name">Sort by Name</option>
            <option value="runs">Sort by Run Count</option>
          </select>
        }
      />

      <div className="space-y-4 mb-6">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by pipeline name or description..."
        />
        <div className="flex flex-wrap gap-4">
          <FilterChips options={typeOptions} selected={types} onChange={(t) => { setTypes(t); setPage(1); }} />
          <div className="w-px bg-cream-200" />
          <FilterChips options={statusOptions} selected={statuses} onChange={(s) => { setStatuses(s); setPage(1); }} />
        </div>
      </div>

      <div className="space-y-3">
        {pageData.map((pipeline) => {
          const sColors = statusColors[pipeline.lastRunStatus] || statusColors.Never;
          const rc = runCounts[pipeline.id] || 0;

          return (
            <button
              key={pipeline.id}
              onClick={() => navigate(`/pipelines/${pipeline.id}`)}
              className={clsx(
                'bg-white rounded-xl border border-cream-200 shadow-card p-4 border-l-4 hover:shadow-card-hover transition-all w-full text-left',
                sColors.border
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-cream-900 text-sm">{pipeline.displayName}</h3>
                    <span className={clsx('text-xs font-semibold px-2.5 py-0.5 rounded-full', sColors.badge)}>
                      {pipeline.lastRunStatus}
                    </span>
                  </div>
                  <p className="text-xs text-cream-500 font-mono">{pipeline.name}</p>
                  <p className="text-xs text-cream-500 mt-1 line-clamp-1">{pipeline.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-cream-400 flex-shrink-0 mt-1" />
              </div>

              <div className="grid grid-cols-4 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-cream-400" />
                  <div>
                    <p className="text-cream-500">Type</p>
                    <p className="text-cream-800 font-medium">{pipeline.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cream-400" />
                  <div>
                    <p className="text-cream-500">Avg Duration</p>
                    <p className="text-cream-800 font-medium">{formatDuration(pipeline.avgDuration)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-cream-400" />
                  <div>
                    <p className="text-cream-500">Runs</p>
                    <p className="text-cream-800 font-medium">{rc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-cream-400" />
                  <div>
                    <p className="text-cream-500">Last Run</p>
                    <p className="text-cream-800 font-medium">
                      {pipeline.lastRunTime ? new Date(pipeline.lastRunTime).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>

              {pipeline.tags.length > 0 && (
                <div className="mt-3 pt-2 border-t border-cream-100 flex flex-wrap gap-1.5">
                  {pipeline.tags.slice(0, 5).map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-cream-50 text-cream-600 text-[10px] rounded border border-cream-200">
                      {t}
                    </span>
                  ))}
                  {pipeline.tags.length > 5 && (
                    <span className="text-[10px] text-cream-400">+{pipeline.tags.length - 5} more</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
