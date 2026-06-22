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
  unitsPerPack: number;   // ADD THIS LINE
  expiryDate: string;
  batchNo: string;
  description: string;
  status: 'In Stock' | 'Low Stock' | 'Expired' | 'Out of Stock';
}