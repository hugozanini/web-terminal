import { faker } from '@faker-js/faker';
import type { CostEntry, Dataset, PipelineRun, DataSource } from '../types';

const ENTITY_TYPES: CostEntry['entityType'][] = ['Dataset', 'Pipeline', 'Source'];

const SUBCATEGORIES: Record<CostEntry['category'], string[]> = {
  Storage: ['Snowflake Storage', 'S3 Object Storage', 'BigQuery Active Storage', 'Archive Storage'],
  Compute: ['Snowflake Warehouse Credits', 'dbt Cloud Runs', 'Spark Cluster Hours', 'Airflow Workers'],
  Query: ['On-demand Queries', 'Scheduled Queries', 'Ad-hoc Analysis', 'BI Dashboard Queries'],
  Transfer: ['Cross-region Transfer', 'Egress to External', 'API Data Pulls', 'Replication'],
  Licensing: ['Snowflake License', 'Fivetran Connectors', 'Looker Seats', 'Great Expectations Cloud'],
  Infrastructure: ['Kubernetes Nodes', 'Networking', 'Monitoring (Datadog)', 'CI/CD Pipelines'],
};

export function generateCosts(
  count: number,
  datasets: Dataset[],
  pipelineRuns: PipelineRun[],
  dataSources: DataSource[]
): CostEntry[] {
  const entries: CostEntry[] = [];

  const pipelineNames = [...new Set(pipelineRuns.map(r => r.pipelineName))];

  for (let i = 0; i < count; i++) {
    const category = faker.helpers.weightedArrayElement([
      { value: 'Storage' as const, weight: 0.22 },
      { value: 'Compute' as const, weight: 0.28 },
      { value: 'Query' as const, weight: 0.18 },
      { value: 'Transfer' as const, weight: 0.1 },
      { value: 'Licensing' as const, weight: 0.12 },
      { value: 'Infrastructure' as const, weight: 0.1 },
    ]);
    const entityType = faker.helpers.arrayElement(ENTITY_TYPES);

    let entityId: string;
    let description: string;

    if (entityType === 'Dataset') {
      const ds = faker.helpers.arrayElement(datasets);
      entityId = ds.id;
      description = `${category} cost for dataset ${ds.displayName}`;
    } else if (entityType === 'Pipeline') {
      const pipeline = faker.helpers.arrayElement(pipelineNames);
      entityId = pipeline;
      description = `${category} cost for pipeline ${pipeline}`;
    } else {
      const src = faker.helpers.arrayElement(dataSources);
      entityId = src.id;
      description = `${category} cost for source ${src.name}`;
    }

    const subcategory = faker.helpers.arrayElement(SUBCATEGORIES[category]);
    const amount = faker.number.float({ min: 5, max: 2500, fractionDigits: 2 });

    entries.push({
      id: faker.string.uuid(),
      category,
      subcategory,
      entityType,
      entityId,
      amount,
      currency: 'USD',
      date: faker.date.between({ from: new Date(2026, 1, 1), to: new Date(2026, 1, 28) }),
      description,
      breakdown: faker.helpers.maybe(() => [
        { item: 'Base', cost: +(amount * 0.6).toFixed(2) },
        { item: 'Overage', cost: +(amount * 0.3).toFixed(2) },
        { item: 'Tax', cost: +(amount * 0.1).toFixed(2) },
      ], { probability: 0.3 }),
    });
  }

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
