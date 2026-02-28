import { faker } from '@faker-js/faker';
import type { LineageNode } from '../types';

const LINEAGE_CHAIN: { type: LineageNode['type']; nameTemplate: string; location: string }[] = [
  { type: 'Source', nameTemplate: 'Source System', location: 'External' },
  { type: 'Ingestion', nameTemplate: 'Airbyte Ingestion', location: 'Airbyte Cloud' },
  { type: 'Bronze', nameTemplate: 'Bronze Layer', location: 'analytics_warehouse.bronze' },
  { type: 'Silver', nameTemplate: 'dbt Silver Models', location: 'analytics_warehouse.silver' },
  { type: 'Gold', nameTemplate: 'Gold Analytics', location: 'analytics_warehouse.gold' },
  { type: 'BI', nameTemplate: 'Looker Dashboard', location: 'Looker' },
];

const SOURCE_NAMES = ['SAP ERP', 'PostgreSQL', 'IoT Hub', 'Salesforce', 'Kafka Stream', 'S3 Files', 'REST API'];
const BI_NAMES = ['Looker Dashboard', 'Power BI Report', 'Metabase Dashboard', 'Jupyter Notebook', 'dbt Docs'];

export function generateLineage(datasetIds: string[]): LineageNode[] {
  const nodes: LineageNode[] = [];
  const trackedDatasets = datasetIds.slice(0, Math.min(10, datasetIds.length));

  for (const datasetId of trackedDatasets) {
    let parentId: string | undefined;
    const baseDate = faker.date.between({ from: new Date(2025, 6, 1), to: new Date(2025, 9, 1) });

    for (let step = 0; step < LINEAGE_CHAIN.length; step++) {
      const stage = LINEAGE_CHAIN[step];
      const nodeId = faker.string.uuid();

      let name = stage.nameTemplate;
      if (stage.type === 'Source') name = faker.helpers.arrayElement(SOURCE_NAMES);
      if (stage.type === 'BI') name = faker.helpers.arrayElement(BI_NAMES);

      nodes.push({
        id: nodeId,
        type: stage.type,
        name,
        timestamp: new Date(baseDate.getTime() + step * 7 * 24 * 60 * 60 * 1000),
        location: stage.location,
        datasetIds: [datasetId],
        metadata: {
          tier: stage.type,
          ...(stage.type === 'Bronze' && { format: 'Parquet', partitioned: true }),
          ...(stage.type === 'Silver' && { materialized: 'incremental', tests: faker.number.int({ min: 2, max: 8 }) }),
          ...(stage.type === 'Gold' && { materialized: 'table', grain: 'daily' }),
        },
        parentId,
      });

      parentId = nodeId;
    }
  }

  return nodes;
}
