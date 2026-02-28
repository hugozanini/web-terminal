// Coffee Bean Sample
export interface CoffeeBeanSample {
  id: string;
  batchNumber: string;
  variety: 'Arabica' | 'Robusta' | 'Liberica';
  subVariety: string; // e.g., Bourbon, Catuaí, Mundo Novo
  origin: {
    farm: string;
    region: string;
    state: string;
    coordinates: { lat: number; lng: number };
  };
  harvestDate: Date;
  processingMethod: 'Natural' | 'Pulped Natural' | 'Washed' | 'Honey';
  gradeScore: number; // SCA score 0-100
  moistureContent: number; // percentage
  defectCount: number;
  bagWeight: number; // kg
  certifications: string[];
}

// Shipment
export interface Shipment {
  id: string;
  shipmentNumber: string;
  batchIds: string[];
  origin: {
    port: string;
    city: string;
    state: string;
  };
  destination: {
    port: string;
    country: string;
    customer: string;
  };
  containerNumber: string;
  weight: number; // kg
  departureDate: Date;
  estimatedArrival: Date;
  actualArrival?: Date;
  status: 'Preparing' | 'In Transit' | 'Customs' | 'Delivered';
  trackingEvents: TrackingEvent[];
}

export interface TrackingEvent {
  timestamp: Date;
  location: string;
  status: string;
  description: string;
}

// Order
export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    country: string;
    type: 'Roaster' | 'Distributor' | 'Retailer';
  };
  items: OrderItem[];
  totalWeight: number;
  totalValue: number; // USD
  currency: string;
  orderDate: Date;
  requestedDelivery: Date;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentTerms: string;
}

export interface OrderItem {
  batchId: string;
  quantity: number; // kg
  pricePerKg: number;
  total: number;
}

// Lineage Node
export interface LineageNode {
  id: string;
  type: 'Farm' | 'Processing' | 'Warehouse' | 'Quality Control' | 'Export';
  name: string;
  timestamp: Date;
  location: string;
  batchIds: string[];
  metadata: Record<string, unknown>;
  parentId?: string;
}

// Processing Run
export interface ProcessingRun {
  id: string;
  runNumber: string;
  type: 'Washing' | 'Drying' | 'Hulling' | 'Sorting' | 'Grading';
  inputBatchIds: string[];
  outputBatchId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  operator: string;
  facilityId: string;
  parameters: {
    temperature?: number;
    humidity?: number;
    [key: string]: unknown;
  };
  yieldPercentage: number;
  qualityMetrics: {
    score: number;
    notes: string;
  };
}

// Log Entry
export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'Quality Check' | 'Shipping' | 'Processing' | 'Inspection' | 'Maintenance';
  severity: 'Info' | 'Warning' | 'Error' | 'Critical';
  entityType: 'Batch' | 'Shipment' | 'Run' | 'Equipment';
  entityId: string;
  message: string;
  user: string;
  metadata: Record<string, unknown>;
}

// Cost Entry
export interface CostEntry {
  id: string;
  category: 'Production' | 'Processing' | 'Shipping' | 'Export' | 'Labor' | 'Equipment';
  subcategory: string;
  entityType: 'Batch' | 'Shipment' | 'Run';
  entityId: string;
  amount: number;
  currency: string;
  date: Date;
  description: string;
  breakdown?: {
    item: string;
    cost: number;
  }[];
}

// Catalog Data Store
export interface CatalogData {
  coffeeBeans: CoffeeBeanSample[];
  shipments: Shipment[];
  orders: Order[];
  lineage: LineageNode[];
  runs: ProcessingRun[];
  logs: LogEntry[];
  costs: CostEntry[];
}
