import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Server,
  Play,
  ShieldCheck,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { SearchInput } from '../ui/SearchInput';
import { StatCard } from '../ui/StatCard';
import { Logo } from '../ui/Logo';
import { useCatalogData } from '../../hooks/useCatalogData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import clsx from 'clsx';

type AssetTab = 'all' | 'datasets' | 'sources' | 'pipelines';

export function Home() {
  const { datasets, dataSources, pipelineRuns, qualityChecks, costs } = useCatalogData();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<AssetTab>('all');
  const navigate = useNavigate();
  useDocumentTitle('Home');

  const avgQuality = datasets.length
    ? (datasets.reduce((sum, d) => sum + d.qualityScore, 0) / datasets.length).toFixed(1)
    : '0';

  const totalCost = costs.reduce((sum, c) => sum + c.amount, 0);
  const connectedSources = dataSources.filter((s) => s.connectionStatus === 'Connected').length;

  const tabs: { key: AssetTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: datasets.length + dataSources.length + pipelineRuns.length },
    { key: 'datasets', label: 'Datasets', count: datasets.length },
    { key: 'sources', label: 'Sources', count: dataSources.length },
    { key: 'pipelines', label: 'Pipelines', count: pipelineRuns.length },
  ];

  const assetRows = useMemo(() => {
    const rows: { id: string; type: string; name: string; meta: string; score?: number; link: string }[] = [];

    if (activeTab === 'all' || activeTab === 'datasets') {
      datasets.forEach((d) => rows.push({
        id: d.id, type: 'Dataset', name: d.displayName,
        meta: `${d.type} -- ${d.schema.database}.${d.schema.schema} -- Quality ${d.qualityScore}`,
        score: d.qualityScore, link: `/datasets/${d.id}`,
      }));
    }
    if (activeTab === 'all' || activeTab === 'sources') {
      dataSources.forEach((s) => rows.push({
        id: s.id, type: 'Source', name: s.name,
        meta: `${s.system} -- ${s.connectionStatus} -- ${s.datasetsCount} datasets`,
        link: '/datasets',
      }));
    }
    if (activeTab === 'all' || activeTab === 'pipelines') {
      pipelineRuns.forEach((r) => rows.push({
        id: r.id, type: 'Pipeline', name: r.pipelineName,
        meta: `${r.type} -- ${r.status} -- ${r.recordsProcessed.toLocaleString()} records`,
        link: '/pipelines',
      }));
    }

    if (search) {
      const q = search.toLowerCase();
      return rows.filter((r) => r.name.toLowerCase().includes(q) || r.meta.toLowerCase().includes(q));
    }
    return rows;
  }, [activeTab, datasets, dataSources, pipelineRuns, search]);

  const typeIcons: Record<string, typeof Database> = {
    Dataset: Database, Source: Server, Pipeline: Play,
  };

  const recentChecks = [...qualityChecks]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  const now = new Date();
  const staleThresholdMs = 24 * 60 * 60 * 1000;
  const freshCount = datasets.filter((d) => now.getTime() - new Date(d.freshness.lastUpdated).getTime() < staleThresholdMs).length;
  const staleCount = datasets.filter((d) => now.getTime() - new Date(d.freshness.lastUpdated).getTime() >= staleThresholdMs).length;
  const unknownCount = datasets.length - freshCount - staleCount;

  const freshnessData = [
    { label: 'Fresh', count: freshCount, color: 'bg-emerald-400' },
    { label: 'Stale', count: staleCount, color: 'bg-amber-400' },
    { label: 'Unknown', count: unknownCount, color: 'bg-cream-300' },
  ].filter(d => d.count > 0);

  const resultIcon = (result: string) => {
    if (result === 'Passed') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    if (result === 'Failed') return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
    return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
  };

  return (
    <div>
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 rounded-2xl p-6 mb-8 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-4" style={{ '--logo-inner': '#1a1a1a' } as React.CSSProperties}>
            <Logo size={56} className="flex-shrink-0" />
            <h1 className="text-2xl font-semibold leading-none">Happy Coffee Data Catalog</h1>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search datasets, sources, pipelines..."
            showShortcut
            className="max-w-lg mx-auto"
          />
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard icon={Database} label="Total Datasets" value={datasets.length} />
            <StatCard icon={ShieldCheck} label="Avg Quality" value={avgQuality} detail="Score 0-100" />
            <StatCard icon={Server} label="Connected Sources" value={connectedSources} />
            <StatCard icon={DollarSign} label="Monthly Cost" value={`$${(totalCost / 1000).toFixed(0)}k`} />
          </div>

          <div className="bg-white border border-cream-200 rounded-xl shadow-card">
            <div className="px-4 pt-4 pb-0 border-b border-cream-100">
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
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

            <div className="divide-y divide-cream-100 max-h-[420px] overflow-y-auto scrollbar-thin">
              {assetRows.slice(0, 50).map((row) => {
                const Icon = typeIcons[row.type] || Database;
                return (
                  <button
                    key={row.id}
                    onClick={() => navigate(row.link)}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-cream-50 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-cream-400 flex-shrink-0" />
                    <span className="font-medium text-cream-900 text-sm">{row.name}</span>
                    {row.score && row.score >= 90 && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-500 flex-shrink-0" />
                    )}
                    <span className="text-xs text-cream-500 truncate">{row.meta}</span>
                  </button>
                );
              })}
              {assetRows.length === 0 && (
                <div className="px-4 py-8 text-center text-cream-400 text-sm">No assets match your search</div>
              )}
            </div>
          </div>
        </div>

        <div className="w-72 flex-shrink-0 space-y-6 hidden lg:block">
          <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
            <h3 className="text-sm font-semibold text-cream-800 mb-3">Recent Quality Checks</h3>
            <div className="space-y-3">
              {recentChecks.map((check) => (
                <div key={check.id} className="flex gap-2">
                  {resultIcon(check.result)}
                  <div className="min-w-0">
                    <p className="text-xs text-cream-700 line-clamp-2">
                      <span className="font-medium">{check.datasetName}</span> -- {check.message}
                    </p>
                    <p className="text-[10px] text-cream-400 mt-0.5">
                      {check.checkType} -- {new Date(check.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
            <h3 className="text-sm font-semibold text-cream-800 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Dataset Freshness
            </h3>
            {freshnessData.map((item) => {
              const pct = datasets.length ? (item.count / datasets.length) * 100 : 0;
              return (
                <div key={item.label} className="mb-2 last:mb-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-cream-700">{item.label}</span>
                    <span className="text-cream-500">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-cream-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
