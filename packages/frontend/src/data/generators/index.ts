import { faker } from '@faker-js/faker';
import type { CatalogData } from '../types';
import { generateCoffeeBeans } from './coffee-beans';
import { generateShipments } from './shipments';
import { generateOrders } from './orders';
import { generateLineage } from './lineage';
import { generateProcessingRuns } from './runs';
import { generateLogs } from './logs';
import { generateCosts } from './costs';

// Use deterministic seed for consistent data
const SEED = 'happy-coffee-2024';

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export function generateCatalogData(): CatalogData {
  // Set seed for deterministic generation
  faker.seed(hashCode(SEED));

  // Generate base data
  const coffeeBeans = generateCoffeeBeans(50);
  const batchIds = coffeeBeans.map((bean) => bean.id);

  // Generate related data
  const shipments = generateShipments(20, batchIds);
  const orders = generateOrders(30, batchIds);
  const lineage = generateLineage(batchIds);
  const runs = generateProcessingRuns(40, batchIds);

  // Generate logs and costs using all entity IDs
  const allEntityIds = [
    ...batchIds,
    ...shipments.map((s) => s.id),
    ...orders.map((o) => o.id),
    ...runs.map((r) => r.id),
  ];

  const logs = generateLogs(100, allEntityIds);
  const costs = generateCosts(80, allEntityIds);

  return {
    coffeeBeans,
    shipments,
    orders,
    lineage,
    runs,
    logs,
    costs,
  };
}
