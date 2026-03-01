import { faker } from '@faker-js/faker';
import type { Pipeline, PipelineRun, PipelineRunLog } from '../types';

interface PipelineDef {
  name: string;
  displayName: string;
  type: Pipeline['type'];
  description: string;
  engine: string;
  cron: string | null;
  tags: string[];
}

const PIPELINE_DEFS: PipelineDef[] = [
  { name: 'ingest_farm_data', displayName: 'Ingest Farm Data', type: 'Ingestion', description: 'Pulls farm sensor readings and harvest logs from IoT gateway into Bronze layer', engine: 'Fivetran', cron: '0 */2 * * *', tags: ['farm', 'iot', 'bronze'] },
  { name: 'ingest_erp_financials', displayName: 'Ingest ERP Financials', type: 'Ingestion', description: 'Syncs financial transactions from SAP ERP into the data warehouse', engine: 'Fivetran', cron: '30 1 * * *', tags: ['erp', 'finance', 'daily'] },
  { name: 'ingest_crm_orders', displayName: 'Ingest CRM Orders', type: 'Ingestion', description: 'Extracts customer orders and contact records from Salesforce CRM', engine: 'Fivetran', cron: '0 */4 * * *', tags: ['crm', 'orders'] },
  { name: 'ingest_iot_sensors', displayName: 'Ingest IoT Sensors', type: 'Ingestion', description: 'Streams temperature, humidity, and altitude readings from warehouse sensors', engine: 'Kafka Connect', cron: '*/15 * * * *', tags: ['iot', 'streaming', 'sensors'] },
  { name: 'ingest_shipping_events', displayName: 'Ingest Shipping Events', type: 'Ingestion', description: 'Captures container tracking and port arrival events from logistics partner API', engine: 'Fivetran', cron: '0 */6 * * *', tags: ['shipping', 'logistics'] },
  { name: 'ingest_weather_data', displayName: 'Ingest Weather Data', type: 'Ingestion', description: 'Fetches daily weather forecasts and historical data for farm regions', engine: 'Airflow', cron: '0 6 * * *', tags: ['weather', 'external'] },
  { name: 'ingest_market_prices', displayName: 'Ingest Market Prices', type: 'Ingestion', description: 'Pulls daily commodity prices from ICE exchange and local markets', engine: 'Airflow', cron: '0 8 * * 1-5', tags: ['market', 'pricing'] },
  { name: 'transform_inventory_silver', displayName: 'Transform Inventory (Silver)', type: 'Transformation', description: 'Cleans and deduplicates raw inventory data, applies business rules, outputs Silver-tier table', engine: 'dbt', cron: '0 3 * * *', tags: ['inventory', 'silver', 'dbt'] },
  { name: 'transform_orders_silver', displayName: 'Transform Orders (Silver)', type: 'Transformation', description: 'Joins CRM orders with ERP line items, resolves foreign keys, produces Silver orders', engine: 'dbt', cron: '0 3 * * *', tags: ['orders', 'silver', 'dbt'] },
  { name: 'transform_quality_silver', displayName: 'Transform Quality (Silver)', type: 'Transformation', description: 'Standardizes quality grading data and maps it to the unified quality schema', engine: 'dbt', cron: '0 4 * * *', tags: ['quality', 'silver', 'dbt'] },
  { name: 'build_farm_origins_gold', displayName: 'Build Farm Origins (Gold)', type: 'Transformation', description: 'Aggregates farm, region, and harvest data into the Gold-tier farm origins dimension', engine: 'Spark', cron: '0 5 * * *', tags: ['farm', 'gold', 'spark'] },
  { name: 'build_shipment_analytics', displayName: 'Build Shipment Analytics', type: 'Aggregation', description: 'Produces daily shipment KPIs: transit times, delay rates, cost per kg', engine: 'Spark', cron: '0 6 * * *', tags: ['shipping', 'gold', 'analytics'] },
  { name: 'build_pricing_cube', displayName: 'Build Pricing Cube', type: 'Aggregation', description: 'Combines market prices, costs, and margins into a multidimensional pricing cube', engine: 'Spark', cron: '0 7 * * 1-5', tags: ['pricing', 'gold', 'cube'] },
  { name: 'build_demand_forecast', displayName: 'Build Demand Forecast', type: 'Aggregation', description: 'Runs ML-based demand forecasting model using historical orders and seasonality', engine: 'Spark', cron: '0 8 * * 1', tags: ['forecast', 'ml', 'weekly'] },
  { name: 'build_customer_360', displayName: 'Build Customer 360', type: 'Aggregation', description: 'Merges CRM, order, and support data into a unified customer profile', engine: 'dbt', cron: '0 4 * * *', tags: ['customer', 'gold', 'dbt'] },
  { name: 'quality_check_daily', displayName: 'Quality Check Daily', type: 'Quality Check', description: 'Runs the full suite of data quality assertions across all Silver and Gold tables', engine: 'Great Expectations', cron: '30 5 * * *', tags: ['quality', 'daily', 'assertions'] },
  { name: 'quality_check_freshness', displayName: 'Quality Check Freshness', type: 'Quality Check', description: 'Verifies that all critical tables have been updated within their SLA window', engine: 'Great Expectations', cron: '0 */3 * * *', tags: ['quality', 'freshness', 'sla'] },
  { name: 'quality_check_schema_drift', displayName: 'Quality Check Schema Drift', type: 'Quality Check', description: 'Detects column additions, removals, or type changes across all source tables', engine: 'Great Expectations', cron: '0 2 * * *', tags: ['quality', 'schema', 'drift'] },
  { name: 'export_to_looker', displayName: 'Export to Looker', type: 'Export', description: 'Refreshes Looker PDTs and triggers LookML dashboard cache rebuild', engine: 'Airflow', cron: '0 9 * * *', tags: ['export', 'looker', 'bi'] },
  { name: 'export_to_powerbi', displayName: 'Export to Power BI', type: 'Export', description: 'Pushes Gold-tier datasets to Power BI Premium workspace via REST API', engine: 'Airflow', cron: '30 9 * * *', tags: ['export', 'powerbi', 'bi'] },
  { name: 'aggregate_monthly_costs', displayName: 'Aggregate Monthly Costs', type: 'Aggregation', description: 'Consolidates compute, storage, and query costs into monthly cost allocation report', engine: 'dbt', cron: '0 2 1 * *', tags: ['costs', 'monthly', 'finance'] },
  { name: 'aggregate_quality_metrics', displayName: 'Aggregate Quality Metrics', type: 'Aggregation', description: 'Summarizes quality check pass/fail rates into weekly trend metrics', engine: 'dbt', cron: '0 6 * * 1', tags: ['quality', 'metrics', 'weekly'] },
];

const CLUSTERS = ['prod-01', 'prod-02', 'staging-01'];
const TIMEZONES = ['America/Sao_Paulo', 'UTC', 'America/New_York'];

function generateRunLogs(status: PipelineRun['status'], pipelineName: string, duration: number): PipelineRunLog[] {
  const logs: PipelineRunLog[] = [];
  const baseTime = new Date();

  const pushLog = (offsetSec: number, level: PipelineRunLog['level'], message: string) => {
    logs.push({ timestamp: new Date(baseTime.getTime() + offsetSec * 1000), level, message });
  };

  pushLog(0, 'INFO', `Starting pipeline "${pipelineName}"...`);
  pushLog(1, 'INFO', 'Resolving dependencies and validating configuration...');
  pushLog(2, 'DEBUG', 'Connection pool initialized (max_connections=8, timeout=30s)');
  pushLog(3, 'INFO', 'Authenticated with warehouse credentials (role: ETL_SERVICE)');
  pushLog(5, 'INFO', 'Step 1/5: Extracting data from source...');
  pushLog(8, 'DEBUG', 'Source query compiled: SELECT * FROM raw.* WHERE updated_at > last_checkpoint');
  pushLog(12, 'INFO', 'Extraction complete. 4,218 rows fetched in 7.2s');
  pushLog(13, 'INFO', 'Step 2/5: Validating schema compatibility...');
  pushLog(15, 'DEBUG', 'Schema hash: a4f8e2c1 -- no drift detected');
  pushLog(16, 'INFO', 'Schema validation passed (22 columns matched)');
  pushLog(17, 'INFO', 'Step 3/5: Applying transformations...');
  pushLog(20, 'DEBUG', 'Running deduplication pass (strategy: last_write_wins)');
  pushLog(22, 'INFO', 'Deduplication removed 12 duplicate records');
  pushLog(24, 'DEBUG', 'Applying business rules: null coalescing, type casting, enrichment');

  if (status === 'Failed') {
    pushLog(26, 'WARN', 'Encountered 3 records with invalid date format in column "harvest_date"');
    pushLog(28, 'ERROR', 'Transformation failed: division by zero in "cost_per_kg" calculation');
    pushLog(29, 'ERROR', `java.lang.ArithmeticException: / by zero at transform.CostCalculator.compute(CostCalculator.java:142)`);
    pushLog(30, 'ERROR', `  at pipeline.StepRunner.execute(StepRunner.java:89)`);
    pushLog(30, 'ERROR', `  at pipeline.Engine.run(Engine.java:201)`);
    pushLog(31, 'INFO', 'Rolling back partial writes to target table...');
    pushLog(33, 'INFO', 'Rollback complete. 0 rows committed.');
    pushLog(34, 'ERROR', `Pipeline "${pipelineName}" FAILED after ${duration}s (exit code 1)`);
  } else {
    pushLog(26, 'INFO', 'Transformations applied successfully (4,206 rows output)');
    pushLog(28, 'INFO', 'Step 4/5: Loading data into target table...');
    pushLog(30, 'DEBUG', 'Using MERGE strategy (match on primary key: id)');
    pushLog(32, 'INFO', 'Merge complete: 3,891 updated, 315 inserted, 0 deleted');
    pushLog(33, 'INFO', 'Step 5/5: Running post-load quality checks...');
    pushLog(35, 'DEBUG', 'Assertion: row_count > 0 -- PASSED');
    pushLog(35, 'DEBUG', 'Assertion: null_pct("id") = 0 -- PASSED');
    pushLog(36, 'DEBUG', 'Assertion: freshness < 2h -- PASSED');
    pushLog(37, 'INFO', 'All 3 quality assertions passed');
    pushLog(38, 'INFO', `Pipeline "${pipelineName}" completed successfully in ${duration}s`);
    pushLog(39, 'INFO', 'Updating pipeline metadata and refreshing downstream dependencies...');
    pushLog(40, 'INFO', 'Done.');
  }

  return logs;
}

export function generatePipelines(datasetIds: string[]): Pipeline[] {
  return PIPELINE_DEFS.map((def) => {
    const id = faker.string.uuid();
    const hasCron = def.cron !== null;
    const lastRunStatus: Pipeline['lastRunStatus'] = faker.helpers.weightedArrayElement([
      { value: 'Success' as const, weight: 0.75 },
      { value: 'Failed' as const, weight: 0.15 },
      { value: 'Running' as const, weight: 0.05 },
      { value: 'Cancelled' as const, weight: 0.05 },
    ]);
    const totalRuns = faker.number.int({ min: 15, max: 120 });

    return {
      id,
      name: def.name,
      displayName: def.displayName,
      description: def.description,
      type: def.type,
      owner: faker.helpers.arrayElement([
        'data-eng@happycoffee.com',
        'analytics@happycoffee.com',
        'platform@happycoffee.com',
        'ml-team@happycoffee.com',
      ]),
      schedule: hasCron ? {
        enabled: faker.datatype.boolean({ probability: 0.9 }),
        cron: def.cron!,
        timezone: faker.helpers.arrayElement(TIMEZONES),
        nextRun: faker.date.soon({ days: 2 }),
      } : null,
      engine: def.engine,
      cluster: faker.helpers.arrayElement(CLUSTERS),
      inputDatasets: faker.helpers.arrayElements(datasetIds, { min: 1, max: 3 }),
      outputDatasets: faker.helpers.arrayElements(datasetIds, { min: 1, max: 2 }),
      tags: def.tags,
      createdAt: faker.date.past({ years: 1 }),
      lastRunStatus,
      lastRunTime: faker.date.recent({ days: 3 }),
      avgDuration: faker.number.int({ min: 15, max: 1800 }),
      totalRuns,
    };
  });
}

export function generatePipelineRuns(pipelines: Pipeline[]): PipelineRun[] {
  const runs: PipelineRun[] = [];

  for (const pipeline of pipelines) {
    const runCount = faker.number.int({ min: 3, max: 8 });
    let currentRefTime = pipeline.lastRunTime || new Date();

    for (let i = 0; i < runCount; i++) {
      const startTime = new Date(currentRefTime.getTime());

      // The next historical run is randomly 1 to 5 days older than the current one
      const daysBack = faker.number.int({ min: 1, max: 5 });
      currentRefTime = new Date(currentRefTime.getTime() - daysBack * 24 * 60 * 60 * 1000);

      const duration = faker.number.int({ min: 5, max: 3600 });
      const endTime = new Date(startTime.getTime() + duration * 1000);

      // The first run in the sequence (the most recent one) MUST match the pipeline's global status
      const isLatest = i === 0;
      const status = isLatest ? (pipeline.lastRunStatus as PipelineRun['status']) : faker.helpers.weightedArrayElement([
        { value: 'Success' as const, weight: 0.72 },
        { value: 'Failed' as const, weight: 0.15 },
        { value: 'Running' as const, weight: 0.08 },
        { value: 'Cancelled' as const, weight: 0.05 },
      ]);
      const recordsProcessed = faker.number.int({ min: 100, max: 5_000_000 });

      runs.push({
        id: faker.string.uuid(),
        runNumber: `RUN-${faker.string.alphanumeric(8).toUpperCase()}`,
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        type: pipeline.type,
        status,
        startTime,
        endTime,
        duration,
        recordsProcessed,
        recordsFailed: status === 'Failed' ? faker.number.int({ min: 1, max: Math.floor(recordsProcessed * 0.1) }) : 0,
        triggerType: faker.helpers.arrayElement(['Scheduled', 'Manual', 'Event'] as const),
        inputDatasets: pipeline.inputDatasets,
        outputDatasets: pipeline.outputDatasets,
        parameters: {
          engine: pipeline.engine,
          cluster: pipeline.cluster,
        },
        logs: generateRunLogs(status, pipeline.displayName, duration),
      });
    }
  }

  return runs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

export { generateRunLogs };
