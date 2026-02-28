import { faker } from '@faker-js/faker';
import type { QualityEntry, Dataset } from '../types';

const CHECK_TYPES: QualityEntry['checkType'][] = ['Freshness', 'Schema', 'Volume', 'Accuracy', 'Completeness'];

const RULES_BY_TYPE: Record<QualityEntry['checkType'], string[]> = {
  Freshness: [
    'Last update within SLA window',
    'Data must be updated within 24h',
    'Staleness threshold < 4 hours',
    'Real-time feed lag < 5 minutes',
  ],
  Schema: [
    'No new columns detected',
    'Column types unchanged',
    'Required columns present',
    'No schema drift since last run',
  ],
  Volume: [
    'Row count within expected range',
    'Row count > 1000',
    'No more than 10% daily variance',
    'Partition not empty',
  ],
  Accuracy: [
    'Price values within market range',
    'GPS coordinates valid',
    'Email format validation',
    'Referential integrity check',
  ],
  Completeness: [
    'Null rate < 5% for required fields',
    'No missing primary keys',
    'All foreign keys resolvable',
    'Required fields populated',
  ],
};

const MSG_TEMPLATES_PASS: Record<QualityEntry['checkType'], string[]> = {
  Freshness: ['Data updated 2h ago, within SLA', 'Feed is current', 'Last sync within threshold'],
  Schema: ['Schema unchanged', 'No drift detected', 'All columns match expected types'],
  Volume: ['Row count 145,230 within expected range', 'Volume stable', 'Daily row delta +2.1%'],
  Accuracy: ['All values within valid range', 'Referential integrity OK', '0 invalid records found'],
  Completeness: ['Null rate 0.3% for required fields', 'All PKs present', 'No missing required values'],
};

const MSG_TEMPLATES_FAIL: Record<QualityEntry['checkType'], string[]> = {
  Freshness: ['Data is 26h stale, SLA breached', 'Feed delayed by 3 hours', 'No update in 48h'],
  Schema: ['Column "grade" type changed from INT to VARCHAR', 'Unexpected column "tmp_fix" detected', '2 columns dropped'],
  Volume: ['Row count dropped 45% vs yesterday', '0 rows ingested', 'Partition contained only 12 rows'],
  Accuracy: ['Price -$4.20 out of valid range', '142 records with invalid coordinates', 'Duplicate primary keys found'],
  Completeness: ['Null rate 18% on field "origin_country"', '345 missing foreign keys', 'Required field "owner" empty in 12% of rows'],
};

export function generateQualityChecks(count: number, datasets: Dataset[]): QualityEntry[] {
  const entries: QualityEntry[] = [];

  for (let i = 0; i < count; i++) {
    const checkType = faker.helpers.arrayElement(CHECK_TYPES);
    const result = faker.helpers.weightedArrayElement([
      { value: 'Passed' as const, weight: 0.65 },
      { value: 'Failed' as const, weight: 0.2 },
      { value: 'Warning' as const, weight: 0.15 },
    ]);
    const dataset = faker.helpers.arrayElement(datasets);
    const severity = result === 'Passed'
      ? 'Info'
      : result === 'Warning'
        ? faker.helpers.arrayElement(['Warning', 'Info'] as const)
        : faker.helpers.arrayElement(['Error', 'Critical'] as const);

    const messages = result === 'Passed'
      ? MSG_TEMPLATES_PASS[checkType]
      : MSG_TEMPLATES_FAIL[checkType];

    entries.push({
      id: faker.string.uuid(),
      timestamp: faker.date.between({ from: new Date(2026, 1, 1), to: new Date(2026, 1, 28) }),
      checkType,
      severity,
      datasetId: dataset.id,
      datasetName: dataset.displayName,
      message: faker.helpers.arrayElement(messages),
      rule: faker.helpers.arrayElement(RULES_BY_TYPE[checkType]),
      result,
      metadata: {
        executionTimeMs: faker.number.int({ min: 50, max: 5000 }),
        engine: faker.helpers.arrayElement(['dbt test', 'Great Expectations', 'Soda', 'Custom SQL']),
      },
    });
  }

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
