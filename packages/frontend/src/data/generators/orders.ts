import { faker } from '@faker-js/faker';
import type { Order, OrderItem } from '../types';

const CUSTOMER_COUNTRIES = [
  'USA', 'Germany', 'Italy', 'Japan', 'Belgium', 'Netherlands', 'France', 'Canada', 'South Korea', 'United Kingdom'
];

export function generateOrders(count: number, batchIds: string[]): Order[] {
  const orders: Order[] = [];

  for (let i = 0; i < count; i++) {
    const itemCount = faker.number.int({ min: 1, max: 5 });
    const items: OrderItem[] = [];
    let totalWeight = 0;
    let totalValue = 0;

    for (let j = 0; j < itemCount; j++) {
      const quantity = faker.number.int({ min: 1000, max: 5000 });
      const pricePerKg = faker.number.float({ min: 4.5, max: 12.0, fractionDigits: 2 });
      const total = quantity * pricePerKg;

      items.push({
        batchId: faker.helpers.arrayElement(batchIds),
        quantity,
        pricePerKg,
        total,
      });

      totalWeight += quantity;
      totalValue += total;
    }

    const orderDate = faker.date.between({
      from: new Date(2025, 8, 1),
      to: new Date(2026, 0, 1),
    });

    const requestedDelivery = new Date(orderDate);
    requestedDelivery.setDate(requestedDelivery.getDate() + faker.number.int({ min: 30, max: 90 }));

    const order: Order = {
      id: faker.string.uuid(),
      orderNumber: `ORD-${faker.string.alphanumeric(8).toUpperCase()}`,
      customer: {
        name: faker.company.name() + ' ' + faker.helpers.arrayElement(['Coffee', 'Roasters', 'Beans', 'Trading']),
        country: faker.helpers.arrayElement(CUSTOMER_COUNTRIES),
        type: faker.helpers.arrayElement(['Roaster', 'Distributor', 'Retailer'] as const),
      },
      items,
      totalWeight,
      totalValue,
      currency: 'USD',
      orderDate,
      requestedDelivery,
      status: faker.helpers.arrayElement(['Pending', 'Processing', 'Shipped', 'Delivered'] as const),
      paymentTerms: faker.helpers.arrayElement(['Net 30', 'Net 60', 'Letter of Credit', 'Prepaid']),
    };

    orders.push(order);
  }

  return orders;
}
