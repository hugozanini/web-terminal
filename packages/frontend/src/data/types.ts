export interface Dataset {
  id: string;
  name: string;
  displayName: string;
  type: 'Table' | 'View' | 'Materialized View' | 'External Table';
  schema: {
    database: string;
    schema: string;
  };
  description: string;
  columns: number;
  rows: number;
  sizeBytes: number;
  owner: string;
  tags: string[];
  qualityScore: number;
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  freshness: {
    lastUpdated: Date;
    updateFrequency: string;
  };
  source: string;
  createdAt: Date;
  sampleData: Record<string, unknown>[];
  fields: { name: string; type: string; description: string }[];
  qualityDashboard: QualityDashboard;
}

export interface QualityDashboard {
  checksFailed: number;
  checksWarned: number;
  healthScore: number;
  activeChecks: number;
  avgAlertsPerDay: number;
  dailyChecks: { date: string; pass: number; warn: number; fail: number }[];
}

export interface DataSource {
  id: string;
  name: string;
  type: 'Database' | 'API' | 'File' | 'Stream' | 'IoT';
  system: string;
  connectionStatus: 'Connected' | 'Degraded' | 'Disconnected';
  datasetsCount: number;
  lastSync: Date;
  owner: string;
  description: string;
}

export interface Pipeline {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: 'Ingestion' | 'Transformation' | 'Quality Check' | 'Export' | 'Aggregation';
  owner: string;
  schedule: {
    enabled: boolean;
    cron: string;
    timezone: string;
    nextRun: Date;
  } | null;
  engine: string;
  cluster: string;
  inputDatasets: string[];
  outputDatasets: string[];
  tags: string[];
  createdAt: Date;
  lastRunStatus: 'Success' | 'Failed' | 'Running' | 'Cancelled' | 'Never';
  lastRunTime: Date | null;
  avgDuration: number;
  totalRuns: number;
}

export interface PipelineRunLog {
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

export interface PipelineRun {
  id: string;
  runNumber: string;
  pipelineId: string;
  pipelineName: string;
  type: 'Ingestion' | 'Transformation' | 'Quality Check' | 'Export' | 'Aggregation';
  status: 'Success' | 'Failed' | 'Running' | 'Cancelled';
  startTime: Date;
  endTime: Date;
  duration: number;
  recordsProcessed: number;
  recordsFailed: number;
  triggerType: 'Scheduled' | 'Manual' | 'Event';
  inputDatasets: string[];
  outputDatasets: string[];
  parameters: Record<string, unknown>;
  logs: PipelineRunLog[];
}

export interface LineageNode {
  id: string;
  type: 'Source' | 'Ingestion' | 'Bronze' | 'Silver' | 'Gold' | 'BI';
  name: string;
  timestamp: Date;
  location: string;
  datasetIds: string[];
  metadata: Record<string, unknown>;
  parentId?: string;
}

export interface QualityEntry {
  id: string;
  timestamp: Date;
  checkType: 'Freshness' | 'Schema' | 'Volume' | 'Accuracy' | 'Completeness';
  severity: 'Info' | 'Warning' | 'Error' | 'Critical';
  datasetId: string;
  datasetName: string;
  message: string;
  rule: string;
  result: 'Passed' | 'Failed' | 'Warning';
  metadata: Record<string, unknown>;
}

export interface CostEntry {
  id: string;
  category: 'Storage' | 'Compute' | 'Query' | 'Transfer' | 'Licensing' | 'Infrastructure';
  subcategory: string;
  entityType: 'Dataset' | 'Pipeline' | 'Source';
  entityId: string;
  amount: number;
  currency: string;
  date: Date;
  description: string;
  breakdown?: {
    item: string;
    cost: number;
  }[];
}

export interface CatalogData {
  datasets: Dataset[];
  dataSources: DataSource[];
  lineage: LineageNode[];
  pipelines: Pipeline[];
  pipelineRuns: PipelineRun[];
  qualityChecks: QualityEntry[];
  costs: CostEntry[];
}
