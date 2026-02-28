import { faker } from '@faker-js/faker';
import type { PipelineRun } from '../types';

const PIPELINE_NAMES = [
  'ingest_farm_data', 'ingest_erp_financials', 'ingest_crm_orders', 'ingest_iot_sensors',
  'ingest_shipping_events', 'ingest_weather_data', 'ingest_market_prices',
  'transform_inventory_silver', 'transform_orders_silver', 'transform_quality_silver',
  'build_farm_origins_gold', 'build_shipment_analytics', 'build_pricing_cube',
  'build_demand_forecast', 'build_customer_360',
  'quality_check_daily', 'quality_check_freshness', 'quality_check_schema_drift',
  'export_to_looker', 'export_to_powerbi',
  'aggregate_monthly_costs', 'aggregate_quality_metrics',
];

const TYPES: PipelineRun['type'][] = ['Ingestion', 'Transformation', 'Quality Check', 'Export', 'Aggregation'];
const TRIGGERS: PipelineRun['triggerType'][] = ['Scheduled', 'Manual', 'Event'];

export function generatePipelineRuns(count: number, datasetIds: string[]): PipelineRun[] {
  const runs: PipelineRun[] = [];

  for (let i = 0; i < count; i++) {
    const pipelineName = faker.helpers.arrayElement(PIPELINE_NAMES);
    const startTime = faker.date.between({ from: new Date(2026, 1, 1), to: new Date(2026, 1, 28) });
    const duration = faker.number.int({ min: 5, max: 3600 });
    const endTime = new Date(startTime.getTime() + duration * 1000);
    const status = faker.helpers.weightedArrayElement([
      { value: 'Success' as const, weight: 0.72 },
      { value: 'Failed' as const, weight: 0.15 },
      { value: 'Running' as const, weight: 0.08 },
      { value: 'Cancelled' as const, weight: 0.05 },
    ]);
    const recordsProcessed = faker.number.int({ min: 100, max: 5_000_000 });

    runs.push({
      id: faker.string.uuid(),
      runNumber: `RUN-${faker.string.alphanumeric(8).toUpperCase()}`,
      pipelineName,
      type: faker.helpers.arrayElement(TYPES),
      status,
      startTime,
      endTime,
      duration,
      recordsProcessed,
      recordsFailed: status === 'Failed' ? faker.number.int({ min: 1, max: Math.floor(recordsProcessed * 0.1) }) : 0,
      triggerType: faker.helpers.arrayElement(TRIGGERS),
      inputDatasets: faker.helpers.arrayElements(datasetIds, { min: 1, max: 3 }),
      outputDatasets: faker.helpers.arrayElements(datasetIds, { min: 1, max: 2 }),
      parameters: {
        engine: faker.helpers.arrayElement(['dbt', 'Airflow', 'Spark', 'Fivetran']),
        cluster: faker.helpers.arrayElement(['prod-01', 'prod-02', 'staging-01']),
      },
    });
  }

  return runs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}
