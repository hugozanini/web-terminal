import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  Clock,
  User,
  Layers,
  Server,
  Play,
  DollarSign,
  ExternalLink,
  RefreshCw,
  Shield,
  TrendingUp,
  TrendingDown,
  Table2,
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
  Position,
  Handle,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TagPill, getTagVariant, getDatasetTypeVariant } from '../ui/TagPill';
import { DataTable, type Column } from '../ui/DataTable';
import { useCatalogData } from '../../hooks/useCatalogData';
import type { PipelineRun, CostEntry } from '../../data/types';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import clsx from 'clsx';

const typeNodeConfig: Record<string, { color: string; bg: string; border: string }> = {
  Source:    { color: 'text-red-400',     bg: 'bg-red-950/50',     border: 'border-red-700' },
  Ingestion: { color: 'text-orange-400',  bg: 'bg-orange-950/50',  border: 'border-orange-700' },
  Bronze:   { color: 'text-amber-400',    bg: 'bg-amber-950/50',   border: 'border-amber-700' },
  Silver:   { color: 'text-gray-300',     bg: 'bg-gray-800/50',    border: 'border-gray-600' },
  Gold:     { color: 'text-yellow-400',   bg: 'bg-yellow-950/50',  border: 'border-yellow-700' },
  BI:       { color: 'text-blue-400',     bg: 'bg-blue-950/50',    border: 'border-blue-700' },
};

function MiniLineageNode({ data }: { data: { label: string; type: string; location: string } }) {
  const config = typeNodeConfig[data.type] || typeNodeConfig.Source;
  return (
    <div className={clsx('rounded-lg border px-3 py-2 min-w-[160px]', config.bg, config.border)}>
      <Handle type="target" position={Position.Left} className="!bg-gray-500 !w-2 !h-2 !border-0" />
      <p className={clsx('text-[10px] font-semibold uppercase tracking-wider mb-0.5', config.color)}>{data.type}</p>
      <p className="text-xs font-medium text-gray-100 truncate">{data.label}</p>
      <p className="text-[10px] text-gray-400 truncate">{data.location}</p>
      <Handle type="source" position={Position.Right} className="!bg-gray-500 !w-2 !h-2 !border-0" />
    </div>
  );
}

const miniNodeTypes: NodeTypes = { lineage: MiniLineageNode };

function layoutMiniGraph(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', ranksep: 80, nodesep: 40, marginx: 20, marginy: 20 });
  nodes.forEach((n) => g.setNode(n.id, { width: 170, height: 60 }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const pos = g.node(n.id);
    return { ...n, position: { x: pos.x - 85, y: pos.y - 30 } };
  });
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

const criticalityConfig: Record<string, { color: string; bg: string; border: string }> = {
  Critical: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  High:     { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  Medium:   { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Low:      { color: 'text-cream-600', bg: 'bg-cream-50', border: 'border-cream-200' },
};

type TabKey = 'overview' | 'data' | 'quality' | 'lineage' | 'pipelines' | 'costs';

function PipelineLink({ run, pipelineList, datasetId, datasetName }: { run: PipelineRun; pipelineList: { id: string; name: string }[]; datasetId?: string; datasetName?: string }) {
  const p = pipelineList.find((pl) => pl.id === run.pipelineId);
  if (p) {
    return (
      <Link
        to={`/pipelines/${p.id}`}
        state={datasetId ? { fromDataset: { id: datasetId, name: datasetName } } : undefined}
        className="text-xs font-medium font-mono text-brand-700 hover:text-brand-900 hover:underline inline-flex items-center gap-1"
      >
        {run.pipelineName}
        <ExternalLink className="w-3 h-3" />
      </Link>
    );
  }
  return <span className="text-xs font-medium font-mono">{run.pipelineName}</span>;
}

function makePipelineColumns(pList: { id: string; name: string }[], dsId?: string, dsName?: string): Column<PipelineRun>[] {
  return [
    { key: 'pipeline', header: 'Pipeline', width: '200px', sortable: true, sortValue: (r) => r.pipelineName, render: (r) => <PipelineLink run={r} pipelineList={pList} datasetId={dsId} datasetName={dsName} /> },
    { key: 'run', header: 'Run', width: '120px', render: (r) => <span className="text-xs text-cream-500">{r.runNumber}</span> },
    { key: 'type', header: 'Type', width: '120px', sortable: true, sortValue: (r) => r.type, render: (r) => <span className="text-xs">{r.type}</span> },
    { key: 'status', header: 'Status', width: '90px', sortable: true, sortValue: (r) => r.status, render: (r) => {
      const color = r.status === 'Success' ? 'text-emerald-600' : r.status === 'Failed' ? 'text-red-600' : r.status === 'Running' ? 'text-blue-600' : 'text-cream-500';
      return <span className={clsx('text-xs font-medium', color)}>{r.status}</span>;
    }},
    { key: 'records', header: 'Records', width: '100px', sortable: true, sortValue: (r) => r.recordsProcessed, render: (r) => <span className="text-xs">{r.recordsProcessed.toLocaleString()}</span> },
    { key: 'date', header: 'Date', width: '110px', sortable: true, sortValue: (r) => new Date(r.startTime).getTime(), render: (r) => <span className="text-xs text-cream-600">{new Date(r.startTime).toLocaleDateString()}</span> },
  ];
}

const costTableColumns: Column<CostEntry>[] = [
  { key: 'date', header: 'Date', width: '100px', sortable: true, sortValue: (r) => new Date(r.date).getTime(), render: (r) => <span className="text-xs text-cream-600">{new Date(r.date).toLocaleDateString()}</span> },
  { key: 'category', header: 'Category', width: '110px', sortable: true, sortValue: (r) => r.category, render: (r) => <span className="text-xs">{r.category}</span> },
  { key: 'subcategory', header: 'Subcategory', render: (r) => <span className="text-xs font-medium">{r.subcategory}</span> },
  { key: 'description', header: 'Description', render: (r) => <span className="text-xs text-cream-600 line-clamp-1">{r.description}</span> },
  { key: 'amount', header: 'Amount', width: '110px', sortable: true, sortValue: (r) => r.amount, render: (r) => <span className="text-xs font-semibold">${r.amount.toLocaleString()}</span> },
];

export function DatasetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { datasets, lineage, pipelines, pipelineRuns, costs } = useCatalogData();
  const [tab, setTab] = useState<TabKey>('overview');

  const dataset = datasets.find((d) => d.id === id);
  useDocumentTitle(dataset ? dataset.displayName : 'Dataset Detail');

  const datasetLineage = useMemo(() => {
    if (!id) return { nodes: [] as Node[], edges: [] as Edge[] };
    const relevant = lineage.filter((n) => n.datasetIds.includes(id));
    const nodes: Node[] = relevant.map((n) => ({
      id: n.id, type: 'lineage', position: { x: 0, y: 0 },
      data: { label: n.name, type: n.type, location: n.location },
    }));
    const edges: Edge[] = relevant.filter((n) => n.parentId).map((n) => ({
      id: `${n.parentId}-${n.id}`, source: n.parentId!, target: n.id,
      animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
      style: { stroke: '#4b5563', strokeWidth: 2 },
    }));
    return { nodes: layoutMiniGraph(nodes, edges), edges };
  }, [id, lineage]);

  const datasetPipelines = useMemo(() =>
    id ? pipelineRuns.filter((r) => r.inputDatasets.includes(id) || r.outputDatasets.includes(id)) : [],
    [id, pipelineRuns]
  );

  const datasetCosts = useMemo(() =>
    id ? costs.filter((c) => c.entityId === id && c.entityType === 'Dataset') : [],
    [id, costs]
  );

  const costChartData = useMemo(() => {
    if (datasetCosts.length === 0) return [];
    const byDate: Record<string, { storage: number; compute: number }> = {};
    for (const c of datasetCosts) {
      const key = new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!byDate[key]) byDate[key] = { storage: 0, compute: 0 };
      if (c.category === 'Storage') byDate[key].storage += c.amount;
      else if (c.category === 'Compute') byDate[key].compute += c.amount;
    }
    return Object.entries(byDate)
      .map(([date, vals]) => ({ date, storage: +vals.storage.toFixed(2), compute: +vals.compute.toFixed(2) }))
      .reverse();
  }, [datasetCosts]);

  const costSummary = useMemo(() => {
    const storage = datasetCosts.filter(c => c.category === 'Storage').reduce((s, c) => s + c.amount, 0);
    const compute = datasetCosts.filter(c => c.category === 'Compute').reduce((s, c) => s + c.amount, 0);
    const total = datasetCosts.reduce((s, c) => s + c.amount, 0);
    const halfLen = Math.floor(costChartData.length / 2);
    const recentStorage = costChartData.slice(halfLen).reduce((s, d) => s + d.storage, 0);
    const olderStorage = costChartData.slice(0, halfLen).reduce((s, d) => s + d.storage, 0);
    const storageTrend = olderStorage > 0 ? ((recentStorage - olderStorage) / olderStorage) * 100 : 0;
    const recentCompute = costChartData.slice(halfLen).reduce((s, d) => s + d.compute, 0);
    const olderCompute = costChartData.slice(0, halfLen).reduce((s, d) => s + d.compute, 0);
    const computeTrend = olderCompute > 0 ? ((recentCompute - olderCompute) / olderCompute) * 100 : 0;
    return { storage, compute, total, storageTrend, computeTrend };
  }, [datasetCosts, costChartData]);

  const costTrendUp = useMemo(() => {
    if (datasetCosts.length === 0) return null;
    const now = Date.now();
    const cutoff15 = now - 15 * 24 * 60 * 60 * 1000;
    const cutoff30 = now - 30 * 24 * 60 * 60 * 1000;
    const recent = datasetCosts
      .filter((c) => { const t = new Date(c.date).getTime(); return t >= cutoff15 && t <= now; })
      .reduce((s, c) => s + c.amount, 0);
    const prev = datasetCosts
      .filter((c) => { const t = new Date(c.date).getTime(); return t >= cutoff30 && t < cutoff15; })
      .reduce((s, c) => s + c.amount, 0);
    if (prev === 0 && recent === 0) return null;
    return recent >= prev;
  }, [datasetCosts]);

  const sampleColumns = useMemo(() => {
    if (!dataset || dataset.sampleData.length === 0) return [];
    return Object.keys(dataset.sampleData[0]);
  }, [dataset]);

  if (!dataset) {
    return (
      <div className="text-center py-20">
        <p className="text-cream-500">Dataset not found</p>
        <button onClick={() => navigate('/datasets')} className="text-brand-600 hover:underline text-sm mt-2">
          Back to Datasets
        </button>
      </div>
    );
  }

  const qualityColor = dataset.qualityScore >= 90 ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : dataset.qualityScore >= 75 ? 'bg-blue-100 text-blue-700 border-blue-200'
    : 'bg-amber-100 text-amber-700 border-amber-200';

  const critConf = criticalityConfig[dataset.criticality] || criticalityConfig.Medium;

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'data', label: 'Data' },
    { key: 'quality', label: 'Quality' },
    { key: 'lineage', label: 'Lineage', count: datasetLineage.nodes.length },
    { key: 'pipelines', label: 'Pipeline Runs', count: datasetPipelines.length },
    { key: 'costs', label: 'Costs' },
  ];

  return (
    <div>
      <button
        onClick={() => navigate('/datasets')}
        className="inline-flex items-center gap-1.5 text-sm text-cream-500 hover:text-cream-800 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Datasets
      </button>

      <div className="bg-white border border-cream-200 rounded-xl shadow-card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-5 h-5 text-cream-400" />
              <h1 className="text-2xl font-semibold text-cream-950">{dataset.displayName}</h1>
            </div>
            <p className="text-sm text-cream-500 font-mono">{dataset.schema.database}.{dataset.schema.schema}.{dataset.name}</p>
            <p className="text-sm text-cream-600 mt-1">{dataset.description}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold', critConf.bg, critConf.border, critConf.color)}>
              <Shield className="w-3.5 h-3.5" />
              {dataset.criticality}
            </div>
            <span className={clsx('text-lg font-bold px-3 py-1.5 rounded-full border', qualityColor)}>
              {dataset.qualityScore}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-3 border-t border-b border-cream-100">
          <div className="flex items-center gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5 text-cream-400" />
            <div>
              <p className="text-cream-500">Update Frequency</p>
              <p className="text-cream-900 font-medium">{dataset.freshness.updateFrequency}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3.5 h-3.5 text-cream-400" />
            <div>
              <p className="text-cream-500">Last Updated</p>
              <p className="text-cream-900 font-medium">{freshnessLabel(dataset.freshness.lastUpdated)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <User className="w-3.5 h-3.5 text-cream-400" />
            <div>
              <p className="text-cream-500">Owner</p>
              <p className="text-cream-900 font-medium">{dataset.owner}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Server className="w-3.5 h-3.5 text-cream-400" />
            <div>
              <p className="text-cream-500">Source</p>
              <p className="text-cream-900 font-medium">{dataset.source}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <TagPill label={dataset.type} variant={getDatasetTypeVariant(dataset.type)} />
          {dataset.tags.map((tag) => (
            <TagPill key={tag} label={tag} variant={getTagVariant(tag)} />
          ))}
        </div>
      </div>

      <div className="border-b border-cream-200 mb-6">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors',
                tab === t.key
                  ? 'border-brand-900 text-brand-900 font-medium'
                  : 'border-transparent text-cream-500 hover:text-cream-700'
              )}
            >
              {t.label}
              {t.key === 'costs' && costTrendUp !== null ? (
                costTrendUp ? (
                  <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                )
              ) : t.count !== undefined ? (
                <span className={clsx(
                  'text-[10px] px-1.5 py-0.5 rounded-full',
                  tab === t.key ? 'bg-brand-100 text-brand-800' : 'bg-cream-100 text-cream-500'
                )}>
                  {t.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-cream-800">Schema & Structure</h3>
            <div className="bg-white border border-cream-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Database className="w-4 h-4 text-cream-400 flex-shrink-0" />
                <span className="text-cream-600">Type: <span className="font-medium text-cream-900">{dataset.type}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-cream-400 flex-shrink-0" />
                <span className="text-cream-600">{dataset.columns} columns / {dataset.rows.toLocaleString()} rows / {formatBytes(dataset.sizeBytes)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Server className="w-4 h-4 text-cream-400 flex-shrink-0" />
                <span className="text-cream-600">Source: <span className="font-medium text-cream-900">{dataset.source}</span></span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-cream-800">Ownership & Freshness</h3>
            <div className="bg-white border border-cream-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-cream-400 flex-shrink-0" />
                <span className="text-cream-600">Owner: <span className="font-medium text-cream-900">{dataset.owner}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-cream-400 flex-shrink-0" />
                <span className="text-cream-600">Last updated: <span className="font-medium text-cream-900">{freshnessLabel(dataset.freshness.lastUpdated)}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RefreshCw className="w-4 h-4 text-cream-400 flex-shrink-0" />
                <span className="text-cream-600">Update frequency: <span className="font-medium text-cream-900">{dataset.freshness.updateFrequency}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-cream-400 flex-shrink-0" />
                <span className="text-cream-600">Created: <span className="font-medium text-cream-900">{new Date(dataset.createdAt).toLocaleDateString()}</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'data' && (
        dataset.sampleData.length > 0 ? (
          <div className="bg-white border border-cream-200 rounded-xl shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-cream-100 flex items-center gap-2">
              <Table2 className="w-4 h-4 text-cream-400" />
              <h3 className="text-sm font-semibold text-cream-800">Data Preview</h3>
              <span className="text-[10px] text-cream-400 ml-1">Top 10 rows</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-cream-50">
                    {sampleColumns.map((col) => (
                      <th key={col} className="px-3 py-2 text-left text-cream-600 font-semibold whitespace-nowrap border-b border-cream-100">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataset.sampleData.map((row, idx) => (
                    <tr key={idx} className="border-b border-cream-50 hover:bg-cream-50/50 transition-colors">
                      {sampleColumns.map((col) => (
                        <td key={col} className="px-3 py-2 text-cream-800 whitespace-nowrap">
                          {String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-cream-400 text-sm">
            <Table2 className="w-8 h-8 mx-auto mb-2 text-cream-300" />
            No sample data available for this dataset
          </div>
        )
      )}

      {tab === 'quality' && (() => {
        const qd = dataset.qualityDashboard;
        const healthColor = qd.healthScore >= 85 ? 'text-emerald-600' : qd.healthScore >= 70 ? 'text-amber-600' : 'text-red-600';
        const healthBg = qd.healthScore >= 85 ? 'bg-emerald-50 border-emerald-200' : qd.healthScore >= 70 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
        return (
          <div className="space-y-6">
            {qd.checksFailed > 0 && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-800">
                  <span className="font-semibold">{qd.checksFailed} failing check{qd.checksFailed !== 1 ? 's' : ''}</span>
                  {' '}(last 90 days) -- These need attention to maintain data reliability.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
                <p className="text-xs text-cream-500 mb-1 uppercase tracking-wide">Checks Failed</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-cream-900">{qd.checksFailed}</p>
                  {qd.checksFailed > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-600">REVIEW</span>
                  )}
                </div>
                <p className="text-[10px] text-cream-400 mt-1">Last 90 days</p>
              </div>
              <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
                <p className="text-xs text-cream-500 mb-1 uppercase tracking-wide">Checks Warned</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-cream-900">{qd.checksWarned}</p>
                  {qd.checksWarned > 5 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">REVIEW</span>
                  )}
                </div>
                <p className="text-[10px] text-cream-400 mt-1">Last 90 days</p>
              </div>
              <div className={clsx('rounded-xl shadow-card p-4 border', healthBg)}>
                <p className="text-xs text-cream-500 mb-1 uppercase tracking-wide">Data Health Score</p>
                <p className={clsx('text-2xl font-bold', healthColor)}>{qd.healthScore}%</p>
                <p className="text-[10px] text-cream-400 mt-1">Last 90 days</p>
              </div>
              <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
                <p className="text-xs text-cream-500 mb-1 uppercase tracking-wide">Active Checks</p>
                <p className="text-2xl font-bold text-cream-900">{qd.activeChecks.toLocaleString()}</p>
                <p className="text-[10px] text-cream-400 mt-1">Last 90 days</p>
              </div>
            </div>

            <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-cream-800">All Checks</h3>
                <div className="flex items-center gap-4 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> PASS</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> WARN</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> FAIL</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={qd.dailyChecks} barCategoryGap="10%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: '#a3a3a3' }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      if (d.getDate() === 1 || d.getDate() === 15) {
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }
                      return '';
                    }}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 9, fill: '#a3a3a3' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e5e5' }}
                    labelFormatter={(label) => new Date(String(label)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  />
                  <Bar dataKey="pass" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} name="Pass" />
                  <Bar dataKey="warn" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} name="Warn" />
                  <Bar dataKey="fail" stackId="a" fill="#f87171" radius={[2, 2, 0, 0]} name="Fail" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
              <h3 className="text-sm font-semibold text-cream-800 mb-3">Activity</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-bold text-cream-900">{qd.activeChecks.toLocaleString()}</p>
                    <p className="text-[10px] text-cream-500">Active checks (last 90 days)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-bold text-cream-900">{Math.round(qd.activeChecks / 90)}</p>
                    <p className="text-[10px] text-cream-500">Avg checks per day</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-bold text-cream-900">{qd.avgAlertsPerDay}</p>
                    <p className="text-[10px] text-cream-500">Avg alerts per day</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-bold text-cream-900">{qd.healthScore}%</p>
                    <p className="text-[10px] text-cream-500">Overall health</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {tab === 'lineage' && (
        <div className="h-[400px] bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          {datasetLineage.nodes.length > 0 ? (
            <ReactFlow
              nodes={datasetLineage.nodes}
              edges={datasetLineage.edges}
              nodeTypes={miniNodeTypes}
              fitView
              minZoom={0.5}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#374151" gap={20} size={1} />
              <Controls className="!bg-gray-800 !border-gray-700 !rounded-lg [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-gray-400 [&>button:hover]:!bg-gray-700" />
            </ReactFlow>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No lineage data available for this dataset
            </div>
          )}
        </div>
      )}

      {tab === 'pipelines' && (
        datasetPipelines.length > 0 ? (
          <DataTable columns={makePipelineColumns(pipelines, dataset.id, dataset.displayName)} data={datasetPipelines} pageSize={10} keyExtractor={(r) => r.id} />
        ) : (
          <div className="text-center py-12 text-cream-400 text-sm">
            <Play className="w-8 h-8 mx-auto mb-2 text-cream-300" />
            No pipeline runs found for this dataset
          </div>
        )
      )}

      {tab === 'costs' && (
        datasetCosts.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
                <p className="text-xs text-cream-500 mb-1">Total Cost</p>
                <p className="text-xl font-bold text-cream-900">${costSummary.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p className="text-[10px] text-cream-400 mt-1">Last 90 days</p>
              </div>
              <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
                <p className="text-xs text-cream-500 mb-1">Storage</p>
                <p className="text-xl font-bold text-cream-900">${costSummary.storage.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <div className="flex items-center gap-1 mt-1">
                  {costSummary.storageTrend >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-red-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-emerald-500" />
                  )}
                  <span className={clsx('text-[10px] font-medium', costSummary.storageTrend >= 0 ? 'text-red-500' : 'text-emerald-500')}>
                    {Math.abs(costSummary.storageTrend).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
                <p className="text-xs text-cream-500 mb-1">Compute</p>
                <p className="text-xl font-bold text-cream-900">${costSummary.compute.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <div className="flex items-center gap-1 mt-1">
                  {costSummary.computeTrend >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-red-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-emerald-500" />
                  )}
                  <span className={clsx('text-[10px] font-medium', costSummary.computeTrend >= 0 ? 'text-red-500' : 'text-emerald-500')}>
                    {Math.abs(costSummary.computeTrend).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {costChartData.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
                  <h3 className="text-sm font-semibold text-cream-800 mb-3">Storage Cost Trend</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={costChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#737373' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e5e5' }}
                        formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, 'Storage']}
                      />
                      <Line type="monotone" dataKey="storage" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
                  <h3 className="text-sm font-semibold text-cream-800 mb-3">Compute Cost Trend</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={costChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#737373' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e5e5' }}
                        formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, 'Compute']}
                      />
                      <Line type="monotone" dataKey="compute" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <DataTable columns={costTableColumns} data={datasetCosts} pageSize={10} keyExtractor={(r) => r.id} />
          </div>
        ) : (
          <div className="text-center py-12 text-cream-400 text-sm">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-cream-300" />
            No costs recorded for this dataset
          </div>
        )
      )}
    </div>
  );
}
