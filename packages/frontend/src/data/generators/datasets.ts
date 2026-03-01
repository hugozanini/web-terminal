import { faker } from '@faker-js/faker';
import type { Dataset, QualityDashboard } from '../types';

interface DatasetTemplate {
  name: string;
  display: string;
  desc: string;
  sampleColumns: { name: string; type: string; description: string; gen: () => unknown }[];
}

const DATASET_TEMPLATES: DatasetTemplate[] = [
  { name: 'coffee_inventory', display: 'Coffee Inventory', desc: 'Current stock of coffee beans across all warehouses',
    sampleColumns: [
      { name: 'warehouse_id', type: 'string', description: 'Warehouse Id value', gen: () => faker.string.alphanumeric(6).toUpperCase() },
      { name: 'variety', type: 'string', description: 'Variety value', gen: () => faker.helpers.arrayElement(['Arabica Bourbon', 'Arabica Catuai', 'Robusta', 'Arabica Typica', 'Caturra']) },
      { name: 'bags', type: 'number', description: 'Bags value', gen: () => faker.number.int({ min: 10, max: 5000 }) },
      { name: 'weight_kg', type: 'number', description: 'Weight Kg value', gen: () => faker.number.float({ min: 600, max: 300000, fractionDigits: 1 }) },
      { name: 'grade', type: 'string', description: 'Grade value', gen: () => faker.helpers.arrayElement(['Specialty', 'Premium', 'Standard', 'Commercial']) },
      { name: 'origin', type: 'string', description: 'Origin value', gen: () => faker.helpers.arrayElement(['Minas Gerais', 'Espirito Santo', 'Bahia', 'Parana', 'Sao Paulo']) },
    ] },
  { name: 'farm_origins', display: 'Farm Origins', desc: 'Master data for partner farms and their geographical details',
    sampleColumns: [
      { name: 'farm_id', type: 'string', description: 'Farm Id value', gen: () => `FARM-${faker.string.alphanumeric(5).toUpperCase()}` },
      { name: 'farm_name', type: 'string', description: 'Farm Name value', gen: () => `Fazenda ${faker.person.lastName()}` },
      { name: 'region', type: 'string', description: 'Region value', gen: () => faker.helpers.arrayElement(['Cerrado Mineiro', 'Sul de Minas', 'Mogiana', 'Alta Paulista', 'Chapada Diamantina']) },
      { name: 'altitude_m', type: 'number', description: 'Altitude M value', gen: () => faker.number.int({ min: 600, max: 1800 }) },
      { name: 'hectares', type: 'string', description: 'Hectares value', gen: () => faker.number.float({ min: 5, max: 500, fractionDigits: 1 }) },
      { name: 'certified', type: 'boolean', description: 'Certified value', gen: () => faker.datatype.boolean({ probability: 0.6 }) },
    ] },
  { name: 'shipment_tracking', display: 'Shipment Tracking', desc: 'Real-time shipment status and tracking events',
    sampleColumns: [
      { name: 'shipment_id', type: 'string', description: 'Shipment Id value', gen: () => `SHP-${faker.string.alphanumeric(8).toUpperCase()}` },
      { name: 'container', type: 'string', description: 'Container value', gen: () => `MSKU${faker.string.numeric(7)}` },
      { name: 'origin_port', type: 'string', description: 'Origin Port value', gen: () => faker.helpers.arrayElement(['Santos', 'Paranagua', 'Vitoria', 'Rio de Janeiro']) },
      { name: 'dest_port', type: 'string', description: 'Dest Port value', gen: () => faker.helpers.arrayElement(['Hamburg', 'Le Havre', 'New York', 'Yokohama', 'Genoa']) },
      { name: 'status', type: 'string', description: 'Status value', gen: () => faker.helpers.arrayElement(['In Transit', 'At Port', 'Delivered', 'Customs Hold']) },
      { name: 'weight_tons', type: 'string', description: 'Weight Tons value', gen: () => faker.number.float({ min: 10, max: 25, fractionDigits: 2 }) },
    ] },
  { name: 'quality_scores', display: 'Quality Scores', desc: 'SCA cupping scores and quality assessment results',
    sampleColumns: [
      { name: 'sample_id', type: 'string', description: 'Sample Id value', gen: () => `QS-${faker.string.alphanumeric(6).toUpperCase()}` },
      { name: 'lot_number', type: 'string', description: 'Lot Number value', gen: () => `LOT-${faker.string.numeric(6)}` },
      { name: 'cupping_score', type: 'number', description: 'Cupping Score value', gen: () => faker.number.float({ min: 72, max: 95, fractionDigits: 1 }) },
      { name: 'acidity', type: 'string', description: 'Acidity value', gen: () => faker.number.float({ min: 6, max: 9, fractionDigits: 1 }) },
      { name: 'body', type: 'string', description: 'Body value', gen: () => faker.number.float({ min: 6, max: 9, fractionDigits: 1 }) },
      { name: 'flavor_notes', type: 'string', description: 'Flavor Notes value', gen: () => faker.helpers.arrayElement(['Chocolate, Nutty', 'Fruity, Citrus', 'Floral, Honey', 'Caramel, Toffee']) },
    ] },
  { name: 'customer_orders', display: 'Customer Orders', desc: 'Customer purchase orders and fulfillment status',
    sampleColumns: [
      { name: 'order_id', type: 'string', description: 'Order Id value', gen: () => `ORD-${faker.string.numeric(8)}` },
      { name: 'customer', type: 'string', description: 'Customer value', gen: () => faker.company.name() },
      { name: 'product', type: 'string', description: 'Product value', gen: () => faker.helpers.arrayElement(['Green Beans', 'Roasted Beans', 'Ground Coffee', 'Capsules']) },
      { name: 'quantity_kg', type: 'number', description: 'Quantity Kg value', gen: () => faker.number.int({ min: 50, max: 20000 }) },
      { name: 'total_usd', type: 'number', description: 'Total Usd value', gen: () => faker.number.float({ min: 500, max: 150000, fractionDigits: 2 }) },
      { name: 'status', type: 'string', description: 'Status value', gen: () => faker.helpers.arrayElement(['Confirmed', 'Processing', 'Shipped', 'Delivered', 'Invoiced']) },
    ] },
  { name: 'roasting_profiles', display: 'Roasting Profiles', desc: 'Temperature curves and roasting parameters by variety',
    sampleColumns: [
      { name: 'profile_id', type: 'string', description: 'Profile Id value', gen: () => `RP-${faker.string.alphanumeric(4).toUpperCase()}` },
      { name: 'variety', type: 'string', description: 'Variety value', gen: () => faker.helpers.arrayElement(['Bourbon', 'Catuai', 'Typica', 'Caturra', 'Mundo Novo']) },
      { name: 'roast_level', type: 'string', description: 'Roast Level value', gen: () => faker.helpers.arrayElement(['Light', 'Medium', 'Medium-Dark', 'Dark']) },
      { name: 'temp_max_c', type: 'number', description: 'Temp Max C value', gen: () => faker.number.int({ min: 195, max: 230 }) },
      { name: 'duration_min', type: 'string', description: 'Duration Min value', gen: () => faker.number.float({ min: 8, max: 16, fractionDigits: 1 }) },
      { name: 'first_crack_s', type: 'number', description: 'First Crack S value', gen: () => faker.number.int({ min: 300, max: 600 }) },
    ] },
  { name: 'cupping_results', display: 'Cupping Results', desc: 'Detailed sensory evaluation notes and scores',
    sampleColumns: [
      { name: 'session_id', type: 'string', description: 'Session Id value', gen: () => `CUP-${faker.string.numeric(5)}` },
      { name: 'cupper', type: 'string', description: 'Cupper value', gen: () => faker.person.fullName() },
      { name: 'overall_score', type: 'number', description: 'Overall Score value', gen: () => faker.number.float({ min: 75, max: 95, fractionDigits: 1 }) },
      { name: 'sweetness', type: 'string', description: 'Sweetness value', gen: () => faker.number.float({ min: 6, max: 10, fractionDigits: 1 }) },
      { name: 'clean_cup', type: 'string', description: 'Clean Cup value', gen: () => faker.number.float({ min: 6, max: 10, fractionDigits: 1 }) },
      { name: 'uniformity', type: 'string', description: 'Uniformity value', gen: () => faker.number.float({ min: 6, max: 10, fractionDigits: 1 }) },
    ] },
  { name: 'warehouse_stock', display: 'Warehouse Stock', desc: 'Inventory levels per warehouse location',
    sampleColumns: [
      { name: 'location_id', type: 'string', description: 'Location Id value', gen: () => `WH-${faker.string.alphanumeric(3).toUpperCase()}` },
      { name: 'product_sku', type: 'string', description: 'Product Sku value', gen: () => `SKU-${faker.string.numeric(6)}` },
      { name: 'quantity', type: 'number', description: 'Quantity value', gen: () => faker.number.int({ min: 0, max: 50000 }) },
      { name: 'capacity_pct', type: 'number', description: 'Capacity Pct value', gen: () => faker.number.float({ min: 15, max: 98, fractionDigits: 1 }) },
      { name: 'last_count', type: 'string', description: 'Last Count value', gen: () => faker.date.recent({ days: 7 }).toISOString().split('T')[0] },
      { name: 'zone', type: 'string', description: 'Zone value', gen: () => faker.helpers.arrayElement(['A1', 'A2', 'B1', 'B2', 'C1', 'Cold']) },
    ] },
  { name: 'export_documents', display: 'Export Documents', desc: 'Phytosanitary certificates and customs declarations',
    sampleColumns: [
      { name: 'doc_id', type: 'string', description: 'Doc Id value', gen: () => `DOC-${faker.string.alphanumeric(8).toUpperCase()}` },
      { name: 'type', type: 'string', description: 'Type value', gen: () => faker.helpers.arrayElement(['Phytosanitary', 'Bill of Lading', 'Invoice', 'Certificate of Origin', 'Customs Declaration']) },
      { name: 'shipment_ref', type: 'string', description: 'Shipment Ref value', gen: () => `SHP-${faker.string.alphanumeric(8).toUpperCase()}` },
      { name: 'issued_by', type: 'string', description: 'Issued By value', gen: () => faker.helpers.arrayElement(['MAPA', 'Customs Authority', 'Chamber of Commerce']) },
      { name: 'status', type: 'string', description: 'Status value', gen: () => faker.helpers.arrayElement(['Draft', 'Submitted', 'Approved', 'Rejected']) },
      { name: 'valid_until', type: 'string', description: 'Valid Until value', gen: () => faker.date.soon({ days: 90 }).toISOString().split('T')[0] },
    ] },
  { name: 'pricing_history', display: 'Pricing History', desc: 'Historical FOB and CIF pricing per variety and grade',
    sampleColumns: [
      { name: 'date', type: 'timestamp', description: 'Date value', gen: () => faker.date.recent({ days: 30 }).toISOString().split('T')[0] },
      { name: 'variety', type: 'string', description: 'Variety value', gen: () => faker.helpers.arrayElement(['Arabica', 'Robusta', 'Conilon']) },
      { name: 'grade', type: 'string', description: 'Grade value', gen: () => faker.helpers.arrayElement(['Specialty', 'Fine Cup', 'Good Cup', 'Standard']) },
      { name: 'fob_usd_lb', type: 'number', description: 'Fob Usd Lb value', gen: () => faker.number.float({ min: 1.2, max: 6.5, fractionDigits: 2 }) },
      { name: 'cif_usd_lb', type: 'number', description: 'Cif Usd Lb value', gen: () => faker.number.float({ min: 1.5, max: 7.2, fractionDigits: 2 }) },
      { name: 'volume_bags', type: 'number', description: 'Volume Bags value', gen: () => faker.number.int({ min: 100, max: 10000 }) },
    ] },
  { name: 'supplier_contracts', display: 'Supplier Contracts', desc: 'Active contracts with farms and cooperatives',
    sampleColumns: [
      { name: 'contract_id', type: 'string', description: 'Contract Id value', gen: () => `CTR-${faker.string.numeric(6)}` },
      { name: 'supplier', type: 'string', description: 'Supplier value', gen: () => `Cooperativa ${faker.person.lastName()}` },
      { name: 'volume_bags', type: 'number', description: 'Volume Bags value', gen: () => faker.number.int({ min: 500, max: 50000 }) },
      { name: 'price_usd_bag', type: 'number', description: 'Price Usd Bag value', gen: () => faker.number.float({ min: 120, max: 350, fractionDigits: 2 }) },
      { name: 'start_date', type: 'timestamp', description: 'Start Date value', gen: () => faker.date.recent({ days: 180 }).toISOString().split('T')[0] },
      { name: 'status', type: 'string', description: 'Status value', gen: () => faker.helpers.arrayElement(['Active', 'Pending Renewal', 'Expired', 'Negotiating']) },
    ] },
  { name: 'logistics_routes', display: 'Logistics Routes', desc: 'Shipping lanes, transit times, and carrier performance',
    sampleColumns: [
      { name: 'route_id', type: 'string', description: 'Route Id value', gen: () => `RT-${faker.string.alphanumeric(4).toUpperCase()}` },
      { name: 'origin', type: 'string', description: 'Origin value', gen: () => faker.helpers.arrayElement(['Santos', 'Paranagua', 'Vitoria']) },
      { name: 'destination', type: 'string', description: 'Destination value', gen: () => faker.helpers.arrayElement(['Hamburg', 'Le Havre', 'New York', 'Yokohama']) },
      { name: 'carrier', type: 'string', description: 'Carrier value', gen: () => faker.helpers.arrayElement(['Maersk', 'MSC', 'CMA CGM', 'Hapag-Lloyd']) },
      { name: 'transit_days', type: 'number', description: 'Transit Days value', gen: () => faker.number.int({ min: 12, max: 45 }) },
      { name: 'avg_delay_days', type: 'number', description: 'Avg Delay Days value', gen: () => faker.number.float({ min: 0, max: 5, fractionDigits: 1 }) },
    ] },
  { name: 'weather_data', display: 'Weather Data', desc: 'Climate data for coffee-growing regions',
    sampleColumns: [
      { name: 'date', type: 'timestamp', description: 'Date value', gen: () => faker.date.recent({ days: 14 }).toISOString().split('T')[0] },
      { name: 'region', type: 'string', description: 'Region value', gen: () => faker.helpers.arrayElement(['Cerrado Mineiro', 'Sul de Minas', 'Mogiana', 'Chapada Diamantina']) },
      { name: 'temp_max_c', type: 'number', description: 'Temp Max C value', gen: () => faker.number.float({ min: 22, max: 38, fractionDigits: 1 }) },
      { name: 'temp_min_c', type: 'number', description: 'Temp Min C value', gen: () => faker.number.float({ min: 10, max: 22, fractionDigits: 1 }) },
      { name: 'rainfall_mm', type: 'string', description: 'Rainfall Mm value', gen: () => faker.number.float({ min: 0, max: 85, fractionDigits: 1 }) },
      { name: 'humidity_pct', type: 'string', description: 'Humidity Pct value', gen: () => faker.number.int({ min: 30, max: 95 }) },
    ] },
  { name: 'certification_registry', display: 'Certification Registry', desc: 'Organic, Fair Trade, and Rainforest Alliance certifications',
    sampleColumns: [
      { name: 'cert_id', type: 'string', description: 'Cert Id value', gen: () => `CERT-${faker.string.alphanumeric(6).toUpperCase()}` },
      { name: 'farm_name', type: 'string', description: 'Farm Name value', gen: () => `Fazenda ${faker.person.lastName()}` },
      { name: 'certification', type: 'string', description: 'Certification value', gen: () => faker.helpers.arrayElement(['Organic', 'Fair Trade', 'Rainforest Alliance', 'UTZ', '4C']) },
      { name: 'issued', type: 'string', description: 'Issued value', gen: () => faker.date.past({ years: 1 }).toISOString().split('T')[0] },
      { name: 'expires', type: 'string', description: 'Expires value', gen: () => faker.date.soon({ days: 365 }).toISOString().split('T')[0] },
      { name: 'status', type: 'string', description: 'Status value', gen: () => faker.helpers.arrayElement(['Valid', 'Expiring Soon', 'Under Review', 'Expired']) },
    ] },
  { name: 'harvest_schedule', display: 'Harvest Schedule', desc: 'Planned and actual harvest dates by region and farm',
    sampleColumns: [
      { name: 'season', type: 'string', description: 'Season value', gen: () => faker.helpers.arrayElement(['2025/26', '2024/25']) },
      { name: 'region', type: 'string', description: 'Region value', gen: () => faker.helpers.arrayElement(['Cerrado Mineiro', 'Sul de Minas', 'Mogiana', 'Bahia']) },
      { name: 'farm', type: 'string', description: 'Farm value', gen: () => `Fazenda ${faker.person.lastName()}` },
      { name: 'planned_start', type: 'string', description: 'Planned Start value', gen: () => faker.date.soon({ days: 90 }).toISOString().split('T')[0] },
      { name: 'actual_start', type: 'string', description: 'Actual Start value', gen: () => faker.helpers.maybe(() => faker.date.recent({ days: 30 }).toISOString().split('T')[0]) ?? '' },
      { name: 'estimated_bags', type: 'number', description: 'Estimated Bags value', gen: () => faker.number.int({ min: 200, max: 15000 }) },
    ] },
  { name: 'lab_analysis', display: 'Lab Analysis', desc: 'Moisture content, defect counts, and screen size distributions',
    sampleColumns: [
      { name: 'sample_id', type: 'string', description: 'Sample Id value', gen: () => `LAB-${faker.string.alphanumeric(6).toUpperCase()}` },
      { name: 'lot', type: 'string', description: 'Lot value', gen: () => `LOT-${faker.string.numeric(6)}` },
      { name: 'moisture_pct', type: 'number', description: 'Moisture Pct value', gen: () => faker.number.float({ min: 9.5, max: 13.5, fractionDigits: 1 }) },
      { name: 'defects_per_300g', type: 'string', description: 'Defects Per 300g value', gen: () => faker.number.int({ min: 0, max: 45 }) },
      { name: 'screen_16_pct', type: 'number', description: 'Screen 16 Pct value', gen: () => faker.number.float({ min: 40, max: 85, fractionDigits: 1 }) },
      { name: 'color', type: 'string', description: 'Color value', gen: () => faker.helpers.arrayElement(['Green', 'Greenish', 'Yellowish', 'Pale']) },
    ] },
  { name: 'financial_transactions', display: 'Financial Transactions', desc: 'Payments, receivables, and FX operations',
    sampleColumns: [
      { name: 'txn_id', type: 'string', description: 'Txn Id value', gen: () => `TXN-${faker.string.numeric(8)}` },
      { name: 'type', type: 'string', description: 'Type value', gen: () => faker.helpers.arrayElement(['Payment', 'Receivable', 'FX Hedge', 'Invoice']) },
      { name: 'counterparty', type: 'string', description: 'Counterparty value', gen: () => faker.company.name() },
      { name: 'amount_usd', type: 'number', description: 'Amount Usd value', gen: () => faker.number.float({ min: 1000, max: 500000, fractionDigits: 2 }) },
      { name: 'currency', type: 'string', description: 'Currency value', gen: () => faker.helpers.arrayElement(['USD', 'BRL', 'EUR', 'JPY']) },
      { name: 'status', type: 'string', description: 'Status value', gen: () => faker.helpers.arrayElement(['Completed', 'Pending', 'Failed', 'Reconciled']) },
    ] },
  { name: 'employee_directory', display: 'Employee Directory', desc: 'Staff across offices, warehouses, and field operations',
    sampleColumns: [
      { name: 'employee_id', type: 'string', description: 'Employee Id value', gen: () => `EMP-${faker.string.numeric(5)}` },
      { name: 'name', type: 'string', description: 'Name value', gen: () => faker.person.fullName() },
      { name: 'department', type: 'string', description: 'Department value', gen: () => faker.helpers.arrayElement(['Operations', 'Quality', 'Sales', 'Finance', 'IT', 'Logistics']) },
      { name: 'location', type: 'string', description: 'Location value', gen: () => faker.helpers.arrayElement(['Sao Paulo HQ', 'Santos Warehouse', 'Minas Field Office', 'New York Office']) },
      { name: 'role', type: 'string', description: 'Role value', gen: () => faker.helpers.arrayElement(['Analyst', 'Manager', 'Specialist', 'Director', 'Coordinator']) },
      { name: 'hire_date', type: 'timestamp', description: 'Hire Date value', gen: () => faker.date.past({ years: 5 }).toISOString().split('T')[0] },
    ] },
  { name: 'iot_sensor_readings', display: 'IoT Sensor Readings', desc: 'Temperature and humidity from warehouse sensors',
    sampleColumns: [
      { name: 'sensor_id', type: 'string', description: 'Sensor Id value', gen: () => `SNR-${faker.string.alphanumeric(4).toUpperCase()}` },
      { name: 'warehouse', type: 'string', description: 'Warehouse value', gen: () => faker.helpers.arrayElement(['WH-Santos', 'WH-Paranagua', 'WH-Vitoria', 'WH-SP']) },
      { name: 'temperature_c', type: 'number', description: 'Temperature C value', gen: () => faker.number.float({ min: 18, max: 32, fractionDigits: 1 }) },
      { name: 'humidity_pct', type: 'string', description: 'Humidity Pct value', gen: () => faker.number.float({ min: 35, max: 75, fractionDigits: 1 }) },
      { name: 'timestamp', type: 'timestamp', description: 'Timestamp value', gen: () => faker.date.recent({ days: 1 }).toISOString() },
      { name: 'alert', type: 'string', description: 'Alert value', gen: () => faker.helpers.maybe(() => faker.helpers.arrayElement(['High Temp', 'High Humidity'])) ?? 'None' },
    ] },
  { name: 'market_prices', display: 'Market Prices', desc: 'ICE futures and spot prices for arabica and robusta',
    sampleColumns: [
      { name: 'date', type: 'timestamp', description: 'Date value', gen: () => faker.date.recent({ days: 30 }).toISOString().split('T')[0] },
      { name: 'commodity', type: 'string', description: 'Commodity value', gen: () => faker.helpers.arrayElement(['KC (Arabica)', 'RC (Robusta)']) },
      { name: 'contract', type: 'string', description: 'Contract value', gen: () => faker.helpers.arrayElement(['Mar 26', 'May 26', 'Jul 26', 'Sep 26']) },
      { name: 'close_usd', type: 'number', description: 'Close Usd value', gen: () => faker.number.float({ min: 1.1, max: 4.8, fractionDigits: 4 }) },
      { name: 'change_pct', type: 'number', description: 'Change Pct value', gen: () => faker.number.float({ min: -5, max: 5, fractionDigits: 2 }) },
      { name: 'volume', type: 'string', description: 'Volume value', gen: () => faker.number.int({ min: 5000, max: 80000 }) },
    ] },
  { name: 'blend_recipes', display: 'Blend Recipes', desc: 'Proprietary blend compositions and ratios',
    sampleColumns: [
      { name: 'blend_id', type: 'string', description: 'Blend Id value', gen: () => `BLD-${faker.string.alphanumeric(4).toUpperCase()}` },
      { name: 'blend_name', type: 'string', description: 'Blend Name value', gen: () => faker.helpers.arrayElement(['Morning Sunrise', 'Dark Reserve', 'Cerrado Select', 'Estate Blend', 'Premium Export']) },
      { name: 'origin_1', type: 'string', description: 'Origin 1 value', gen: () => faker.helpers.arrayElement(['Cerrado', 'Sul de Minas', 'Mogiana']) },
      { name: 'origin_1_pct', type: 'number', description: 'Origin 1 Pct value', gen: () => faker.number.int({ min: 30, max: 70 }) },
      { name: 'origin_2', type: 'string', description: 'Origin 2 value', gen: () => faker.helpers.arrayElement(['Bahia', 'Espirito Santo', 'Parana']) },
      { name: 'target_score', type: 'number', description: 'Target Score value', gen: () => faker.number.float({ min: 80, max: 92, fractionDigits: 1 }) },
    ] },
  { name: 'defect_classifications', display: 'Defect Classifications', desc: 'Bean defect taxonomy and visual grading standards',
    sampleColumns: [
      { name: 'defect_code', type: 'string', description: 'Defect Code value', gen: () => `DEF-${faker.string.numeric(3)}` },
      { name: 'category', type: 'string', description: 'Category value', gen: () => faker.helpers.arrayElement(['Black', 'Sour', 'Broken', 'Insect', 'Immature', 'Shell']) },
      { name: 'severity', type: 'string', description: 'Severity value', gen: () => faker.helpers.arrayElement(['Full', 'Partial', 'Minor']) },
      { name: 'points', type: 'number', description: 'Points value', gen: () => faker.number.int({ min: 1, max: 5 }) },
      { name: 'description', type: 'string', description: 'Description value', gen: () => faker.lorem.sentence(4) },
      { name: 'is_primary', type: 'boolean', description: 'Is Primary value', gen: () => faker.datatype.boolean() },
    ] },
  { name: 'port_operations', display: 'Port Operations', desc: 'Container loading, vessel schedules, and port fees',
    sampleColumns: [
      { name: 'operation_id', type: 'string', description: 'Operation Id value', gen: () => `POP-${faker.string.numeric(7)}` },
      { name: 'port', type: 'string', description: 'Port value', gen: () => faker.helpers.arrayElement(['Santos', 'Paranagua', 'Vitoria']) },
      { name: 'vessel', type: 'string', description: 'Vessel value', gen: () => `MV ${faker.person.lastName().toUpperCase()}` },
      { name: 'containers', type: 'string', description: 'Containers value', gen: () => faker.number.int({ min: 1, max: 50 }) },
      { name: 'fee_usd', type: 'number', description: 'Fee Usd value', gen: () => faker.number.float({ min: 500, max: 15000, fractionDigits: 2 }) },
      { name: 'status', type: 'string', description: 'Status value', gen: () => faker.helpers.arrayElement(['Scheduled', 'Loading', 'Departed', 'Cancelled']) },
    ] },
  { name: 'customer_feedback', display: 'Customer Feedback', desc: 'Buyer satisfaction surveys and complaint records',
    sampleColumns: [
      { name: 'ticket_id', type: 'string', description: 'Ticket Id value', gen: () => `FB-${faker.string.numeric(6)}` },
      { name: 'customer', type: 'string', description: 'Customer value', gen: () => faker.company.name() },
      { name: 'category', type: 'string', description: 'Category value', gen: () => faker.helpers.arrayElement(['Quality', 'Delivery', 'Pricing', 'Packaging', 'Documentation']) },
      { name: 'rating', type: 'string', description: 'Rating value', gen: () => faker.number.int({ min: 1, max: 5 }) },
      { name: 'sentiment', type: 'string', description: 'Sentiment value', gen: () => faker.helpers.arrayElement(['Positive', 'Neutral', 'Negative']) },
      { name: 'resolved', type: 'string', description: 'Resolved value', gen: () => faker.datatype.boolean({ probability: 0.7 }) },
    ] },
  { name: 'demand_forecast', display: 'Demand Forecast', desc: 'ML-based demand predictions by region and variety',
    sampleColumns: [
      { name: 'forecast_period', type: 'string', description: 'Forecast Period value', gen: () => faker.helpers.arrayElement(['2026-Q1', '2026-Q2', '2026-Q3', '2026-Q4']) },
      { name: 'region', type: 'string', description: 'Region value', gen: () => faker.helpers.arrayElement(['Europe', 'North America', 'Asia Pacific', 'Middle East']) },
      { name: 'variety', type: 'string', description: 'Variety value', gen: () => faker.helpers.arrayElement(['Arabica', 'Robusta', 'Blends']) },
      { name: 'predicted_bags', type: 'number', description: 'Predicted Bags value', gen: () => faker.number.int({ min: 5000, max: 200000 }) },
      { name: 'confidence', type: 'string', description: 'Confidence value', gen: () => faker.number.float({ min: 0.7, max: 0.98, fractionDigits: 2 }) },
      { name: 'model_version', type: 'string', description: 'Model Version value', gen: () => faker.helpers.arrayElement(['v3.2', 'v3.1', 'v2.9']) },
    ] },
];

const SCHEMAS = ['raw', 'bronze', 'silver', 'gold', 'reporting'];
const DATABASES = ['analytics_warehouse', 'operational_db', 'data_lake'];
const OWNERS = ['Data Engineering', 'Analytics', 'BI Team', 'Data Science', 'Platform Team'];
const TAGS = ['production', 'staging', 'pii', 'sla-critical', 'certified', 'deprecated', 'experimental', 'core'];
const SOURCES = ['SAP ERP', 'PostgreSQL', 'Salesforce', 'IoT Hub', 'Shipping API', 'Weather API', 'Manual Upload', 'Kafka Stream'];
const FREQUENCIES = ['Real-time', 'Hourly', 'Daily', 'Weekly', 'Monthly'];

function generateSampleRows(columns: { name: string; type: string; description: string; gen: () => unknown }[]): Record<string, unknown>[] {
  return Array.from({ length: 10 }, () => {
    const row: Record<string, unknown> = {};
    for (const col of columns) {
      row[col.name] = col.gen();
    }
    return row;
  });
}

const QUALITY_TEMPLATES = 10;

function generateQualityDashboardTemplates(): QualityDashboard[] {
  const templates: QualityDashboard[] = [];

  for (let t = 0; t < QUALITY_TEMPLATES; t++) {
    const healthScore = faker.number.int({ min: 62, max: 99 });
    const isHealthy = healthScore >= 85;
    const failBase = isHealthy ? faker.number.int({ min: 0, max: 4 }) : faker.number.int({ min: 3, max: 12 });
    const warnBase = isHealthy ? faker.number.int({ min: 0, max: 6 }) : faker.number.int({ min: 4, max: 15 });
    const checksPerDay = faker.number.int({ min: 12, max: 40 });

    const dailyChecks: QualityDashboard['dailyChecks'] = [];
    for (let d = 89; d >= 0; d--) {
      const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const fail = Math.max(0, failBase + faker.number.int({ min: -2, max: 3 }));
      const warn = Math.max(0, warnBase + faker.number.int({ min: -3, max: 4 }));
      const pass = Math.max(1, checksPerDay - fail - warn + faker.number.int({ min: -2, max: 2 }));
      dailyChecks.push({ date: dateStr, pass, warn, fail });
    }

    const totalFail = dailyChecks.reduce((s, d) => s + d.fail, 0);
    const totalWarn = dailyChecks.reduce((s, d) => s + d.warn, 0);
    const totalChecks = dailyChecks.reduce((s, d) => s + d.pass + d.warn + d.fail, 0);

    templates.push({
      checksFailed: totalFail,
      checksWarned: totalWarn,
      healthScore,
      activeChecks: totalChecks,
      avgAlertsPerDay: Math.round((totalFail + totalWarn) / 90),
      dailyChecks,
    });
  }

  return templates;
}

const qualityTemplates = generateQualityDashboardTemplates();

export function generateDatasets(count: number): Dataset[] {
  const datasets: Dataset[] = [];

  for (let i = 0; i < count; i++) {
    const template = DATASET_TEMPLATES[i % DATASET_TEMPLATES.length];
    const suffix = i >= DATASET_TEMPLATES.length ? `_v${Math.floor(i / DATASET_TEMPLATES.length) + 1}` : '';
    const schema = faker.helpers.arrayElement(SCHEMAS);

    const qd = qualityTemplates[i % QUALITY_TEMPLATES];

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
      qualityScore: qd.healthScore,
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
      fields: template.sampleColumns.map(c => ({ name: c.name, type: c.type, description: c.description })),
      qualityDashboard: qd,
    });
  }

  return datasets;
}
