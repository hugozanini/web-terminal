import { faker } from '@faker-js/faker';
import type { Dataset } from '../types';

const DATASET_TEMPLATES = [
  { name: 'coffee_inventory', display: 'Coffee Inventory', desc: 'Current stock of coffee beans across all warehouses' },
  { name: 'farm_origins', display: 'Farm Origins', desc: 'Master data for partner farms and their geographical details' },
  { name: 'shipment_tracking', display: 'Shipment Tracking', desc: 'Real-time shipment status and tracking events' },
  { name: 'quality_scores', display: 'Quality Scores', desc: 'SCA cupping scores and quality assessment results' },
  { name: 'customer_orders', display: 'Customer Orders', desc: 'Customer purchase orders and fulfillment status' },
  { name: 'roasting_profiles', display: 'Roasting Profiles', desc: 'Temperature curves and roasting parameters by variety' },
  { name: 'cupping_results', display: 'Cupping Results', desc: 'Detailed sensory evaluation notes and scores' },
  { name: 'warehouse_stock', display: 'Warehouse Stock', desc: 'Inventory levels per warehouse location' },
  { name: 'export_documents', display: 'Export Documents', desc: 'Phytosanitary certificates and customs declarations' },
  { name: 'pricing_history', display: 'Pricing History', desc: 'Historical FOB and CIF pricing per variety and grade' },
  { name: 'supplier_contracts', display: 'Supplier Contracts', desc: 'Active contracts with farms and cooperatives' },
  { name: 'logistics_routes', display: 'Logistics Routes', desc: 'Shipping lanes, transit times, and carrier performance' },
  { name: 'weather_data', display: 'Weather Data', desc: 'Climate data for coffee-growing regions' },
  { name: 'certification_registry', display: 'Certification Registry', desc: 'Organic, Fair Trade, and Rainforest Alliance certifications' },
  { name: 'harvest_schedule', display: 'Harvest Schedule', desc: 'Planned and actual harvest dates by region and farm' },
  { name: 'lab_analysis', display: 'Lab Analysis', desc: 'Moisture content, defect counts, and screen size distributions' },
  { name: 'financial_transactions', display: 'Financial Transactions', desc: 'Payments, receivables, and FX operations' },
  { name: 'employee_directory', display: 'Employee Directory', desc: 'Staff across offices, warehouses, and field operations' },
  { name: 'iot_sensor_readings', display: 'IoT Sensor Readings', desc: 'Temperature and humidity from warehouse sensors' },
  { name: 'market_prices', display: 'Market Prices', desc: 'ICE futures and spot prices for arabica and robusta' },
  { name: 'blend_recipes', display: 'Blend Recipes', desc: 'Proprietary blend compositions and ratios' },
  { name: 'defect_classifications', display: 'Defect Classifications', desc: 'Bean defect taxonomy and visual grading standards' },
  { name: 'port_operations', display: 'Port Operations', desc: 'Container loading, vessel schedules, and port fees' },
  { name: 'customer_feedback', display: 'Customer Feedback', desc: 'Buyer satisfaction surveys and complaint records' },
  { name: 'demand_forecast', display: 'Demand Forecast', desc: 'ML-based demand predictions by region and variety' },
];

const SCHEMAS = ['raw', 'bronze', 'silver', 'gold', 'reporting'];
const DATABASES = ['analytics_warehouse', 'operational_db', 'data_lake'];
const OWNERS = ['Data Engineering', 'Analytics', 'BI Team', 'Data Science', 'Platform Team'];
const TAGS = ['production', 'staging', 'pii', 'sla-critical', 'certified', 'deprecated', 'experimental', 'core'];
const SOURCES = ['SAP ERP', 'PostgreSQL', 'Salesforce', 'IoT Hub', 'Shipping API', 'Weather API', 'Manual Upload', 'Kafka Stream'];
const FREQUENCIES = ['Real-time', 'Hourly', 'Daily', 'Weekly', 'Monthly'];

export function generateDatasets(count: number): Dataset[] {
  const datasets: Dataset[] = [];

  for (let i = 0; i < count; i++) {
    const template = DATASET_TEMPLATES[i % DATASET_TEMPLATES.length];
    const suffix = i >= DATASET_TEMPLATES.length ? `_v${Math.floor(i / DATASET_TEMPLATES.length) + 1}` : '';
    const schema = faker.helpers.arrayElement(SCHEMAS);

    datasets.push({
      id: faker.string.uuid(),
      name: `${template.name}${suffix}`,
      displayName: `${template.display}${suffix ? ` V${Math.floor(i / DATASET_TEMPLATES.length) + 1}` : ''}`,
      type: faker.helpers.weightedArrayElement([
        { value: 'Table' as const, weight: 0.55 },
        { value: 'View' as const, weight: 0.25 },
        { value: 'Materialized View' as const, weight: 0.12 },
        { value: 'External Table' as const, weight: 0.08 },
      ]),
      schema: {
        database: faker.helpers.arrayElement(DATABASES),
        schema,
      },
      description: template.desc,
      columns: faker.number.int({ min: 5, max: 120 }),
      rows: faker.number.int({ min: 100, max: 50_000_000 }),
      sizeBytes: faker.number.int({ min: 1024, max: 500_000_000_000 }),
      owner: faker.helpers.arrayElement(OWNERS),
      tags: faker.helpers.arrayElements(TAGS, { min: 1, max: 3 }),
      qualityScore: faker.number.float({ min: 60, max: 100, fractionDigits: 1 }),
      freshness: {
        lastUpdated: faker.date.between({ from: new Date(2025, 10, 1), to: new Date(2026, 1, 28) }),
        updateFrequency: faker.helpers.arrayElement(FREQUENCIES),
      },
      source: faker.helpers.arrayElement(SOURCES),
      createdAt: faker.date.between({ from: new Date(2024, 0, 1), to: new Date(2025, 6, 1) }),
    });
  }

  return datasets;
}
