import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DatasetDetail } from '../DatasetDetail';
import * as useCatalogDataModule from '../../../hooks/useCatalogData';
import { Dataset } from '../../../data/types';

vi.mock('recharts', async (importOriginal) => {
    const OriginalRecharts = await importOriginal<typeof import('recharts')>();
    return {
        ...OriginalRecharts,
        ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
        BarChart: ({ children }: any) => <div>{children}</div>,
        Bar: () => <div />,
        CartesianGrid: () => <div />,
        YAxis: () => <div />,
        XAxis: (props: any) => (
            <div data-testid="xaxis-mock">
                {props.tickFormatter ? props.tickFormatter('2026-03-01') : 'no-formatter'}
            </div>
        ),
        Tooltip: (props: any) => (
            <div data-testid="tooltip-mock">
                {props.labelFormatter ? props.labelFormatter('2026-03-01') : 'no-formatter'}
            </div>
        )
    };
});

const originalTZ = process.env.TZ;

beforeAll(() => {
    process.env.TZ = 'America/Sao_Paulo';
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    }));
});

afterAll(() => {
    process.env.TZ = originalTZ;
});

const mockDataset: Partial<Dataset> = {
    id: 'ds-123',
    name: 'mock_dataset',
    displayName: 'Mock Dataset',
    description: 'A dataset for testing',
    tags: [],
    owner: 'Testing',
    schema: { database: 'db', schema: 'public' },
    qualityScore: 95,
    freshness: { lastUpdated: new Date(), updateFrequency: 'Daily' },
    columns: 10,
    rows: 100,
    sizeBytes: 1000,
    source: 'Mock',
    criticality: 'High',
    createdAt: new Date(),
    type: 'Table',
    sampleData: [],
    fields: [],
    qualityDashboard: {
        checksFailed: 0,
        checksWarned: 0,
        healthScore: 95,
        activeChecks: 100,
        avgAlertsPerDay: 0,
        dailyChecks: [
            {
                date: '2026-03-01',
                pass: 10,
                warn: 0,
                fail: 0
            }
        ]
    }
};

describe('DatasetDetail', () => {
    beforeEach(() => {
        vi.spyOn(useCatalogDataModule, 'useCatalogData').mockReturnValue({
            datasets: [mockDataset as Dataset],
            pipelines: [],
            dataSources: [],
            lineage: [],
            pipelineRuns: [],
            costs: [],
            loading: false
        } as any);
    });

    it('renders quality checks dates in UTC without shifting backwards in negative timezones', async () => {
        render(
            <MemoryRouter initialEntries={['/datasets/ds-123?tab=quality']}>
                <Routes>
                    <Route path="/datasets/:id" element={<DatasetDetail />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Mar 1')).toBeInTheDocument();
        });

        expect(screen.queryByText('Feb 28')).not.toBeInTheDocument();
    });
});
