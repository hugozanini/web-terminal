import { faker } from '@faker-js/faker';
import type { LineageNode } from '../types';

export function generateLineage(batchIds: string[]): LineageNode[] {
  const nodes: LineageNode[] = [];

  // Create lineage chains for a subset of batches
  const trackedBatches = faker.helpers.arrayElements(batchIds, Math.min(batchIds.length, 10));

  trackedBatches.forEach((batchId) => {
    const baseTimestamp = faker.date.between({
      from: new Date(2025, 3, 1),
      to: new Date(2025, 7, 1),
    });

    // Farm
    const farmNode: LineageNode = {
      id: faker.string.uuid(),
      type: 'Farm',
      name: `Fazenda ${faker.location.city()}`,
      timestamp: new Date(baseTimestamp),
      location: faker.location.state(),
      batchIds: [batchId],
      metadata: {
        farmSize: faker.number.int({ min: 50, max: 500 }) + ' hectares',
        altitude: faker.number.int({ min: 800, max: 1400 }) + 'm',
      },
    };
    nodes.push(farmNode);

    // Processing
    const processingTimestamp = new Date(baseTimestamp);
    processingTimestamp.setDate(processingTimestamp.getDate() + faker.number.int({ min: 2, max: 7 }));

    const processingNode: LineageNode = {
      id: faker.string.uuid(),
      type: 'Processing',
      name: `${faker.helpers.arrayElement(['Natural', 'Washed', 'Pulped'])} Processing`,
      timestamp: processingTimestamp,
      location: farmNode.location,
      batchIds: [batchId],
      metadata: {
        method: faker.helpers.arrayElement(['Natural', 'Washed', 'Pulped Natural']),
        duration: faker.number.int({ min: 15, max: 30 }) + ' days',
      },
      parentId: farmNode.id,
    };
    nodes.push(processingNode);

    // Warehouse
    const warehouseTimestamp = new Date(processingTimestamp);
    warehouseTimestamp.setDate(warehouseTimestamp.getDate() + faker.number.int({ min: 10, max: 20 }));

    const warehouseNode: LineageNode = {
      id: faker.string.uuid(),
      type: 'Warehouse',
      name: 'Santos Storage Facility',
      timestamp: warehouseTimestamp,
      location: 'Santos, São Paulo',
      batchIds: [batchId],
      metadata: {
        storageCondition: 'Climate Controlled',
        humidity: faker.number.int({ min: 55, max: 65 }) + '%',
      },
      parentId: processingNode.id,
    };
    nodes.push(warehouseNode);

    // Quality Control
    const qcTimestamp = new Date(warehouseTimestamp);
    qcTimestamp.setDate(qcTimestamp.getDate() + faker.number.int({ min: 1, max: 3 }));

    const qcNode: LineageNode = {
      id: faker.string.uuid(),
      type: 'Quality Control',
      name: 'SCA Cupping and Grading',
      timestamp: qcTimestamp,
      location: 'Santos, São Paulo',
      batchIds: [batchId],
      metadata: {
        cuppingScore: faker.number.float({ min: 80, max: 92, fractionDigits: 1 }),
        grade: faker.helpers.arrayElement(['Grade 1', 'Grade 2', 'Specialty']),
      },
      parentId: warehouseNode.id,
    };
    nodes.push(qcNode);

    // Export
    const exportTimestamp = new Date(qcTimestamp);
    exportTimestamp.setDate(exportTimestamp.getDate() + faker.number.int({ min: 5, max: 15 }));

    const exportNode: LineageNode = {
      id: faker.string.uuid(),
      type: 'Export',
      name: 'Port of Santos Export',
      timestamp: exportTimestamp,
      location: 'Santos, São Paulo',
      batchIds: [batchId],
      metadata: {
        containerType: '20ft Reefer',
        exportLicense: `EXP-${faker.string.alphanumeric(8).toUpperCase()}`,
      },
      parentId: qcNode.id,
    };
    nodes.push(exportNode);
  });

  return nodes;
}
