import { faker } from '@faker-js/faker';
import type { Dataset } from '../types';

interface DatasetTemplate {
  name: string;
  display: string;
  desc: string;
  sampleColumns: { key: string; gen: () => unknown }[];
}

const DATASET_TEMPLATES: DatasetTemplate[] = [
  { name: 'coffee_inventory', display: 'Coffee Inventory', desc: 'Current stock of coffee beans across all warehouses',
    sampleColumns: [
      { key: 'warehouse_id', gen: () => faker.string.alphanumeric(6).toUpperCase() },
      { key: 'variety', gen: () => faker.helpers.arrayElement(['Arabica Bourbon', 'Arabica Catuai', 'Robusta', 'Arabica Typica', 'Caturra']) },
      { key: 'bags', gen: () => faker.number.int({ min: 10, max: 5000 }) },
      { key: 'weight_kg', gen: () => faker.number.float({ min: 600, max: 300000, fractionDigits: 1 }) },
      { key: 'grade', gen: () => faker.helpers.arrayElement(['Specialty', 'Premium', 'Standard', 'Commercial']) },
      { key: 'origin', gen: () => faker.helpers.arrayElement(['Minas Gerais', 'Espirito Santo', 'Bahia', 'Parana', 'Sao Paulo']) },
    ] },
  { name: 'farm_origins', display: 'Farm Origins', desc: 'Master data for partner farms and their geographical details',
    sampleColumns: [
      { key: 'farm_id', gen: () => `FARM-${faker.string.alphanumeric(5).toUpperCase()}` },
      { key: 'farm_name', gen: () => `Fazenda ${faker.person.lastName()}` },
      { key: 'region', gen: () => faker.helpers.arrayElement(['Cerrado Mineiro', 'Sul de Minas', 'Mogiana', 'Alta Paulista', 'Chapada Diamantina']) },
      { key: 'altitude_m', gen: () => faker.number.int({ min: 600, max: 1800 }) },
      { key: 'hectares', gen: () => faker.number.float({ min: 5, max: 500, fractionDigits: 1 }) },
      { key: 'certified', gen: () => faker.datatype.boolean({ probability: 0.6 }) },
    ] },
  { name: 'shipment_tracking', display: 'Shipment Tracking', desc: 'Real-time shipment status and tracking events',
    sampleColumns: [
      { key: 'shipment_id', gen: () => `SHP-${faker.string.alphanumeric(8).toUpperCase()}` },
      { key: 'container', gen: () => `MSKU${faker.string.numeric(7)}` },
      { key: 'origin_port', gen: () => faker.helpers.arrayElement(['Santos', 'Paranagua', 'Vitoria', 'Rio de Janeiro']) },
      { key: 'dest_port', gen: () => faker.helpers.arrayElement(['Hamburg', 'Le Havre', 'New York', 'Yokohama', 'Genoa']) },
      { key: 'status', gen: () => faker.helpers.arrayElement(['In Transit', 'At Port', 'Delivered', 'Customs Hold']) },
      { key: 'weight_tons', gen: () => faker.number.float({ min: 10, max: 25, fractionDigits: 2 }) },
    ] },
  { name: 'quality_scores', display: 'Quality Scores', desc: 'SCA cupping scores and quality assessment results',
    sampleColumns: [
      { key: 'sample_id', gen: () => `QS-${faker.string.alphanumeric(6).toUpperCase()}` },
      { key: 'lot_number', gen: () => `LOT-${faker.string.numeric(6)}` },
      { key: 'cupping_score', gen: () => faker.number.float({ min: 72, max: 95, fractionDigits: 1 }) },
      { key: 'acidity', gen: () => faker.number.float({ min: 6, max: 9, fractionDigits: 1 }) },
      { key: 'body', gen: () => faker.number.float({ min: 6, max: 9, fractionDigits: 1 }) },
      { key: 'flavor_notes', gen: () => faker.helpers.arrayElement(['Chocolate, Nutty', 'Fruity, Citrus', 'Floral, Honey', 'Caramel, Toffee']) },
    ] },
  { name: 'customer_orders', display: 'Customer Orders', desc: 'Customer purchase orders and fulfillment status',
    sampleColumns: [
      { key: 'order_id', gen: () => `ORD-${faker.string.numeric(8)}` },
      { key: 'customer', gen: () => faker.company.name() },
      { key: 'product', gen: () => faker.helpers.arrayElement(['Green Beans', 'Roasted Beans', 'Ground Coffee', 'Capsules']) },
      { key: 'quantity_kg', gen: () => faker.number.int({ min: 50, max: 20000 }) },
      { key: 'total_usd', gen: () => faker.number.float({ min: 500, max: 150000, fractionDigits: 2 }) },
      { key: 'status', gen: () => faker.helpers.arrayElement(['Confirmed', 'Processing', 'Shipped', 'Delivered', 'Invoiced']) },
    ] },
  { name: 'roasting_profiles', display: 'Roasting Profiles', desc: 'Temperature curves and roasting parameters by variety',
    sampleColumns: [
      { key: 'profile_id', gen: () => `RP-${faker.string.alphanumeric(4).toUpperCase()}` },
      { key: 'variety', gen: () => faker.helpers.arrayElement(['Bourbon', 'Catuai', 'Typica', 'Caturra', 'Mundo Novo']) },
      { key: 'roast_level', gen: () => faker.helpers.arrayElement(['Light', 'Medium', 'Medium-Dark', 'Dark']) },
      { key: 'temp_max_c', gen: () => faker.number.int({ min: 195, max: 230 }) },
      { key: 'duration_min', gen: () => faker.number.float({ min: 8, max: 16, fractionDigits: 1 }) },
      { key: 'first_crack_s', gen: () => faker.number.int({ min: 300, max: 600 }) },
    ] },
  { name: 'cupping_results', display: 'Cupping Results', desc: 'Detailed sensory evaluation notes and scores',
    sampleColumns: [
      { key: 'session_id', gen: () => `CUP-${faker.string.numeric(5)}` },
      { key: 'cupper', gen: () => faker.person.fullName() },
      { key: 'overall_score', gen: () => faker.number.float({ min: 75, max: 95, fractionDigits: 1 }) },
      { key: 'sweetness', gen: () => faker.number.float({ min: 6, max: 10, fractionDigits: 1 }) },
      { key: 'clean_cup', gen: () => faker.number.float({ min: 6, max: 10, fractionDigits: 1 }) },
      { key: 'uniformity', gen: () => faker.number.float({ min: 6, max: 10, fractionDigits: 1 }) },
    ] },
  { name: 'warehouse_stock', display: 'Warehouse Stock', desc: 'Inventory levels per warehouse location',
    sampleColumns: [
      { key: 'location_id', gen: () => `WH-${faker.string.alphanumeric(3).toUpperCase()}` },
      { key: 'product_sku', gen: () => `SKU-${faker.string.numeric(6)}` },
      { key: 'quantity', gen: () => faker.number.int({ min: 0, max: 50000 }) },
      { key: 'capacity_pct', gen: () => faker.number.float({ min: 15, max: 98, fractionDigits: 1 }) },
      { key: 'last_count', gen: () => faker.date.recent({ days: 7 }).toISOString().split('T')[0] },
      { key: 'zone', gen: () => faker.helpers.arrayElement(['A1', 'A2', 'B1', 'B2', 'C1', 'Cold']) },
    ] },
  { name: 'export_documents', display: 'Export Documents', desc: 'Phytosanitary certificates and customs declarations',
    sampleColumns: [
      { key: 'doc_id', gen: () => `DOC-${faker.string.alphanumeric(8).toUpperCase()}` },
      { key: 'type', gen: () => faker.helpers.arrayElement(['Phytosanitary', 'Bill of Lading', 'Invoice', 'Certificate of Origin', 'Customs Declaration']) },
      { key: 'shipment_ref', gen: () => `SHP-${faker.string.alphanumeric(8).toUpperCase()}` },
      { key: 'issued_by', gen: () => faker.helpers.arrayElement(['MAPA', 'Customs Authority', 'Chamber of Commerce']) },
      { key: 'status', gen: () => faker.helpers.arrayElement(['Draft', 'Submitted', 'Approved', 'Rejected']) },
      { key: 'valid_until', gen: () => faker.date.soon({ days: 90 }).toISOString().split('T')[0] },
    ] },
  { name: 'pricing_history', display: 'Pricing History', desc: 'Historical FOB and CIF pricing per variety and grade',
    sampleColumns: [
      { key: 'date', gen: () => faker.date.recent({ days: 30 }).toISOString().split('T')[0] },
      { key: 'variety', gen: () => faker.helpers.arrayElement(['Arabica', 'Robusta', 'Conilon']) },
      { key: 'grade', gen: () => faker.helpers.arrayElement(['Specialty', 'Fine Cup', 'Good Cup', 'Standard']) },
      { key: 'fob_usd_lb', gen: () => faker.number.float({ min: 1.2, max: 6.5, fractionDigits: 2 }) },
      { key: 'cif_usd_lb', gen: () => faker.number.float({ min: 1.5, max: 7.2, fractionDigits: 2 }) },
      { key: 'volume_bags', gen: () => faker.number.int({ min: 100, max: 10000 }) },
    ] },
  { name: 'supplier_contracts', display: 'Supplier Contracts', desc: 'Active contracts with farms and cooperatives',
    sampleColumns: [
      { key: 'contract_id', gen: () => `CTR-${faker.string.numeric(6)}` },
      { key: 'supplier', gen: () => `Cooperativa ${faker.person.lastName()}` },
      { key: 'volume_bags', gen: () => faker.number.int({ min: 500, max: 50000 }) },
      { key: 'price_usd_bag', gen: () => faker.number.float({ min: 120, max: 350, fractionDigits: 2 }) },
      { key: 'start_date', gen: () => faker.date.recent({ days: 180 }).toISOString().split('T')[0] },
      { key: 'status', gen: () => faker.helpers.arrayElement(['Active', 'Pending Renewal', 'Expired', 'Negotiating']) },
    ] },
  { name: 'logistics_routes', display: 'Logistics Routes', desc: 'Shipping lanes, transit times, and carrier performance',
    sampleColumns: [
      { key: 'route_id', gen: () => `RT-${faker.string.alphanumeric(4).toUpperCase()}` },
      { key: 'origin', gen: () => faker.helpers.arrayElement(['Santos', 'Paranagua', 'Vitoria']) },
      { key: 'destination', gen: () => faker.helpers.arrayElement(['Hamburg', 'Le Havre', 'New York', 'Yokohama']) },
      { key: 'carrier', gen: () => faker.helpers.arrayElement(['Maersk', 'MSC', 'CMA CGM', 'Hapag-Lloyd']) },
      { key: 'transit_days', gen: () => faker.number.int({ min: 12, max: 45 }) },
      { key: 'avg_delay_days', gen: () => faker.number.float({ min: 0, max: 5, fractionDigits: 1 }) },
    ] },
  { name: 'weather_data', display: 'Weather Data', desc: 'Climate data for coffee-growing regions',
    sampleColumns: [
      { key: 'date', gen: () => faker.date.recent({ days: 14 }).toISOString().split('T')[0] },
      { key: 'region', gen: () => faker.helpers.arrayElement(['Cerrado Mineiro', 'Sul de Minas', 'Mogiana', 'Chapada Diamantina']) },
      { key: 'temp_max_c', gen: () => faker.number.float({ min: 22, max: 38, fractionDigits: 1 }) },
      { key: 'temp_min_c', gen: () => faker.number.float({ min: 10, max: 22, fractionDigits: 1 }) },
      { key: 'rainfall_mm', gen: () => faker.number.float({ min: 0, max: 85, fractionDigits: 1 }) },
      { key: 'humidity_pct', gen: () => faker.number.int({ min: 30, max: 95 }) },
    ] },
  { name: 'certification_registry', display: 'Certification Registry', desc: 'Organic, Fair Trade, and Rainforest Alliance certifications',
    sampleColumns: [
      { key: 'cert_id', gen: () => `CERT-${faker.string.alphanumeric(6).toUpperCase()}` },
      { key: 'farm_name', gen: () => `Fazenda ${faker.person.lastName()}` },
      { key: 'certification', gen: () => faker.helpers.arrayElement(['Organic', 'Fair Trade', 'Rainforest Alliance', 'UTZ', '4C']) },
      { key: 'issued', gen: () => faker.date.past({ years: 1 }).toISOString().split('T')[0] },
      { key: 'expires', gen: () => faker.date.soon({ days: 365 }).toISOString().split('T')[0] },
      { key: 'status', gen: () => faker.helpers.arrayElement(['Valid', 'Expiring Soon', 'Under Review', 'Expired']) },
    ] },
  { name: 'harvest_schedule', display: 'Harvest Schedule', desc: 'Planned and actual harvest dates by region and farm',
    sampleColumns: [
      { key: 'season', gen: () => faker.helpers.arrayElement(['2025/26', '2024/25']) },
      { key: 'region', gen: () => faker.helpers.arrayElement(['Cerrado Mineiro', 'Sul de Minas', 'Mogiana', 'Bahia']) },
      { key: 'farm', gen: () => `Fazenda ${faker.person.lastName()}` },
      { key: 'planned_start', gen: () => faker.date.soon({ days: 90 }).toISOString().split('T')[0] },
      { key: 'actual_start', gen: () => faker.helpers.maybe(() => faker.date.recent({ days: 30 }).toISOString().split('T')[0]) ?? '' },
      { key: 'estimated_bags', gen: () => faker.number.int({ min: 200, max: 15000 }) },
    ] },
  { name: 'lab_analysis', display: 'Lab Analysis', desc: 'Moisture content, defect counts, and screen size distributions',
    sampleColumns: [
      { key: 'sample_id', gen: () => `LAB-${faker.string.alphanumeric(6).toUpperCase()}` },
      { key: 'lot', gen: () => `LOT-${faker.string.numeric(6)}` },
      { key: 'moisture_pct', gen: () => faker.number.float({ min: 9.5, max: 13.5, fractionDigits: 1 }) },
      { key: 'defects_per_300g', gen: () => faker.number.int({ min: 0, max: 45 }) },
      { key: 'screen_16_pct', gen: () => faker.number.float({ min: 40, max: 85, fractionDigits: 1 }) },
      { key: 'color', gen: () => faker.helpers.arrayElement(['Green', 'Greenish', 'Yellowish', 'Pale']) },
    ] },
  { name: 'financial_transactions', display: 'Financial Transactions', desc: 'Payments, receivables, and FX operations',
    sampleColumns: [
      { key: 'txn_id', gen: () => `TXN-${faker.string.numeric(8)}` },
      { key: 'type', gen: () => faker.helpers.arrayElement(['Payment', 'Receivable', 'FX Hedge', 'Invoice']) },
      { key: 'counterparty', gen: () => faker.company.name() },
      { key: 'amount_usd', gen: () => faker.number.float({ min: 1000, max: 500000, fractionDigits: 2 }) },
      { key: 'currency', gen: () => faker.helpers.arrayElement(['USD', 'BRL', 'EUR', 'JPY']) },
      { key: 'status', gen: () => faker.helpers.arrayElement(['Completed', 'Pending', 'Failed', 'Reconciled']) },
    ] },
  { name: 'employee_directory', display: 'Employee Directory', desc: 'Staff across offices, warehouses, and field operations',
    sampleColumns: [
      { key: 'employee_id', gen: () => `EMP-${faker.string.numeric(5)}` },
      { key: 'name', gen: () => faker.person.fullName() },
      { key: 'department', gen: () => faker.helpers.arrayElement(['Operations', 'Quality', 'Sales', 'Finance', 'IT', 'Logistics']) },
      { key: 'location', gen: () => faker.helpers.arrayElement(['Sao Paulo HQ', 'Santos Warehouse', 'Minas Field Office', 'New York Office']) },
      { key: 'role', gen: () => faker.helpers.arrayElement(['Analyst', 'Manager', 'Specialist', 'Director', 'Coordinator']) },
      { key: 'hire_date', gen: () => faker.date.past({ years: 5 }).toISOString().split('T')[0] },
    ] },
  { name: 'iot_sensor_readings', display: 'IoT Sensor Readings', desc: 'Temperature and humidity from warehouse sensors',
    sampleColumns: [
      { key: 'sensor_id', gen: () => `SNR-${faker.string.alphanumeric(4).toUpperCase()}` },
      { key: 'warehouse', gen: () => faker.helpers.arrayElement(['WH-Santos', 'WH-Paranagua', 'WH-Vitoria', 'WH-SP']) },
      { key: 'temperature_c', gen: () => faker.number.float({ min: 18, max: 32, fractionDigits: 1 }) },
      { key: 'humidity_pct', gen: () => faker.number.float({ min: 35, max: 75, fractionDigits: 1 }) },
      { key: 'timestamp', gen: () => faker.date.recent({ days: 1 }).toISOString() },
      { key: 'alert', gen: () => faker.helpers.maybe(() => faker.helpers.arrayElement(['High Temp', 'High Humidity'])) ?? 'None' },
    ] },
  { name: 'market_prices', display: 'Market Prices', desc: 'ICE futures and spot prices for arabica and robusta',
    sampleColumns: [
      { key: 'date', gen: () => faker.date.recent({ days: 30 }).toISOString().split('T')[0] },
      { key: 'commodity', gen: () => faker.helpers.arrayElement(['KC (Arabica)', 'RC (Robusta)']) },
      { key: 'contract', gen: () => faker.helpers.arrayElement(['Mar 26', 'May 26', 'Jul 26', 'Sep 26']) },
      { key: 'close_usd', gen: () => faker.number.float({ min: 1.1, max: 4.8, fractionDigits: 4 }) },
      { key: 'change_pct', gen: () => faker.number.float({ min: -5, max: 5, fractionDigits: 2 }) },
      { key: 'volume', gen: () => faker.number.int({ min: 5000, max: 80000 }) },
    ] },
  { name: 'blend_recipes', display: 'Blend Recipes', desc: 'Proprietary blend compositions and ratios',
    sampleColumns: [
      { key: 'blend_id', gen: () => `BLD-${faker.string.alphanumeric(4).toUpperCase()}` },
      { key: 'blend_name', gen: () => faker.helpers.arrayElement(['Morning Sunrise', 'Dark Reserve', 'Cerrado Select', 'Estate Blend', 'Premium Export']) },
      { key: 'origin_1', gen: () => faker.helpers.arrayElement(['Cerrado', 'Sul de Minas', 'Mogiana']) },
      { key: 'origin_1_pct', gen: () => faker.number.int({ min: 30, max: 70 }) },
      { key: 'origin_2', gen: () => faker.helpers.arrayElement(['Bahia', 'Espirito Santo', 'Parana']) },
      { key: 'target_score', gen: () => faker.number.float({ min: 80, max: 92, fractionDigits: 1 }) },
    ] },
  { name: 'defect_classifications', display: 'Defect Classifications', desc: 'Bean defect taxonomy and visual grading standards',
    sampleColumns: [
      { key: 'defect_code', gen: () => `DEF-${faker.string.numeric(3)}` },
      { key: 'category', gen: () => faker.helpers.arrayElement(['Black', 'Sour', 'Broken', 'Insect', 'Immature', 'Shell']) },
      { key: 'severity', gen: () => faker.helpers.arrayElement(['Full', 'Partial', 'Minor']) },
      { key: 'points', gen: () => faker.number.int({ min: 1, max: 5 }) },
      { key: 'description', gen: () => faker.lorem.sentence(4) },
      { key: 'is_primary', gen: () => faker.datatype.boolean() },
    ] },
  { name: 'port_operations', display: 'Port Operations', desc: 'Container loading, vessel schedules, and port fees',
    sampleColumns: [
      { key: 'operation_id', gen: () => `POP-${faker.string.numeric(7)}` },
      { key: 'port', gen: () => faker.helpers.arrayElement(['Santos', 'Paranagua', 'Vitoria']) },
      { key: 'vessel', gen: () => `MV ${faker.person.lastName().toUpperCase()}` },
      { key: 'containers', gen: () => faker.number.int({ min: 1, max: 50 }) },
      { key: 'fee_usd', gen: () => faker.number.float({ min: 500, max: 15000, fractionDigits: 2 }) },
      { key: 'status', gen: () => faker.helpers.arrayElement(['Scheduled', 'Loading', 'Departed', 'Cancelled']) },
    ] },
  { name: 'customer_feedback', display: 'Customer Feedback', desc: 'Buyer satisfaction surveys and complaint records',
    sampleColumns: [
      { key: 'ticket_id', gen: () => `FB-${faker.string.numeric(6)}` },
      { key: 'customer', gen: () => faker.company.name() },
      { key: 'category', gen: () => faker.helpers.arrayElement(['Quality', 'Delivery', 'Pricing', 'Packaging', 'Documentation']) },
      { key: 'rating', gen: () => faker.number.int({ min: 1, max: 5 }) },
      { key: 'sentiment', gen: () => faker.helpers.arrayElement(['Positive', 'Neutral', 'Negative']) },
      { key: 'resolved', gen: () => faker.datatype.boolean({ probability: 0.7 }) },
    ] },
  { name: 'demand_forecast', display: 'Demand Forecast', desc: 'ML-based demand predictions by region and variety',
    sampleColumns: [
      { key: 'forecast_period', gen: () => faker.helpers.arrayElement(['2026-Q1', '2026-Q2', '2026-Q3', '2026-Q4']) },
      { key: 'region', gen: () => faker.helpers.arrayElement(['Europe', 'North America', 'Asia Pacific', 'Middle East']) },
      { key: 'variety', gen: () => faker.helpers.arrayElement(['Arabica', 'Robusta', 'Blends']) },
      { key: 'predicted_bags', gen: () => faker.number.int({ min: 5000, max: 200000 }) },
      { key: 'confidence', gen: () => faker.number.float({ min: 0.7, max: 0.98, fractionDigits: 2 }) },
      { key: 'model_version', gen: () => faker.helpers.arrayElement(['v3.2', 'v3.1', 'v2.9']) },
    ] },
];

const SCHEMAS = ['raw', 'bronze', 'silver', 'gold', 'reporting'];
const DATABASES = ['analytics_warehouse', 'operational_db', 'data_lake'];
const OWNERS = ['Data Engineering', 'Analytics', 'BI Team', 'Data Science', 'Platform Team'];
const TAGS = ['production', 'staging', 'pii', 'sla-critical', 'certified', 'deprecated', 'experimental', 'core'];
const SOURCES = ['SAP ERP', 'PostgreSQL', 'Salesforce', 'IoT Hub', 'Shipping API', 'Weather API', 'Manual Upload', 'Kafka Stream'];
const FREQUENCIES = ['Real-time', 'Hourly', 'Daily', 'Weekly', 'Monthly'];

function generateSampleRows(columns: { key: string; gen: () => unknown }[]): Record<string, unknown>[] {
  return Array.from({ length: 10 }, () => {
    const row: Record<string, unknown> = {};
    for (const col of columns) {
      row[col.key] = col.gen();
    }
    return row;
  });
}

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
      criticality: faker.helpers.weightedArrayElement([
        { value: 'Critical' as const, weight: 0.1 },
        { value: 'High' as const, weight: 0.25 },
        { value: 'Medium' as const, weight: 0.4 },
        { value: 'Low' as const, weight: 0.25 },
      ]),
      freshness: {
        lastUpdated: faker.date.recent({ days: 2 }),
        updateFrequency: faker.helpers.arrayElement(FREQUENCIES),
      },
      source: faker.helpers.arrayElement(SOURCES),
      createdAt: faker.date.past({ years: 2 }),
      sampleData: generateSampleRows(template.sampleColumns),
    });
  }

  return datasets;
}
