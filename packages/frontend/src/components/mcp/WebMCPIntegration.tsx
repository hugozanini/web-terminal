import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCatalogData } from '../../hooks/useCatalogData';

export function WebMCPIntegration() {
    const navigate = useNavigate();
    const { datasets, pipelines, pipelineRuns, costs } = useCatalogData();

    useEffect(() => {
        const modelContext = (navigator as any).modelContext;
        if (!modelContext) {
            console.warn('WebMCP not available (navigator.modelContext is undefined).');
            return;
        }

        modelContext.provideContext({
            tools: [
                {
                    name: 'view_home_dashboard',
                    description: 'Navigate to the home dashboard and view top assets. Optionally filter by asset type.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            tab: {
                                type: 'string',
                                enum: ['all', 'datasets', 'sources', 'pipelines'],
                                description: 'The category to view on the dashboard.'
                            }
                        }
                    },
                    execute: async (args: { tab?: string }) => {
                        const tab = args.tab || 'all';
                        navigate(`/?tab=${tab}`);
                        return {
                            content: [{ type: 'text', text: `Navigated to Home Dashboard with tab=${tab}` }]
                        };
                    }
                },
                {
                    name: 'search_global_catalog',
                    description: 'Search across all datasets, pipelines, and sources in the catalog. Use this tool for broad discovery. IMPORTANT: Extract only the core entity name for the query. Do NOT include words like "dataset", "pipeline", or "table" in the query string.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'The core search term. Example: If user asks for "Farm Origins dataset", the query must be strictly "Farm Origins".' },
                            type: { type: 'string', enum: ['all', 'datasets', 'sources', 'pipelines'], description: 'Filter by asset type.' }
                        },
                        required: ['query']
                    },
                    execute: async (args: { query: string; type?: string }) => {
                        const tab = args.type || 'all';
                        navigate(`/search?q=${encodeURIComponent(args.query)}&tab=${tab}`);

                        const queryLower = args.query.toLowerCase();
                        const matchingDatasets = datasets
                            .filter(d => d.displayName.toLowerCase().includes(queryLower) || d.name.toLowerCase().includes(queryLower))
                            .map(d => ({ id: d.id, name: d.displayName, type: 'dataset' }));

                        const matchingPipelines = pipelines
                            .filter(p => p.displayName.toLowerCase().includes(queryLower) || p.name.toLowerCase().includes(queryLower))
                            .map(p => ({ id: p.id, name: p.displayName, type: 'pipeline' }));

                        const isEmpty = matchingDatasets.length === 0 && matchingPipelines.length === 0;
                        let text = `Searching for "${args.query}" with tab=${tab}.\n\nResults:\nDatasets: ${JSON.stringify(matchingDatasets)}\nPipelines: ${JSON.stringify(matchingPipelines)}`;
                        if (isEmpty) {
                            text += `\n\nNo records found. Please retry this tool up to 2 times with semantic variations of your query based on the context of the app.`;
                        }

                        return { content: [{ type: 'text', text }] };
                    }
                },
                {
                    name: 'filter_datasets',
                    description: 'Filter the datasets list by advanced parameters like types, tags, or search string.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'The search term for the dataset name. Strip out extraneous words like "dataset" or "table". Example for "revenue dataset": "revenue".' },
                            types: {
                                type: 'array',
                                items: { type: 'string', enum: ['Table', 'View', 'Materialized View', 'External Table'] },
                                description: 'Filter by dataset types.'
                            },
                            tags: { type: 'array', items: { type: 'string' } },
                            sortKey: { type: 'string', enum: ['quality', 'updated', 'name', 'size'] },
                            page: { type: 'number' }
                        }
                    },
                    execute: async (args: any) => {
                        const params = new URLSearchParams();
                        let filtered = datasets;

                        if (args.query) {
                            params.set('q', args.query);
                            const q = args.query.toLowerCase();
                            filtered = filtered.filter(d => d.displayName.toLowerCase().includes(q) || d.name.toLowerCase().includes(q));
                        }
                        if (args.types && args.types.length > 0) {
                            args.types.forEach((t: string) => params.append('type', t));
                            filtered = filtered.filter(d => args.types.includes(d.type));
                        }
                        if (args.tags) args.tags.forEach((t: string) => params.append('tag', t));
                        if (args.sortKey) params.set('sort', args.sortKey);
                        if (args.page) params.set('page', String(args.page));
                        navigate(`/datasets?${params.toString()}`);

                        const summary = filtered.map(d => ({ id: d.id, name: d.displayName, type: d.type, owner: d.owner }));
                        let text = `Navigated to datasets with filters.\nFound ${summary.length} datasets. Results (up to 5): ${JSON.stringify(summary.slice(0, 5))}`;
                        if (summary.length === 0) {
                            text += `\n\nNo records found. Please retry this tool up to 2 times with semantic variations of your query or filters based on the context of the app.`;
                        }

                        return { content: [{ type: 'text', text }] };
                    }
                },
                {
                    name: 'view_dataset_details',
                    description: 'View specific details of a dataset by navigating directly to a specific tab (overview, data, quality, lineage, pipelines, costs).',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', description: 'The dataset ID (e.g. ds-1)' },
                            tab: { type: 'string', enum: ['overview', 'data', 'quality', 'lineage', 'pipelines', 'costs'] }
                        },
                        required: ['id', 'tab']
                    },
                    execute: async (args: { id: string; tab: string }) => {
                        const d = datasets.find(x => x.id === args.id);
                        if (!d) return { content: [{ type: 'text', text: `Dataset ${args.id} not found.` }] };
                        navigate(`/datasets/${args.id}?tab=${args.tab}`);

                        let info = '';
                        if (args.tab === 'overview') {
                            info = JSON.stringify({
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
                                    tags: d.tags
                                },
                                metrics: {
                                    columnsCount: d.columns,
                                    rowsCount: d.rows,
                                    sizeBytes: d.sizeBytes
                                },
                                schema: d.fields
                            }, null, 2);
                        }
                        else if (args.tab === 'data') info = JSON.stringify(d.sampleData, null, 2);
                        else if (args.tab === 'quality') info = JSON.stringify(d.qualityDashboard, null, 2);

                        return { content: [{ type: 'text', text: `Navigated to Dataset ${args.id} tab ${args.tab}.\nPage Content Context:\n${info}` }] };
                    }
                },
                {
                    name: 'filter_pipelines',
                    description: 'Filter the pipelines list by advanced parameters like statuses, engines.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'The search term for the pipeline name. Strip out extraneous words like "pipeline" or "job". Example: "ETL pipeline" -> "ETL".' },
                            types: {
                                type: 'array',
                                items: { type: 'string', enum: ['Ingestion', 'Transformation', 'Quality Check', 'Export', 'Aggregation'] },
                                description: 'Filter by pipeline type. Use this when the user asks for a specific category of pipeline (e.g., Ingestion pipeline).'
                            },
                            statuses: {
                                type: 'array',
                                items: { type: 'string', enum: ['Success', 'Failed', 'Running', 'Cancelled', 'Never'] },
                                description: 'Filter by the last run status.'
                            },
                            engines: {
                                type: 'array',
                                items: { type: 'string', enum: ['Fivetran', 'Kafka Connect', 'Airflow', 'dbt', 'Spark', 'Great Expectations'] },
                                description: 'Filter by the execution engine.'
                            },
                            scheduleFilter: { type: 'array', items: { type: 'string' } },
                            sortKey: { type: 'string', enum: ['name', 'lastRun', 'runs', 'duration'] },
                            page: { type: 'number' }
                        }
                    },
                    execute: async (args: any) => {
                        const params = new URLSearchParams();
                        let filtered = pipelines;

                        if (args.query) {
                            params.set('q', args.query);
                            const q = args.query.toLowerCase();
                            filtered = filtered.filter(p => p.displayName.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
                        }
                        if (args.types && args.types.length > 0) {
                            args.types.forEach((t: string) => params.append('type', t));
                            filtered = filtered.filter(p => args.types.includes(p.type));
                        }
                        if (args.statuses && args.statuses.length > 0) {
                            args.statuses.forEach((t: string) => params.append('status', t));
                            filtered = filtered.filter(p => args.statuses.includes(p.lastRunStatus));
                        }
                        if (args.engines && args.engines.length > 0) {
                            args.engines.forEach((t: string) => params.append('engine', t));
                            filtered = filtered.filter(p => args.engines.includes(p.engine));
                        }
                        if (args.scheduleFilter) args.scheduleFilter.forEach((t: string) => params.append('schedule', t));
                        if (args.sortKey) params.set('sort', args.sortKey);
                        if (args.page) params.set('page', String(args.page));
                        navigate(`/pipelines?${params.toString()}`);

                        const summary = filtered.map(p => ({ id: p.id, name: p.displayName, type: p.type, status: p.lastRunStatus, engine: p.engine }));
                        let text = `Navigated to Pipelines list with filtered view.\nFound ${summary.length} pipelines. Results (up to 5): ${JSON.stringify(summary.slice(0, 5))}`;
                        if (summary.length === 0) {
                            text += `\n\nNo records found. Please retry this tool up to 2 times with semantic variations of your query or filters based on the context of the app.`;
                        }

                        return { content: [{ type: 'text', text }] };
                    }
                },
                {
                    name: 'view_pipeline_details',
                    description: 'View specific details of a pipeline by navigating directly to a tab (overview, runs, lineage). If you need to summarize logs, you must first get the runId from the "runs" tab using this tool, and then immediately call view_pipeline_run_logs.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            tab: { type: 'string', enum: ['overview', 'runs', 'lineage'] }
                        },
                        required: ['id', 'tab']
                    },
                    execute: async (args: { id: string; tab: string }) => {
                        const p = pipelines.find(x => x.id === args.id);
                        if (!p) return { content: [{ type: 'text', text: `Pipeline ${args.id} not found.` }] };
                        navigate(`/pipelines/${args.id}?tab=${args.tab}`);

                        let info = '';
                        if (args.tab === 'overview') {
                            info = JSON.stringify({
                                name: p.name,
                                displayName: p.displayName,
                                description: p.description,
                                type: p.type,
                                owner: p.owner,
                                schedule: p.schedule,
                                clusterDetails: { engine: p.engine, cluster: p.cluster },
                                relationships: { inputs: p.inputDatasets, outputs: p.outputDatasets },
                                performance: { lastRunStatus: p.lastRunStatus, avgDuration: p.avgDuration, totalRuns: p.totalRuns },
                                tags: p.tags
                            }, null, 2);
                        } else if (args.tab === 'runs') {
                            const runsList = pipelineRuns
                                .filter(r => r.pipelineId === args.id)
                                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
                            info = JSON.stringify(runsList.map(r => ({
                                id: r.id,
                                runNumber: r.runNumber,
                                status: r.status,
                                startTime: r.startTime,
                                duration: r.duration,
                                recordsProcessed: r.recordsProcessed,
                                recordsFailed: r.recordsFailed
                            })), null, 2);
                        } else if (args.tab === 'lineage') {
                            info = JSON.stringify({ inputDatasets: p.inputDatasets, outputDatasets: p.outputDatasets }, null, 2);
                        }

                        return { content: [{ type: 'text', text: `Navigated to Pipeline ${args.id} tab ${args.tab}.\nPage Content Context:\n${info}` }] };
                    }
                },
                {
                    name: 'view_pipeline_run_logs',
                    description: 'View granular logs of a specific pipeline run execution. Use this tool autonomously to fetch logs for summarization or analysis without asking the user for permission. If the user asks you to summarize a failure, you MUST use this tool to read the logs into your context before responding.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            pipelineId: { type: 'string' },
                            runId: { type: 'string' }
                        },
                        required: ['pipelineId', 'runId']
                    },
                    execute: async (args: { pipelineId: string; runId: string }) => {
                        navigate(`/pipelines/${args.pipelineId}?tab=runs&run=${args.runId}`);
                        const runs = pipelineRuns.filter(r => r.pipelineId === args.pipelineId && r.id === args.runId);
                        return { content: [{ type: 'text', text: `Navigated to logs for run ${args.runId}.\nLogs context:\n${JSON.stringify(runs.map(r => r.logs), null, 2)}` }] };
                    }
                },
                {
                    name: 'trigger_pipeline_execution',
                    description: 'Trigger a new pipeline run on either staging or production clusters.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            pipelineId: { type: 'string' },
                            environment: { type: 'string', enum: ['production', 'staging'] }
                        },
                        required: ['pipelineId', 'environment']
                    },
                    execute: async (args: { pipelineId: string; environment: string }) => {
                        navigate(`/pipelines/${args.pipelineId}?tab=runs`);
                        return { content: [{ type: 'text', text: `Navigated to the Runs tab for pipeline ${args.pipelineId}. You MUST interact with the actual DOM tool "Run Pipeline" button to actually trigger it. It cannot be headless.` }] };
                    }
                },
                {
                    name: 'analyze_infrastructure_costs',
                    description: 'View the data platform infrastructure costs with advanced date/category slicing. Use this tool autonomously to fetch costs and summarize them for the user without asking for permission.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            dateRange: { type: 'string', enum: ['7', '15', '30', '60', '90'] },
                            category: {
                                type: 'string',
                                enum: ['Storage', 'Compute', 'Query', 'Transfer', 'Licensing', 'Infrastructure']
                            },
                            entityType: { type: 'string' },
                            search: { type: 'string', description: 'Search term for specific infrastructure components. Do not include extraneous words.' }
                        }
                    },
                    execute: async (args: any) => {
                        const params = new URLSearchParams();
                        let filteredCosts = costs;

                        if (args.dateRange) {
                            params.set('range', args.dateRange);
                            const cutoffDate = new Date();
                            cutoffDate.setDate(cutoffDate.getDate() - parseInt(args.dateRange));
                            filteredCosts = filteredCosts.filter((c: any) => new Date(c.date) >= cutoffDate);
                        }
                        if (args.category) {
                            params.set('category', args.category);
                            filteredCosts = filteredCosts.filter((c: any) => c.category.toLowerCase() === args.category.toLowerCase());
                        }
                        if (args.entityType) {
                            params.set('entityType', args.entityType);
                            filteredCosts = filteredCosts.filter((c: any) => c.entityType.toLowerCase() === args.entityType.toLowerCase());
                        }
                        if (args.search) {
                            params.set('q', args.search);
                            const q = args.search.toLowerCase();
                            filteredCosts = filteredCosts.filter((c: any) =>
                                c.description.toLowerCase().includes(q) ||
                                c.subcategory.toLowerCase().includes(q) ||
                                c.category.toLowerCase().includes(q)
                            );
                        }
                        navigate(`/costs?${params.toString()}`);

                        const aggregated = filteredCosts.reduce((acc: Record<string, number>, curr: any) => {
                            acc[curr.subcategory] = (acc[curr.subcategory] || 0) + curr.amount;
                            return acc;
                        }, {});

                        const totalCost = filteredCosts.reduce((sum: number, curr: any) => sum + curr.amount, 0);

                        const summary = {
                            totalCost: totalCost.toFixed(2),
                            currency: 'USD',
                            breakdownBySubcategory: Object.entries(aggregated)
                                .map(([subcategory, amount]: [string, any]) => ({ subcategory, amount: amount.toFixed(2) }))
                                .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
                        };

                        let text = `Filtered costs with params: ${params.toString()}.\n\nCost Data Context:\n${JSON.stringify(summary, null, 2)}`;
                        if (filteredCosts.length === 0) {
                            text += `\n\nNo records found. Please retry this tool up to 2 times with semantic variations of your search query or filters based on the context of the app. Valid categories are: Storage, Compute, Query, Transfer, Licensing, Infrastructure.`;
                        }

                        return { content: [{ type: 'text', text }] };
                    }
                }
            ]
        });

        return () => {
            // Unmount logic if necessary
        };
    }, [navigate, datasets, pipelines, pipelineRuns, costs]);

    return null;
}
