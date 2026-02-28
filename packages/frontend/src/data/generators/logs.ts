import { faker } from '@faker-js/faker';
import type { LogEntry } from '../types';

const LOG_TYPES: LogEntry['type'][] = [
  'Quality Check', 'Shipping', 'Processing', 'Inspection', 'Maintenance'
];

const SEVERITIES: LogEntry['severity'][] = ['Info', 'Warning', 'Error', 'Critical'];

const LOG_MESSAGES = {
  'Quality Check': [
    'SCA cupping score recorded',
    'Moisture content verified within limits',
    'Defect count below threshold',
    'Visual inspection completed',
    'Sample extracted for lab testing',
  ],
  'Shipping': [
    'Container loaded successfully',
    'Documentation submitted to customs',
    'Vessel departed on schedule',
    'Shipment tracking updated',
    'Delivery confirmed at destination',
  ],
  'Processing': [
    'Processing run completed successfully',
    'Equipment performance nominal',
    'Yield percentage meets target',
    'Quality metrics recorded',
    'Batch transferred to next stage',
  ],
  'Inspection': [
    'Routine facility inspection passed',
    'Health and safety audit completed',
    'Certification renewal processed',
    'Third-party audit scheduled',
    'Compliance check successful',
  ],
  'Maintenance': [
    'Preventive maintenance completed',
    'Equipment calibration verified',
    'Filter replacement performed',
    'System diagnostics run',
    'Scheduled downtime logged',
  ],
};

export function generateLogs(count: number, entityIds: string[]): LogEntry[] {
  const logs: LogEntry[] = [];

  for (let i = 0; i < count; i++) {
    const type = faker.helpers.arrayElement(LOG_TYPES);
    const severity = faker.helpers.arrayElement(SEVERITIES);
    const entityType = faker.helpers.arrayElement(['Batch', 'Shipment', 'Run', 'Equipment'] as const);

    const log: LogEntry = {
      id: faker.string.uuid(),
      timestamp: faker.date.between({
        from: new Date(2025, 6, 1),
        to: new Date(2026, 1, 28),
      }),
      type,
      severity,
      entityType,
      entityId: faker.helpers.arrayElement(entityIds),
      message: faker.helpers.arrayElement(LOG_MESSAGES[type]),
      user: faker.person.fullName(),
      metadata: {
        source: faker.helpers.arrayElement(['System', 'Manual', 'Automated']),
        location: faker.helpers.arrayElement(['Santos', 'Minas Gerais', 'São Paulo', 'Bahia']),
      },
    };

    logs.push(log);
  }

  // Sort by timestamp descending (newest first)
  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
