import { useEffect, useRef } from 'react';
import { useCatalogTools } from './useCatalogTools';

// Registers data-portal tools on navigator.modelContext so they are
// available when the page is opened inside claude.ai (Web MCP API).
export function WebMCPIntegration() {
  const { executeTool } = useCatalogTools();
  const executeToolRef = useRef(executeTool);

  useEffect(() => {
    executeToolRef.current = executeTool;
  });

  useEffect(() => {
    const modelContext = (navigator as unknown as { modelContext?: { provideContext: (ctx: unknown) => void } }).modelContext;
    if (!modelContext) {
      console.warn('WebMCP not available (navigator.modelContext is undefined).');
      return;
    }

    modelContext.provideContext({
      tools: [
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
          execute: (args: Record<string, unknown>) =>
            executeToolRef.current('view_home_dashboard', args),
        },
        {
          name: 'search_global_catalog',
          description:
            'Search across all datasets, pipelines, and sources. ' +
            'IMPORTANT: Extract only the core entity name. Do NOT include words like "dataset", "pipeline", or "table".',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description:
                  'Core search term. Use partial strings if exact searches fail. ' +
                  'Example: "Farm Origins" not "Farm Origins dataset".',
              },
              type: {
                type: 'string',
                enum: ['all', 'datasets', 'sources', 'pipelines'],
                description: 'Filter by asset type.',
              },
            },
            required: ['query'],
          },
          execute: (args: Record<string, unknown>) =>
            executeToolRef.current('search_global_catalog', args),
        },
        {
          name: 'filter_datasets',
          description: 'Filter the datasets list by types, tags, or search string.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search term for dataset name. Strip extraneous words; use partial chunks.',
              },
              types: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['Table', 'View', 'Materialized View', 'External Table'],
                },
              },
              tags: { type: 'array', items: { type: 'string' } },
              sortKey: { type: 'string', enum: ['quality', 'updated', 'name', 'size'] },
              page: { type: 'number' },
            },
          },
          execute: (args: Record<string, unknown>) =>
            executeToolRef.current('filter_datasets', args),
        },
        {
          name: 'view_dataset_details',
          description:
            'View details of a dataset by tab (overview, data, quality, lineage, pipelines, costs). ' +
            'Use "pipelines" to see executions; "costs" to see cost trends.',
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
                description: 'For the costs tab: days of history.',
              },
            },
            required: ['id', 'tab'],
          },
          execute: (args: Record<string, unknown>) =>
            executeToolRef.current('view_dataset_details', args),
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
              },
              statuses: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['Success', 'Failed', 'Running', 'Cancelled', 'Never'],
                },
              },
              engines: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: [
                    'Fivetran',
                    'Kafka Connect',
                    'Airflow',
                    'dbt',
                    'Spark',
                    'Great Expectations',
                  ],
                },
              },
              scheduleFilter: { type: 'array', items: { type: 'string' } },
              sortKey: { type: 'string', enum: ['name', 'lastRun', 'runs', 'duration'] },
              page: { type: 'number' },
            },
          },
          execute: (args: Record<string, unknown>) =>
            executeToolRef.current('filter_pipelines', args),
        },
        {
          name: 'view_pipeline_details',
          description:
            'View details of a pipeline by tab (overview, runs, lineage, costs). ' +
            'Get the runId from "runs", then call view_pipeline_run_logs for logs.',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              tab: { type: 'string', enum: ['overview', 'runs', 'lineage', 'costs'] },
              dateRange: {
                type: 'string',
                enum: ['7', '30', '90'],
                description: 'For the costs tab: days of history.',
              },
            },
            required: ['id', 'tab'],
          },
          execute: (args: Record<string, unknown>) =>
            executeToolRef.current('view_pipeline_details', args),
        },
        {
          name: 'view_pipeline_run_logs',
          description:
            'View granular logs of a specific pipeline run. ' +
            'Get runId first from view_pipeline_details (tab=runs) before calling this.',
          inputSchema: {
            type: 'object',
            properties: {
              pipelineId: { type: 'string' },
              runId: { type: 'string' },
            },
            required: ['pipelineId', 'runId'],
          },
          execute: (args: Record<string, unknown>) =>
            executeToolRef.current('view_pipeline_run_logs', args),
        },
        {
          name: 'trigger_pipeline_execution',
          description:
            'Trigger a new pipeline run on staging or production. ' +
            'Returns the runId. Wait ~10 seconds then call view_pipeline_details (tab=runs) to confirm status.',
          inputSchema: {
            type: 'object',
            properties: {
              pipelineId: { type: 'string' },
              environment: { type: 'string', enum: ['production', 'staging'] },
            },
            required: ['pipelineId', 'environment'],
          },
          execute: (args: Record<string, unknown>) =>
            executeToolRef.current('trigger_pipeline_execution', args),
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
                enum: [
                  'Storage',
                  'Compute',
                  'Query',
                  'Transfer',
                  'Licensing',
                  'Infrastructure',
                ],
              },
              entityType: { type: 'string' },
              search: {
                type: 'string',
                description: 'Search term for specific infrastructure components.',
              },
            },
          },
          execute: (args: Record<string, unknown>) =>
            executeToolRef.current('analyze_infrastructure_costs', args),
        },
      ],
    });
  }, []);

  return null;
}
