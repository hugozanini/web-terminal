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

const UNIQUE_CHAINS = 15;

export function generateLineage(datasetIds: string[]): LineageNode[] {
  const nodes: LineageNode[] = [];
  const chainNodeIds: string[][] = [];

  const primaryDatasets = datasetIds.slice(0, Math.min(UNIQUE_CHAINS, datasetIds.length));

  for (const datasetId of primaryDatasets) {
    let parentId: string | undefined;
    const baseDate = faker.date.recent({ days: 90 });
    const chainIds: string[] = [];

    for (let step = 0; step < LINEAGE_CHAIN.length; step++) {
      const stage = LINEAGE_CHAIN[step];
      const nodeId = faker.string.uuid();
      chainIds.push(nodeId);

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

    chainNodeIds.push(chainIds);
  }

  const remaining = datasetIds.slice(UNIQUE_CHAINS);
  for (const datasetId of remaining) {
    const chainIdx = Math.floor(Math.random() * chainNodeIds.length);
    const chainIds = chainNodeIds[chainIdx];
    for (const nodeId of chainIds) {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        node.datasetIds.push(datasetId);
      }
    }
  }

  return nodes;
}
