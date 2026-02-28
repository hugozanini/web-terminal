import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Clock,
  Hash,
  Zap,
  Calendar,
  User,
  Server,
  Tag,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
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
import { useCatalogData } from '../../hooks/useCatalogData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getSuccessLogSteps, getFailureLogSteps } from '../../data/generators/log-templates';
import type { PipelineRun, PipelineRunLog } from '../../data/types';
import clsx from 'clsx';

type TabKey = 'overview' | 'runs' | 'lineage';
type Environment = 'production' | 'staging';

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

function formatCron(cron: string): string {
  const parts = cron.split(' ');
  if (parts[0] === '*/15') return 'Every 15 minutes';
  if (parts[1] === '*/2') return 'Every 2 hours';
  if (parts[1] === '*/3') return 'Every 3 hours';
  if (parts[1] === '*/4') return 'Every 4 hours';
  if (parts[1] === '*/6') return 'Every 6 hours';
  if (parts[4] === '1') return 'Weekly (Monday)';
  if (parts[4] === '1-5') return `Weekdays at ${parts[1]}:${parts[0].padStart(2, '0')}`;
  if (parts[2] === '1') return 'Monthly (1st)';
  return `Daily at ${parts[1]}:${parts[0].padStart(2, '0')}`;
}

const logLevelColors: Record<string, string> = {
  INFO: 'text-blue-400',
  DEBUG: 'text-gray-500',
  WARN: 'text-amber-400',
  ERROR: 'text-red-400',
};

function LogLine({ log }: { log: PipelineRunLog }) {
  const ts = new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return (
    <div className="flex gap-2 font-mono text-xs leading-relaxed">
      <span className="text-gray-600 flex-shrink-0">{ts}</span>
      <span className={clsx('w-12 flex-shrink-0 text-right', logLevelColors[log.level])}>{log.level.padStart(5)}</span>
      <span className={clsx(
        'flex-1',
        log.level === 'ERROR' ? 'text-red-300' :
          log.level === 'WARN' ? 'text-amber-300' :
            log.level === 'DEBUG' ? 'text-gray-500' :
              'text-gray-300'
      )}>{log.message}</span>
    </div>
  );
}

const lineageNodeConfig: Record<string, { color: string; bg: string; border: string }> = {
  input: { color: 'text-blue-400', bg: 'bg-blue-950/50', border: 'border-blue-700' },
  pipeline: { color: 'text-white', bg: 'bg-gray-800', border: 'border-gray-500' },
  output: { color: 'text-emerald-400', bg: 'bg-emerald-950/50', border: 'border-emerald-700' },
};

function PipelineFlowNode({ data }: { data: { label: string; sublabel: string; nodeType: string } }) {
  const config = lineageNodeConfig[data.nodeType] || lineageNodeConfig.input;
  return (
    <div className={clsx('rounded-lg border px-4 py-3 min-w-[180px] max-w-[220px]', config.bg, config.border)}>
      <Handle type="target" position={Position.Left} className="!bg-gray-500 !w-2 !h-2 !border-0" />
      <p className={clsx('text-[10px] font-semibold uppercase tracking-wider mb-0.5', config.color)}>
        {data.nodeType === 'pipeline' ? 'Pipeline' : data.nodeType === 'input' ? 'Input Dataset' : 'Output Dataset'}
      </p>
      <p className="text-sm font-medium text-gray-100 leading-tight truncate">{data.label}</p>
      <p className="text-[11px] text-gray-400 truncate">{data.sublabel}</p>
      <Handle type="source" position={Position.Right} className="!bg-gray-500 !w-2 !h-2 !border-0" />
    </div>
  );
}

const pipelineNodeTypes: NodeTypes = { pipelineFlow: PipelineFlowNode };

function layoutPipelineGraph(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', ranksep: 120, nodesep: 50, marginx: 40, marginy: 40 });
  nodes.forEach((n) => g.setNode(n.id, { width: 200, height: 70 }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const pos = g.node(n.id);
    return { ...n, position: { x: pos.x - 100, y: pos.y - 35 } };
  });
}

export function PipelineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromDataset = (location.state as { fromDataset?: { id: string; name: string } } | null)?.fromDataset;
  const {
    pipelines, pipelineRuns, datasets,
    addPipelineRun, updatePipelineRun, updatePipeline,
  } = useCatalogData();

  const pipeline = pipelines.find((p) => p.id === id);
  useDocumentTitle(pipeline ? pipeline.displayName : 'Pipeline');

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabKey) || 'overview';
  const expandedRun = searchParams.get('run');
  const [isRunning, setIsRunning] = useState(false);
  const [liveRunId, setLiveRunId] = useState<string | null>(null);
  const [liveLogs, setLiveLogs] = useState<PipelineRunLog[]>([]);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<Environment>('production');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const runs = useMemo(() =>
    pipelineRuns
      .filter((r) => r.pipelineId === pipeline?.id)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [pipelineRuns, pipeline?.id]
  );

  const successRate = useMemo(() => {
    const completed = runs.filter((r) => r.status === 'Success' || r.status === 'Failed');
    if (completed.length === 0) return 0;
    return Math.round((completed.filter((r) => r.status === 'Success').length / completed.length) * 100);
  }, [runs]);

  const inputDs = useMemo(() =>
    pipeline ? datasets.filter((d) => pipeline.inputDatasets.includes(d.id)) : [],
    [pipeline, datasets]
  );

  const outputDs = useMemo(() =>
    pipeline ? datasets.filter((d) => pipeline.outputDatasets.includes(d.id)) : [],
    [pipeline, datasets]
  );

  const { lineageNodes, lineageEdges } = useMemo(() => {
    if (!pipeline) return { lineageNodes: [], lineageEdges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    inputDs.forEach((d) => {
      nodes.push({
        id: `input-${d.id}`,
        type: 'pipelineFlow',
        position: { x: 0, y: 0 },
        data: { label: d.displayName, sublabel: `${d.type} -- ${d.schema.database}.${d.schema.schema}`, nodeType: 'input' },
      });
      edges.push({
        id: `input-${d.id}-to-pipeline`,
        source: `input-${d.id}`,
        target: 'pipeline-center',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
        style: { stroke: '#3b82f6', strokeWidth: 2 },
      });
    });

    nodes.push({
      id: 'pipeline-center',
      type: 'pipelineFlow',
      position: { x: 0, y: 0 },
      data: { label: pipeline.displayName, sublabel: `${pipeline.engine} / ${pipeline.cluster}`, nodeType: 'pipeline' },
    });

    outputDs.forEach((d) => {
      nodes.push({
        id: `output-${d.id}`,
        type: 'pipelineFlow',
        position: { x: 0, y: 0 },
        data: { label: d.displayName, sublabel: `${d.type} -- ${d.schema.database}.${d.schema.schema}`, nodeType: 'output' },
      });
      edges.push({
        id: `pipeline-to-output-${d.id}`,
        source: 'pipeline-center',
        target: `output-${d.id}`,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
        style: { stroke: '#10b981', strokeWidth: 2 },
      });
    });

    return { lineageNodes: layoutPipelineGraph(nodes, edges), lineageEdges: edges };
  }, [pipeline, inputDs, outputDs]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [liveLogs]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as HTMLElement)) {
        setEnvDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerRun = useCallback((env: Environment) => {
    if (!pipeline || isRunning) return;
    setEnvDropdownOpen(false);

    const willSucceed = Math.random() > 0.35;
    const steps = willSucceed
      ? getSuccessLogSteps(pipeline.displayName)
      : getFailureLogSteps(pipeline.displayName);

    const clusterForEnv = env === 'staging' ? 'staging-01' : pipeline.cluster;

    const runId = `live-${Date.now()}`;
    const startTime = new Date();
    const newRun: PipelineRun = {
      id: runId,
      runNumber: `RUN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      type: pipeline.type,
      status: 'Running',
      startTime,
      endTime: startTime,
      duration: 0,
      recordsProcessed: 0,
      recordsFailed: 0,
      triggerType: 'Manual',
      inputDatasets: pipeline.inputDatasets,
      outputDatasets: pipeline.outputDatasets,
      parameters: { engine: pipeline.engine, cluster: clusterForEnv, environment: env },
      logs: [],
    };

    addPipelineRun(newRun);
    updatePipeline(pipeline.id, { lastRunStatus: 'Running', lastRunTime: startTime });
    setLiveRunId(runId);
    setLiveLogs([]);
    setLiveElapsed(0);
    setIsRunning(true);
    setSelectedEnv(env);
    setSearchParams({ tab: 'runs', run: runId });

    timerRef.current = setInterval(() => {
      setLiveElapsed((prev) => prev + 1);
    }, 1000);

    let stepIndex = 0;
    const scheduleNext = () => {
      if (stepIndex >= steps.length) {
        clearInterval(timerRef.current);
        const finalStatus = willSucceed ? 'Success' : 'Failed';
        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
        const records = willSucceed ? 12804 : 0;
        const failed = willSucceed ? 0 : 9231;

        updatePipelineRun(runId, {
          status: finalStatus,
          endTime,
          duration,
          recordsProcessed: records,
          recordsFailed: failed,
        });
        updatePipeline(pipeline.id, { lastRunStatus: finalStatus, lastRunTime: endTime, totalRuns: pipeline.totalRuns + 1 });
        setIsRunning(false);
        return;
      }

      const step = steps[stepIndex];
      const nextStep = steps[stepIndex + 1];
      const logEntry: PipelineRunLog = {
        timestamp: new Date(),
        level: step.level,
        message: step.message,
      };

      setLiveLogs((prev) => [...prev, logEntry]);
      stepIndex++;

      if (nextStep) {
        const waitMs = nextStep.delay - step.delay;
        setTimeout(scheduleNext, waitMs);
      } else {
        scheduleNext();
      }
    };

    scheduleNext();
  }, [pipeline, isRunning, addPipelineRun, updatePipelineRun, updatePipeline]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!pipeline) {
    return (
      <div className="text-center py-16">
        <p className="text-cream-500">Pipeline not found.</p>
        <button onClick={() => navigate(fromDataset ? `/datasets/${fromDataset.id}` : '/pipelines')} className="text-sm text-brand-600 mt-2 hover:underline">
          {fromDataset ? `Back to ${fromDataset.name}` : 'Back to Pipelines'}
        </button>
      </div>
    );
  }

  const sColors = statusColors[pipeline.lastRunStatus] || statusColors.Never;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'runs', label: `Runs (${runs.length})` },
    { key: 'lineage', label: 'Lineage' },
  ];

  return (
    <div>
      <button
        onClick={() => navigate(fromDataset ? `/datasets/${fromDataset.id}` : '/pipelines')}
        className="inline-flex items-center gap-1.5 text-sm text-cream-500 hover:text-cream-800 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {fromDataset ? `Back to ${fromDataset.name}` : 'Back to Pipelines'}
      </button>

      <div className="bg-white border border-cream-200 rounded-xl shadow-card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-semibold text-cream-900">{pipeline.displayName}</h1>
              <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full', sColors.badge)}>
                {pipeline.lastRunStatus}
              </span>
            </div>
            <p className="text-sm text-cream-500 font-mono">{pipeline.name}</p>
          </div>

          <div className="relative" ref={dropdownRef}>
            {isRunning ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-cream-100 text-cream-400 cursor-not-allowed">
                <Loader2 className="w-4 h-4 animate-spin" /> Running on {selectedEnv}...
              </div>
            ) : (
              <div className="inline-flex rounded-lg shadow-sm">
                <button
                  onClick={() => triggerRun(selectedEnv)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-l-lg text-sm font-medium bg-brand-900 text-white hover:bg-brand-800 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Run in {selectedEnv === 'production' ? 'Production' : 'Staging'}
                </button>
                <button
                  onClick={() => setEnvDropdownOpen(!envDropdownOpen)}
                  className="inline-flex items-center px-2 py-2 rounded-r-lg text-sm font-medium bg-brand-800 text-white hover:bg-brand-700 transition-colors border-l border-brand-700"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}

            {envDropdownOpen && !isRunning && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-cream-200 rounded-lg shadow-lg z-10 overflow-hidden">
                <button
                  onClick={() => { setSelectedEnv('production'); triggerRun('production'); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-left hover:bg-cream-50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-cream-900">Production</p>
                    <p className="text-[10px] text-cream-500">{pipeline.cluster}</p>
                  </div>
                </button>
                <div className="border-t border-cream-100" />
                <button
                  onClick={() => { setSelectedEnv('staging'); triggerRun('staging'); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-left hover:bg-cream-50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-cream-900">Staging</p>
                    <p className="text-[10px] text-cream-500">staging-01</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-cream-600 mb-4">{pipeline.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-cream-400" />
            <div>
              <p className="text-cream-500">Owner</p>
              <p className="text-cream-800 font-medium">{pipeline.owner}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-cream-400" />
            <div>
              <p className="text-cream-500">Engine / Cluster</p>
              <p className="text-cream-800 font-medium">{pipeline.engine} / {pipeline.cluster}</p>
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
              <p className="text-cream-500">Total Runs</p>
              <p className="text-cream-800 font-medium">{pipeline.totalRuns}</p>
            </div>
          </div>
        </div>
      </div>

      {isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Pipeline is running on <span className="font-semibold">{selectedEnv}</span>...
              </p>
              <p className="text-xs text-blue-600">Elapsed: {liveElapsed}s</p>
            </div>
          </div>
          <div className="h-1.5 w-48 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((liveElapsed / 40) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="border-b border-cream-200 mb-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSearchParams({ tab: tab.key, ...(expandedRun ? { run: expandedRun } : {}) })}
              className={clsx(
                'px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors',
                activeTab === tab.key
                  ? 'border-brand-900 text-brand-900 font-medium'
                  : 'border-transparent text-cream-500 hover:text-cream-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
              <h3 className="text-sm font-semibold text-cream-800 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Schedule
              </h3>
              {pipeline.schedule ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-cream-500">Frequency</span>
                    <span className="text-cream-800 font-medium">{formatCron(pipeline.schedule.cron)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream-500">Cron</span>
                    <span className="text-cream-800 font-mono">{pipeline.schedule.cron}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream-500">Timezone</span>
                    <span className="text-cream-800">{pipeline.schedule.timezone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream-500">Next Run</span>
                    <span className="text-cream-800">{new Date(pipeline.schedule.nextRun).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream-500">Enabled</span>
                    <span className={pipeline.schedule.enabled ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                      {pipeline.schedule.enabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-cream-400">No schedule configured (manual triggers only)</p>
              )}
            </div>

            <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
              <h3 className="text-sm font-semibold text-cream-800 mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Performance
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-cream-500">Success Rate</span>
                  <span className={clsx('font-medium', successRate >= 80 ? 'text-emerald-600' : successRate >= 50 ? 'text-amber-600' : 'text-red-600')}>
                    {successRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream-500">Avg Duration</span>
                  <span className="text-cream-800 font-medium">{formatDuration(pipeline.avgDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream-500">Total Runs</span>
                  <span className="text-cream-800 font-medium">{pipeline.totalRuns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream-500">Last Run</span>
                  <span className="text-cream-800">
                    {pipeline.lastRunTime ? new Date(pipeline.lastRunTime).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
              <h3 className="text-sm font-semibold text-cream-800 mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {pipeline.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-cream-100 text-cream-700 text-[10px] rounded-full border border-cream-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
              <h3 className="text-sm font-semibold text-cream-800 mb-3">Input Datasets</h3>
              {inputDs.length === 0 ? (
                <p className="text-xs text-cream-400">No input datasets</p>
              ) : (
                <div className="space-y-2">
                  {inputDs.map((d) => (
                    <Link
                      key={d.id}
                      to={`/datasets/${d.id}`}
                      className="flex items-center gap-2 text-xs hover:bg-cream-50 px-2 py-1.5 rounded-lg transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                      <span className="text-cream-800 font-medium">{d.displayName}</span>
                      <span className="text-cream-400">{d.type}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-cream-200 rounded-xl shadow-card p-4">
              <h3 className="text-sm font-semibold text-cream-800 mb-3">Output Datasets</h3>
              {outputDs.length === 0 ? (
                <p className="text-xs text-cream-400">No output datasets</p>
              ) : (
                <div className="space-y-2">
                  {outputDs.map((d) => (
                    <Link
                      key={d.id}
                      to={`/datasets/${d.id}`}
                      className="flex items-center gap-2 text-xs hover:bg-cream-50 px-2 py-1.5 rounded-lg transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span className="text-cream-800 font-medium">{d.displayName}</span>
                      <span className="text-cream-400">{d.type}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'runs' && (
        <div className="space-y-3">
          {runs.map((run) => {
            const rColors = statusColors[run.status] || statusColors.Cancelled;
            const isExpanded = expandedRun === run.id;
            const isLive = run.id === liveRunId;
            const logsToShow = isLive && isRunning ? liveLogs : run.logs;
            const runEnv = run.parameters.environment as string | undefined;

            return (
              <div
                key={run.id}
                className={clsx(
                  'bg-white rounded-xl border border-cream-200 shadow-card border-l-4 transition-all',
                  rColors.border,
                  isLive && isRunning && 'ring-2 ring-blue-200'
                )}
              >
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    if (isExpanded) {
                      newParams.delete('run');
                    } else {
                      newParams.set('run', run.id);
                    }
                    setSearchParams(newParams);
                  }}
                  className="flex items-center justify-between w-full px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-cream-400" /> : <ChevronRight className="w-4 h-4 text-cream-400" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-cream-900">{run.runNumber}</span>
                        <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full', rColors.badge)}>
                          {run.status === 'Running' && isLive ? (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Running
                            </span>
                          ) : run.status}
                        </span>
                        {runEnv && (
                          <span className={clsx(
                            'text-[10px] px-2 py-0.5 rounded-full border',
                            runEnv === 'production'
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : 'bg-amber-50 text-amber-600 border-amber-200'
                          )}>
                            {runEnv}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-cream-500 mt-0.5">
                        {run.triggerType} -- {new Date(run.startTime).toLocaleString()}
                        {run.status !== 'Running' && ` -- ${formatDuration(run.duration)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-cream-500">
                    {run.status !== 'Running' && (
                      <>
                        <span>{run.recordsProcessed.toLocaleString()} records</span>
                        {run.recordsFailed > 0 && (
                          <span className="text-red-500">{run.recordsFailed.toLocaleString()} failed</span>
                        )}
                      </>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-cream-100">
                    {run.status !== 'Running' && !isLive && (
                      <div className="grid grid-cols-4 gap-4 px-4 py-3 text-xs border-b border-cream-100 bg-cream-50/50">
                        <div>
                          <p className="text-cream-500">Duration</p>
                          <p className="text-cream-800 font-medium">{formatDuration(run.duration)}</p>
                        </div>
                        <div>
                          <p className="text-cream-500">Records Processed</p>
                          <p className="text-cream-800 font-medium">{run.recordsProcessed.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-cream-500">Records Failed</p>
                          <p className="text-cream-800 font-medium">{run.recordsFailed.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-cream-500">Trigger</p>
                          <p className="text-cream-800 font-medium">{run.triggerType}</p>
                        </div>
                      </div>
                    )}

                    <div ref={isLive ? logContainerRef : undefined} className="bg-gray-950 rounded-b-xl p-4 max-h-80 overflow-y-auto scrollbar-thin">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-800">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDuration: isLive && isRunning ? '1s' : '0s' }} />
                        <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                          {isLive && isRunning ? 'Live Logs' : 'Execution Logs'}
                        </span>
                      </div>
                      {logsToShow.length === 0 ? (
                        <p className="text-xs text-gray-600 font-mono">Waiting for output...</p>
                      ) : (
                        <div className="space-y-0.5">
                          {logsToShow.map((log, idx) => (
                            <LogLine key={idx} log={log} />
                          ))}
                        </div>
                      )}
                      {isLive && isRunning && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse" />
                        </div>
                      )}
                    </div>

                    {!isRunning && run.status !== 'Running' && (
                      <div className="px-4 py-2 bg-cream-50/50 rounded-b-xl flex items-center gap-2 text-xs">
                        {run.status === 'Success' ? (
                          <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-700 font-medium">Run completed successfully</span></>
                        ) : run.status === 'Failed' ? (
                          <><XCircle className="w-3.5 h-3.5 text-red-500" /><span className="text-red-700 font-medium">Run failed</span></>
                        ) : (
                          <><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /><span className="text-amber-700 font-medium">Run cancelled</span></>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {runs.length === 0 && (
            <div className="text-center py-12 text-cream-400 text-sm">No runs recorded for this pipeline yet.</div>
          )}
        </div>
      )}

      {activeTab === 'lineage' && (
        <div className="h-[450px] bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          {lineageNodes.length > 0 ? (
            <ReactFlow
              nodes={lineageNodes}
              edges={lineageEdges}
              nodeTypes={pipelineNodeTypes}
              fitView
              minZoom={0.5}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#374151" gap={20} size={1} />
              <Controls
                className="!bg-gray-800 !border-gray-700 !rounded-lg [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-gray-400 [&>button:hover]:!bg-gray-700"
              />
            </ReactFlow>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No lineage data available for this pipeline
            </div>
          )}
        </div>
      )}
    </div>
  );
}
