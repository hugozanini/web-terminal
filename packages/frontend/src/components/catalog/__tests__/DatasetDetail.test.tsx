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
    // Set explicit negative timezone to simulate Brazil/Americas offset
    // If the component uses naive local dates, it will shift 2026-03-01 backwards to Feb 28
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
                date: '2026-03-01', // This should render as "Mar 1" on the X-Axis because of the tick formatter
                pass: 10,
                warn: 0,
                fail: 0
            }
        ]
    }
};

describe('DatasetDetail - Quality Timezone UI Check', () => {
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
        // Navigate straight to the quality tab
        render(
            <MemoryRouter initialEntries={['/datasets/ds-123?tab=quality']}>
                <Routes>
                    <Route path="/datasets/:id" element={<DatasetDetail />} />
                </Routes>
            </MemoryRouter>
        );

        // Wait for the SVG to render. The ResponsiveContainer wrapper from recharts requires width/height, 
        // which normally happens automatically, but we might need to await it.
        await waitFor(() => {
            // Because 2026-03-01 is the 1st of the month, the logic: 
            // if (d.getUTCDate() === 1 || d.getUTCDate() === 15)
            // will evaluate to true and return 'Mar 1'.
            // If it incorrectly used d.getDate() in a GMT-3 zone, it would be Feb 28, and the text wouldn't be "Mar 1".
            expect(screen.getByText('Mar 1')).toBeInTheDocument();
        });

        // Explicitly verify that shifted dates like "Feb 28" are NOT in the document
        expect(screen.queryByText('Feb 28')).not.toBeInTheDocument();
    });
});
