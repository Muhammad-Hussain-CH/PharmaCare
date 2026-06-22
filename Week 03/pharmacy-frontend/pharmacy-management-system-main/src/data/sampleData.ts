export interface Medicine {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  supplierId: string;
  dosageForm: string;
  strength: string;
  unitPrice: number;
  stockQty: number;
  lowStockThreshold: number;
  unitsPerPack: number;
  expiryDate: string;
  batchNo: string;
  description: string;
  status: 'In Stock' | 'Low Stock' | 'Expired' | 'Out of Stock';
}

export interface Supplier {
  id: string;
  company: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  status: 'Active' | 'Inactive';
}

export interface OrderItem {
  medicineId: string;
  medicineName: string;
  qty: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDelivery: string;
  actualDelivery: string;
  status: 'Pending' | 'Delivered' | 'Cancelled';
  totalValue: number;
  items: OrderItem[];
}

export interface DispenseRecord {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  medicineId: string;
  medicineName: string;
  qty: number;
  date: string;
  dispensedBy: string;
  notes: string;
}

export interface PharmacySettings {
  pharmacyName: string;
  licenseNumber: string;
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  lowStockThreshold: number;
  criticalStockThreshold: number;
  expiryAlertDays: number;
  fullName: string;
  userEmail: string;
  role: string;
  userPhone: string;
  language: string;
  dateFormat: string;
  currency: string;
  itemsPerPage: number;
  timezone: string;
  notifications: {
    lowStockEmail: boolean;
    expiryAlerts: boolean;
    dailySummary: boolean;
    newOrderNotif: boolean;
    smsNotif: boolean;
    browserPush: boolean;
  };
}

export const DEFAULT_SETTINGS: PharmacySettings = {
  pharmacyName: 'PharmaCare Hospital',
  licenseNumber: 'PH-2024-ISB-0042',
  address: 'Blue Area, Islamabad, Pakistan',
  phone: '051-1234567',
  email: 'info@pharmacare.pk',
  workingHours: '8:00 AM — 10:00 PM',
  lowStockThreshold: 20,
  criticalStockThreshold: 10,
  expiryAlertDays: 30,
  fullName: 'Muhammad Hussain',
  userEmail: 'm.hussain@pharmacare.pk',
  role: 'Admin',
  userPhone: '0300-1234567',
  language: 'English',
  dateFormat: 'DD/MM/YYYY',
  currency: 'Rs.',
  itemsPerPage: 10,
  timezone: 'Asia/Karachi',
  notifications: {
    lowStockEmail: true,
    expiryAlerts: true,
    dailySummary: true,
    newOrderNotif: true,
    smsNotif: false,
    browserPush: false,
  },
};

export const SAMPLE_SUPPLIERS: Supplier[] = [
  { id: 's1', company: 'MedPlus Distributors', contactPerson: 'Tariq Mehmood', phone: '0300-1234567', email: 'tariq@medplus.pk', city: 'Islamabad', address: 'G-9 Markaz, Islamabad', status: 'Active' },
  { id: 's2', company: 'PharmaCare Supplies', contactPerson: 'Sana Akhtar', phone: '0311-2345678', email: 'sana@pharmacare.pk', city: 'Lahore', address: 'Main Boulevard, DHA, Lahore', status: 'Active' },
  { id: 's3', company: 'HealthLine Traders', contactPerson: 'Kamran Bashir', phone: '0321-3456789', email: 'kamran@healthline.pk', city: 'Rawalpindi', address: 'Saddar Bazaar, Rawalpindi', status: 'Active' },
  { id: 's4', company: 'National Med Supplies', contactPerson: 'Ayesha Noor', phone: '0333-4567890', email: 'ayesha@natmed.pk', city: 'Karachi', address: 'Clifton Block 5, Karachi', status: 'Active' },
  { id: 's5', company: 'City Pharma Traders', contactPerson: 'Usman Qureshi', phone: '0345-5678901', email: 'usman@citypharma.pk', city: 'Islamabad', address: 'F-10 Markaz, Islamabad', status: 'Inactive' },
];

export const SAMPLE_MEDICINES: Medicine[] = [
  { id: 'm1', name: 'Panadol 500mg', category: 'Tablet', manufacturer: 'GSK Pakistan', supplierId: 's1', dosageForm: 'Tablet', strength: '500mg', unitPrice: 15, stockQty: 150, lowStockThreshold: 20, unitsPerPack: 10, expiryDate: '2026-08-01', batchNo: 'BT-001', description: 'Analgesic and antipyretic', status: 'In Stock' },
  { id: 'm2', name: 'Amoxicillin 250mg', category: 'Capsule', manufacturer: 'Pfizer Pakistan', supplierId: 's2', dosageForm: 'Capsule', strength: '250mg', unitPrice: 45, stockQty: 8, lowStockThreshold: 20, unitsPerPack: 10, expiryDate: '2026-12-15', batchNo: 'BT-002', description: 'Broad-spectrum antibiotic', status: 'Low Stock' },
  { id: 'm3', name: 'ORS Sachet', category: 'Powder', manufacturer: 'Highnoon Labs', supplierId: 's3', dosageForm: 'Sachet', strength: 'Standard', unitPrice: 20, stockQty: 200, lowStockThreshold: 20, unitsPerPack: 1, expiryDate: '2027-03-10', batchNo: 'BT-003', description: 'Oral rehydration salts', status: 'In Stock' },
  { id: 'm4', name: 'Metformin 500mg', category: 'Tablet', manufacturer: 'Sanofi Pakistan', supplierId: 's1', dosageForm: 'Tablet', strength: '500mg', unitPrice: 30, stockQty: 12, lowStockThreshold: 20, unitsPerPack: 10, expiryDate: '2026-11-20', batchNo: 'BT-004', description: 'Antidiabetic medication', status: 'Low Stock' },
  { id: 'm5', name: 'Brufen 400mg', category: 'Tablet', manufacturer: 'Abbott Labs', supplierId: 's1', dosageForm: 'Tablet', strength: '400mg', unitPrice: 25, stockQty: 90, lowStockThreshold: 20, unitsPerPack: 10, expiryDate: '2025-06-01', batchNo: 'BT-005', description: 'Anti-inflammatory analgesic', status: 'Expired' },
  { id: 'm6', name: 'Flagyl 400mg', category: 'Tablet', manufacturer: 'Searle Pakistan', supplierId: 's4', dosageForm: 'Tablet', strength: '400mg', unitPrice: 18, stockQty: 75, lowStockThreshold: 20, unitsPerPack: 10, expiryDate: '2026-09-15', batchNo: 'BT-006', description: 'Antibacterial and antiprotozoal', status: 'In Stock' },
  { id: 'm7', name: 'Ventolin Inhaler', category: 'Inhaler', manufacturer: 'GSK Pakistan', supplierId: 's2', dosageForm: 'Inhaler', strength: '100mcg', unitPrice: 350, stockQty: 40, lowStockThreshold: 20, unitsPerPack: 1, expiryDate: '2025-07-05', batchNo: 'BT-007', description: 'Bronchodilator for asthma', status: 'Expired' },
  { id: 'm8', name: 'Vitamin C 500mg', category: 'Tablet', manufacturer: 'Herbion Pakistan', supplierId: 's3', dosageForm: 'Tablet', strength: '500mg', unitPrice: 12, stockQty: 300, lowStockThreshold: 20, unitsPerPack: 10, expiryDate: '2027-06-30', batchNo: 'BT-008', description: 'Vitamin C supplement', status: 'In Stock' },
  { id: 'm9', name: 'Ringer Lactate', category: 'Injection', manufacturer: 'Otsuka Pakistan', supplierId: 's4', dosageForm: 'Infusion', strength: '500ml', unitPrice: 120, stockQty: 60, lowStockThreshold: 20, unitsPerPack: 1, expiryDate: '2026-07-01', batchNo: 'BT-009', description: 'IV fluid for rehydration', status: 'In Stock' },
  { id: 'm10', name: 'Cough Syrup 100ml', category: 'Syrup', manufacturer: 'GSK Pakistan', supplierId: 's1', dosageForm: 'Syrup', strength: '100ml', unitPrice: 85, stockQty: 5, lowStockThreshold: 20, unitsPerPack: 1, expiryDate: '2026-10-20', batchNo: 'BT-010', description: 'Antitussive and expectorant', status: 'Low Stock' },
  { id: 'm11', name: 'Augmentin 625mg', category: 'Capsule', manufacturer: 'Pfizer Pakistan', supplierId: 's2', dosageForm: 'Tablet', strength: '625mg', unitPrice: 95, stockQty: 45, lowStockThreshold: 20, unitsPerPack: 10, expiryDate: '2026-05-18', batchNo: 'BT-011', description: 'Amoxicillin + Clavulanate antibiotic', status: 'In Stock' },
  { id: 'm12', name: 'Lipitor 20mg', category: 'Tablet', manufacturer: 'Abbott Labs', supplierId: 's4', dosageForm: 'Tablet', strength: '20mg', unitPrice: 110, stockQty: 80, lowStockThreshold: 20, unitsPerPack: 10, expiryDate: '2027-01-25', batchNo: 'BT-012', description: 'Statin for cholesterol management', status: 'In Stock' },
  { id: 'm13', name: 'Betnovate Cream', category: 'Cream', manufacturer: 'Searle Pakistan', supplierId: 's5', dosageForm: 'Cream', strength: '0.1%', unitPrice: 55, stockQty: 30, lowStockThreshold: 20, unitsPerPack: 1, expiryDate: '2026-04-10', batchNo: 'BT-013', description: 'Topical corticosteroid cream', status: 'In Stock' },
  { id: 'm14', name: 'Refresh Eye Drop', category: 'Drop', manufacturer: 'Sanofi Pakistan', supplierId: 's4', dosageForm: 'Eye Drop', strength: '0.5%', unitPrice: 75, stockQty: 55, lowStockThreshold: 20, unitsPerPack: 1, expiryDate: '2026-08-22', batchNo: 'BT-014', description: 'Lubricating eye drops', status: 'In Stock' },
  { id: 'm15', name: 'Disprin 300mg', category: 'Tablet', manufacturer: 'Highnoon Labs', supplierId: 's3', dosageForm: 'Tablet', strength: '300mg', unitPrice: 10, stockQty: 7, lowStockThreshold: 20, unitsPerPack: 10, expiryDate: '2026-03-05', batchNo: 'BT-015', description: 'Aspirin analgesic and antiplatelet', status: 'Low Stock' },
];

export const SAMPLE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-001', supplierId: 's1', supplierName: 'MedPlus Distributors',
    orderDate: '2026-04-01', expectedDelivery: '2026-04-08', actualDelivery: '2026-04-07',
    status: 'Delivered', totalValue: 97500,
    items: [
      { medicineId: 'm1', medicineName: 'Panadol 500mg', qty: 500, unitPrice: 15 },
      { medicineId: 'm8', medicineName: 'Vitamin C 500mg', qty: 1000, unitPrice: 12 },
      { medicineId: 'm4', medicineName: 'Metformin 500mg', qty: 500, unitPrice: 30 },
      { medicineId: 'm6', medicineName: 'Flagyl 400mg', qty: 300, unitPrice: 18 },
    ]
  },
  {
    id: 'PO-002', supplierId: 's2', supplierName: 'PharmaCare Supplies',
    orderDate: '2026-04-10', expectedDelivery: '2026-04-17', actualDelivery: '2026-04-18',
    status: 'Delivered', totalValue: 26400,
    items: [
      { medicineId: 'm2', medicineName: 'Amoxicillin 250mg', qty: 200, unitPrice: 45 },
      { medicineId: 'm11', medicineName: 'Augmentin 625mg', qty: 100, unitPrice: 95 },
      { medicineId: 'm7', medicineName: 'Ventolin Inhaler', qty: 50, unitPrice: 350 },
    ]
  },
  {
    id: 'PO-003', supplierId: 's3', supplierName: 'HealthLine Traders',
    orderDate: '2026-04-20', expectedDelivery: '2026-04-27', actualDelivery: '',
    status: 'Pending', totalValue: 11200,
    items: [
      { medicineId: 'm3', medicineName: 'ORS Sachet', qty: 300, unitPrice: 20 },
      { medicineId: 'm15', medicineName: 'Disprin 300mg', qty: 200, unitPrice: 10 },
      { medicineId: 'm8', medicineName: 'Vitamin C 500mg', qty: 200, unitPrice: 12 },
    ]
  },
  {
    id: 'PO-004', supplierId: 's4', supplierName: 'National Med Supplies',
    orderDate: '2026-04-25', expectedDelivery: '2026-05-02', actualDelivery: '',
    status: 'Pending', totalValue: 26000,
    items: [
      { medicineId: 'm9', medicineName: 'Ringer Lactate', qty: 100, unitPrice: 120 },
      { medicineId: 'm12', medicineName: 'Lipitor 20mg', qty: 100, unitPrice: 110 },
      { medicineId: 'm14', medicineName: 'Refresh Eye Drop', qty: 50, unitPrice: 75 },
    ]
  },
  {
    id: 'PO-005', supplierId: 's1', supplierName: 'MedPlus Distributors',
    orderDate: '2026-03-15', expectedDelivery: '2026-03-22', actualDelivery: '',
    status: 'Cancelled', totalValue: 42000,
    items: [
      { medicineId: 'm5', medicineName: 'Brufen 400mg', qty: 500, unitPrice: 25 },
      { medicineId: 'm10', medicineName: 'Cough Syrup 100ml', qty: 100, unitPrice: 85 },
      { medicineId: 'm13', medicineName: 'Betnovate Cream', qty: 100, unitPrice: 55 },
    ]
  },
];

export const SAMPLE_DISPENSES: DispenseRecord[] = [
  { id: 'd1', patientName: 'Muhammad Ali', patientId: 'PT-001', doctorName: 'Dr. Ahmed Raza', medicineId: 'm1', medicineName: 'Panadol 500mg', qty: 10, date: '2026-04-28T10:15:00', dispensedBy: 'M. Hussain', notes: '' },
  { id: 'd2', patientName: 'Zainab Bibi', patientId: 'PT-002', doctorName: 'Dr. Fatima Malik', medicineId: 'm12', medicineName: 'Lipitor 20mg', qty: 30, date: '2026-04-29T11:30:00', dispensedBy: 'Ali Ahmed', notes: '' },
  { id: 'd3', patientName: 'Zainab Bibi', patientId: 'PT-002', doctorName: 'Dr. Fatima Malik', medicineId: 'm14', medicineName: 'Refresh Eye Drop', qty: 1, date: '2026-04-29T11:31:00', dispensedBy: 'Ali Ahmed', notes: '' },
  { id: 'd4', patientName: 'Tariq Jameel', patientId: 'PT-003', doctorName: 'Dr. Usman Tariq', medicineId: 'm11', medicineName: 'Augmentin 625mg', qty: 14, date: '2026-04-30T09:45:00', dispensedBy: 'M. Hussain', notes: '' },
  { id: 'd5', patientName: 'Ayesha Khan', patientId: 'PT-004', doctorName: 'Dr. Sadia Hussain', medicineId: 'm4', medicineName: 'Metformin 500mg', qty: 30, date: '2026-05-01T14:20:00', dispensedBy: 'Ali Ahmed', notes: '' },
  { id: 'd6', patientName: 'Muhammad Ali', patientId: 'PT-001', doctorName: 'Dr. Ahmed Raza', medicineId: 'm1', medicineName: 'Panadol 500mg', qty: 6, date: '2026-05-02T16:00:00', dispensedBy: 'M. Hussain', notes: '' },
  { id: 'd7', patientName: 'Muhammad Ali', patientId: 'PT-001', doctorName: 'Dr. Ahmed Raza', medicineId: 'm10', medicineName: 'Cough Syrup 100ml', qty: 1, date: '2026-05-02T16:01:00', dispensedBy: 'M. Hussain', notes: '' },
  { id: 'd8', patientName: 'Hassan Nawaz', patientId: 'PT-005', doctorName: 'Dr. Bilal Chaudhry', medicineId: 'm6', medicineName: 'Flagyl 400mg', qty: 14, date: '2026-05-03T08:30:00', dispensedBy: 'Ali Ahmed', notes: '' },
  { id: 'd9', patientName: 'Hassan Nawaz', patientId: 'PT-005', doctorName: 'Dr. Bilal Chaudhry', medicineId: 'm13', medicineName: 'Betnovate Cream', qty: 1, date: '2026-05-03T08:31:00', dispensedBy: 'Ali Ahmed', notes: '' },
  { id: 'd10', patientName: 'Imran Siddiqui', patientId: 'PT-006', doctorName: 'Dr. Fatima Malik', medicineId: 'm12', medicineName: 'Lipitor 20mg', qty: 30, date: '2026-05-04T13:15:00', dispensedBy: 'M. Hussain', notes: '' },
  { id: 'd11', patientName: 'Muhammad Ali', patientId: 'PT-001', doctorName: 'Dr. Ahmed Raza', medicineId: 'm8', medicineName: 'Vitamin C 500mg', qty: 5, date: '2026-04-28T10:16:00', dispensedBy: 'M. Hussain', notes: '' },
  { id: 'd12', patientName: 'Saima Perveen', patientId: 'PT-007', doctorName: 'Dr. Ahmed Raza', medicineId: 'm10', medicineName: 'Cough Syrup 100ml', qty: 1, date: '2026-05-05T10:00:00', dispensedBy: 'Ali Ahmed', notes: '' },
  { id: 'd13', patientName: 'Saima Perveen', patientId: 'PT-007', doctorName: 'Dr. Ahmed Raza', medicineId: 'm1', medicineName: 'Panadol 500mg', qty: 6, date: '2026-05-05T10:01:00', dispensedBy: 'Ali Ahmed', notes: '' },
];

export function getMedicineStatus(medicine: Omit<Medicine, 'status'>): Medicine['status'] {
  const today = new Date();
  const expiry = new Date(medicine.expiryDate);
  if (expiry < today) return 'Expired';
  if (medicine.stockQty === 0) return 'Out of Stock';
  if (medicine.stockQty <= medicine.lowStockThreshold) return 'Low Stock';
  return 'In Stock';
}