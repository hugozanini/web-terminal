import { faker } from '@faker-js/faker';
import type { DataSource } from '../types';

const SOURCE_TEMPLATES: { name: string; type: DataSource['type']; system: string; desc: string }[] = [
  { name: 'SAP ERP', type: 'Database', system: 'SAP S/4HANA', desc: 'Enterprise resource planning system for financials and procurement' },
  { name: 'Farm PostgreSQL', type: 'Database', system: 'PostgreSQL 15', desc: 'Operational database for farm management and contracts' },
  { name: 'Salesforce CRM', type: 'API', system: 'Salesforce', desc: 'Customer relationship management and order pipeline' },
  { name: 'IoT Warehouse Sensors', type: 'IoT', system: 'Azure IoT Hub', desc: 'Temperature and humidity sensors across warehouses' },
  { name: 'Shipping Carrier API', type: 'API', system: 'Maersk Track API', desc: 'Real-time container tracking and vessel schedules' },
  { name: 'Weather Service', type: 'API', system: 'OpenWeather API', desc: 'Climate data for coffee-growing regions in Brazil' },
  { name: 'Quality Lab LIMS', type: 'Database', system: 'MySQL 8', desc: 'Laboratory information management for cupping and analysis' },
  { name: 'ICE Market Feed', type: 'Stream', system: 'Kafka', desc: 'Real-time commodity futures prices from ICE exchange' },
  { name: 'HR System', type: 'API', system: 'Workday', desc: 'Employee data, payroll, and organizational structure' },
  { name: 'Warehouse WMS', type: 'Database', system: 'Oracle DB', desc: 'Warehouse management system for inventory and logistics' },
  { name: 'Certification Bodies', type: 'API', system: 'REST API', desc: 'Fair Trade, Rainforest Alliance certification status feeds' },
  { name: 'Port Authority Feed', type: 'Stream', system: 'Kafka', desc: 'Container terminal operations and berth schedules' },
  { name: 'Customer Portal', type: 'Database', system: 'MongoDB', desc: 'Self-service portal data including orders and feedback' },
  { name: 'Excel Uploads', type: 'File', system: 'SharePoint', desc: 'Manual spreadsheet uploads from field operations' },
  { name: 'Google Analytics', type: 'API', system: 'GA4', desc: 'Website and portal usage analytics' },
  { name: 'Payment Gateway', type: 'API', system: 'Stripe', desc: 'Payment processing and settlement records' },
  { name: 'IoT Farm Stations', type: 'IoT', system: 'AWS IoT Core', desc: 'Soil moisture and micro-climate stations on partner farms' },
  { name: 'Email Marketing', type: 'API', system: 'Mailchimp', desc: 'Campaign performance and subscriber engagement data' },
  { name: 'Logistics TMS', type: 'Database', system: 'PostgreSQL 14', desc: 'Transportation management system for route optimization' },
  { name: 'Document Storage', type: 'File', system: 'AWS S3', desc: 'Scanned certificates, contracts, and phytosanitary docs' },
];

const OWNERS = ['Data Engineering', 'Platform Team', 'IT Operations', 'Analytics'];

export function generateDataSources(count: number): DataSource[] {
  const sources: DataSource[] = [];

  for (let i = 0; i < count; i++) {
    const template = SOURCE_TEMPLATES[i % SOURCE_TEMPLATES.length];

    sources.push({
      id: faker.string.uuid(),
      name: template.name,
      type: template.type,
      system: template.system,
      connectionStatus: faker.helpers.weightedArrayElement([
        { value: 'Connected' as const, weight: 0.8 },
        { value: 'Degraded' as const, weight: 0.12 },
        { value: 'Disconnected' as const, weight: 0.08 },
      ]),
      datasetsCount: faker.number.int({ min: 1, max: 12 }),
      lastSync: faker.date.between({ from: new Date(2026, 1, 20), to: new Date(2026, 1, 28) }),
      owner: faker.helpers.arrayElement(OWNERS),
      description: template.desc,
    });
  }

  return sources;
}
