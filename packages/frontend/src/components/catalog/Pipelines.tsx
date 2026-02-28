import { useState, useMemo } from 'react';
import { Clock, Zap, Hash } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { SearchInput } from '../ui/SearchInput';
import { FilterChips } from '../ui/FilterChips';
import { Pagination } from '../ui/Pagination';
import { useCatalogData } from '../../hooks/useCatalogData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import clsx from 'clsx';

const PAGE_SIZE = 12;

type SortKey = 'date' | 'duration' | 'records';

const statusColors: Record<string, { badge: string; border: string }> = {
  Success:   { badge: 'bg-emerald-100 text-emerald-700', border: 'border-l-emerald-400' },
  Failed:    { badge: 'bg-red-100 text-red-700',         border: 'border-l-red-400' },
  Running:   { badge: 'bg-blue-100 text-blue-700',       border: 'border-l-blue-400' },
  Cancelled: { badge: 'bg-cream-100 text-cream-600',     border: 'border-l-cream-400' },
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function Pipelines() {
  const { pipelineRuns } = useCatalogData();
  useDocumentTitle('Pipelines');
  const [search, setSearch] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [page, setPage] = useState(1);

  const typeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    pipelineRuns.forEach((r) => { counts[r.type] = (counts[r.type] || 0) + 1; });
    return Object.entries(counts).map(([t, c]) => ({ value: t, label: t, count: c }));
  }, [pipelineRuns]);

  const statusOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    pipelineRuns.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([s, c]) => ({ value: s, label: s, count: c }));
  }, [pipelineRuns]);

  const filtered = useMemo(() => {
    let result = pipelineRuns;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        r.pipelineName.toLowerCase().includes(q) ||
        r.runNumber.toLowerCase().includes(q)
      );
    }
    if (types.length > 0) {
      result = result.filter((r) => types.includes(r.type));
    }
    if (statuses.length > 0) {
      result = result.filter((r) => statuses.includes(r.status));
    }

    const sorted = [...result];
    switch (sortKey) {
      case 'date': sorted.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()); break;
      case 'duration': sorted.sort((a, b) => b.duration - a.duration); break;
      case 'records': sorted.sort((a, b) => b.recordsProcessed - a.recordsProcessed); break;
    }
    return sorted;
  }, [pipelineRuns, search, types, statuses, sortKey]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Pipeline Runs"
        subtitle={`${filtered.length} of ${pipelineRuns.length} runs`}
        actions={
          <select
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value as SortKey); setPage(1); }}
            className="text-sm border border-cream-200 rounded-lg px-3 py-2 bg-white text-cream-700 focus:outline-none focus:ring-2 focus:ring-coffee-300"
          >
            <option value="date">Sort by Date</option>
            <option value="duration">Sort by Duration</option>
            <option value="records">Sort by Records</option>
          </select>
        }
      />

      <div className="space-y-4 mb-6">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by pipeline name or run number..."
        />
        <div className="flex flex-wrap gap-4">
          <FilterChips options={typeOptions} selected={types} onChange={(t) => { setTypes(t); setPage(1); }} />
          <div className="w-px bg-cream-200" />
          <FilterChips options={statusOptions} selected={statuses} onChange={(s) => { setStatuses(s); setPage(1); }} />
        </div>
      </div>

      <div className="space-y-3">
        {pageData.map((run) => {
          const sColors = statusColors[run.status] || statusColors.Cancelled;
          const failRate = run.recordsProcessed > 0 ? (run.recordsFailed / run.recordsProcessed) * 100 : 0;

          return (
            <div
              key={run.id}
              className={clsx(
                'bg-white rounded-xl border border-cream-200 shadow-card p-4 border-l-4 hover:shadow-card-hover transition-all',
                sColors.border
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-cream-900 text-sm font-mono">{run.pipelineName}</h3>
                  <p className="text-xs text-cream-500">{run.runNumber} -- {run.type}</p>
                </div>
                <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full', sColors.badge)}>
                  {run.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cream-400" />
                  <div>
                    <p className="text-cream-500">Duration</p>
                    <p className="text-cream-900 font-medium">{formatDuration(run.duration)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-cream-400" />
                  <div>
                    <p className="text-cream-500">Records</p>
                    <p className="text-cream-900 font-medium">{run.recordsProcessed.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-cream-400" />
                  <div>
                    <p className="text-cream-500">Trigger</p>
                    <p className="text-cream-900 font-medium">{run.triggerType}</p>
                  </div>
                </div>
              </div>

              {run.recordsFailed > 0 && (
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] text-cream-500 mb-1">
                    <span>Error rate</span>
                    <span className="text-red-600">{failRate.toFixed(1)}% ({run.recordsFailed.toLocaleString()} failed)</span>
                  </div>
                  <div className="h-1.5 bg-cream-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full transition-all"
                      style={{ width: `${Math.min(failRate, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {Object.keys(run.parameters).length > 0 && (
                <div className="pt-2 border-t border-cream-100">
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(run.parameters).map(([key, value]) => (
                      <span key={key} className="px-2 py-0.5 bg-cream-50 text-cream-600 text-[10px] rounded border border-cream-200">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-2 text-[10px] text-cream-400">
                Started {new Date(run.startTime).toLocaleString()}
              </div>
            </div>
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
