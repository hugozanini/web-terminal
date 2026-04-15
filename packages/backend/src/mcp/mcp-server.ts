import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { bridgeManager } from './bridge-handler.js';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
  id?: string | number;
}

// ------------------------------------------------------------------
// SSE session management
// Each GET /mcp/sse opens a session; POST /mcp/messages?sessionId=<id>
// delivers client→server messages into that session.
// ------------------------------------------------------------------
const sessions = new Map<string, Response>();

function sendSSEMessage(sseRes: Response, data: unknown): void {
  sseRes.write(`event: message\ndata: ${JSON.stringify(data)}\n\n`);
}

// ------------------------------------------------------------------
// Tool manifest (mirrors the browser-side tools in useCatalogTools.ts)
// ------------------------------------------------------------------
const TOOLS = [
  {
    name: 'view_home_dashboard',
    description:
      'Navigate to the home dashboard and view top assets. Optionally filter by asset type.',
    inputSchema: {
      type: 'object',
      properties: {
        tab: {
          type: 'string',
          enum: ['all', 'datasets', 'sources', 'pipelines'],
          description: 'The category to view on the dashboard.',
        },
      },
    },
  },
  {
    name: 'search_global_catalog',
    description:
      'Search across all datasets, pipelines, and sources in the catalog. ' +
      'IMPORTANT: Extract only the core entity name — do NOT include words like "dataset", "pipeline", or "table". ' +
      'Use partial strings (e.g. "farm" not "farm_origins_dataset") if exact searches fail.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Core search term. Example: "Farm Origins" not "Farm Origins dataset".',
        },
        type: {
          type: 'string',
          enum: ['all', 'datasets', 'sources', 'pipelines'],
          description: 'Filter by asset type.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'filter_datasets',
    description: 'Filter the datasets list by types, tags, or search string.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term for the dataset name. Strip extraneous words; use partial chunks.',
        },
        types: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['Table', 'View', 'Materialized View', 'External Table'],
          },
          description: 'Filter by dataset types.',
        },
        tags: { type: 'array', items: { type: 'string' } },
        sortKey: { type: 'string', enum: ['quality', 'updated', 'name', 'size'] },
        page: { type: 'number' },
      },
    },
  },
  {
    name: 'view_dataset_details',
    description:
      'View details of a dataset by tab. ' +
      'Use "pipelines" to see executions, "costs" to see cost trends.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Dataset ID (e.g. ds-1).' },
        tab: {
          type: 'string',
          enum: ['overview', 'data', 'quality', 'lineage', 'pipelines', 'costs'],
        },
        dateRange: {
          type: 'string',
          enum: ['7', '30', '90'],
          description: 'For the costs tab: number of days of history.',
        },
      },
      required: ['id', 'tab'],
    },
  },
  {
    name: 'filter_pipelines',
    description: 'Filter the pipelines list by statuses, engines, or search.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term for pipeline name. Use partial chunks if exact match fails.',
        },
        types: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['Ingestion', 'Transformation', 'Quality Check', 'Export', 'Aggregation'],
          },
          description: 'Filter by pipeline type.',
        },
        statuses: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['Success', 'Failed', 'Running', 'Cancelled', 'Never'],
          },
          description: 'Filter by last run status.',
        },
        engines: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['Fivetran', 'Kafka Connect', 'Airflow', 'dbt', 'Spark', 'Great Expectations'],
          },
          description: 'Filter by execution engine.',
        },
        scheduleFilter: { type: 'array', items: { type: 'string' } },
        sortKey: { type: 'string', enum: ['name', 'lastRun', 'runs', 'duration'] },
        page: { type: 'number' },
      },
    },
  },
  {
    name: 'view_pipeline_details',
    description:
      'View details of a pipeline by tab. ' +
      'Use "runs" to see execution history; call view_pipeline_run_logs for logs. ' +
      'Use "costs" to see infrastructure spend.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Pipeline ID.' },
        tab: { type: 'string', enum: ['overview', 'runs', 'lineage', 'costs'] },
        dateRange: {
          type: 'string',
          enum: ['7', '30', '90'],
          description: 'For the costs tab: number of days of history.',
        },
      },
      required: ['id', 'tab'],
    },
  },
  {
    name: 'view_pipeline_run_logs',
    description:
      'View granular logs of a specific pipeline run. ' +
      'Get the runId first from view_pipeline_details (tab=runs), then call this tool.',
    inputSchema: {
      type: 'object',
      properties: {
        pipelineId: { type: 'string' },
        runId: { type: 'string' },
      },
      required: ['pipelineId', 'runId'],
    },
  },
  {
    name: 'trigger_pipeline_execution',
    description:
      'Trigger a new pipeline run on staging or production. ' +
      'Returns the runId of the new run. ' +
      'After triggering, wait ~10 seconds then call view_pipeline_details with tab=runs to confirm the status.',
    inputSchema: {
      type: 'object',
      properties: {
        pipelineId: { type: 'string' },
        environment: { type: 'string', enum: ['production', 'staging'] },
      },
      required: ['pipelineId', 'environment'],
    },
  },
  {
    name: 'analyze_infrastructure_costs',
    description:
      'View and analyze data platform infrastructure costs with date/category filters. ' +
      'Call autonomously to fetch and summarize costs without asking the user for permission.',
    inputSchema: {
      type: 'object',
      properties: {
        dateRange: { type: 'string', enum: ['7', '15', '30', '60', '90'] },
        category: {
          type: 'string',
          enum: ['Storage', 'Compute', 'Query', 'Transfer', 'Licensing', 'Infrastructure'],
        },
        entityType: { type: 'string' },
        search: {
          type: 'string',
          description: 'Search term for infrastructure components. No extraneous words.',
        },
      },
    },
  },
];

// ------------------------------------------------------------------
// SSE connection handler  GET /mcp/sse
// ------------------------------------------------------------------
export function handleSSEConnection(req: Request, res: Response): void {
  const sessionId = randomUUID();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sessions.set(sessionId, res);
  console.log(`MCP SSE: session opened (${sessionId})`);

  // Tell the client where to POST messages
  const host = req.get('host') ?? 'localhost:3001';
  const endpointUrl = `${req.protocol}://${host}/mcp/messages?sessionId=${sessionId}`;
  res.write(`event: endpoint\ndata: ${endpointUrl}\n\n`);

  // Keep-alive heartbeat
  const keepAlive = setInterval(() => {
    res.write(': ping\n\n');
  }, 15_000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sessions.delete(sessionId);
    console.log(`MCP SSE: session closed (${sessionId})`);
  });
}

// ------------------------------------------------------------------
// Message handler  POST /mcp/messages?sessionId=<id>
// ------------------------------------------------------------------
export async function handleMCPMessage(req: Request, res: Response): Promise<void> {
  const sessionId = req.query['sessionId'] as string;
  const sseRes = sessions.get(sessionId);

  if (!sseRes) {
    res.status(404).json({ error: 'MCP session not found or expired' });
    return;
  }

  // Acknowledge receipt immediately so the client doesn't time out
  res.status(202).end();

  const { method, params, id } = req.body as JsonRpcRequest;

  if (method === 'initialize') {
    sendSSEMessage(sseRes, {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'data-portal', version: '1.0.0' },
      },
    });
  } else if (method === 'notifications/initialized') {
    // No response required for notifications
  } else if (method === 'tools/list') {
    sendSSEMessage(sseRes, {
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS },
    });
  } else if (method === 'tools/call') {
    const callParams = params as { name: string; arguments?: Record<string, unknown> };
    const { name, arguments: args = {} } = callParams;

    try {
      const result = await bridgeManager.callTool(name, args);
      sendSSEMessage(sseRes, { jsonrpc: '2.0', id, result });
    } catch (err) {
      sendSSEMessage(sseRes, {
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: (err as Error).message },
      });
    }
  } else if (id !== undefined) {
    sendSSEMessage(sseRes, {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  }
}
