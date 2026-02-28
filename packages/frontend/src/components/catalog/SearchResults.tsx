import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Database,
  Server,
  Play,
  CheckCircle2,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { SearchInput } from '../ui/SearchInput';
import { useCatalogData } from '../../hooks/useCatalogData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import clsx from 'clsx';

type AssetTab = 'all' | 'datasets' | 'sources' | 'pipelines';

interface AssetRow {
  id: string;
  type: string;
  name: string;
  meta: string;
  score?: number;
  link: string;
}

export function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [localQuery, setLocalQuery] = useState(query);
  const activeTab = (searchParams.get('tab') as AssetTab) || 'all';
  const navigate = useNavigate();
  const { datasets, dataSources, pipelines } = useCatalogData();
  useDocumentTitle(query ? `Search: ${query}` : 'Search');

  const allRows = useMemo(() => {
    const rows: AssetRow[] = [];

    datasets.forEach((d) => rows.push({
      id: d.id, type: 'Dataset', name: d.displayName,
      meta: `${d.type} -- ${d.schema.database}.${d.schema.schema} -- Quality ${d.qualityScore}`,
      score: d.qualityScore, link: `/datasets/${d.id}`,
    }));
    dataSources.forEach((s) => rows.push({
      id: s.id, type: 'Source', name: s.name,
      meta: `${s.system} -- ${s.connectionStatus} -- ${s.datasetsCount} datasets`,
      link: '/datasets',
    }));
    pipelines.forEach((p) => rows.push({
      id: p.id, type: 'Pipeline', name: p.displayName,
      meta: `${p.type} -- ${p.lastRunStatus} -- ${p.engine}`,
      link: `/pipelines/${p.id}`,
    }));

    return rows;
  }, [datasets, dataSources, pipelines]);

  const filtered = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return allRows.filter((r) =>
      r.name.toLowerCase().includes(q) || r.meta.toLowerCase().includes(q)
    );
  }, [allRows, query]);

  const tabCounts = useMemo(() => ({
    all: filtered.length,
    datasets: filtered.filter((r) => r.type === 'Dataset').length,
    sources: filtered.filter((r) => r.type === 'Source').length,
    pipelines: filtered.filter((r) => r.type === 'Pipeline').length,
  }), [filtered]);

  const displayed = activeTab === 'all'
    ? filtered
    : filtered.filter((r) => r.type === { datasets: 'Dataset', sources: 'Source', pipelines: 'Pipeline' }[activeTab]);

  const tabs: { key: AssetTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: tabCounts.all },
    { key: 'datasets', label: 'Datasets', count: tabCounts.datasets },
    { key: 'sources', label: 'Sources', count: tabCounts.sources },
    { key: 'pipelines', label: 'Pipelines', count: tabCounts.pipelines },
  ];

  const typeIcons: Record<string, typeof Database> = {
    Dataset: Database, Source: Server, Pipeline: Play,
  };

  const handleSearch = () => {
    const trimmed = localQuery.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed, tab: 'all' });
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 text-sm text-cream-500 hover:text-cream-800 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      <div className="mb-6">
        <SearchInput
          value={localQuery}
          onChange={setLocalQuery}
          onSubmit={handleSearch}
          placeholder="Search datasets, sources, pipelines..."
          className="max-w-xl"
        />
      </div>

      {query && (
        <>
          <div className="mb-4">
            <h1 className="text-lg font-semibold text-cream-900">
              {tabCounts.all} result{tabCounts.all !== 1 ? 's' : ''} for "{query}"
            </h1>
          </div>

          <div className="bg-white border border-cream-200 rounded-xl shadow-card">
            <div className="px-4 pt-4 pb-0 border-b border-cream-100">
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSearchParams({ q: query, tab: tab.key })}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap',
                      activeTab === tab.key
                        ? 'border-brand-900 text-brand-900 font-medium'
                        : 'border-transparent text-cream-500 hover:text-cream-700'
                    )}
                  >
                    {tab.label}
                    <span className={clsx(
                      'text-[10px] px-1.5 py-0.5 rounded-full',
                      activeTab === tab.key ? 'bg-brand-100 text-brand-800' : 'bg-cream-100 text-cream-500'
                    )}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-cream-100 max-h-[560px] overflow-y-auto scrollbar-thin">
              {displayed.map((row) => {
                const Icon = typeIcons[row.type] || Database;
                return (
                  <button
                    key={`${row.type}-${row.id}`}
                    onClick={() => navigate(row.link)}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-cream-50 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-cream-400 flex-shrink-0" />
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded bg-cream-100 text-cream-600 flex-shrink-0">
                      {row.type}
                    </span>
                    <span className="font-medium text-cream-900 text-sm">{row.name}</span>
                    {row.score && row.score >= 90 && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-500 flex-shrink-0" />
                    )}
                    <span className="text-xs text-cream-500 truncate">{row.meta}</span>
                  </button>
                );
              })}
              {displayed.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <Search className="w-8 h-8 text-cream-300 mx-auto mb-2" />
                  <p className="text-cream-500 text-sm">No results found for "{query}"</p>
                  <p className="text-cream-400 text-xs mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!query && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-cream-300 mx-auto mb-3" />
          <p className="text-cream-500 text-sm">Type a query and press Enter to search</p>
        </div>
      )}
    </div>
  );
}
