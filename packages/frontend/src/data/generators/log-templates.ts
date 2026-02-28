import type { PipelineRunLog } from '../types';

interface LogStep {
  delay: number;
  level: PipelineRunLog['level'];
  message: string;
}

export function getSuccessLogSteps(pipelineName: string): LogStep[] {
  return [
    { delay: 0,    level: 'INFO',  message: `Initializing pipeline "${pipelineName}"...` },
    { delay: 800,  level: 'INFO',  message: 'Resolving DAG dependencies (3 upstream, 2 downstream)...' },
    { delay: 1500, level: 'DEBUG', message: 'Acquired execution slot on cluster prod-01 (4 vCPU, 16 GB)' },
    { delay: 2200, level: 'INFO',  message: 'Authenticating with warehouse (role: ETL_SERVICE)...' },
    { delay: 3000, level: 'INFO',  message: 'Authentication successful. Session ID: sess_8f2a4e91' },
    { delay: 4000, level: 'INFO',  message: '[Step 1/6] Extracting data from source...' },
    { delay: 5500, level: 'DEBUG', message: 'Compiling source query: SELECT * FROM raw.events WHERE updated_at > \'2026-02-27T00:00:00Z\'' },
    { delay: 7000, level: 'DEBUG', message: 'Query plan: SeqScan -> Filter -> Project (estimated cost: 342.18)' },
    { delay: 9000, level: 'INFO',  message: 'Extraction complete. 12,847 rows fetched (4.2 MB) in 5.0s' },
    { delay: 10500, level: 'INFO', message: '[Step 2/6] Validating schema compatibility...' },
    { delay: 12000, level: 'DEBUG', message: 'Schema fingerprint: sha256:a4f8e2c1d9b3...  (22 columns)' },
    { delay: 13000, level: 'DEBUG', message: 'Column check: all NOT NULL constraints satisfied' },
    { delay: 14000, level: 'INFO',  message: 'Schema validation PASSED -- no drift detected' },
    { delay: 15500, level: 'INFO',  message: '[Step 3/6] Applying transformations...' },
    { delay: 17000, level: 'DEBUG', message: 'Pass 1: Deduplication (strategy: last_write_wins, key: id)' },
    { delay: 18500, level: 'INFO',  message: 'Deduplication removed 43 duplicate records' },
    { delay: 19500, level: 'DEBUG', message: 'Pass 2: Type casting -- converting 4 columns (varchar -> timestamp)' },
    { delay: 21000, level: 'DEBUG', message: 'Pass 3: Null coalescing -- 7 columns with default values applied' },
    { delay: 22500, level: 'DEBUG', message: 'Pass 4: Business rule enrichment -- joining with dim_regions (238 rows)' },
    { delay: 24000, level: 'INFO',  message: 'All transformations applied. Output: 12,804 rows' },
    { delay: 25500, level: 'INFO',  message: '[Step 4/6] Loading data into target table...' },
    { delay: 27000, level: 'DEBUG', message: 'MERGE strategy: match on primary key (id), update on conflict' },
    { delay: 28500, level: 'DEBUG', message: 'Batch 1/3: 5,000 rows merged...' },
    { delay: 29500, level: 'DEBUG', message: 'Batch 2/3: 5,000 rows merged...' },
    { delay: 30500, level: 'DEBUG', message: 'Batch 3/3: 2,804 rows merged...' },
    { delay: 31500, level: 'INFO',  message: 'Load complete: 11,492 updated, 1,312 inserted, 0 deleted' },
    { delay: 33000, level: 'INFO',  message: '[Step 5/6] Running post-load quality checks...' },
    { delay: 34000, level: 'DEBUG', message: 'Assertion 1/4: row_count > 0 ............. PASSED' },
    { delay: 34500, level: 'DEBUG', message: 'Assertion 2/4: null_pct("id") = 0 ........ PASSED' },
    { delay: 35000, level: 'DEBUG', message: 'Assertion 3/4: freshness < 2h ............. PASSED' },
    { delay: 35500, level: 'DEBUG', message: 'Assertion 4/4: unique("id") = true ........ PASSED' },
    { delay: 36500, level: 'INFO',  message: 'All 4 quality assertions passed' },
    { delay: 37500, level: 'INFO',  message: '[Step 6/6] Updating catalog metadata...' },
    { delay: 38500, level: 'DEBUG', message: 'Refreshing table statistics and column profiles...' },
    { delay: 39000, level: 'INFO',  message: 'Notifying 2 downstream pipelines (transform_orders_silver, build_customer_360)' },
    { delay: 39500, level: 'INFO',  message: `Pipeline "${pipelineName}" completed successfully.` },
    { delay: 40000, level: 'INFO',  message: 'Total duration: 40s | Records: 12,804 | Status: SUCCESS' },
  ];
}

export function getFailureLogSteps(pipelineName: string): LogStep[] {
  return [
    { delay: 0,    level: 'INFO',  message: `Initializing pipeline "${pipelineName}"...` },
    { delay: 800,  level: 'INFO',  message: 'Resolving DAG dependencies (3 upstream, 2 downstream)...' },
    { delay: 1500, level: 'DEBUG', message: 'Acquired execution slot on cluster prod-02 (4 vCPU, 16 GB)' },
    { delay: 2200, level: 'INFO',  message: 'Authenticating with warehouse (role: ETL_SERVICE)...' },
    { delay: 3000, level: 'INFO',  message: 'Authentication successful. Session ID: sess_c7e19b34' },
    { delay: 4000, level: 'INFO',  message: '[Step 1/6] Extracting data from source...' },
    { delay: 5500, level: 'DEBUG', message: 'Compiling source query: SELECT * FROM raw.events WHERE updated_at > \'2026-02-27T00:00:00Z\'' },
    { delay: 7000, level: 'DEBUG', message: 'Query plan: SeqScan -> Filter -> Project (estimated cost: 342.18)' },
    { delay: 9000, level: 'INFO',  message: 'Extraction complete. 9,231 rows fetched (3.1 MB) in 5.0s' },
    { delay: 10500, level: 'INFO', message: '[Step 2/6] Validating schema compatibility...' },
    { delay: 12000, level: 'DEBUG', message: 'Schema fingerprint: sha256:b7c4a1e2f530...  (22 columns)' },
    { delay: 13000, level: 'WARN',  message: 'Column "harvest_date" type changed: varchar -> date (source schema drift detected)' },
    { delay: 14000, level: 'WARN',  message: 'Proceeding with type coercion -- 14 rows may fail casting' },
    { delay: 15500, level: 'INFO',  message: '[Step 3/6] Applying transformations...' },
    { delay: 17000, level: 'DEBUG', message: 'Pass 1: Deduplication (strategy: last_write_wins, key: id)' },
    { delay: 18500, level: 'INFO',  message: 'Deduplication removed 17 duplicate records' },
    { delay: 19500, level: 'DEBUG', message: 'Pass 2: Type casting -- converting 4 columns (varchar -> timestamp)' },
    { delay: 21000, level: 'WARN',  message: '14 records failed type casting for column "harvest_date" -- values: "N/A", "TBD", ""' },
    { delay: 22500, level: 'DEBUG', message: 'Pass 3: Business rule enrichment -- joining with dim_regions...' },
    { delay: 24000, level: 'ERROR', message: 'Transformation FAILED at step "cost_per_kg" calculation' },
    { delay: 25000, level: 'ERROR', message: 'java.lang.ArithmeticException: / by zero' },
    { delay: 25500, level: 'ERROR', message: '  at transform.CostCalculator.compute(CostCalculator.java:142)' },
    { delay: 26000, level: 'ERROR', message: '  at pipeline.StepRunner.execute(StepRunner.java:89)' },
    { delay: 26500, level: 'ERROR', message: '  at pipeline.DAGExecutor.runStep(DAGExecutor.java:67)' },
    { delay: 27000, level: 'ERROR', message: '  at pipeline.Engine.run(Engine.java:201)' },
    { delay: 28000, level: 'INFO',  message: 'Initiating rollback of partial writes...' },
    { delay: 29500, level: 'DEBUG', message: 'Rolling back transaction txn_9f8e7d6c (target: silver.orders)' },
    { delay: 31000, level: 'INFO',  message: 'Rollback complete. 0 rows committed to target.' },
    { delay: 32500, level: 'WARN',  message: 'Downstream pipelines will NOT be triggered due to failure' },
    { delay: 34000, level: 'INFO',  message: 'Sending failure notification to #data-alerts (Slack) and data-eng@happycoffee.com' },
    { delay: 36000, level: 'ERROR', message: `Pipeline "${pipelineName}" FAILED.` },
    { delay: 37000, level: 'ERROR', message: 'Root cause: division by zero in cost_per_kg -- likely null/zero "weight_kg" values in source' },
    { delay: 38000, level: 'INFO',  message: 'Suggested fix: Add null guard in transform step or upstream data quality check' },
    { delay: 39000, level: 'INFO',  message: 'Artifacts preserved at: s3://happy-coffee-logs/failed/2026-02-28/txn_9f8e7d6c/' },
    { delay: 40000, level: 'ERROR', message: 'Total duration: 40s | Records: 0 committed | Status: FAILED' },
  ];
}
