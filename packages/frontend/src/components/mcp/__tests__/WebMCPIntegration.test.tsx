import { render } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebMCPIntegration } from '../WebMCPIntegration';
import { useCatalogData } from '../../../hooks/useCatalogData';

// Mock the dependencies
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../../hooks/useCatalogData', () => ({
    useCatalogData: vi.fn(),
}));

describe('WebMCPIntegration', () => {
    let mockNavigate: any;
    let modelContextMock: any;

    beforeEach(() => {
        mockNavigate = vi.fn();
        (useNavigate as any).mockReturnValue(mockNavigate);

        (useCatalogData as any).mockReturnValue({
            datasets: [{ id: 'ds-1', name: 'mock_dataset', displayName: 'Mock Dataset', type: 'dbt', owner: 'Test', schema: { fields: [] }, sampleData: [], qualityScore: 90 }],
            pipelines: [{ id: 'p-1', name: 'mock_pipeline', displayName: 'Mock Pipeline', inputDatasets: [], outputDatasets: ['ds-1'] }],
            pipelineRuns: [{ pipelineId: 'p-1', id: 'run-1', logs: [{ message: 'Test Log' }] }],
            costs: [{ id: 'c-1', category: 'Compute', subcategory: 'Snowflake Warehouse Credits', entityType: 'Pipeline', entityId: 'p-1', amount: 150.50, currency: 'USD', date: new Date().toISOString(), description: 'Compute cost' }],
        });

        modelContextMock = {
            provideContext: vi.fn()
        };
        (global.navigator as any).modelContext = modelContextMock;
    });

    afterEach(() => {
        vi.clearAllMocks();
        delete (global.navigator as any).modelContext;
    });

    it('handles missing modelContext safely', () => {
        delete (global.navigator as any).modelContext;
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        render(
            <MemoryRouter>
                <WebMCPIntegration />
            </MemoryRouter>
        );

        expect(consoleSpy).toHaveBeenCalledWith('WebMCP not available (navigator.modelContext is undefined).');
        consoleSpy.mockRestore();
    });

    it('registers 9 tools when mounted', () => {
        render(
            <MemoryRouter>
                <WebMCPIntegration />
            </MemoryRouter>
        );

        expect(modelContextMock.provideContext).toHaveBeenCalledTimes(1);
        const tools = modelContextMock.provideContext.mock.calls[0][0].tools;
        expect(tools).toHaveLength(9);
    });

    describe('Tool Execution', () => {
        // Helper to get a registered tool by name
        const getTool = (name: string) => {
            render(
                <MemoryRouter>
                    <WebMCPIntegration />
                </MemoryRouter>
            );
            const tools = modelContextMock.provideContext.mock.calls[0][0].tools;
            return tools.find((t: any) => t.name === name);
        };

        it('view_home_dashboard navigates correctly', async () => {
            const tool = getTool('view_home_dashboard');
            const result = await tool.execute({ tab: 'datasets' });

            expect(mockNavigate).toHaveBeenCalledWith('/?tab=datasets');
            expect(result.content[0].text).toContain('datasets');
        });

        it('search_global_catalog navigates correctly', async () => {
            const tool = getTool('search_global_catalog');
            await tool.execute({ query: 'test query', type: 'sources' });

            expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20query&tab=sources');
        });

        it('filter_datasets pushes exact searchParams', async () => {
            const tool = getTool('filter_datasets');
            await tool.execute({ query: 'sales', types: ['dbt', 'sql'], sortKey: 'updated', page: 2 });

            expect(mockNavigate).toHaveBeenCalledWith('/datasets?q=sales&type=dbt&type=sql&sort=updated&page=2');
        });

        it('view_dataset_details paths correctly', async () => {
            const tool = getTool('view_dataset_details');
            await tool.execute({ id: 'ds-1', tab: 'costs', dateRange: '30' });

            expect(mockNavigate).toHaveBeenCalledWith('/datasets/ds-1?tab=costs&dateRange=30');
        });

        it('view_pipeline_details paths correctly for costs', async () => {
            const tool = getTool('view_pipeline_details');
            const result = await tool.execute({ id: 'p-1', tab: 'costs', dateRange: '7' });

            expect(mockNavigate).toHaveBeenCalledWith('/pipelines/p-1?tab=costs&dateRange=7');
            expect(result.content[0].text).toContain('producedDatasets');
            expect(result.content[0].text).toContain('150.5');
        });

        it('view_pipeline_run_logs retrieves logs', async () => {
            const tool = getTool('view_pipeline_run_logs');
            const result = await tool.execute({ pipelineId: 'p-1', runId: 'run-1' });

            expect(mockNavigate).toHaveBeenCalledWith('/pipelines/p-1?tab=runs&run=run-1');
            expect(result.content[0].text).toContain('Test Log');
        });

        it('analyze_infrastructure_costs navigates and computes aggregation correctly', async () => {
            const tool = getTool('analyze_infrastructure_costs');
            const result = await tool.execute({ dateRange: '30', search: 'compute' });

            expect(mockNavigate).toHaveBeenCalledWith('/costs?range=30&q=compute');
            expect(result.content[0].text).toContain('150.50');
            expect(result.content[0].text).toContain('Snowflake');
        });
    });
});
