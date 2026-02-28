import { faker } from '@faker-js/faker';
import type { CostEntry } from '../types';

const COST_CATEGORIES: Array<{
  category: CostEntry['category'];
  subcategories: string[];
}> = [
  {
    category: 'Production',
    subcategories: ['Seeds & Seedlings', 'Fertilizers', 'Pesticides', 'Water & Irrigation', 'Farm Maintenance'],
  },
  {
    category: 'Processing',
    subcategories: ['Washing', 'Drying', 'Hulling', 'Sorting', 'Quality Control'],
  },
  {
    category: 'Shipping',
    subcategories: ['Container Transport', 'Ocean Freight', 'Port Handling', 'Insurance', 'Customs Clearance'],
  },
  {
    category: 'Export',
    subcategories: ['Export License', 'Documentation', 'Inspection Fees', 'Certification', 'Brokerage'],
  },
  {
    category: 'Labor',
    subcategories: ['Harvest Labor', 'Processing Labor', 'Quality Control Staff', 'Administrative', 'Management'],
  },
  {
    category: 'Equipment',
    subcategories: ['Machinery Purchase', 'Maintenance', 'Fuel & Energy', 'Spare Parts', 'Depreciation'],
  },
];

export function generateCosts(count: number, entityIds: string[]): CostEntry[] {
  const costs: CostEntry[] = [];

  for (let i = 0; i < count; i++) {
    const categoryData = faker.helpers.arrayElement(COST_CATEGORIES);
    const subcategory = faker.helpers.arrayElement(categoryData.subcategories);
    const entityType = faker.helpers.arrayElement(['Batch', 'Shipment', 'Run'] as const);

    // Generate base amount
    const baseAmount = faker.number.float({
      min: categoryData.category === 'Equipment' ? 5000 : 500,
      max: categoryData.category === 'Shipping' ? 50000 : 20000,
      fractionDigits: 2,
    });

    // Generate breakdown for some categories
    let breakdown: CostEntry['breakdown'] = undefined;
    if (faker.datatype.boolean(0.3)) {
      const itemCount = faker.number.int({ min: 2, max: 5 });
      breakdown = [];
      let remainingAmount = baseAmount;

      for (let j = 0; j < itemCount - 1; j++) {
        const itemCost = faker.number.float({
          min: remainingAmount * 0.1,
          max: remainingAmount * 0.4,
          fractionDigits: 2,
        });
        breakdown.push({
          item: faker.commerce.productName(),
          cost: itemCost,
        });
        remainingAmount -= itemCost;
      }

      // Add final item with remaining amount
      breakdown.push({
        item: faker.commerce.productName(),
        cost: remainingAmount,
      });
    }

    const cost: CostEntry = {
      id: faker.string.uuid(),
      category: categoryData.category,
      subcategory,
      entityType,
      entityId: faker.helpers.arrayElement(entityIds),
      amount: baseAmount,
      currency: 'USD',
      date: faker.date.between({
        from: new Date(2025, 5, 1),
        to: new Date(2026, 1, 1),
      }),
      description: `${subcategory} cost for ${entityType.toLowerCase()}`,
      breakdown,
    };

    costs.push(cost);
  }

  return costs;
}
