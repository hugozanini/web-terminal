import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  Clock,
  User,
  Layers,
  Server,
  Play,
  DollarSign,
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

type TabKey = 'overview' | 'lineage' | 'pipelines' | 'costs';

const pipelineColumns: Column<PipelineRun>[] = [
  { key: 'pipeline', header: 'Pipeline', width: '180px', sortable: true, sortValue: (r) => r.pipelineName, render: (r) => <span className="text-xs font-medium font-mono">{r.pipelineName}</span> },
  { key: 'run', header: 'Run', width: '120px', render: (r) => <span className="text-xs text-cream-500">{r.runNumber}</span> },
  { key: 'type', header: 'Type', width: '120px', sortable: true, sortValue: (r) => r.type, render: (r) => <span className="text-xs">{r.type}</span> },
  { key: 'status', header: 'Status', width: '90px', sortable: true, sortValue: (r) => r.status, render: (r) => {
    const color = r.status === 'Success' ? 'text-emerald-600' : r.status === 'Failed' ? 'text-red-600' : r.status === 'Running' ? 'text-blue-600' : 'text-cream-500';
    return <span className={clsx('text-xs font-medium', color)}>{r.status}</span>;
  }},
  { key: 'records', header: 'Records', width: '100px', sortable: true, sortValue: (r) => r.recordsProcessed, render: (r) => <span className="text-xs">{r.recordsProcessed.toLocaleString()}</span> },
  { key: 'date', header: 'Date', width: '110px', sortable: true, sortValue: (r) => new Date(r.startTime).getTime(), render: (r) => <span className="text-xs text-cream-600">{new Date(r.startTime).toLocaleDateString()}</span> },
];

const costColumns: Column<CostEntry>[] = [
  { key: 'date', header: 'Date', width: '100px', sortable: true, sortValue: (r) => new Date(r.date).getTime(), render: (r) => <span className="text-xs text-cream-600">{new Date(r.date).toLocaleDateString()}</span> },
  { key: 'category', header: 'Category', width: '110px', sortable: true, sortValue: (r) => r.category, render: (r) => <span className="text-xs">{r.category}</span> },
  { key: 'subcategory', header: 'Subcategory', render: (r) => <span className="text-xs font-medium">{r.subcategory}</span> },
  { key: 'description', header: 'Description', render: (r) => <span className="text-xs text-cream-600 line-clamp-1">{r.description}</span> },
  { key: 'amount', header: 'Amount', width: '110px', sortable: true, sortValue: (r) => r.amount, render: (r) => <span className="text-xs font-semibold">${r.amount.toLocaleString()}</span> },
];

export function DatasetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { datasets, lineage, pipelineRuns, costs } = useCatalogData();
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

  if (!dataset) {
    return (
      <div className="text-center py-20">
        <p className="text-cream-500">Dataset not found</p>
        <button onClick={() => navigate('/datasets')} className="text-coffee-600 hover:underline text-sm mt-2">
          Back to Datasets
        </button>
      </div>
    );
  }

  const qualityColor = dataset.qualityScore >= 90 ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : dataset.qualityScore >= 75 ? 'bg-blue-100 text-blue-700 border-blue-200'
    : 'bg-amber-100 text-amber-700 border-amber-200';

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'lineage', label: 'Lineage', count: datasetLineage.nodes.length },
    { key: 'pipelines', label: 'Pipeline Runs', count: datasetPipelines.length },
    { key: 'costs', label: 'Costs', count: datasetCosts.length },
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
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-5 h-5 text-cream-400" />
              <h1 className="text-2xl font-semibold text-cream-950">{dataset.displayName}</h1>
            </div>
            <p className="text-sm text-cream-500 font-mono">{dataset.schema.database}.{dataset.schema.schema}.{dataset.name}</p>
            <p className="text-sm text-cream-600 mt-1">{dataset.description}</p>
          </div>
          <span className={clsx('text-lg font-bold px-3 py-1.5 rounded-full border', qualityColor)}>
            {dataset.qualityScore}
          </span>
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
                  ? 'border-coffee-600 text-coffee-700 font-medium'
                  : 'border-transparent text-cream-500 hover:text-cream-700'
              )}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={clsx(
                  'text-[10px] px-1.5 py-0.5 rounded-full',
                  tab === t.key ? 'bg-coffee-100 text-coffee-700' : 'bg-cream-100 text-cream-500'
                )}>
                  {t.count}
                </span>
              )}
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
                <Clock className="w-4 h-4 text-cream-400 flex-shrink-0" />
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
          <DataTable columns={pipelineColumns} data={datasetPipelines} pageSize={10} keyExtractor={(r) => r.id} />
        ) : (
          <div className="text-center py-12 text-cream-400 text-sm">
            <Play className="w-8 h-8 mx-auto mb-2 text-cream-300" />
            No pipeline runs found for this dataset
          </div>
        )
      )}

      {tab === 'costs' && (
        datasetCosts.length > 0 ? (
          <DataTable columns={costColumns} data={datasetCosts} pageSize={10} keyExtractor={(r) => r.id} />
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
