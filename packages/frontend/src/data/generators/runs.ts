import { faker } from '@faker-js/faker';
import type { ProcessingRun } from '../types';

const RUN_TYPES: ProcessingRun['type'][] = [
  'Washing', 'Drying', 'Hulling', 'Sorting', 'Grading'
];

export function generateProcessingRuns(count: number, batchIds: string[]): ProcessingRun[] {
  const runs: ProcessingRun[] = [];

  for (let i = 0; i < count; i++) {
    const type = faker.helpers.arrayElement(RUN_TYPES);
    const startTime = faker.date.between({
      from: new Date(2025, 4, 1),
      to: new Date(2025, 8, 30),
    });

    const duration = faker.number.int({ min: 120, max: 480 }); // 2-8 hours
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);

    const parameters: Record<string, unknown> = {};

    if (type === 'Washing') {
      parameters.waterTemperature = faker.number.int({ min: 18, max: 25 }) + '°C';
      parameters.washCycles = faker.number.int({ min: 2, max: 4 });
    } else if (type === 'Drying') {
      parameters.temperature = faker.number.int({ min: 35, max: 45 }) + '°C';
      parameters.humidity = faker.number.int({ min: 40, max: 60 }) + '%';
    } else if (type === 'Hulling') {
      parameters.speed = faker.number.int({ min: 1200, max: 1800 }) + ' rpm';
    }

    const run: ProcessingRun = {
      id: faker.string.uuid(),
      runNumber: `RUN-${faker.string.alphanumeric(8).toUpperCase()}`,
      type,
      inputBatchIds: faker.helpers.arrayElements(batchIds, { min: 1, max: 3 }),
      outputBatchId: faker.helpers.arrayElement(batchIds),
      startTime,
      endTime,
      duration,
      operator: faker.person.fullName(),
      facilityId: `FAC-${faker.string.alphanumeric(4).toUpperCase()}`,
      parameters,
      yieldPercentage: faker.number.float({ min: 82, max: 95, fractionDigits: 1 }),
      qualityMetrics: {
        score: faker.number.float({ min: 75, max: 95, fractionDigits: 1 }),
        notes: faker.helpers.arrayElement([
          'Excellent quality, minimal defects',
          'Good processing, uniform beans',
          'Above average yield',
          'Standard quality output',
          'Minor defects detected, within acceptable range',
        ]),
      },
    };

    runs.push(run);
  }

  return runs;
}
