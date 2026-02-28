import { faker } from '@faker-js/faker';
import type { Shipment, TrackingEvent } from '../types';

const BRAZILIAN_PORTS = [
  { port: 'Port of Santos', city: 'Santos', state: 'São Paulo' },
  { port: 'Port of Rio de Janeiro', city: 'Rio de Janeiro', state: 'Rio de Janeiro' },
  { port: 'Port of Vitória', city: 'Vitória', state: 'Espírito Santo' },
  { port: 'Port of Paranaguá', city: 'Paranaguá', state: 'Paraná' },
];

const DESTINATION_PORTS = [
  { port: 'Port of Hamburg', country: 'Germany' },
  { port: 'Port of Rotterdam', country: 'Netherlands' },
  { port: 'Port of Antwerp', country: 'Belgium' },
  { port: 'Port of New Orleans', country: 'USA' },
  { port: 'Port of Oakland', country: 'USA' },
  { port: 'Port of Long Beach', country: 'USA' },
  { port: 'Port of Kobe', country: 'Japan' },
  { port: 'Port of Genoa', country: 'Italy' },
  { port: 'Port of Le Havre', country: 'France' },
];

function generateTrackingEvents(departureDate: Date, status: Shipment['status']): TrackingEvent[] {
  const events: TrackingEvent[] = [];
  const currentDate = new Date(departureDate);

  events.push({
    timestamp: new Date(currentDate),
    location: 'Port of Origin',
    status: 'Loaded',
    description: 'Container loaded onto vessel',
  });

  if (status !== 'Preparing') {
    currentDate.setDate(currentDate.getDate() + 3);
    events.push({
      timestamp: new Date(currentDate),
      location: 'Atlantic Ocean',
      status: 'In Transit',
      description: 'Vessel departed and in transit',
    });
  }

  if (status === 'Customs' || status === 'Delivered') {
    currentDate.setDate(currentDate.getDate() + 15);
    events.push({
      timestamp: new Date(currentDate),
      location: 'Destination Port',
      status: 'Arrived',
      description: 'Vessel arrived at destination port',
    });
  }

  if (status === 'Delivered') {
    currentDate.setDate(currentDate.getDate() + 2);
    events.push({
      timestamp: new Date(currentDate),
      location: 'Customer Warehouse',
      status: 'Delivered',
      description: 'Container delivered to customer',
    });
  }

  return events;
}

export function generateShipments(count: number, batchIds: string[]): Shipment[] {
  const shipments: Shipment[] = [];

  for (let i = 0; i < count; i++) {
    const origin = faker.helpers.arrayElement(BRAZILIAN_PORTS);
    const destination = faker.helpers.arrayElement(DESTINATION_PORTS);
    const status = faker.helpers.arrayElement(['Preparing', 'In Transit', 'Customs', 'Delivered'] as const);

    const departureDate = faker.date.between({
      from: new Date(2025, 9, 1),
      to: new Date(2026, 1, 1),
    });

    const estimatedArrival = new Date(departureDate);
    estimatedArrival.setDate(estimatedArrival.getDate() + faker.number.int({ min: 20, max: 35 }));

    const shipment: Shipment = {
      id: faker.string.uuid(),
      shipmentNumber: `SHP-${faker.string.alphanumeric(10).toUpperCase()}`,
      batchIds: faker.helpers.arrayElements(batchIds, { min: 5, max: 15 }),
      origin,
      destination: {
        ...destination,
        customer: faker.company.name() + ' Coffee Roasters',
      },
      containerNumber: `${faker.string.alpha({ length: 4, casing: 'upper' })}${faker.number.int({ min: 100000, max: 999999 })}`,
      weight: faker.number.int({ min: 15000, max: 25000 }),
      departureDate,
      estimatedArrival,
      actualArrival: status === 'Delivered' ? estimatedArrival : undefined,
      status,
      trackingEvents: generateTrackingEvents(departureDate, status),
    };

    shipments.push(shipment);
  }

  return shipments;
}
