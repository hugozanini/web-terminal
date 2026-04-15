import { useNavigate } from 'react-router-dom';
import { useCatalogData } from '../../hooks/useCatalogData';
import { useCatalogStore } from '../../store/catalog-store';

// ------------------------------------------------------------------
// Shared tool execution logic consumed by both WebMCPIntegration
// (claude.ai) and MCPBridgeClient (local CLI via backend bridge).
// ------------------------------------------------------------------

export type ToolResult = { content: Array<{ type: string; text: string }> };

function text(str: string): ToolResult {
  return { content: [{ type: 'text', text: str }] };
}

export function useCatalogTools() {
  const navigate = useNavigate();
  const { datasets, pipelines, pipelineRuns, costs } = useCatalogData();
  const startMockPipelineRun = useCatalogStore((s) => s.startMockPipelineRun);

  const executeTool = async (
    name: string,
    args: Record<string, unknown>,
  ): Promise<ToolResult> => {
    switch (name) {
      // ----------------------------------------------------------------
      case 'view_home_dashboard': {
        const tab = (args['tab'] as string | undefined) ?? 'all';
        navigate(`/?tab=${tab}`);
        return text(`Navigated to Home Dashboard with tab=${tab}`);
      }

      // ----------------------------------------------------------------
      case 'search_global_catalog': {
        const query = args['query'] as string;
        const tab = (args['type'] as string | undefined) ?? 'all';
        navigate(`/search?q=${encodeURIComponent(query)}&tab=${tab}`);

        const q = query.toLowerCase();
        const matchingDatasets = datasets
          .filter(
            (d) =>
              d.displayName.toLowerCase().includes(q) ||
              d.name.toLowerCase().includes(q),
          )
          .map((d) => ({ id: d.id, name: d.displayName, type: 'dataset' }));
        const matchingPipelines = pipelines
          .filter(
            (p) =>
              p.displayName.toLowerCase().includes(q) ||
              p.name.toLowerCase().includes(q),
          )
          .map((p) => ({ id: p.id, name: p.displayName, type: 'pipeline' }));

        const isEmpty = matchingDatasets.length === 0 && matchingPipelines.length === 0;
        let msg =
          `Searching for "${query}" with tab=${tab}.\n\n` +
          `Results:\nDatasets: ${JSON.stringify(matchingDatasets)}\n` +
          `Pipelines: ${JSON.stringify(matchingPipelines)}`;
        if (isEmpty) {
          msg +=
            '\n\nNo records found. You MUST autonomously retry this tool up to 2 times ' +
            'with semantic variations of your query.';
        }
        return text(msg);
      }

      // ----------------------------------------------------------------
      case 'filter_datasets': {
        const a = args as {
          query?: string;
          types?: string[];
          tags?: string[];
          sortKey?: string;
          page?: number;
        };
        const params = new URLSearchParams();
        let filtered = datasets;

        if (a.query) {
          params.set('q', a.query);
          const q = a.query.toLowerCase();
          filtered = filtered.filter(
            (d) =>
              d.displayName.toLowerCase().includes(q) ||
              d.name.toLowerCase().includes(q),
          );
        }
        if (a.types && a.types.length > 0) {
          a.types.forEach((t) => params.append('type', t));
          filtered = filtered.filter((d) => a.types!.includes(d.type));
        }
        if (a.tags) a.tags.forEach((t) => params.append('tag', t));
        if (a.sortKey) params.set('sort', a.sortKey);
        if (a.page) params.set('page', String(a.page));
        navigate(`/datasets?${params.toString()}`);

        const summary = filtered.map((d) => ({
          id: d.id,
          name: d.displayName,
          type: d.type,
          owner: d.owner,
        }));
        let msg =
          `Navigated to datasets with filters.\n` +
          `Found ${summary.length} datasets. Results (up to 5): ${JSON.stringify(summary.slice(0, 5))}`;
        if (summary.length === 0) {
          msg +=
            '\n\nNo records found. You MUST autonomously retry this tool up to 2 times ' +
            'with semantic variations of your query. If still not found, try filter_pipelines ' +
            'or search_global_catalog.';
        }
        return text(msg);
      }

      // ----------------------------------------------------------------
      case 'view_dataset_details': {
        const { id, tab, dateRange } = args as {
          id: string;
          tab: string;
          dateRange?: string;
        };
        const d = datasets.find((x) => x.id === id);
        if (!d) return text(`Dataset ${id} not found.`);

        const params = new URLSearchParams({ tab });
        if (tab === 'costs') params.set('dateRange', dateRange ?? '90');
        navigate(`/datasets/${id}?${params.toString()}`);

        let info = '';
        if (tab === 'overview') {
          info = JSON.stringify(
            {
              metadata: {
                database: d.schema.database,
                schema: d.schema.schema,
                name: d.name,
                description: d.description,
                type: d.type,
                owner: d.owner,
                criticality: d.criticality,
                freshness: d.freshness,
                source: d.source,
                tags: d.tags,
              },
              metrics: { columnsCount: d.columns, rowsCount: d.rows, sizeBytes: d.sizeBytes },
              schema: d.fields,
            },
            null,
            2,
          );
        } else if (tab === 'data') {
          info = JSON.stringify(d.sampleData, null, 2);
        } else if (tab === 'quality') {
          info = JSON.stringify(d.qualityDashboard, null, 2);
        } else if (tab === 'costs') {
          const days = parseInt(dateRange ?? '90', 10);
          const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
          const datasetCosts = costs
            .filter(
              (c) =>
                c.entityId === d.id &&
                c.entityType === 'Dataset' &&
                new Date(c.date).getTime() >= cutoff,
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const summary = {
            storageSummary: datasetCosts
              .filter((c) => c.category === 'Storage')
              .reduce((acc, c) => acc + c.amount, 0),
            computeSummary: datasetCosts
              .filter((c) => c.category === 'Compute')
              .reduce((acc, c) => acc + c.amount, 0),
            totalCost: datasetCosts.reduce((acc, c) => acc + c.amount, 0),
          };
          info = JSON.stringify(
            {
              dateRangeDays: days,
              summary,
              history: datasetCosts.map((c) => ({
                date: c.date,
                category: c.category,
                subcategory: c.subcategory,
                amount: c.amount,
                description: c.description,
              })),
            },
            null,
            2,
          );
        } else if (tab === 'pipelines') {
          const related = pipelineRuns
            .filter((r) => r.inputDatasets.includes(d.id) || r.outputDatasets.includes(d.id))
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
          info = JSON.stringify(
            related.map((r) => ({
              runId: r.id,
              pipelineId: r.pipelineId,
              pipelineName: r.pipelineName,
              status: r.status,
              startTime: r.startTime,
              duration: r.duration,
            })),
            null,
            2,
          );
        }

        let msg = `Navigated to Dataset ${id} tab=${tab}.\nPage Content Context:\n${info}`;
        if (!info || info === '[]') msg += '\n\nNo records found in this tab.';
        return text(msg);
      }

      // ----------------------------------------------------------------
      case 'filter_pipelines': {
        const a = args as {
          query?: string;
          types?: string[];
          statuses?: string[];
          engines?: string[];
          scheduleFilter?: string[];
          sortKey?: string;
          page?: number;
        };
        const params = new URLSearchParams();
        let filtered = pipelines;

        if (a.query) {
          params.set('q', a.query);
          const q = a.query.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.displayName.toLowerCase().includes(q) ||
              p.name.toLowerCase().includes(q),
          );
        }
        if (a.types && a.types.length > 0) {
          a.types.forEach((t) => params.append('type', t));
          filtered = filtered.filter((p) => a.types!.includes(p.type));
        }
        if (a.statuses && a.statuses.length > 0) {
          a.statuses.forEach((s) => params.append('status', s));
          filtered = filtered.filter((p) => a.statuses!.includes(p.lastRunStatus));
        }
        if (a.engines && a.engines.length > 0) {
          a.engines.forEach((e) => params.append('engine', e));
          filtered = filtered.filter((p) => a.engines!.includes(p.engine));
        }
        if (a.scheduleFilter) a.scheduleFilter.forEach((s) => params.append('schedule', s));
        if (a.sortKey) params.set('sort', a.sortKey);
        if (a.page) params.set('page', String(a.page));
        navigate(`/pipelines?${params.toString()}`);

        const summary = filtered.map((p) => ({
          id: p.id,
          name: p.displayName,
          type: p.type,
          status: p.lastRunStatus,
          engine: p.engine,
        }));
        let msg =
          `Navigated to Pipelines list with filtered view.\n` +
          `Found ${summary.length} pipelines. Results (up to 5): ${JSON.stringify(summary.slice(0, 5))}`;
        if (summary.length === 0) {
          msg +=
            '\n\nNo records found. You MUST autonomously retry this tool up to 2 times ' +
            'with semantic variations of your query. If searching for dataset executions, ' +
            'use filter_datasets or search_global_catalog instead.';
        }
        return text(msg);
      }

      // ----------------------------------------------------------------
      case 'view_pipeline_details': {
        const { id, tab, dateRange } = args as {
          id: string;
          tab: string;
          dateRange?: string;
        };
        const p = pipelines.find((x) => x.id === id);
        if (!p) return text(`Pipeline ${id} not found.`);

        const params = new URLSearchParams({ tab });
        if (tab === 'costs') params.set('dateRange', dateRange ?? '90');
        navigate(`/pipelines/${id}?${params.toString()}`);

        let info = '';
        if (tab === 'overview') {
          info = JSON.stringify(
            {
              name: p.name,
              displayName: p.displayName,
              description: p.description,
              type: p.type,
              owner: p.owner,
              schedule: p.schedule,
              clusterDetails: { engine: p.engine, cluster: p.cluster },
              relationships: { inputs: p.inputDatasets, outputs: p.outputDatasets },
              performance: {
                lastRunStatus: p.lastRunStatus,
                avgDuration: p.avgDuration,
                totalRuns: p.totalRuns,
              },
              tags: p.tags,
            },
            null,
            2,
          );
        } else if (tab === 'runs') {
          const runs = pipelineRuns
            .filter((r) => r.pipelineId === id)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
          info = JSON.stringify(
            runs.map((r) => ({
              id: r.id,
              runNumber: r.runNumber,
              status: r.status,
              startTime: r.startTime,
              duration: r.duration,
              recordsProcessed: r.recordsProcessed,
              recordsFailed: r.recordsFailed,
            })),
            null,
            2,
          );
        } else if (tab === 'lineage') {
          info = JSON.stringify(
            { inputDatasets: p.inputDatasets, outputDatasets: p.outputDatasets },
            null,
            2,
          );
        } else if (tab === 'costs') {
          const days = parseInt(dateRange ?? '90', 10);
          const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
          const pipelineCosts = costs
            .filter(
              (c) =>
                c.entityId === p.id &&
                c.entityType === 'Pipeline' &&
                new Date(c.date).getTime() >= cutoff,
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const summary = {
            storageSummary: pipelineCosts
              .filter((c) => c.category === 'Storage')
              .reduce((acc, c) => acc + c.amount, 0),
            computeSummary: pipelineCosts
              .filter((c) => c.category === 'Compute')
              .reduce((acc, c) => acc + c.amount, 0),
            totalCost: pipelineCosts.reduce((acc, c) => acc + c.amount, 0),
          };
          const outputDs = datasets
            .filter((d) => p.outputDatasets.includes(d.id))
            .map((d) => ({ id: d.id, name: d.displayName, type: d.type }));
          info = JSON.stringify(
            {
              dateRangeDays: days,
              summary,
              producedDatasets: outputDs,
              history: pipelineCosts.map((c) => ({
                date: c.date,
                category: c.category,
                subcategory: c.subcategory,
                amount: c.amount,
                description: c.description,
              })),
            },
            null,
            2,
          );
        }

        return text(`Navigated to Pipeline ${id} tab=${tab}.\nPage Content Context:\n${info}`);
      }

      // ----------------------------------------------------------------
      case 'view_pipeline_run_logs': {
        const { pipelineId, runId } = args as { pipelineId: string; runId: string };
        navigate(`/pipelines/${pipelineId}?tab=runs&run=${runId}`);
        const runs = pipelineRuns.filter(
          (r) => r.pipelineId === pipelineId && r.id === runId,
        );
        return text(
          `Navigated to logs for run ${runId}.\n` +
            `Logs context:\n${JSON.stringify(
              runs.map((r) => r.logs),
              null,
              2,
            )}`,
        );
      }

      // ----------------------------------------------------------------
      case 'trigger_pipeline_execution': {
        const { pipelineId, environment } = args as {
          pipelineId: string;
          environment: string;
        };
        const pipeline = pipelines.find((p) => p.id === pipelineId);
        if (!pipeline) return text(`Pipeline ${pipelineId} not found.`);

        const runId = startMockPipelineRun(pipelineId, environment);
        navigate(`/pipelines/${pipelineId}?tab=runs`);
        return text(
          `Triggered pipeline "${pipeline.displayName}" on ${environment}.\n` +
            `New run ID: ${runId} — status is now Running.\n` +
            `Wait ~10 seconds, then call view_pipeline_details with tab=runs to confirm completion.`,
        );
      }

      // ----------------------------------------------------------------
      case 'analyze_infrastructure_costs': {
        const a = args as {
          dateRange?: string;
          category?: string;
          entityType?: string;
          search?: string;
        };
        const params = new URLSearchParams();
        let filtered = costs;

        if (a.dateRange) {
          params.set('range', a.dateRange);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - parseInt(a.dateRange, 10));
          filtered = filtered.filter((c) => new Date(c.date) >= cutoffDate);
        }
        if (a.category) {
          params.set('category', a.category);
          filtered = filtered.filter(
            (c) => c.category.toLowerCase() === a.category!.toLowerCase(),
          );
        }
        if (a.entityType) {
          params.set('entityType', a.entityType);
          filtered = filtered.filter(
            (c) => c.entityType.toLowerCase() === a.entityType!.toLowerCase(),
          );
        }
        if (a.search) {
          params.set('q', a.search);
          const q = a.search.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.description.toLowerCase().includes(q) ||
              c.subcategory.toLowerCase().includes(q) ||
              c.category.toLowerCase().includes(q),
          );
        }
        navigate(`/costs?${params.toString()}`);

        const aggregated = filtered.reduce<Record<string, number>>((acc, curr) => {
          acc[curr.subcategory] = (acc[curr.subcategory] ?? 0) + curr.amount;
          return acc;
        }, {});
        const totalCost = filtered.reduce((sum, c) => sum + c.amount, 0);
        const summary = {
          totalCost: totalCost.toFixed(2),
          currency: 'USD',
          breakdownBySubcategory: Object.entries(aggregated)
            .map(([subcategory, amount]) => ({ subcategory, amount: amount.toFixed(2) }))
            .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount)),
        };

        let msg =
          `Filtered costs with params: ${params.toString()}.\n\n` +
          `Cost Data Context:\n${JSON.stringify(summary, null, 2)}`;
        if (filtered.length === 0) {
          msg +=
            '\n\nNo records found. Retry with semantic variations or different filters. ' +
            'Valid categories: Storage, Compute, Query, Transfer, Licensing, Infrastructure.';
        }
        return text(msg);
      }

      // ----------------------------------------------------------------
      default:
        return text(`Unknown tool: ${name}`);
    }
  };

  return { executeTool };
}
