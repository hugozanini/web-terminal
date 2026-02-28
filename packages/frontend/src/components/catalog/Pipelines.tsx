import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Clock, Hash, Zap, Calendar, ChevronRight,
  CheckCircle2, Activity, Timer,
} from 'lucide-react';
import { Search, X } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { Pagination } from '../ui/Pagination';
import { useCatalogData } from '../../hooks/useCatalogData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import clsx from 'clsx';

const PAGE_SIZE = 12;

type SortKey = 'name' | 'lastRun' | 'runs' | 'duration';

const statusColors: Record<string, { badge: string; border: string; dot: string }> = {
  Success: { badge: 'bg-emerald-100 text-emerald-700', border: 'border-l-emerald-400', dot: 'bg-emerald-400' },
  Failed: { badge: 'bg-red-100 text-red-700', border: 'border-l-red-400', dot: 'bg-red-400' },
  Running: { badge: 'bg-blue-100 text-blue-700', border: 'border-l-blue-400', dot: 'bg-blue-400' },
  Cancelled: { badge: 'bg-cream-100 text-cream-600', border: 'border-l-cream-400', dot: 'bg-cream-400' },
  Never: { badge: 'bg-cream-100 text-cream-500', border: 'border-l-cream-300', dot: 'bg-cream-300' },
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

const engineOptions = [
  { value: 'dbt', label: 'dbt' },
  { value: 'Spark', label: 'Spark' },
  { value: 'Airflow', label: 'Airflow' },
  { value: 'Fivetran', label: 'Fivetran' },
  { value: 'Kafka Connect', label: 'Kafka Connect' },
  { value: 'Great Expectations', label: 'Great Expectations' },
];

const scheduleOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'unscheduled', label: 'Unscheduled' },
];

export function Pipelines() {
  const { pipelines, pipelineRuns } = useCatalogData();
  const navigate = useNavigate();
  useDocumentTitle('Pipelines');
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') || '';
  const types = searchParams.getAll('type');
  const statuses = searchParams.getAll('status');
  const engines = searchParams.getAll('engine');
  const scheduleFilter = searchParams.getAll('schedule');
  const sortKey = (searchParams.get('sort') as SortKey) || 'lastRun';
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

  const dashboardStats = useMemo(() => {
    const total = pipelines.length;
    const successCount = pipelines.filter((p) => p.lastRunStatus === 'Success').length;
    const runningCount = pipelines.filter((p) => p.lastRunStatus === 'Running').length;
    const failedCount = pipelines.filter((p) => p.lastRunStatus === 'Failed').length;
    const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;
    const activePipelines = pipelines.filter((p) => p.lastRunStatus !== 'Never').length;
    const avgDuration = pipelines.length > 0
      ? Math.round(pipelines.reduce((sum, p) => sum + p.avgDuration, 0) / pipelines.length)
      : 0;
    const scheduledCount = pipelines.filter((p) => p.schedule?.enabled).length;
    return { total, successCount, runningCount, failedCount, successRate, activePipelines, avgDuration, scheduledCount };
  }, [pipelines]);

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
    if (engines.length > 0) {
      result = result.filter((p) => engines.includes(p.engine));
    }
    if (scheduleFilter.length > 0) {
      result = result.filter((p) => {
        const isScheduled = p.schedule?.enabled ?? false;
        if (scheduleFilter.includes('scheduled') && isScheduled) return true;
        if (scheduleFilter.includes('unscheduled') && !isScheduled) return true;
        return false;
      });
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
      case 'duration': sorted.sort((a, b) => b.avgDuration - a.avgDuration); break;
    }
    return sorted;
  }, [pipelines, search, types, statuses, engines, scheduleFilter, sortKey, runCounts]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFilterCount = types.length + statuses.length + engines.length + scheduleFilter.length;

  return (
    <div>
      <PageHeader
        title="Pipelines"
        subtitle={`${filtered.length} of ${pipelines.length} pipelines`}
        actions={
          <select
            value={sortKey}
            onChange={(e) => updateFilters({ sort: e.target.value, page: '1' })}
            className="text-sm border border-cream-200 rounded-lg px-3 py-2 bg-white text-cream-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            <option value="lastRun">Sort by Last Run</option>
            <option value="name">Sort by Name</option>
            <option value="runs">Sort by Run Count</option>
            <option value="duration">Sort by Avg Duration</option>
          </select>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <p className="text-xs text-cream-500 uppercase tracking-wide">Success Rate</p>
          </div>
          <p className="text-2xl font-bold text-cream-900">{dashboardStats.successRate}%</p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 bg-cream-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${dashboardStats.successRate}%` }} />
            </div>
            <span className="text-[10px] text-cream-400">{dashboardStats.successCount}/{dashboardStats.total}</span>
          </div>
        </div>
        <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-cream-500 uppercase tracking-wide">Active Pipelines</p>
          </div>
          <p className="text-2xl font-bold text-cream-900">{dashboardStats.activePipelines}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />{dashboardStats.runningCount} running</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />{dashboardStats.failedCount} failed</span>
          </div>
        </div>
        <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-cream-500 uppercase tracking-wide">Avg Duration</p>
          </div>
          <p className="text-2xl font-bold text-cream-900">{formatDuration(dashboardStats.avgDuration)}</p>
          <p className="text-[10px] text-cream-400 mt-1.5">Across all pipelines</p>
        </div>
        <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-violet-500" />
            <p className="text-xs text-cream-500 uppercase tracking-wide">Scheduled</p>
          </div>
          <p className="text-2xl font-bold text-cream-900">{dashboardStats.scheduledCount}</p>
          <p className="text-[10px] text-cream-400 mt-1.5">{dashboardStats.total - dashboardStats.scheduledCount} manual/event-driven</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => updateFilters({ q: e.target.value, page: '1' })}
            placeholder="Search pipelines..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-cream-200 rounded-lg text-cream-950 placeholder-cream-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-colors"
          />
        </div>
        <select
          value={statuses.length === 1 ? statuses[0] : ''}
          onChange={(e) => updateFilters({ status: e.target.value ? [e.target.value] : null, page: '1' })}
          className={clsx(
            'text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-colors',
            statuses.length > 0 ? 'border-brand-300 text-brand-800' : 'border-cream-200 text-cream-600'
          )}
        >
          <option value="">All Statuses</option>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label} ({o.count})</option>
          ))}
        </select>
        <select
          value={types.length === 1 ? types[0] : ''}
          onChange={(e) => updateFilters({ type: e.target.value ? [e.target.value] : null, page: '1' })}
          className={clsx(
            'text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-colors',
            types.length > 0 ? 'border-brand-300 text-brand-800' : 'border-cream-200 text-cream-600'
          )}
        >
          <option value="">All Types</option>
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label} ({o.count})</option>
          ))}
        </select>
        <select
          value={engines.length === 1 ? engines[0] : ''}
          onChange={(e) => updateFilters({ engine: e.target.value ? [e.target.value] : null, page: '1' })}
          className={clsx(
            'text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-colors',
            engines.length > 0 ? 'border-brand-300 text-brand-800' : 'border-cream-200 text-cream-600'
          )}
        >
          <option value="">All Engines</option>
          {engineOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={scheduleFilter.length === 1 ? scheduleFilter[0] : ''}
          onChange={(e) => updateFilters({ schedule: e.target.value ? [e.target.value] : null, page: '1' })}
          className={clsx(
            'text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 transition-colors',
            scheduleFilter.length > 0 ? 'border-brand-300 text-brand-800' : 'border-cream-200 text-cream-600'
          )}
        >
          <option value="">All Schedules</option>
          {scheduleOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {activeFilterCount > 0 && (
          <button
            onClick={() => updateFilters({ type: null, status: null, engine: null, schedule: null, page: '1' })}
            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 transition-colors px-2 py-2 rounded-lg border border-brand-200 bg-brand-50 flex-shrink-0"
          >
            <X className="w-3 h-3" />
            Clear ({activeFilterCount})
          </button>
        )}
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
                    {pipeline.schedule?.enabled && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200">
                        Scheduled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-cream-500 font-mono">{pipeline.name}</p>
                  <p className="text-xs text-cream-500 mt-1 line-clamp-1">{pipeline.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-cream-400 flex-shrink-0 mt-1" />
              </div>

              <div className="grid grid-cols-5 gap-4 text-xs">
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
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-cream-400" />
                  <div>
                    <p className="text-cream-500">Engine</p>
                    <p className="text-cream-800 font-medium">{pipeline.engine}</p>
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

        {pageData.length === 0 && (
          <div className="text-center py-12 text-cream-400 text-sm">
            No pipelines match the current filters
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => updateFilters({ page: String(p) })} />
        </div>
      )}
    </div>
  );
}
