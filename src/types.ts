export type DrugType = 'tablet' | 'syrup' | 'injection' | 'cream' | 'capsule' | 'other' | (string & {});

export interface Drug {
  id: string;
  scientificName: string;
  commercialName: string;
  type: DrugType;
  category: string;
  barcode: string;
  minStockLevel: number;
  image?: string;
  normalPurchasePrice: number;
  normalSellPrice: number;
}

export interface Batch {
  id: string;
  drugId: string;
  batchNumber: string;
  supplierId: string;
  purchasePrice: number;
  sellPrice: number;
  stripsPerBox: number;
  stripPrice: number;
  quantityBoxes: number;
  quantityStrips: number;
  productionDate: string;
  expiryDate: string;
  receivedDate: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
}

export interface SaleItem {
  drugId: string;
  batchId: string;
  quantity: number;
  unit: 'box' | 'strip';
  price: number;
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
  paymentMethod: 'cash' | 'debt';
  customerId?: string;
  patientName?: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'pharmacist' | 'cashier';
  phone: string;
  status: 'active' | 'restricted';
  shiftStart: string; // HH:mm
  shiftEnd: string; // HH:mm
  createdAt: string;
}

export interface ShiftLog {
  id: string;
  userId: string;
  loginTime: string;
  logoutTime?: string;
  isLate: boolean;
  lateMinutes: number;
  isOvertime: boolean;
  overtimeMinutes: number;
  date: string;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  fontScale: number; // 0.8 to 1.5
  darkMode: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense' | 'purchase_debt' | 'sale_debt';
  amount: number;
  description: string;
  category: string;
  userId?: string;
  relatedId?: string; // saleId or purchaseId
}

export interface DashboardStats {
  dailySales: number;
  dailyExpenses: number;
  invoiceCount: number;
  lowStockCount: number;
  expiredCount: number;
  nearExpiryCount: number;
  topSellingDrug: string;
  totalCustomerDebt: number;
  totalSupplierDebt: number;
  netIncome: number;
}

export interface Prescription {
  id: string;
  patientName: string;
  doctorName?: string;
  date: string;
  items: SaleItem[];
  total: number;
  status: 'pending' | 'dispensed' | 'cancelled';
  note?: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  width: '80mm' | '210mm';
  // Header
  pharmacyName: string;
  pharmacyPhone: string;
  pharmacyAddress: string; // Added
  logoUrl?: string;
  headerFontSize: 'text-sm' | 'text-base' | 'text-lg' | 'text-xl';
  // Body/Table
  showScientificName: boolean;
  showBoxPrice: boolean;
  showPatientName: boolean; // Added
  showDoctorName: boolean; // Added
  // Footer
  footerMessage: string;
  // Layout
  margin: 'p-2' | 'p-4' | 'p-8';
  primaryColor: string; // Tailwind color class, e.g., 'emerald-600'
}

export interface SubstitutePharmacist {
  id: string;
  name: string;
  replacedPharmacistName: string;
  shiftDate: string;
  shiftStart: string;
  shiftEnd: string;
  agreedPrice: number;
  status: 'pending' | 'paid' | 'cancelled';
}

export interface SubstitutePayment {
  id: string;
  substituteId: string;
  substituteName: string;
  replacedPharmacistName: string;
  agreedPrice: number;
  shiftDate: string;
  shiftTime: string;
  paymentDate: string;
}

export interface PatientRequest {
  id: string;
  patientName: string;
  drugName: string;
  phone: string;
  note?: string;
  date: string;
  status: 'pending' | 'ordered' | 'available' | 'delivered';
}
