import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PipelineDetail } from '../PipelineDetail';
import * as useCatalogDataModule from '../../../hooks/useCatalogData';

vi.mock('recharts', async (importOriginal) => {
    const OriginalRecharts = await importOriginal<typeof import('recharts')>();
    return {
        ...OriginalRecharts,
        ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
        LineChart: ({ children }: any) => <div>{children}</div>,
        Line: () => <div />,
        CartesianGrid: () => <div />,
        YAxis: () => <div />,
        XAxis: () => <div />,
        Tooltip: () => <div />,
    };
});

// Mocking useCatalogData
const mockPipeline = {
    id: 'p-123',
    name: 'test_pipeline',
    displayName: 'Test Pipeline',
    description: 'A test pipeline',
    owner: 'Tester',
    engine: 'Airflow',
    cluster: 'prod-01',
    avgDuration: 600,
    totalRuns: 10,
    lastRunStatus: 'Success',
    inputDatasets: ['ds-in'],
    outputDatasets: ['ds-out'],
    tags: [],
};

const mockDatasets = [
    { id: 'ds-in', displayName: 'Input DS', type: 'Bronze', schema: { database: 'db', schema: 's' } },
    { id: 'ds-out', displayName: 'Output DS', type: 'Silver', schema: { database: 'db', schema: 's' } },
];

describe('PipelineDetail', () => {
    beforeAll(() => {
        global.ResizeObserver = vi.fn().mockImplementation(() => ({
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect: vi.fn(),
        }));
    });

    beforeEach(() => {
        vi.spyOn(useCatalogDataModule, 'useCatalogData').mockReturnValue({
            pipelines: [mockPipeline],
            datasets: mockDatasets,
            costs: [],
            pipelineRuns: [],
            addPipelineRun: vi.fn(),
            updatePipelineRun: vi.fn(),
            updatePipeline: vi.fn(),
        } as any);
    });

    it('renders pipeline overview correctly', () => {
        render(
            <MemoryRouter initialEntries={['/pipelines/p-123']}>
                <Routes>
                    <Route path="/pipelines/:id" element={<PipelineDetail />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Test Pipeline')).toBeInTheDocument();
        expect(screen.getByText('A test pipeline')).toBeInTheDocument();
        expect(screen.getByText('Airflow / prod-01')).toBeInTheDocument();
    });
});
