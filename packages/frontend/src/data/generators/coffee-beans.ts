import { faker } from '@faker-js/faker';
import type { CoffeeBeanSample } from '../types';

// Brazilian coffee regions and their coordinates
const BRAZILIAN_REGIONS = [
  { state: 'Minas Gerais', region: 'Sul de Minas', lat: -21.7642, lng: -45.1842 },
  { state: 'Minas Gerais', region: 'Cerrado Mineiro', lat: -18.9188, lng: -46.8753 },
  { state: 'São Paulo', region: 'Mogiana', lat: -21.3045, lng: -47.3714 },
  { state: 'Espírito Santo', region: 'Montanhas do Espírito Santo', lat: -20.3155, lng: -41.0789 },
  { state: 'Bahia', region: 'Planalto da Bahia', lat: -13.3369, lng: -42.0076 },
  { state: 'Paraná', region: 'Norte Pioneiro', lat: -23.3045, lng: -50.6145 },
];

const SUB_VARIETIES = [
  'Bourbon', 'Catuaí', 'Mundo Novo', 'Icatu', 'Acaiá', 'Catucaí', 'Topázio', 'IAC', 'Obatã'
];

const PROCESSING_METHODS: CoffeeBeanSample['processingMethod'][] = [
  'Natural', 'Pulped Natural', 'Washed', 'Honey'
];

const CERTIFICATIONS = [
  'Organic', 'Fair Trade', 'Rainforest Alliance', 'UTZ', '4C', 'Bird Friendly'
];

export function generateCoffeeBeans(count: number): CoffeeBeanSample[] {
  const beans: CoffeeBeanSample[] = [];

  for (let i = 0; i < count; i++) {
    const region = faker.helpers.arrayElement(BRAZILIAN_REGIONS);
    const variety = faker.helpers.weightedArrayElement([
      { value: 'Arabica' as const, weight: 0.75 },
      { value: 'Robusta' as const, weight: 0.23 },
      { value: 'Liberica' as const, weight: 0.02 },
    ]);

    const bean: CoffeeBeanSample = {
      id: faker.string.uuid(),
      batchNumber: `HC-${faker.string.alphanumeric(8).toUpperCase()}`,
      variety,
      subVariety: faker.helpers.arrayElement(SUB_VARIETIES),
      origin: {
        farm: `Fazenda ${faker.location.city()}`,
        region: region.region,
        state: region.state,
        coordinates: {
          lat: region.lat + faker.number.float({ min: -0.5, max: 0.5, fractionDigits: 4 }),
          lng: region.lng + faker.number.float({ min: -0.5, max: 0.5, fractionDigits: 4 }),
        },
      },
      harvestDate: faker.date.between({
        from: new Date(2025, 3, 1),
        to: new Date(2025, 8, 30),
      }),
      processingMethod: faker.helpers.arrayElement(PROCESSING_METHODS),
      gradeScore: faker.number.float({ min: 75, max: 95, fractionDigits: 1 }),
      moistureContent: faker.number.float({ min: 10, max: 12.5, fractionDigits: 1 }),
      defectCount: faker.number.int({ min: 0, max: 15 }),
      bagWeight: faker.helpers.arrayElement([60, 69]), // Standard coffee bag weights
      certifications: faker.helpers.arrayElements(CERTIFICATIONS, { min: 0, max: 3 }),
    };

    beans.push(bean);
  }

  return beans;
}
