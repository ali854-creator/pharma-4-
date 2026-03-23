/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Pill, 
  Package, 
  Truck, 
  FileText, 
  Wallet, 
  Users, 
  Settings, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Barcode,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  DollarSign,
  Printer,
  Save,
  History,
  UserPlus,
  FileClock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Drug, Batch, Sale, Transaction, DashboardStats, DrugType, Supplier, User, ShiftLog, ThemeConfig, SubstitutePharmacist, PatientRequest, SaleItem, Prescription, FormTemplate } from './types';
import { TemplateDesigner } from './components/TemplateDesigner';

// Mock Data
const MOCK_DRUGS: Drug[] = [
  { id: '1', scientificName: 'Paracetamol', commercialName: 'Panadol', type: 'tablet', category: 'Analgesic', barcode: '123456', minStockLevel: 10, normalPurchasePrice: 1500, normalSellPrice: 2500 },
  { id: '2', scientificName: 'Amoxicillin', commercialName: 'Amoxil', type: 'capsule', category: 'Antibiotic', barcode: '234567', minStockLevel: 5, normalPurchasePrice: 4000, normalSellPrice: 6000 },
  { id: '3', scientificName: 'Ibuprofen', commercialName: 'Advil', type: 'tablet', category: 'Analgesic', barcode: '345678', minStockLevel: 8, normalPurchasePrice: 2500, normalSellPrice: 4000 },
  { id: '4', scientificName: 'Cetirizine', commercialName: 'Zyrtec', type: 'tablet', category: 'Antihistamine', barcode: '456789', minStockLevel: 15, normalPurchasePrice: 1000, normalSellPrice: 2000 },
];

const MOCK_BATCHES: Batch[] = [
  { id: 'b1', drugId: '1', batchNumber: 'BN001', supplierId: 's1', purchasePrice: 2000, sellPrice: 3000, stripsPerBox: 2, stripPrice: 1500, quantityBoxes: 20, quantityStrips: 40, productionDate: '2024-01-01', expiryDate: '2026-01-01', receivedDate: '2024-02-01' },
  { id: 'b2', drugId: '2', batchNumber: 'BN002', supplierId: 's2', purchasePrice: 5000, sellPrice: 7500, stripsPerBox: 3, stripPrice: 2500, quantityBoxes: 3, quantityStrips: 9, productionDate: '2023-06-01', expiryDate: '2024-06-01', receivedDate: '2023-07-01' },
  { id: 'b3', drugId: '3', batchNumber: 'BN003', supplierId: 's1', purchasePrice: 3000, sellPrice: 4500, stripsPerBox: 2, stripPrice: 2250, quantityBoxes: 15, quantityStrips: 30, productionDate: '2024-03-01', expiryDate: '2027-03-01', receivedDate: '2024-04-01' },
];

const MOCK_SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'مذخر الأمل' },
  { id: 's2', name: 'مذخر النور' },
];

type View = 'dashboard' | 'pos' | 'drugs' | 'shortages' | 'inventory' | 'purchases' | 'prescriptions' | 'history' | 'accounting' | 'users' | 'settings' | 'requests';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [globalDate, setGlobalDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [actionLogs, setActionLogs] = useState<{ id: string; date: string; section: string; description: string }[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>(MOCK_DRUGS);
  
  const logAction = (section: string, description: string) => {
    setActionLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      section,
      description
    }, ...prev]);
  };
  const [batches, setBatches] = useState<Batch[]>(MOCK_BATCHES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [sales, setSales] = useState<Sale[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSaleConfirm, setShowSaleConfirm] = useState(false);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<'cash' | 'debt' | null>(null);
  const [showPatientRequestModal, setShowPatientRequestModal] = useState(false);

  // POS State
  const [cart, setCart] = useState<{ drugId: string; batchId: string; quantity: number; unit: 'box' | 'strip'; price: number }[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [patientName, setPatientName] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'amount' | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [shouldPrint, setShouldPrint] = useState(true);
  const [printType, setPrintType] = useState<'invoice' | 'prescription'>('invoice');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Barcode Scanning Logic
  useEffect(() => {
    if (posSearch.length >= 6) {
      const drug = drugs.find(d => d.barcode === posSearch);
      if (drug) {
        const drugBatches = batches.filter(b => b.drugId === drug.id && b.quantityStrips > 0);
        if (drugBatches.length > 0) {
          addToCart(drug, drugBatches[0], 'box');
          setPosSearch('');
          setToast({ message: `تمت إضافة ${drug.commercialName} عبر الباركود`, type: 'success' });
          setTimeout(() => setToast(null), 3000);
        } else {
          setToast({ message: `العلاج ${drug.commercialName} غير متوفر في المخزن`, type: 'error' });
          setTimeout(() => setToast(null), 3000);
          setPosSearch('');
        }
      }
    }
  }, [posSearch, drugs, batches]);

  // Purchases State
  const [showAddDrugModal, setShowAddDrugModal] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminAuthAction, setAdminAuthAction] = useState<(() => void) | null>(null);
  const [adminAuthPassword, setAdminAuthPassword] = useState('');
  const [adminOverrideCode, setAdminOverrideCode] = useState('1234');
  const [showEditDrugModal, setShowEditDrugModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [newDrug, setNewDrug] = useState<any>({
    scientificName: '',
    commercialName: '',
    type: 'tablet',
    category: '',
    barcode: '',
    minStockLevel: 10,
    image: '',
    normalPurchasePrice: 0,
    normalSellPrice: 0,
    // Initial Batch Fields
    supplierId: '',
    purchasePrice: 0,
    sellPrice: 0,
    stripsPerBox: 1,
    stripPrice: 0,
    quantityBoxes: 0,
    batchNumber: 'BN-' + Math.floor(Math.random() * 10000),
    productionDate: '',
    expiryDate: ''
  });

  const [purchaseForm, setPurchaseForm] = useState({
    drugId: '',
    supplierId: '',
    purchasePrice: 0,
    sellPrice: 0,
    quantityBoxes: 0,
    stripsPerBox: 1,
    batchNumber: '',
    productionDate: '',
    expiryDate: '',
    paymentMethod: 'cash' as 'cash' | 'debt'
  });

  const [showQuickStockModal, setShowQuickStockModal] = useState(false);
  const [quickStockBarcode, setQuickStockBarcode] = useState('');
  const [quickStockDrug, setQuickStockDrug] = useState<Drug | null>(null);
  const [quickStockData, setQuickStockData] = useState({
    quantityBoxes: 0,
    quantityStrips: 0,
    expiryDate: '',
    purchasePrice: 0,
    sellPrice: 0
  });

  const [showSupplierPaymentModal, setShowSupplierPaymentModal] = useState(false);
  const [supplierPaymentAmount, setSupplierPaymentAmount] = useState<number>(0);
  const [selectedSupplierDebtId, setSelectedSupplierDebtId] = useState<string | null>(null);

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showDebtReport, setShowDebtReport] = useState(false);
  const [debtType, setDebtType] = useState<'customer' | 'supplier'>('customer');
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'income',
    category: 'مبيعات',
    amount: 0,
    description: ''
  });
  const [users, setUsers] = useState<User[]>([
    { id: 'u1', name: 'د. علي الحسيني', username: 'admin', role: 'admin', phone: '07800000000', status: 'active', shiftStart: '08:00', shiftEnd: '16:00', createdAt: new Date().toISOString() },
    { id: 'u2', name: 'أحمد جاسم', username: 'ahmed', role: 'pharmacist', phone: '07811111111', status: 'active', shiftStart: '16:00', shiftEnd: '00:00', createdAt: new Date().toISOString() },
  ]);
  const [shiftLogs, setShiftLogs] = useState<ShiftLog[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(users[0]);
  const [theme, setTheme] = useState<ThemeConfig>({
    primaryColor: '#10b981',
    secondaryColor: '#3b82f6',
    fontScale: 1,
    darkMode: false
  });
  const [securityPin, setSecurityPin] = useState<string>('');
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({ role: 'pharmacist', status: 'active', shiftStart: '08:00', shiftEnd: '16:00' });
  const [substitutes, setSubstitutes] = useState<SubstitutePharmacist[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([{ id: '1', name: 'افتراضي', width: '80mm', pharmacyName: 'صيدلية الأمل', pharmacyPhone: '07700000000', pharmacyAddress: 'بغداد - الكرادة', headerFontSize: 'text-base', showScientificName: true, showBoxPrice: true, showPatientName: true, showDoctorName: true, footerMessage: 'مع تمنياتنا لكم بالشفاء العاجل', margin: 'p-4', primaryColor: 'emerald-600' }]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('1');
  const [prescriptionSearch, setPrescriptionSearch] = useState('');
  const [prescriptionPaymentMethod, setPrescriptionPaymentMethod] = useState<'cash' | 'debt'>('cash');
  const [prescriptionCart, setPrescriptionCart] = useState<SaleItem[]>([]);
  const [prescriptionPatient, setPrescriptionPatient] = useState('');
  const [prescriptionDoctor, setPrescriptionDoctor] = useState('');
  const [prescriptionDiscountType, setPrescriptionDiscountType] = useState<'percent' | 'amount' | null>(null);
  const [prescriptionDiscountValue, setPrescriptionDiscountValue] = useState<number>(0);
  const [patients, setPatients] = useState<string[]>(['أحمد محمد', 'سارة علي', 'محمود حسن']);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patientRequests, setPatientRequests] = useState<PatientRequest[]>([]);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [newPrescription, setNewPrescription] = useState<Partial<Prescription>>({
    patientName: '',
    doctorName: '',
    items: [],
    status: 'pending'
  });
  const [newPatientRequest, setNewPatientRequest] = useState<Partial<PatientRequest>>({
    patientName: '',
    drugName: '',
    phone: '',
    status: 'pending'
  });
  const [showSubstituteModal, setShowSubstituteModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [newSubstitute, setNewSubstitute] = useState<Partial<SubstitutePharmacist>>({
    status: 'pending',
    shiftDate: new Date().toISOString().split('T')[0],
    shiftStart: '08:00',
    shiftEnd: '16:00',
    agreedPrice: 0,
    replacedPharmacistName: ''
  });

  const formatPrice = (price?: number | null) => {
    if (price === undefined || price === null) return '0 د.ع';
    return `${price.toLocaleString('ar-IQ')} د.ع`;
  };

  const handlePriceBlur = (value: number, setter: (val: number) => void) => {
    if (value > 0 && value < 1000) {
      setter(value * 1000);
    }
  };

  // Shift tracking logic
  useEffect(() => {
    if (currentUser) {
      const now = new Date();
      const [startHour, startMin] = currentUser.shiftStart.split(':').map(Number);
      const shiftStartTime = new Date();
      shiftStartTime.setHours(startHour, startMin, 0, 0);

      const isLate = now > shiftStartTime;
      const lateMinutes = isLate ? Math.floor((now.getTime() - shiftStartTime.getTime()) / 60000) : 0;

      // Only log if not already logged for today
      const today = now.toISOString().split('T')[0];
      const alreadyLogged = shiftLogs.find(log => log.userId === currentUser.id && log.date === today);

      if (!alreadyLogged) {
        const newLog: ShiftLog = {
          id: Math.random().toString(36).substr(2, 9),
          userId: currentUser.id,
          loginTime: now.toISOString(),
          isLate,
          lateMinutes,
          isOvertime: false,
          overtimeMinutes: 0,
          date: today
        };
        setShiftLogs(prev => [...prev, newLog]);
        
        if (isLate) {
          setToast({ message: `تنبيه: تم تسجيل تأخير لمدة ${lateMinutes} دقيقة`, type: 'error' });
          setTimeout(() => setToast(null), 5000);
        }
      } else {
        // Check for overtime if they are still logged in past shift end
        const [endHour, endMin] = currentUser.shiftEnd.split(':').map(Number);
        const shiftEndTime = new Date();
        shiftEndTime.setHours(endHour, endMin, 0, 0);
        
        if (now > shiftEndTime && !alreadyLogged.isOvertime) {
          const overtimeMinutes = Math.floor((now.getTime() - shiftEndTime.getTime()) / 60000);
          if (overtimeMinutes > 0) {
            setShiftLogs(prev => prev.map(log => 
              log.id === alreadyLogged.id ? { ...log, isOvertime: true, overtimeMinutes } : log
            ));
            setToast({ message: `تنبيه: تم تسجيل وقت إضافي لمدة ${overtimeMinutes} دقيقة`, type: 'success' });
            setTimeout(() => setToast(null), 5000);
          }
        }
      }
    }
  }, [currentUser]);

  // Font scale effect
  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * theme.fontScale}px`;
  }, [theme.fontScale]);

  const handleQuickStockScan = (barcode: string) => {
    const drug = drugs.find(d => d.barcode === barcode);
    if (drug) {
      setQuickStockDrug(drug);
      setQuickStockBarcode('');
      const drugBatches = batches.filter(b => b.drugId === drug.id).sort((a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime());
      const latestBatch = drugBatches[0];
      if (latestBatch) {
        setQuickStockData({
          quantityBoxes: 0,
          quantityStrips: 0,
          expiryDate: latestBatch.expiryDate,
          purchasePrice: latestBatch.purchasePrice,
          sellPrice: latestBatch.sellPrice
        });
      } else {
        setQuickStockData({
          quantityBoxes: 0,
          quantityStrips: 0,
          expiryDate: '',
          purchasePrice: 0,
          sellPrice: 0
        });
      }
    } else {
      setToast({ message: 'العلاج غير موجود، يرجى إضافته أولاً', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleAddQuickStock = () => {
    if (!quickStockDrug) return;
    
    const newBatch: Batch = {
      id: Math.random().toString(36).substr(2, 9),
      drugId: quickStockDrug.id,
      batchNumber: `QS-${Date.now().toString().slice(-6)}`,
      supplierId: 's1',
      purchasePrice: quickStockData.purchasePrice,
      sellPrice: quickStockData.sellPrice,
      stripsPerBox: 2,
      stripPrice: quickStockData.sellPrice / 2,
      quantityBoxes: quickStockData.quantityBoxes,
      quantityStrips: quickStockData.quantityBoxes * 2 + quickStockData.quantityStrips,
      productionDate: new Date().toISOString().split('T')[0],
      expiryDate: quickStockData.expiryDate,
      receivedDate: new Date().toISOString().split('T')[0]
    };

    setBatches([...batches, newBatch]);
    setShowQuickStockModal(false);
    setQuickStockDrug(null);
    setQuickStockData({
      quantityBoxes: 0,
      quantityStrips: 0,
      expiryDate: '',
      purchasePrice: 0,
      sellPrice: 0
    });
    setToast({ message: `تمت إضافة الكمية لـ ${quickStockDrug.commercialName} بنجاح`, type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSavePrescription = () => {
    if (!prescriptionPatient.trim() || prescriptionCart.length === 0) {
      setToast({ message: 'يرجى إدخال اسم المريض وإضافة دواء واحد على الأقل', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const subtotal = prescriptionCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    let finalTotal = subtotal;
    if (prescriptionDiscountType === 'percent') {
      finalTotal = subtotal - (subtotal * (prescriptionDiscountValue / 100));
    } else if (prescriptionDiscountType === 'amount') {
      finalTotal = subtotal - prescriptionDiscountValue;
    }
    finalTotal = Math.max(0, finalTotal);

    const newPrescription: Prescription = {
      id: Math.random().toString(36).substr(2, 9),
      patientName: prescriptionPatient,
      doctorName: prescriptionDoctor,
      date: new Date().toISOString(),
      items: prescriptionCart,
      total: finalTotal,
      status: 'dispensed'
    };

    setPrescriptions([...prescriptions, newPrescription]);
    
    const newSale: Sale = {
      id: newPrescription.id,
      date: newPrescription.date,
      items: prescriptionCart,
      total: finalTotal,
      paymentMethod: prescriptionPaymentMethod,
      patientName: prescriptionPatient
    };
    setSales([...sales, newSale]);

    if (prescriptionPaymentMethod === 'debt') {
      const newTransaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        type: 'sale_debt',
        amount: finalTotal,
        description: `دين على المريض: ${prescriptionPatient}`,
        category: 'ديون العملاء',
        relatedId: newSale.id
      };
      setTransactions([...transactions, newTransaction]);
    }

    if (!patients.includes(prescriptionPatient)) {
      setPatients([...patients, prescriptionPatient]);
    }
    
    logAction('المبيعات', `صرف وصفة طبية للمريض: ${prescriptionPatient}`);

    setPrescriptionCart([]);
    setPrescriptionPatient('');
    setPrescriptionDoctor('');
    setPrescriptionDiscountType(null);
    setPrescriptionDiscountValue(0);
    setToast({ message: 'تم حفظ وصرف الوصفة بنجاح', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const addToPrescriptionCart = (drug: Drug, batch: Batch, unit: 'box' | 'strip' = 'box') => {
    const price = unit === 'box' ? batch.sellPrice : Math.round(batch.sellPrice / batch.stripsPerBox);
    const existing = prescriptionCart.find(item => item.batchId === batch.id && item.unit === unit);
    if (existing) {
      setPrescriptionCart(prescriptionCart.map(item => item.batchId === batch.id && item.unit === unit ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setPrescriptionCart([...prescriptionCart, { 
        drugId: drug.id, 
        batchId: batch.id, 
        quantity: 1, 
        unit: unit, 
        price: price 
      }]);
    }
  };

  useEffect(() => {
    if (prescriptionSearch.length >= 6) {
      const drug = drugs.find(d => d.barcode === prescriptionSearch);
      if (drug) {
        const drugBatches = batches.filter(b => b.drugId === drug.id && b.quantityStrips > 0);
        if (drugBatches.length > 0) {
          addToPrescriptionCart(drug, drugBatches[0]);
          setPrescriptionSearch('');
          setToast({ message: `تمت إضافة ${drug.commercialName} عبر الباركود`, type: 'success' });
          setTimeout(() => setToast(null), 3000);
        } else {
          setToast({ message: `العلاج ${drug.commercialName} غير متوفر في المخزن`, type: 'error' });
          setTimeout(() => setToast(null), 3000);
          setPrescriptionSearch('');
        }
      }
    }
  }, [prescriptionSearch, drugs, batches]);

  const handleAddUser = () => {
    if (!newUser.name || !newUser.username || !newUser.role) return;
    
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name,
      username: newUser.username,
      role: newUser.role as any,
      phone: newUser.phone || '',
      status: 'active',
      shiftStart: newUser.shiftStart || '08:00',
      shiftEnd: newUser.shiftEnd || '16:00',
      createdAt: new Date().toISOString()
    };

    setUsers([...users, user]);
    setShowUserModal(false);
    setNewUser({ role: 'pharmacist', status: 'active', shiftStart: '08:00', shiftEnd: '16:00' });
    setToast({ message: 'تم إضافة المستخدم بنجاح', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddSubstitute = () => {
    if (!newSubstitute.name || !newSubstitute.agreedPrice || !newSubstitute.replacedPharmacistName) {
      setToast({ message: 'يرجى ملء كافة الحقول المطلوبة', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    const substitute: SubstitutePharmacist = {
      id: Math.random().toString(36).substr(2, 9),
      name: newSubstitute.name,
      replacedPharmacistName: newSubstitute.replacedPharmacistName,
      shiftDate: newSubstitute.shiftDate || new Date().toISOString().split('T')[0],
      shiftStart: newSubstitute.shiftStart || '08:00',
      shiftEnd: newSubstitute.shiftEnd || '16:00',
      agreedPrice: newSubstitute.agreedPrice,
      status: 'pending'
    };

    setSubstitutes([...substitutes, substitute]);
    setShowSubstituteModal(false);
    setNewSubstitute({
      status: 'pending',
      shiftDate: new Date().toISOString().split('T')[0],
      shiftStart: '08:00',
      shiftEnd: '16:00',
      agreedPrice: 0,
      replacedPharmacistName: ''
    });
    setToast({ message: 'تم إضافة البديل بنجاح', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddPatientRequest = () => {
    if (!newPatientRequest.patientName || !newPatientRequest.drugName) return;
    
    const request: PatientRequest = {
      id: Math.random().toString(36).substr(2, 9),
      patientName: newPatientRequest.patientName,
      drugName: newPatientRequest.drugName,
      phone: newPatientRequest.phone || '',
      note: newPatientRequest.note,
      date: new Date().toISOString(),
      status: 'pending'
    };

    setPatientRequests([...patientRequests, request]);
    setShowPatientRequestModal(false);
    setNewPatientRequest({
      patientName: '',
      drugName: '',
      phone: '',
      status: 'pending'
    });
    setToast({ message: 'تم تسجيل طلب الدواء بنجاح', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    setConfirmDeleteUser(null);
    setToast({ message: 'تم حذف المستخدم بنجاح', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleResetLateness = (logId: string) => {
    if (currentUser?.role !== 'admin') return;
    setShiftLogs(shiftLogs.map(log => log.id === logId ? { ...log, isLate: false, lateMinutes: 0 } : log));
    setToast({ message: 'تم تصفير التأخير بنجاح', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdatePassword = (userId: string, newPassword: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, password: newPassword } : u));
    setToast({ message: 'تم تحديث كلمة المرور بنجاح', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setShowEditUserModal(false);
    setToast({ message: 'تم تحديث البيانات بنجاح', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'expired' | 'nearExpiry'>('all');

  const handlePrintInventory = (type: 'expired' | 'nearExpiry' | 'all') => {
    let filteredBatches = batches;
    let title = 'كشف المخزون';
    
    if (type === 'expired') {
      filteredBatches = batches.filter(b => new Date(b.expiryDate) < new Date());
      title = 'كشف الأدوية منتهية الصلاحية';
    } else if (type === 'nearExpiry') {
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      filteredBatches = batches.filter(b => {
        const expiry = new Date(b.expiryDate);
        return expiry > new Date() && expiry < threeMonthsFromNow;
      });
      title = 'كشف الأدوية قريبة الانتهاء';
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>${title}</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: right; }
              th { background-color: #f8fafc; }
            </style>
          </head>
          <body>
            <h2>${title} - ${new Date().toLocaleDateString('ar-IQ')}</h2>
            <table>
              <thead>
                <tr>
                  <th>اسم الدواء</th>
                  <th>رقم الوجبة</th>
                  <th>الكمية (علبة)</th>
                  <th>تاريخ الانتهاء</th>
                </tr>
              </thead>
              <tbody>
                ${filteredBatches.map(b => {
                  const drug = drugs.find(d => d.id === b.drugId);
                  return `
                    <tr>
                      <td>${drug?.commercialName}</td>
                      <td>${b.batchNumber}</td>
                      <td>${b.quantityBoxes}</td>
                      <td>${b.expiryDate}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handlePrintShortages = () => {
    const lowStockDrugs = drugs.filter(d => {
      const totalBoxes = batches.filter(b => b.drugId === d.id).reduce((acc, b) => acc + b.quantityBoxes, 0);
      return totalBoxes < d.minStockLevel;
    });

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>قائمة النواقص</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: right; }
              th { background-color: #f8fafc; }
            </style>
          </head>
          <body>
            <h2>قائمة النواقص - ${new Date().toLocaleDateString('ar-IQ')}</h2>
            <table>
              <thead>
                <tr>
                  <th>اسم الدواء</th>
                  <th>الاسم العلمي</th>
                  <th>الكمية الحالية (علبة)</th>
                  <th>الحد الأدنى</th>
                </tr>
              </thead>
              <tbody>
                ${lowStockDrugs.map(d => {
                  const totalBoxes = batches.filter(b => b.drugId === d.id).reduce((acc, b) => acc + b.quantityBoxes, 0);
                  return `
                    <tr>
                      <td>${d.commercialName}</td>
                      <td>${d.scientificName}</td>
                      <td>${totalBoxes}</td>
                      <td>${d.minStockLevel}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleAddTransaction = () => {
    if (!newTransaction.amount || !newTransaction.description) return;
    
    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      type: newTransaction.type as 'income' | 'expense',
      category: newTransaction.category || 'عام',
      amount: newTransaction.amount,
      description: newTransaction.description,
      userId: currentUser?.id || 'u1'
    };

    setTransactions([...transactions, transaction]);
    setShowTransactionModal(false);
    setNewTransaction({ type: 'income', category: 'مبيعات', amount: 0, description: '' });
    setToast({ message: 'تم تسجيل الحركة المالية بنجاح', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const validatePhone = (phone: string) => {
    return /^07[789]\d{8}$/.test(phone);
  };

  const deleteBatch = (batchId: string) => {
    setConfirmDeleteBatch(batchId);
  };

  const confirmDeleteBatchAction = (batchId: string) => {
    setBatches(batches.filter(b => b.id !== batchId));
    setConfirmDeleteBatch(null);
    setToast({ message: 'تم حذف الوجبة بنجاح', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const deleteDrug = (drugId: string) => {
    setDrugs(drugs.filter(d => d.id !== drugId));
    setBatches(batches.filter(b => b.drugId !== drugId));
    setConfirmDelete(null);
    setToast({ message: 'تم حذف العلاج بنجاح', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdminAuth = () => {
    if (adminAuthPassword === adminOverrideCode || currentUser?.role === 'admin') {
      if (adminAuthAction) adminAuthAction();
      setShowAdminAuthModal(false);
      setAdminAuthPassword('');
      setAdminAuthAction(null);
      // Generate a new code after successful use if it was used by a non-admin
      if (currentUser?.role !== 'admin') {
        setAdminOverrideCode(Math.floor(1000 + Math.random() * 9000).toString());
      }
    } else {
      setToast({ message: 'الرمز غير صحيح', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const requireAdminAuth = (action: () => void) => {
    if (currentUser?.role === 'admin') {
      action(); // Admin can do it directly
    } else {
      setAdminAuthAction(() => action);
      setShowAdminAuthModal(true);
    }
  };

  const handleClearCustomerDebt = (saleId?: string, customerName?: string) => {
    requireAdminAuth(() => {
      if (saleId) {
        setSales(sales.map(s => s.id === saleId ? { ...s, paymentMethod: 'cash' } : s));
      } else if (customerName) {
        setSales(sales.map(s => s.patientName === customerName && s.paymentMethod === 'debt' ? { ...s, paymentMethod: 'cash' } : s));
      } else {
        setSales(sales.map(s => s.paymentMethod === 'debt' ? { ...s, paymentMethod: 'cash' } : s));
      }
      setToast({ message: 'تم تصفير الديون بنجاح', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    });
  };

  const handlePaySupplierDebt = () => {
    if (!selectedSupplierDebtId || supplierPaymentAmount <= 0) return;
    
    requireAdminAuth(() => {
      const debtTransaction = transactions.find(t => t.id === selectedSupplierDebtId);
      if (debtTransaction) {
        if (supplierPaymentAmount >= debtTransaction.amount) {
          // Fully paid, remove debt
          setTransactions(transactions.filter(t => t.id !== selectedSupplierDebtId));
        } else {
          // Partially paid, reduce debt
          setTransactions(transactions.map(t => 
            t.id === selectedSupplierDebtId 
              ? { ...t, amount: t.amount - supplierPaymentAmount } 
              : t
          ));
        }
        
        // Add payment transaction
        const paymentTransaction: Transaction = {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          type: 'expense',
          amount: supplierPaymentAmount,
          description: `تسديد دين للمورد: ${debtTransaction.description.split('(')[1]?.replace(')', '') || 'مورد غير معروف'}`,
          category: 'تسديد ديون'
        };
        setTransactions(prev => [...prev, paymentTransaction]);
        
        setShowSupplierPaymentModal(false);
        setSupplierPaymentAmount(0);
        setSelectedSupplierDebtId(null);
        setToast({ message: 'تم تسديد المبلغ بنجاح', type: 'success' });
        setTimeout(() => setToast(null), 3000);
      }
    });
  };

  const handleClearSupplierDebt = (transactionId?: string) => {
    requireAdminAuth(() => {
      if (transactionId) {
        setTransactions(transactions.filter(t => t.id !== transactionId));
      } else {
        setTransactions(transactions.filter(t => t.type !== 'purchase_debt'));
      }
      setToast({ message: 'تم تصفير ديون الموردين بنجاح', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    });
  };

  const handleAddDrug = () => {
    if (!newDrug.commercialName || !newDrug.scientificName || !newDrug.purchasePrice || !newDrug.sellPrice) {
      alert('يرجى ملء كافة الحقول المطلوبة (الاسم، السعر، الكمية)');
      return;
    }

    const drugId = Math.random().toString(36).substr(2, 9);
    
    const drug: Drug = {
      id: drugId,
      scientificName: newDrug.scientificName,
      commercialName: newDrug.commercialName,
      type: newDrug.type,
      category: newDrug.category,
      barcode: newDrug.barcode,
      minStockLevel: newDrug.minStockLevel,
      image: newDrug.image,
      normalPurchasePrice: Number(newDrug.normalPurchasePrice),
      normalSellPrice: Number(newDrug.normalSellPrice)
    };

    const batch: Batch = {
      id: Math.random().toString(36).substr(2, 9),
      drugId: drugId,
      batchNumber: newDrug.batchNumber,
      supplierId: newDrug.supplierId || 's1', // Default to first supplier if not set
      purchasePrice: Number(newDrug.purchasePrice),
      sellPrice: Number(newDrug.sellPrice),
      stripsPerBox: Number(newDrug.stripsPerBox),
      stripPrice: Number(newDrug.stripPrice) || Math.round(newDrug.sellPrice / newDrug.stripsPerBox),
      quantityBoxes: Number(newDrug.quantityBoxes),
      quantityStrips: Number(newDrug.quantityBoxes) * Number(newDrug.stripsPerBox),
      productionDate: newDrug.productionDate,
      expiryDate: newDrug.expiryDate,
      receivedDate: new Date().toISOString().split('T')[0]
    };

    setDrugs([...drugs, drug]);
    setBatches([...batches, batch]);
    logAction('المخزون', `إضافة دواء جديد: ${newDrug.commercialName}`);
    
    // Add transaction
    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      type: 'expense',
      amount: Number(newDrug.purchasePrice) * Number(newDrug.quantityBoxes),
      description: `شراء وإضافة علاج جديد: ${newDrug.commercialName}`,
      category: 'مشتريات'
    };
    setTransactions([...transactions, transaction]);

    setShowAddDrugModal(false);
    setNewDrug({
      scientificName: '',
      commercialName: '',
      type: 'tablet',
      category: '',
      barcode: '',
      minStockLevel: 10,
      image: '',
      supplierId: '',
      purchasePrice: 0,
      sellPrice: 0,
      stripsPerBox: 1,
      stripPrice: 0,
      quantityBoxes: 0,
      batchNumber: 'BN-' + Math.floor(Math.random() * 10000),
      productionDate: '',
      expiryDate: ''
    });
    alert('تمت إضافة العلاج والكمية بنجاح');
  };

  const handleUpdateDrug = () => {
    if (!editingDrug) return;
    setDrugs(drugs.map(d => d.id === editingDrug.id ? editingDrug : d));
    logAction('المخزون', `تعديل بيانات دواء: ${editingDrug.commercialName}`);
    setShowEditDrugModal(false);
    setEditingDrug(null);
    setToast({ message: 'تم تحديث بيانات العلاج بنجاح', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const exportBackup = () => {
    const data = {
      drugs,
      batches,
      suppliers,
      sales,
      transactions,
      version: '1.0',
      date: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmacy_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ message: 'تم تصدير النسخة الاحتياطية بنجاح', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseForm.drugId || !purchaseForm.batchNumber || purchaseForm.quantityBoxes <= 0) {
      alert('يرجى ملء كافة الحقول المطلوبة بشكل صحيح');
      return;
    }

    const stripPrice = Math.round(purchaseForm.sellPrice / purchaseForm.stripsPerBox);
    const quantityStrips = purchaseForm.quantityBoxes * purchaseForm.stripsPerBox;

    const newBatch: Batch = {
      id: Math.random().toString(36).substr(2, 9),
      drugId: purchaseForm.drugId,
      batchNumber: purchaseForm.batchNumber,
      supplierId: purchaseForm.supplierId,
      purchasePrice: Number(purchaseForm.purchasePrice),
      sellPrice: Number(purchaseForm.sellPrice),
      stripsPerBox: Number(purchaseForm.stripsPerBox),
      stripPrice,
      quantityBoxes: Number(purchaseForm.quantityBoxes),
      quantityStrips,
      productionDate: purchaseForm.productionDate,
      expiryDate: purchaseForm.expiryDate,
      receivedDate: new Date().toISOString().split('T')[0]
    };

    setBatches([...batches, newBatch]);
    logAction('المشتريات', `إضافة وجبة دواء جديدة: ${drugs.find(d => d.id === purchaseForm.drugId)?.commercialName}`);
    
    // Add transaction
    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      type: purchaseForm.paymentMethod === 'debt' ? 'purchase_debt' : 'expense',
      amount: Number(purchaseForm.purchasePrice) * Number(purchaseForm.quantityBoxes),
      description: `شراء وجبة دواء: ${drugs.find(d => d.id === purchaseForm.drugId)?.commercialName} (${MOCK_SUPPLIERS.find(s => s.id === purchaseForm.supplierId)?.name || 'مورد غير معروف'})`,
      category: 'مشتريات',
      relatedId: purchaseForm.supplierId
    };
    setTransactions([...transactions, transaction]);

    setPurchaseForm({
      drugId: '',
      supplierId: '',
      purchasePrice: 0,
      sellPrice: 0,
      quantityBoxes: 0,
      stripsPerBox: 1,
      batchNumber: '',
      productionDate: '',
      expiryDate: '',
      paymentMethod: 'cash'
    });
    alert('تمت إضافة الوجبة بنجاح');
  };

  // Dashboard Stats Calculation
  const stats: DashboardStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date.startsWith(today)).reduce((acc, s) => acc + s.total, 0);
    const todayExpenses = transactions.filter(t => (t.type === 'expense' || t.type === 'purchase_debt_payment') && t.date.startsWith(today)).reduce((acc, t) => acc + t.amount, 0);
    const todayInvoices = sales.filter(s => s.date.startsWith(today)).length;
    
    const lowStock = drugs.filter(d => {
      const totalBoxes = batches.filter(b => b.drugId === d.id).reduce((acc, b) => acc + b.quantityBoxes, 0);
      return totalBoxes < d.minStockLevel;
    }).length;

    const expired = batches.filter(b => new Date(b.expiryDate) < new Date()).length;
    const nearExpiry = batches.filter(b => {
      const expiry = new Date(b.expiryDate);
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      return expiry > new Date() && expiry < threeMonthsFromNow;
    }).length;

    const totalCustomerDebt = transactions.filter(t => t.type === 'sale_debt').reduce((acc, t) => acc + t.amount, 0);
    const totalSupplierDebt = transactions.filter(t => t.type === 'purchase_debt').reduce((acc, t) => acc + t.amount, 0);
    const totalIncome = sales.reduce((acc, s) => acc + s.total, 0);
    
    // Expenses include 'expense' type and payments of 'purchase_debt'.
    const totalExpenses = transactions.filter(t => t.type === 'expense' || t.type === 'purchase_debt_payment').reduce((acc, t) => acc + t.amount, 0);

    // Calculate top selling drug
    const drugSalesCount: Record<string, number> = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        drugSalesCount[item.drugId] = (drugSalesCount[item.drugId] || 0) + item.quantity;
      });
    });
    
    let topDrugId = '';
    let maxSales = 0;
    Object.entries(drugSalesCount).forEach(([drugId, count]) => {
      if (count > maxSales) {
        maxSales = count;
        topDrugId = drugId;
      }
    });
    const topDrug = drugs.find(d => d.id === topDrugId);

    return {
      dailySales: todaySales,
      dailyExpenses: todayExpenses,
      invoiceCount: todayInvoices,
      lowStockCount: lowStock,
      expiredCount: expired,
      nearExpiryCount: nearExpiry,
      topSellingDrug: topDrug ? topDrug.commercialName : 'لا يوجد مبيعات',
      totalCustomerDebt,
      totalSupplierDebt,
      netIncome: totalIncome - totalExpenses
    };
  }, [sales, transactions, drugs, batches]);

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'pos', label: 'نقطة البيع', icon: ShoppingCart },
    { id: 'drugs', label: 'الأدوية', icon: Pill },
    { id: 'shortages', label: 'النواقص', icon: AlertTriangle },
    { id: 'inventory', label: 'المخزون', icon: Package },
    { id: 'purchases', label: 'المشتريات', icon: Truck },
    { id: 'prescriptions', label: 'الوصفات', icon: FileText },
    { id: 'history', label: 'التاريخ', icon: FileClock },
    { id: 'requests', label: 'طلبات المرضى', icon: UserPlus },
    { id: 'accounting', label: 'الحسابات', icon: Wallet },
    { id: 'users', label: 'المستخدمين', icon: Users },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  const addToCart = (drug: Drug, batch: Batch, unit: 'box' | 'strip' = 'box') => {
    // Check if adding this item would leave less than 1 box in stock
    const drugBatches = batches.filter(b => b.drugId === drug.id);
    const totalStrips = drugBatches.reduce((acc, b) => acc + b.quantityStrips, 0);
    
    // Calculate how many strips are already in cart for this drug
    const stripsInCart = cart
      .filter(item => item.drugId === drug.id)
      .reduce((acc, item) => {
        const b = batches.find(batch => batch.id === item.batchId);
        if (!b) return acc;
        return acc + (item.unit === 'box' ? item.quantity * b.stripsPerBox : item.quantity);
      }, 0);

    const stripsToAdd = unit === 'box' ? batch.stripsPerBox : 1;
    const price = unit === 'box' ? batch.sellPrice : Math.round(batch.sellPrice / batch.stripsPerBox);
    
    // The user wants to keep at least 1 box (stripsPerBox strips)
    if (totalStrips - (stripsInCart + stripsToAdd) < batch.stripsPerBox) {
      setToast({ message: `عذراً، يجب إبقاء علبة واحدة على الأقل من ${drug.commercialName} في المخزن`, type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const existing = cart.find(item => item.batchId === batch.id && item.unit === unit);
    if (existing) {
      setCart(cart.map(item => item.batchId === batch.id && item.unit === unit ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { 
        drugId: drug.id, 
        batchId: batch.id, 
        quantity: 1, 
        unit: unit, 
        price: price 
      }]);
      logAction('المبيعات', `إضافة دواء إلى السلة: ${drug.commercialName}`);
    }
  };

  const removeFromCart = (batchId: string, unit: 'box' | 'strip') => {
    setCart(cart.filter(item => !(item.batchId === batchId && item.unit === unit)));
  };

  const completeSale = (paymentMethod: 'cash' | 'debt') => {
    if (cart.length === 0) return;

    if (paymentMethod === 'debt' && !patientName.trim()) {
      setToast({ message: 'يرجى إدخال اسم المريض لتسجيل الدين', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setPendingPaymentMethod(paymentMethod);
    setShowSaleConfirm(true);
  };

  const finalizeSale = () => {
    if (!pendingPaymentMethod) return;
    const paymentMethod = pendingPaymentMethod;
    
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    let discount = 0;
    if (discountType === 'percent') {
      discount = (subtotal * discountValue) / 100;
    } else if (discountType === 'amount') {
      discount = discountValue;
    }
    const total = Math.max(0, subtotal - discount);

    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      items: cart,
      total,
      paymentMethod,
      patientName: patientName || undefined
    };

    // Add to Prescriptions (History)
    const newPrescription: Prescription = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      patientName: patientName || 'غير معروف',
      items: cart,
      total: total,
      status: 'dispensed'
    };
    setPrescriptions([...prescriptions, newPrescription]);

    // Update Inventory (FIFO logic would go here, but for demo we just subtract from the specific batch)
    const updatedBatches = batches.map(b => {
      const cartItem = cart.find(item => item.batchId === b.id);
      if (cartItem) {
        if (cartItem.unit === 'box') {
          return { ...b, quantityBoxes: b.quantityBoxes - cartItem.quantity, quantityStrips: b.quantityStrips - (cartItem.quantity * b.stripsPerBox) };
        } else {
          return { ...b, quantityStrips: b.quantityStrips - cartItem.quantity, quantityBoxes: Math.floor((b.quantityStrips - cartItem.quantity) / b.stripsPerBox) };
        }
      }
      return b;
    });

    setBatches(updatedBatches);
    setSales([...sales, newSale]);
    setCart([]);
    setPatientName('');
    setDiscountType(null);
    setDiscountValue(0);
    setShowSaleConfirm(false);
    setPendingPaymentMethod(null);
    
    if (shouldPrint) {
      setLastCompletedSale(newSale);
      setShowPrintModal(true);
    } else {
      alert('تمت عملية البيع بنجاح!');
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState<string | null>(null);

  return (
    <>
      <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-emerald-900 text-white transition-all duration-300 flex flex-col sticky top-0 h-screen z-50`}
      >
        <div className="p-4 flex items-center justify-between border-b border-emerald-800">
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">صيدليتي الذكية</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-emerald-800 rounded-lg transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentView === item.id 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                : 'text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <item.icon size={22} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-emerald-800">
          <button className="w-full flex items-center gap-3 p-3 text-emerald-100 hover:bg-emerald-800 rounded-xl transition-all">
            <LogOut size={22} />
            {isSidebarOpen && <span className="font-medium">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">
              {navItems.find(i => i.id === currentView)?.label}
            </h1>
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              <Clock size={14} />
              <span>{new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="بحث سريع..." 
                className="bg-slate-100 border-none rounded-full py-2 pr-10 pl-4 w-64 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-left hidden sm:block">
                <p className="text-sm font-bold leading-none">د. علي الحسيني</p>
                <p className="text-xs text-slate-500">مدير النظام</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-700 font-bold">
                ع
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="المبيعات اليومية" value={formatPrice(stats.dailySales)} icon={TrendingUp} color="emerald" trend="+12%" />
                    <StatCard title="المصروفات اليومية" value={formatPrice(stats.dailyExpenses)} icon={ArrowDownLeft} color="rose" trend="-5%" />
                    <StatCard title="صافي الدخل" value={formatPrice(stats.netIncome)} icon={DollarSign} color="blue" />
                    <StatCard title="أكثر دواء مبيعاً" value={stats.topSellingDrug} icon={Pill} color="amber" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-sm font-bold">ديون العملاء (لنا)</p>
                        <h4 className="text-2xl font-bold text-emerald-600">+{formatPrice(stats.totalCustomerDebt)}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">النسبة من المبيعات</p>
                        <p className="font-bold text-emerald-500">{Math.round((stats.totalCustomerDebt / (sales.reduce((acc, s) => acc + s.total, 0) || 1)) * 100)}%</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-sm font-bold">ديون الموردين (علينا)</p>
                        <h4 className="text-2xl font-bold text-rose-600">-{formatPrice(stats.totalSupplierDebt)}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">النسبة من المشتريات</p>
                        <p className="font-bold text-rose-500">{Math.round((stats.totalSupplierDebt / (transactions.filter(t => t.type === 'purchase_debt' || t.category === 'مشتريات').reduce((acc, t) => acc + t.amount, 0) || 1)) * 100)}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Alerts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            <AlertTriangle className="text-amber-500" />
                            تنبيهات النواقص والصلاحية
                          </h3>
                          <button className="text-emerald-600 text-sm font-medium hover:underline">عرض الكل</button>
                        </div>
                        <div className="space-y-4">
                          {batches.filter(b => new Date(b.expiryDate) < new Date()).map(b => (
                            <div key={b.id}>
                              <AlertItem 
                                type="expiry" 
                                title={drugs.find(d => d.id === b.drugId)?.commercialName || ''} 
                                detail={`منتهي الصلاحية بتاريخ ${b.expiryDate}`} 
                              />
                            </div>
                          ))}
                          {drugs.filter(d => batches.filter(b => b.drugId === d.id).reduce((acc, b) => acc + b.quantityBoxes, 0) < d.minStockLevel).map(d => (
                            <div key={d.id}>
                              <AlertItem 
                                type="stock" 
                                title={d.commercialName} 
                                detail={`الكمية المتبقية: ${batches.filter(b => b.drugId === d.id).reduce((acc, b) => acc + b.quantityBoxes, 0)} علبة`} 
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-6">آخر العمليات</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-right">
                            <thead>
                              <tr className="text-slate-400 border-b border-slate-100">
                                <th className="pb-3 font-medium">رقم العملية</th>
                                <th className="pb-3 font-medium">التاريخ</th>
                                <th className="pb-3 font-medium">المبلغ</th>
                                <th className="pb-3 font-medium">الحالة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {sales.slice(-5).reverse().map(sale => (
                                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-3 font-mono">#{sale.id}</td>
                                  <td className="py-3">{new Date(sale.date).toLocaleTimeString('ar-IQ')}</td>
                                  <td className="py-3 font-bold">{formatPrice(sale.total)}</td>
                                  <td className="py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs ${sale.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {sale.paymentMethod === 'cash' ? 'نقدي' : 'دين'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                          <p className="text-emerald-300 text-sm mb-1">صافي الربح التقديري (اليوم)</p>
                          <h2 className="text-3xl font-bold">{formatPrice(stats.dailySales * 0.25)}</h2>
                          <div className="mt-4 flex items-center gap-2 text-emerald-300 text-sm">
                            <TrendingUp size={16} />
                            <span>زيادة بنسبة 8% عن الأمس</span>
                          </div>
                        </div>
                        <TrendingUp className="absolute -bottom-4 -right-4 text-emerald-800 opacity-20" size={120} />
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-4">توزيع المخزون</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>متوفر</span>
                              <span className="font-bold">75%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 w-3/4"></div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>قريب الانتهاء</span>
                              <span className="font-bold">15%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 w-[15%]"></div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>نواقص</span>
                              <span className="font-bold">10%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 w-[10%]"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'pos' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
                  {/* Search & Selection */}
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                          type="text" 
                          placeholder="ابحث عن دواء (اسم علمي، تجاري، باركود)..." 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-10 pl-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={posSearch}
                          onChange={(e) => setPosSearch(e.target.value)}
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const input = document.querySelector('input[placeholder*="ابحث عن دواء"]') as HTMLInputElement;
                          if (input) input.focus();
                        }}
                        className="bg-slate-100 p-3 rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        <Barcode size={24} className="text-slate-600" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
                      {drugs.filter(d => 
                        d.commercialName.toLowerCase().includes(posSearch.toLowerCase()) || 
                        d.scientificName.toLowerCase().includes(posSearch.toLowerCase()) ||
                        d.barcode.includes(posSearch)
                      ).map(drug => {
                        const drugBatches = batches.filter(b => b.drugId === drug.id && b.quantityStrips > 0);
                        const totalStock = drugBatches.reduce((acc, b) => acc + b.quantityBoxes, 0);
                        
                        return (
                          <div key={drug.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-slate-800">{drug.commercialName}</h4>
                                <p className="text-xs text-slate-500">{drug.scientificName}</p>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${totalStock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {totalStock > 0 ? 'متوفر' : 'غير متوفر'}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between mt-4">
                              <div className="text-sm font-bold text-emerald-600">
                                {formatPrice(Math.round((drugBatches[0]?.sellPrice || 0) / (drugBatches[0]?.stripsPerBox || 1)))} / شريط
                              </div>
                              <div className="flex gap-1">
                                <button 
                                  disabled={totalStock === 0}
                                  onClick={() => addToCart(drug, drugBatches[0], 'strip')}
                                  className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                                  title="إضافة شريط"
                                >
                                  شريط
                                </button>
                                <button 
                                  disabled={totalStock < (drugBatches[0]?.stripsPerBox || 1)}
                                  onClick={() => addToCart(drug, drugBatches[0], 'box')}
                                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                                  title="إضافة علبة"
                                >
                                  علبة
                                </button>
                              </div>
                            </div>
                            
                            {totalStock === 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-100">
                                <p className="text-[10px] text-slate-400 mb-1">البدائل المقترحة:</p>
                                <div className="flex gap-1 flex-wrap">
                                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full cursor-pointer hover:bg-slate-200">باراسيتول</span>
                                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full cursor-pointer hover:bg-slate-200">أدول</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cart / Checkout */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-lg flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold flex items-center gap-2">
                        <ShoppingCart size={20} className="text-emerald-500" />
                        قائمة البيع
                      </h3>
                      <button onClick={() => { setCart([]); setPatientName(''); }} className="text-slate-400 hover:text-rose-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="px-4 py-3 border-b border-slate-50">
                      <div className="relative">
                        <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          placeholder="اسم المريض (اختياري)..." 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-9 pl-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                          <ShoppingCart size={48} strokeWidth={1} />
                          <p>القائمة فارغة</p>
                        </div>
                      ) : (
                        cart.map((item, idx) => {
                          const drug = drugs.find(d => d.id === item.drugId);
                          return (
                            <div key={`${item.batchId}-${item.unit}`} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                              <div className="flex-1">
                                <h5 className="text-sm font-bold">{drug?.commercialName}</h5>
                                <p className="text-[10px] text-slate-500">
                                  {item.unit === 'box' ? 'علبة' : 'شريط'} × {item.quantity}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-emerald-600">{formatPrice(item.price * item.quantity)}</p>
                                <button 
                                  onClick={() => removeFromCart(item.batchId, item.unit)}
                                  className="text-rose-400 hover:text-rose-600"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">خصم نسبة (%)</label>
                            <input 
                              type="number" 
                              disabled={discountType === 'amount'}
                              value={discountType === 'percent' ? discountValue : ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                if (val > 0) {
                                  setDiscountType('percent');
                                  setDiscountValue(val);
                                } else {
                                  setDiscountType(null);
                                  setDiscountValue(0);
                                }
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                              placeholder="0%"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">خصم مبلغ (د.ع)</label>
                            <input 
                              type="number" 
                              disabled={discountType === 'percent'}
                              value={discountType === 'amount' ? discountValue : ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                if (val > 0) {
                                  setDiscountType('amount');
                                  setDiscountValue(val);
                                } else {
                                  setDiscountType(null);
                                  setDiscountValue(0);
                                }
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                              placeholder="0 د.ع"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              checked={shouldPrint}
                              onChange={(e) => setShouldPrint(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-600 transition-colors">تفعيل الطباعة</span>
                          </label>

                          {shouldPrint && (
                            <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                              <button 
                                onClick={() => setPrintType('invoice')}
                                className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${printType === 'invoice' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                فاتورة بيع
                              </button>
                              <button 
                                onClick={() => setPrintType('prescription')}
                                className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${printType === 'prescription' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                وصفة طبية
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-200">
                          <div className="flex justify-between text-slate-500 text-sm">
                            <span>المجموع</span>
                            <span>{formatPrice(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0))}</span>
                          </div>
                          {discountValue > 0 && (
                            <div className="flex justify-between text-rose-500 text-sm">
                              <span>الخصم</span>
                              <span>- {
                                formatPrice(discountType === 'percent' 
                                  ? (cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) * discountValue / 100)
                                  : discountValue
                                )
                              }</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xl font-bold text-slate-800 pt-1">
                            <span>الإجمالي</span>
                            <span>{
                              formatPrice(Math.max(0, 
                                cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) - 
                                (discountType === 'percent' 
                                  ? (cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) * discountValue / 100)
                                  : discountValue
                                )
                              ))
                            }</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => completeSale('cash')}
                          className="bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          دفع نقدي
                        </button>
                        <button 
                          onClick={() => completeSale('debt')}
                          className="bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                        >
                          تسجيل دين
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'drugs' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="بحث في الأدوية..." 
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 pr-10 pl-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => setShowAddDrugModal(true)}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all"
                    >
                      <Plus size={20} />
                      إضافة دواء جديد
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-right">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="p-4 font-bold text-slate-600">الاسم التجاري</th>
                          <th className="p-4 font-bold text-slate-600">الاسم العلمي</th>
                          <th className="p-4 font-bold text-slate-600">الفئة</th>
                          <th className="p-4 font-bold text-slate-600">الكمية الكلية</th>
                          <th className="p-4 font-bold text-slate-600">آخر سعر بيع</th>
                          <th className="p-4 font-bold text-slate-600">الحالة</th>
                          <th className="p-4 font-bold text-slate-600">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {drugs.map(drug => {
                          const drugBatches = batches.filter(b => b.drugId === drug.id);
                          const totalBoxes = drugBatches.reduce((acc, b) => acc + b.quantityBoxes, 0);
                          const totalStrips = drugBatches.reduce((acc, b) => acc + b.quantityStrips, 0);
                          const lastPrice = drugBatches[drugBatches.length - 1]?.sellPrice || 0;
                          
                          return (
                            <tr key={drug.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-bold">{drug.commercialName}</td>
                              <td className="p-4 text-slate-500">{drug.scientificName}</td>
                              <td className="p-4">
                                <span className="bg-slate-100 px-2 py-1 rounded-lg text-xs">{drug.category}</span>
                              </td>
                              <td className="p-4">
                                <div className="text-sm">
                                  <span className="font-bold">{totalBoxes}</span> علبة
                                  <span className="text-slate-400 mx-1">/</span>
                                  <span className="font-bold">{totalStrips}</span> شريط
                                </div>
                              </td>
                              <td className="p-4 font-bold text-emerald-600">{formatPrice(lastPrice)}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${totalBoxes > drug.minStockLevel ? 'bg-emerald-100 text-emerald-700' : totalBoxes > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {totalBoxes > drug.minStockLevel ? 'متوفر' : totalBoxes > 0 ? 'ناقص' : 'منتهي'}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      setEditingDrug(drug);
                                      setShowEditDrugModal(true);
                                    }}
                                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                    title="تعديل العلاج"
                                  >
                                    <Settings size={18} />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setPurchaseForm({ ...purchaseForm, drugId: drug.id });
                                      setCurrentView('purchases');
                                    }}
                                    className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                    title="إضافة وجبة"
                                  >
                                    <Plus size={18} />
                                  </button>
                                  <button 
                                    onClick={() => setConfirmDelete(drug.id)}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    title="حذف العلاج"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {currentView === 'shortages' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <AlertTriangle className="text-amber-500" />
                      قائمة النواقص (الأدوية منخفضة المخزون)
                    </h2>
                    <button 
                      onClick={() => window.print()} 
                      className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <FileText size={20} />
                      طباعة القائمة
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
                    <div className="hidden print:block text-center p-8 border-b-2 border-slate-800 mb-6">
                      <h1 className="text-3xl font-bold mb-2">صيدليتي الذكية</h1>
                      <h2 className="text-xl text-slate-600">تقرير النواقص - {new Date().toLocaleDateString('ar-IQ')}</h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 print:bg-white print:border-b-2 print:border-slate-800">
                          <tr>
                            <th className="p-4 font-bold text-slate-600 print:text-black w-16">#</th>
                            <th className="p-4 font-bold text-slate-600 print:text-black">الاسم التجاري</th>
                            <th className="p-4 font-bold text-slate-600 print:text-black">الاسم العلمي</th>
                            <th className="p-4 font-bold text-slate-600 print:text-black">نوع الجرعة</th>
                            <th className="p-4 font-bold text-slate-600 print:text-black">الكمية الحالية</th>
                            <th className="p-4 font-bold text-slate-600 print:text-black">الحد الأدنى</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 print:divide-slate-800">
                          {drugs
                            .filter(d => {
                              const totalBoxes = batches.filter(b => b.drugId === d.id).reduce((acc, b) => acc + b.quantityBoxes, 0);
                              return totalBoxes < d.minStockLevel;
                            })
                            .sort((a, b) => {
                              const sciCompare = a.scientificName.localeCompare(b.scientificName);
                              if (sciCompare !== 0) return sciCompare;
                              
                              const comCompare = a.commercialName.localeCompare(b.commercialName);
                              if (comCompare !== 0) return comCompare;
                              
                              return a.type.localeCompare(b.type);
                            })
                            .map((drug, index) => {
                              const totalBoxes = batches.filter(b => b.drugId === drug.id).reduce((acc, b) => acc + b.quantityBoxes, 0);
                              return (
                                <tr key={drug.id} className="hover:bg-slate-50 transition-colors print:hover:bg-transparent">
                                  <td className="p-4 font-mono text-slate-400 print:text-black">{index + 1}</td>
                                  <td className="p-4 font-bold text-emerald-700 print:text-black">
                                    <span className="inline-block ml-1 text-slate-300 print:text-slate-400">{index + 1}.</span>
                                    {drug.commercialName}
                                  </td>
                                  <td className="p-4 text-slate-600 print:text-black italic">{drug.scientificName}</td>
                                  <td className="p-4 text-slate-500 print:text-black">
                                    {drug.type === 'tablet' ? 'حبوب' : 
                                     drug.type === 'capsule' ? 'كبسول' : 
                                     drug.type === 'syrup' ? 'شراب' : 
                                     drug.type === 'injection' ? 'حقنة' : 
                                     drug.type === 'cream' ? 'مرهم' : 'أخرى'}
                                  </td>
                                  <td className="p-4 font-bold text-rose-500 print:text-black">{totalBoxes} علبة</td>
                                  <td className="p-4 text-slate-400 print:text-black">{drug.minStockLevel} علبة</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                    
                    {drugs.filter(d => batches.filter(b => b.drugId === d.id).reduce((acc, b) => acc + b.quantityBoxes, 0) < d.minStockLevel).length === 0 && (
                      <div className="p-12 text-center text-slate-400">
                        <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500 opacity-20" />
                        <p className="text-lg font-medium">لا توجد نواقص حالياً. المخزون مكتمل!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentView === 'purchases' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">إدارة المشتريات والموردين</h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowAddDrugModal(true)}
                        className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all"
                      >
                        <Plus size={20} />
                        إضافة علاج جديد
                      </button>
                      <button 
                        onClick={() => {
                          const select = document.getElementById('drug-select');
                          if (select) select.focus();
                        }}
                        className="bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"
                      >
                        <Truck size={20} />
                        إضافة كمية لدواء موجود
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Entry Form */}
                    <div className="lg:col-span-1 space-y-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-6 border-b pb-2">إدخال وجبة جديدة</h3>
                        <form onSubmit={handleAddBatch} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">المورد</label>
                            <select 
                              value={purchaseForm.supplierId}
                              onChange={e => setPurchaseForm({...purchaseForm, supplierId: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">اختر مورد...</option>
                              {MOCK_SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              <option value="new">+ مورد جديد</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">الدواء</label>
                            <select 
                              id="drug-select"
                              value={purchaseForm.drugId}
                              onChange={e => {
                                const drugId = e.target.value;
                                const drugBatches = batches.filter(b => b.drugId === drugId).sort((a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime());
                                const latestBatch = drugBatches[0];
                                setPurchaseForm({
                                  ...purchaseForm, 
                                  drugId,
                                  productionDate: latestBatch ? latestBatch.productionDate : purchaseForm.productionDate,
                                  expiryDate: latestBatch ? latestBatch.expiryDate : purchaseForm.expiryDate,
                                  purchasePrice: latestBatch ? latestBatch.purchasePrice : purchaseForm.purchasePrice,
                                  sellPrice: latestBatch ? latestBatch.sellPrice : purchaseForm.sellPrice,
                                  stripsPerBox: latestBatch ? latestBatch.stripsPerBox : purchaseForm.stripsPerBox
                                });
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">اختر دواء...</option>
                              {drugs.map(d => <option key={d.id} value={d.id}>{d.commercialName} ({d.scientificName})</option>)}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-600">سعر الشراء (علبة)</label>
                              <input 
                                type="number" 
                                value={purchaseForm.purchasePrice || ''}
                                onChange={e => setPurchaseForm({...purchaseForm, purchasePrice: Number(e.target.value)})}
                                onBlur={e => handlePriceBlur(Number(e.target.value), val => setPurchaseForm({...purchaseForm, purchasePrice: val}))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                                placeholder="0" 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-600">سعر البيع (علبة)</label>
                              <input 
                                type="number" 
                                value={purchaseForm.sellPrice || ''}
                                onChange={e => setPurchaseForm({...purchaseForm, sellPrice: Number(e.target.value)})}
                                onBlur={e => handlePriceBlur(Number(e.target.value), val => setPurchaseForm({...purchaseForm, sellPrice: val}))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                                placeholder="0" 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-600">عدد العلب</label>
                              <input 
                                type="number" 
                                value={purchaseForm.quantityBoxes || ''}
                                onChange={e => setPurchaseForm({...purchaseForm, quantityBoxes: Number(e.target.value)})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                                placeholder="0" 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-600">عدد الأشرطة/علبة</label>
                              <input 
                                type="number" 
                                value={purchaseForm.stripsPerBox || ''}
                                onChange={e => setPurchaseForm({...purchaseForm, stripsPerBox: Number(e.target.value)})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                                placeholder="0" 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-600">تاريخ الإنتاج</label>
                              <input 
                                type="date" 
                                value={purchaseForm.productionDate}
                                onChange={e => setPurchaseForm({...purchaseForm, productionDate: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-600">تاريخ الانتهاء</label>
                              <input 
                                type="date" 
                                value={purchaseForm.expiryDate}
                                onChange={e => setPurchaseForm({...purchaseForm, expiryDate: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-600">رقم الوجبة (Batch)</label>
                              <input 
                                type="text" 
                                value={purchaseForm.batchNumber}
                                onChange={e => setPurchaseForm({...purchaseForm, batchNumber: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                                placeholder="BN-XXXX" 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-600">طريقة الدفع</label>
                              <select 
                                value={purchaseForm.paymentMethod}
                                onChange={e => setPurchaseForm({...purchaseForm, paymentMethod: e.target.value as 'cash' | 'debt'})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                <option value="cash">نقداً</option>
                                <option value="debt">آجل (دين)</option>
                              </select>
                            </div>
                          </div>

                          <button type="submit" className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all mt-4">
                            حفظ وإضافة للمخزون
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Recent Purchases List */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-6">آخر المشتريات</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-right">
                            <thead>
                              <tr className="text-slate-400 border-b border-slate-100">
                                <th className="pb-3 font-medium">الدواء</th>
                                <th className="pb-3 font-medium">المورد</th>
                                <th className="pb-3 font-medium">الكمية</th>
                                <th className="pb-3 font-medium">التاريخ</th>
                                <th className="pb-3 font-medium">الإجمالي</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {batches.slice(-5).reverse().map(batch => (
                                <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-3 font-bold">{drugs.find(d => d.id === batch.drugId)?.commercialName}</td>
                                  <td className="py-3">{MOCK_SUPPLIERS.find(s => s.id === batch.supplierId)?.name}</td>
                                  <td className="py-3">{batch.quantityBoxes} علبة</td>
                                  <td className="py-3 text-sm">{batch.receivedDate}</td>
                                  <td className="py-3 font-bold text-emerald-600">{formatPrice(batch.purchasePrice * batch.quantityBoxes)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <Truck size={24} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">إجمالي ديون الموردين</p>
                            <p className="text-lg font-bold">{formatPrice(stats.totalSupplierDebt)}</p>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                            <Package size={24} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">عدد الموردين النشطين</p>
                            <p className="text-lg font-bold">{suppliers.length} مورد</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'inventory' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-2xl font-bold">إدارة المخزون (Batches)</h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handlePrintInventory(inventoryFilter)}
                        className="bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                      >
                        <FileText size={20} className="text-emerald-500" />
                        طباعة الكشف
                      </button>
                      <button 
                        onClick={() => setShowQuickStockModal(true)}
                        className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <Barcode size={20} />
                        إضافة سريعة (باركود)
                      </button>
                      <div className="relative">
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select 
                          value={inventoryFilter}
                          onChange={(e) => setInventoryFilter(e.target.value as any)}
                          className="bg-white border border-slate-200 rounded-xl py-2 pr-10 pl-4 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none shadow-sm"
                        >
                          <option value="all">كل الدفعات</option>
                          <option value="nearExpiry">قريب الانتهاء</option>
                          <option value="expired">منتهي الصلاحية</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-right">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="p-4 font-bold text-slate-600">الدواء</th>
                          <th className="p-4 font-bold text-slate-600">رقم الوجبة</th>
                          <th className="p-4 font-bold text-slate-600">الكمية</th>
                          <th className="p-4 font-bold text-slate-600">تاريخ الانتهاء</th>
                          <th className="p-4 font-bold text-slate-600">سعر الشراء</th>
                          <th className="p-4 font-bold text-slate-600">سعر البيع</th>
                          <th className="p-4 font-bold text-slate-600">الحالة</th>
                          <th className="p-4 font-bold text-slate-600 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {batches.filter(batch => {
                          if (inventoryFilter === 'expired') return new Date(batch.expiryDate) < new Date();
                          if (inventoryFilter === 'nearExpiry') {
                            const expiry = new Date(batch.expiryDate);
                            const threeMonths = new Date();
                            threeMonths.setMonth(threeMonths.getMonth() + 3);
                            return expiry > new Date() && expiry < threeMonths;
                          }
                          return true;
                        }).map(batch => {
                          const drug = drugs.find(d => d.id === batch.drugId);
                          const isExpired = new Date(batch.expiryDate) < new Date();
                          const isNearExpiry = !isExpired && new Date(batch.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                          
                          return (
                            <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <div className="font-bold">{drug?.commercialName}</div>
                                <div className="text-xs text-slate-400">{drug?.scientificName}</div>
                              </td>
                              <td className="p-4 font-mono text-sm">{batch.batchNumber}</td>
                              <td className="p-4">
                                <div className="text-sm">
                                  <span className="font-bold">{batch.quantityBoxes}</span> علبة
                                  <span className="text-slate-400 mx-1">/</span>
                                  <span className="font-bold">{batch.quantityStrips}</span> شريط
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={isExpired ? 'text-rose-600 font-bold' : isNearExpiry ? 'text-amber-600 font-bold' : ''}>
                                  {batch.expiryDate}
                                </span>
                              </td>
                              <td className="p-4">{formatPrice(batch.purchasePrice)}</td>
                              <td className="p-4 font-bold text-emerald-600">
                                <div>{formatPrice(batch.sellPrice)}</div>
                                <div className="text-xs text-slate-400 font-normal">شريط: {formatPrice(batch.sellPrice / (drug?.stripsPerBox || 1))}</div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${isExpired ? 'bg-rose-100 text-rose-700' : isNearExpiry ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {isExpired ? 'منتهي' : isNearExpiry ? 'قريب الانتهاء' : 'صالح'}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button 
                                  onClick={() => deleteBatch(batch.id)}
                                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {currentView === 'accounting' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-slate-500 text-sm mb-1">رصيد الصندوق الحالي</p>
                      <h2 className="text-3xl font-bold text-emerald-600">
                        {formatPrice(transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 4500000))}
                      </h2>
                      <div className="mt-4 flex gap-2">
                        <button 
                          onClick={() => {
                            setNewTransaction({ ...newTransaction, type: 'income' });
                            setShowTransactionModal(true);
                          }}
                          className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-xl text-sm font-bold hover:bg-emerald-100"
                        >
                          إيداع
                        </button>
                        <button 
                          onClick={() => {
                            setNewTransaction({ ...newTransaction, type: 'expense' });
                            setShowTransactionModal(true);
                          }}
                          className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-xl text-sm font-bold hover:bg-rose-100"
                        >
                          سحب
                        </button>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-slate-500 text-sm mb-1">ديون الزبائن</p>
                      <h2 className="text-3xl font-bold text-amber-600">
                        {formatPrice(sales.filter(s => s.paymentMethod === 'debt').reduce((acc, s) => acc + s.total, 0))}
                      </h2>
                      <button 
                        onClick={() => {
                          setDebtType('customer');
                          setShowDebtReport(true);
                        }}
                        className="w-full mt-4 text-amber-600 text-sm font-bold hover:underline"
                      >
                        عرض كشف الديون
                      </button>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-slate-500 text-sm mb-1">ديون الموردين</p>
                      <h2 className="text-3xl font-bold text-rose-600">{formatPrice(stats.totalSupplierDebt)}</h2>
                      <button 
                        onClick={() => {
                          setDebtType('supplier');
                          setShowDebtReport(true);
                        }}
                        className="w-full mt-4 text-rose-600 text-sm font-bold hover:underline"
                      >
                        عرض كشف الديون
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg">سجل الحركات المالية</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const printContent = document.getElementById('financial-log-table');
                            if (printContent) {
                              const printWindow = window.open('', '_blank');
                              if (printWindow) {
                                printWindow.document.write(`
                                  <html dir="rtl">
                                    <head>
                                      <title>سجل الحركات المالية</title>
                                      <style>
                                        body { font-family: Arial, sans-serif; padding: 20px; }
                                        table { w-full border-collapse: collapse; width: 100%; }
                                        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                                        th { background-color: #f2f2f2; }
                                      </style>
                                    </head>
                                    <body>
                                      <h2>سجل الحركات المالية</h2>
                                      ${printContent.outerHTML}
                                    </body>
                                  </html>
                                `);
                                printWindow.document.close();
                                printWindow.print();
                              }
                            }
                          }}
                          className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors"
                        >
                          <Printer size={16} />
                          طباعة السجل
                        </button>
                        <button 
                          onClick={() => requireAdminAuth(() => {
                            setTransactions([]);
                            setToast({ message: 'تم تصفير سجل الحركات بنجاح', type: 'success' });
                            setTimeout(() => setToast(null), 3000);
                          })}
                          className="bg-rose-100 text-rose-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-rose-200 transition-colors"
                        >
                          <Trash2 size={16} />
                          تصفير السجل
                        </button>
                        <button 
                          onClick={() => setShowTransactionModal(true)}
                          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold"
                        >
                          إضافة حركة
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table id="financial-log-table" className="w-full text-right">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-100">
                            <th className="pb-3 font-medium">التاريخ</th>
                            <th className="pb-3 font-medium">النوع</th>
                            <th className="pb-3 font-medium">الوصف</th>
                            <th className="pb-3 font-medium">الفئة</th>
                            <th className="pb-3 font-medium">المبلغ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {transactions.slice().reverse().map(t => (
                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 text-sm">{new Date(t.date).toLocaleString('ar-IQ')}</td>
                              <td className="py-3">
                                <span className={t.type === 'income' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                                  {t.type === 'income' ? 'دخل' : 'مصروف'}
                                </span>
                              </td>
                              <td className="py-3">{t.description}</td>
                              <td className="py-3 text-sm text-slate-500">{t.category}</td>
                              <td className={`py-3 font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {t.type === 'income' ? '+' : '-'}{formatPrice(t.amount)}
                              </td>
                            </tr>
                          ))}
                          {transactions.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-10 text-center text-slate-400">لا توجد حركات مالية مسجلة بعد</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'prescriptions' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">الوصفات الطبية المصروفة</h2>
                    <button 
                      onClick={() => {
                        setPrescriptionCart([]);
                        setPrescriptionPatient('');
                        setPrescriptionDoctor('');
                      }}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all"
                    >
                      <Plus size={20} />
                      وصفة جديدة
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <FileText className="text-emerald-500" />
                          تسجيل وصفة
                        </h3>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">اسم المريض</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                list="patients-list"
                                value={prescriptionPatient}
                                onChange={e => setPrescriptionPatient(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                                placeholder="أدخل اسم المريض..." 
                              />
                              <datalist id="patients-list">
                                {patients.map(p => <option key={p} value={p} />)}
                              </datalist>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">اسم الطبيب (اختياري)</label>
                            <input 
                              type="text" 
                              value={prescriptionDoctor}
                              onChange={e => setPrescriptionDoctor(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                              placeholder="د. فلان..." 
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">إضافة أدوية</label>
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                  type="text" 
                                  value={prescriptionSearch}
                                  onChange={e => setPrescriptionSearch(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-10 pl-4 outline-none focus:ring-2 focus:ring-emerald-500" 
                                  placeholder="ابحث عن دواء (اسم، باركود)..." 
                                />
                                
                                {prescriptionSearch && (
                                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-[200px] overflow-y-auto">
                                    {drugs.filter(d => 
                                      d.commercialName.toLowerCase().includes(prescriptionSearch.toLowerCase()) ||
                                      d.scientificName.toLowerCase().includes(prescriptionSearch.toLowerCase()) ||
                                      (d.barcode && d.barcode.includes(prescriptionSearch))
                                    ).map(drug => {
                                      const drugBatch = batches.find(b => b.drugId === drug.id && b.quantityStrips > 0);
                                      return (
                                        <button 
                                          key={drug.id}
                                          onClick={() => {
                                            if (drugBatch) addToPrescriptionCart(drug, drugBatch);
                                            setPrescriptionSearch('');
                                          }}
                                          className="w-full text-right p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex justify-between items-center"
                                        >
                                          <div>
                                            <p className="font-bold text-sm">{drug.commercialName}</p>
                                            <p className="text-[10px] text-slate-500">{drug.scientificName}</p>
                                          </div>
                                          <Plus size={14} className="text-emerald-500" />
                                        </button>
                                      );
                                    })}
                                    {drugs.filter(d => 
                                      d.commercialName.toLowerCase().includes(prescriptionSearch.toLowerCase()) ||
                                      d.scientificName.toLowerCase().includes(prescriptionSearch.toLowerCase()) ||
                                      (d.barcode && d.barcode.includes(prescriptionSearch))
                                    ).length === 0 && (
                                      <div className="p-4 text-center text-slate-500 text-sm">
                                        لم يتم العثور على أدوية
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <button 
                                onClick={() => {
                                  const input = document.querySelector('input[placeholder*="ابحث عن دواء (اسم، باركود)"]') as HTMLInputElement;
                                  if (input) input.focus();
                                }}
                                className="bg-slate-100 p-2 rounded-xl hover:bg-slate-200 transition-colors"
                              >
                                <Barcode size={20} className="text-slate-600" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">طريقة الدفع</label>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setPrescriptionPaymentMethod('cash')}
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${prescriptionPaymentMethod === 'cash' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                              >
                                نقداً
                              </button>
                              <button 
                                onClick={() => setPrescriptionPaymentMethod('debt')}
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${prescriptionPaymentMethod === 'debt' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                              >
                                دين
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {prescriptionCart.length > 0 ? (
                              prescriptionCart.map((item, idx) => {
                                const drug = drugs.find(d => d.id === item.drugId);
                                return (
                                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold">{drug?.commercialName}</span>
                                      <span className="text-[10px] text-slate-500">{item.quantity} شريط</span>
                                    </div>
                                    <button 
                                      onClick={() => setPrescriptionCart(prescriptionCart.filter((_, i) => i !== idx))}
                                      className="text-rose-500 hover:bg-rose-50 p-1 rounded"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="min-h-[100px] border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                                لم يتم إضافة أدوية بعد
                              </div>
                            )}
                          </div>

                          {prescriptionCart.length > 0 && (
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setPrescriptionDiscountType(prescriptionDiscountType === 'percent' ? null : 'percent')}
                                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${prescriptionDiscountType === 'percent' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                  نسبة %
                                </button>
                                <button 
                                  onClick={() => setPrescriptionDiscountType(prescriptionDiscountType === 'amount' ? null : 'amount')}
                                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${prescriptionDiscountType === 'amount' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                  مبلغ
                                </button>
                              </div>

                              {prescriptionDiscountType && (
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number" 
                                    value={prescriptionDiscountValue || ''}
                                    onChange={e => setPrescriptionDiscountValue(Number(e.target.value))}
                                    onBlur={e => prescriptionDiscountType === 'amount' && handlePriceBlur(Number(e.target.value), setPrescriptionDiscountValue)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                                    placeholder={prescriptionDiscountType === 'percent' ? 'نسبة الخصم %' : 'مبلغ الخصم'}
                                  />
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center font-bold text-lg">
                                <span>الإجمالي:</span>
                                <span>
                                  {formatPrice(Math.max(0, 
                                    prescriptionCart.reduce((acc, item) => acc + (item.price * item.quantity), 0) - 
                                    (prescriptionDiscountType === 'percent' 
                                      ? (prescriptionCart.reduce((acc, item) => acc + (item.price * item.quantity), 0) * prescriptionDiscountValue / 100)
                                      : (prescriptionDiscountType === 'amount' ? prescriptionDiscountValue : 0))
                                  ))}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="pt-4 border-t border-slate-100 flex gap-2">
                            <button 
                              onClick={handleSavePrescription}
                              className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                            >
                              <Save size={18} />
                              صرف وحفظ
                            </button>
                            <button 
                              onClick={() => {
                                if (prescriptionCart.length === 0) {
                                  setToast({ message: 'يرجى إضافة دواء واحد على الأقل', type: 'error' });
                                  setTimeout(() => setToast(null), 3000);
                                  return;
                                }
                                const subtotal = prescriptionCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                                let finalTotal = subtotal;
                                if (prescriptionDiscountType === 'percent') {
                                  finalTotal = subtotal - (subtotal * (prescriptionDiscountValue / 100));
                                } else if (prescriptionDiscountType === 'amount') {
                                  finalTotal = subtotal - prescriptionDiscountValue;
                                }
                                finalTotal = Math.max(0, finalTotal);

                                const tempSale: Sale = {
                                  id: 'preview',
                                  date: new Date().toISOString(),
                                  items: prescriptionCart,
                                  total: finalTotal,
                                  paymentMethod: 'cash',
                                  patientName: prescriptionPatient || 'غير محدد'
                                };
                                setLastCompletedSale(tempSale);
                                setPrintType('prescription');
                                setShowPrintModal(true);
                              }}
                              className="bg-slate-100 text-slate-600 p-3 rounded-xl hover:bg-slate-200 transition-all"
                            >
                              <Printer size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                          <History className="text-slate-400" />
                          آخر الوصفات المصروفة
                        </h3>
                        <div className="space-y-4">
                          {prescriptions.slice().reverse().map(p => (
                            <div key={p.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center hover:bg-white hover:shadow-md transition-all">
                              <div>
                                <h5 className="font-bold text-slate-800">{p.patientName}</h5>
                                <p className="text-xs text-slate-500">
                                  {p.items.length} أدوية • {p.doctorName ? `د. ${p.doctorName}` : 'بدون طبيب'} • {new Date(p.date).toLocaleString('ar-IQ')}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="font-bold text-emerald-600">{formatPrice(p.total)}</p>
                                  <div className="flex gap-2 justify-end">
                                    <button 
                                      onClick={() => {
                                        setLastCompletedSale({
                                          id: p.id,
                                          date: p.date,
                                          items: p.items,
                                          total: p.total,
                                          paymentMethod: 'cash'
                                        });
                                        setPrintType('invoice');
                                        setShowPrintModal(true);
                                      }}
                                      className="text-[10px] text-emerald-600 hover:underline font-bold"
                                    >
                                      طباعة
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const sale = sales.find(s => s.id === p.id);
                                        if (sale) {
                                          setLastCompletedSale(sale);
                                          setPrintType('prescription');
                                          setShowPrintModal(true);
                                        }
                                      }}
                                      className="text-[10px] text-emerald-600 hover:underline font-bold"
                                    >
                                      وصفة
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {prescriptions.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                              <FileText size={48} className="mx-auto mb-3 opacity-20" />
                              <p>لا توجد وصفات محفوظة حالياً</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'history' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">سجل الإجراءات</h2>
                    <select 
                      onChange={e => {
                        // Logic to filter by section
                      }}
                      className="bg-white border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">الكل</option>
                      <option value="sales">المبيعات</option>
                      <option value="inventory">المخزون</option>
                      <option value="purchases">المشتريات</option>
                    </select>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="space-y-4">
                      {actionLogs.map(log => (
                        <div key={log.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                          <div>
                            <h5 className="font-bold text-slate-800">{log.description}</h5>
                            <p className="text-xs text-slate-500">{new Date(log.date).toLocaleString('ar-EG')}</p>
                          </div>
                          <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">{log.section}</span>
                        </div>
                      ))}
                      {actionLogs.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                          <p>لا توجد إجراءات مسجلة حالياً</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'requests' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">طلبات المرضى الخاصة</h2>
                    <button 
                      onClick={() => setShowPatientRequestModal(true)}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all"
                    >
                      <Plus size={20} />
                      طلب جديد
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-right">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 font-bold text-slate-600">المريض</th>
                          <th className="px-6 py-4 font-bold text-slate-600">الدواء المطلوب</th>
                          <th className="px-6 py-4 font-bold text-slate-600">رقم الهاتف</th>
                          <th className="px-6 py-4 font-bold text-slate-600">التاريخ</th>
                          <th className="px-6 py-4 font-bold text-slate-600">الحالة</th>
                          <th className="px-6 py-4 font-bold text-slate-600">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {patientRequests.map(request => (
                          <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold">{request.patientName}</td>
                            <td className="px-6 py-4">{request.drugName}</td>
                            <td className="px-6 py-4 font-mono">{request.phoneNumber}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{new Date(request.date).toLocaleDateString('ar-IQ')}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                request.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {request.status === 'pending' ? 'قيد الانتظار' :
                                 request.status === 'ordered' ? 'تم الطلب' : 'تم التوفير'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {request.status === 'pending' && (
                                  <button 
                                    onClick={() => setPatientRequests(patientRequests.map(r => r.id === request.id ? {...r, status: 'ordered'} : r))}
                                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                                    title="تم الطلب من المذخر"
                                  >
                                    <Truck size={18} />
                                  </button>
                                )}
                                {request.status !== 'available' && (
                                  <button 
                                    onClick={() => setPatientRequests(patientRequests.map(r => r.id === request.id ? {...r, status: 'available'} : r))}
                                    className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-all"
                                    title="تم التوفير"
                                  >
                                    <CheckCircle2 size={18} />
                                  </button>
                                )}
                                <button 
                                  onClick={() => setPatientRequests(patientRequests.filter(r => r.id !== request.id))}
                                  className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-all"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {patientRequests.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                              <UserPlus size={48} className="mx-auto mb-3 opacity-20" />
                              <p>لا توجد طلبات مرضى حالياً</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {currentView === 'users' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">إدارة المستخدمين والصلاحيات</h2>
                    <button 
                      onClick={() => {
                        setNewUser({ role: 'pharmacist', status: 'active', shiftStart: '08:00', shiftEnd: '16:00' });
                        setShowUserModal(true);
                      }}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all"
                    >
                      <Plus size={20} />
                      إضافة مستخدم جديد
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map((user) => {
                      const todayLog = shiftLogs.find(log => log.userId === user.id && log.date === new Date().toISOString().split('T')[0]);
                      
                      return (
                        <div key={user.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold border-2 border-emerald-500">
                                <UserIcon size={32} />
                              </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-lg">{user.name}</h4>
                              <p className="text-sm text-slate-500">
                                {user.role === 'admin' ? 'مدير النظام' : user.role === 'pharmacist' ? 'صيدلي' : 'كاشير'}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                <span className="text-xs text-slate-400">{user.status === 'active' ? 'نشط' : 'مقيد'}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setEditingUser(user);
                                setShowEditUserModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-emerald-500"
                            >
                              <Settings size={20} />
                            </button>
                          </div>
                          
                          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <p className="text-slate-400">الشفت</p>
                              <p className="font-bold">{user.shiftStart} - {user.shiftEnd}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-slate-400">حالة اليوم</p>
                              {todayLog ? (
                                <div className="space-y-1">
                                  <p className={`font-bold ${todayLog.isLate ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {todayLog.isLate ? `متأخر ${todayLog.lateMinutes} د` : 'منتظم'}
                                  </p>
                                  {currentUser?.role === 'admin' && todayLog.isLate && (
                                    <button 
                                      onClick={() => handleResetLateness(todayLog.id)}
                                      className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full hover:bg-emerald-200 transition-colors mt-1 block"
                                    >
                                      تصفير التأخير
                                    </button>
                                  )}
                                  {todayLog.isOvertime && (
                                    <p className="text-emerald-600 font-bold">
                                      إضافي: {todayLog.overtimeMinutes} د
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-slate-300 italic">لم يسجل دخول</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-12 space-y-6">
                    <div className="flex justify-between items-center border-b pb-4">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Users className="text-emerald-500" />
                        نظام بديل الصيدلاني (Substitutes)
                      </h3>
                      <button 
                        onClick={() => setShowSubstituteModal(true)}
                        className="bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                      >
                        <Plus size={20} className="text-emerald-500" />
                        إضافة بديل جديد
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {substitutes.map(sub => (
                        <div key={sub.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-lg">{sub.name}</h4>
                              <p className="text-sm text-slate-500">{sub.shiftDate}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${sub.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {sub.status === 'paid' ? 'تم الدفع' : 'قيد الانتظار'}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
                            <p className="text-xs text-slate-500 mb-1">ناب عن الصيدلاني:</p>
                            <p className="font-bold text-sm text-slate-700">{sub.replacedPharmacistName || 'غير محدد'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <p className="text-slate-400">الوقت</p>
                              <p className="font-bold">{sub.shiftStart} - {sub.shiftEnd}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-slate-400">السعر المتفق</p>
                              <p className="font-bold text-emerald-600">{formatPrice(sub.agreedPrice)}</p>
                            </div>
                          </div>
                          {sub.status === 'pending' && (
                            <button 
                              onClick={() => setSubstitutes(substitutes.map(s => s.id === sub.id ? {...s, status: 'paid'} : s))}
                              className="w-full mt-2 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition-colors"
                            >
                              تأكيد الدفع
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'settings' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <h2 className="text-2xl font-bold">إعدادات النظام</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h3 className="font-bold text-lg border-b pb-2">تخصيص المظهر (الثيم)</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-600">اللون الأساسي</label>
                          <div className="flex gap-2">
                            {['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                              <button 
                                key={color}
                                onClick={() => setTheme({...theme, primaryColor: color})}
                                className={`w-8 h-8 rounded-full border-2 ${theme.primaryColor === color ? 'border-slate-800' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-600">حجم الخط ({Math.round(theme.fontScale * 100)}%)</label>
                          <input 
                            type="range" 
                            min="0.8" 
                            max="1.5" 
                            step="0.1" 
                            value={theme.fontScale}
                            onChange={(e) => setTheme({...theme, fontScale: Number(e.target.value)})}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h3 className="font-bold text-lg border-b pb-2">الأمان والحماية</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-600">رمز الدخول (PIN)</label>
                          <input 
                            type="password" 
                            maxLength={4}
                            placeholder="****"
                            value={securityPin}
                            onChange={(e) => setSecurityPin(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500 text-center tracking-[1em]"
                          />
                        </div>
                        {currentUser?.role === 'admin' && (
                          <div className="space-y-2 pt-4 border-t border-slate-100">
                            <label className="text-sm font-bold text-rose-600">رمز صلاحيات المدير (للاستخدام مرة واحدة)</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                readOnly
                                value={adminOverrideCode}
                                className="w-full bg-rose-50 border border-rose-200 rounded-xl py-2 px-3 outline-none text-center tracking-[0.5em] font-bold text-rose-700"
                              />
                              <button 
                                onClick={() => {
                                  setAdminOverrideCode(Math.floor(1000 + Math.random() * 9000).toString());
                                  setToast({ message: 'تم توليد رمز جديد بنجاح', type: 'success' });
                                  setTimeout(() => setToast(null), 3000);
                                }}
                                className="bg-rose-100 text-rose-700 px-4 rounded-xl font-bold hover:bg-rose-200 transition-colors whitespace-nowrap"
                              >
                                توليد جديد
                              </button>
                            </div>
                            <p className="text-xs text-slate-500">استخدم هذا الرمز لإعطاء صلاحية مؤقتة للموظفين لتصفير السجلات أو الديون.</p>
                          </div>
                        )}
                        <button className="w-full bg-slate-800 text-white py-2 rounded-xl font-bold hover:bg-slate-900 transition-all">
                          تحديث كلمة المرور
                        </button>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h3 className="font-bold text-lg border-b pb-2">معلومات الصيدلية</h3>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">اسم الصيدلية</label>
                          <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3" defaultValue="صيدلية الشفاء الذكية" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">العنوان</label>
                          <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3" defaultValue="بغداد - شارع فلسطين" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500">رقم الهاتف</label>
                          <input 
                            type="text" 
                            className={`w-full bg-slate-50 border rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500 ${!validatePhone('07800000000') ? 'border-rose-300' : 'border-slate-200'}`} 
                            defaultValue="07800000000" 
                            maxLength={11}
                            onChange={(e) => {
                              if (e.target.value.length === 11) {
                                // Valid
                              }
                            }}
                          />
                          <p className="text-[10px] text-slate-400">يجب أن يتكون من 11 رقماً</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <Printer className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-lg">قوالب الطباعة</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">القالب المختار</label>
                          <select 
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                            className="p-2 border rounded-xl text-sm"
                          >
                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                        <button 
                          onClick={() => { setEditingTemplate(null); setShowTemplateModal(true); }}
                          className="w-full bg-blue-50 text-blue-600 py-2 rounded-xl text-sm font-bold hover:bg-blue-100"
                        >
                          إضافة قالب جديد
                        </button>
                        <button 
                          onClick={() => { 
                            const template = templates.find(t => t.id === selectedTemplateId);
                            if (template) { setEditingTemplate(template); setShowTemplateModal(true); }
                          }}
                          className="w-full bg-slate-50 text-slate-600 py-2 rounded-xl text-sm font-bold hover:bg-slate-100"
                        >
                          تعديل القالب المختار
                        </button>
                      </div>
                    </div>

                    {showTemplateModal && (
                      <TemplateDesigner 
                        template={editingTemplate || { id: '', name: 'قالب جديد', width: '80mm', pharmacyName: '', pharmacyPhone: '', headerFontSize: 'text-base', showScientificName: true, showBoxPrice: true, footerMessage: '', margin: 'p-4', primaryColor: 'emerald-600' }}
                        onUpdate={setEditingTemplate}
                        onClose={() => setShowTemplateModal(false)}
                        onSave={() => {
                          if (editingTemplate) {
                            setTemplates(templates.map(t => t.id === editingTemplate.id ? editingTemplate : t));
                          } else {
                            setTemplates([...templates, { ...editingTemplate!, id: Math.random().toString(36).substr(2, 9) }]);
                          }
                          setShowTemplateModal(false);
                        }}
                      />
                    )}

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h3 className="font-bold text-lg border-b pb-2">إعدادات الطباعة والتنبيهات</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">طباعة الفاتورة تلقائياً</span>
                          <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">تنبيه انتهاء الصلاحية (قبل 3 أشهر)</span>
                          <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">النسخ الاحتياطي التلقائي</span>
                          <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
                      <h3 className="font-bold text-lg border-b pb-2">إدارة البيانات</h3>
                      <div className="flex flex-wrap gap-3">
                        <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100">تصدير البيانات (Excel)</button>
                        <button 
                          onClick={exportBackup}
                          className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-100"
                        >
                          نسخ احتياطي الآن (JSON)
                        </button>
                        <button className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-100">تصفير المخزون (تحذير)</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>

    <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'}`}
          >
            {toast.type === 'success' ? <Barcode size={20} /> : <AlertTriangle size={20} />}
            <span className="font-bold">{toast.message}</span>
          </motion.div>
        )}

        {showAdminAuthModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50">
                <h3 className="text-xl font-bold text-rose-900">مصادقة المدير</h3>
                <button onClick={() => {
                  setShowAdminAuthModal(false);
                  setAdminAuthPassword('');
                  setAdminAuthAction(null);
                }} className="p-2 hover:bg-rose-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 text-right">
                <p className="text-sm text-slate-600">هذا الإجراء يتطلب صلاحيات المدير. يرجى إدخال رمز التحقق (الذي يتم توليده من قبل المدير).</p>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">رمز التحقق</label>
                  <input 
                    type="password" 
                    value={adminAuthPassword}
                    onChange={e => setAdminAuthPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-rose-500 text-center tracking-[0.5em] font-bold text-lg" 
                    placeholder="****"
                    autoFocus
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={handleAdminAuth}
                  className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                >
                  تأكيد
                </button>
                <button 
                  onClick={() => {
                    setShowAdminAuthModal(false);
                    setAdminAuthPassword('');
                    setAdminAuthAction(null);
                  }}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showAddDrugModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
                <h3 className="text-xl font-bold text-emerald-900">إضافة علاج جديد مع الكمية الأولى</h3>
                <button onClick={() => setShowAddDrugModal(false)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                {/* Image Upload Section */}
                <div className="flex flex-col items-center gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  {newDrug.image ? (
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-md">
                      <img src={newDrug.image} alt="Drug" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => setNewDrug({...newDrug, image: ''})}
                        className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Pill size={32} />
                      <span className="text-[10px] font-bold">صورة العلاج</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    id="drug-image"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewDrug({...newDrug, image: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label htmlFor="drug-image" className="bg-white border border-slate-200 px-4 py-1.5 rounded-lg text-sm font-bold cursor-pointer hover:bg-slate-50 transition-all">
                    تحميل صورة
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">المعلومات الأساسية</h4>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600">الاسم التجاري *</label>
                      <input 
                        type="text" 
                        value={newDrug.commercialName}
                        onChange={e => setNewDrug({...newDrug, commercialName: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="مثلاً: Panadol"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600">الاسم العلمي *</label>
                      <input 
                        type="text" 
                        value={newDrug.scientificName}
                        onChange={e => setNewDrug({...newDrug, scientificName: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="مثلاً: Paracetamol"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">صنف العلاج</label>
                        <input 
                          type="text" 
                          value={newDrug.category}
                          onChange={e => setNewDrug({...newDrug, category: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                          placeholder="مسكن، مضاد..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">الحد الأدنى للمخزون</label>
                        <input 
                          type="number" 
                          value={newDrug.minStockLevel}
                          onChange={e => setNewDrug({...newDrug, minStockLevel: Number(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                          placeholder="10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">سعر الشراء الطبيعي</label>
                        <input 
                          type="number" 
                          value={newDrug.normalPurchasePrice}
                          onChange={e => setNewDrug({...newDrug, normalPurchasePrice: Number(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">سعر البيع الطبيعي</label>
                        <input 
                          type="number" 
                          value={newDrug.normalSellPrice}
                          onChange={e => setNewDrug({...newDrug, normalSellPrice: Number(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600">نوع الجرعة</label>
                      <div className="flex gap-2">
                        <select 
                          value={['tablet', 'capsule', 'syrup', 'injection', 'cream', 'other'].includes(newDrug.type) ? newDrug.type : 'custom'}
                          onChange={e => {
                            if (e.target.value !== 'custom') {
                              setNewDrug({...newDrug, type: e.target.value});
                            } else {
                              setNewDrug({...newDrug, type: ''});
                            }
                          }}
                          className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="tablet">حبوب</option>
                          <option value="capsule">كبسول</option>
                          <option value="syrup">شراب</option>
                          <option value="injection">حقنة</option>
                          <option value="cream">مرهم</option>
                          <option value="other">أخرى</option>
                          <option value="custom">مخصص...</option>
                        </select>
                        <input 
                          type="text"
                          value={['tablet', 'capsule', 'syrup', 'injection', 'cream', 'other'].includes(newDrug.type) ? '' : newDrug.type}
                          onChange={e => setNewDrug({...newDrug, type: e.target.value})}
                          placeholder="نوع نادر..."
                          className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Quantity */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">الأسعار والكميات</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">عدد الباكيتات</label>
                        <input 
                          type="number" 
                          value={newDrug.quantityBoxes || ''}
                          onChange={e => setNewDrug({...newDrug, quantityBoxes: Number(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">أشرطة/باكيت</label>
                        <input 
                          type="number" 
                          value={newDrug.stripsPerBox || ''}
                          onChange={e => {
                            const stripsPerBox = Number(e.target.value);
                            setNewDrug({
                              ...newDrug, 
                              stripsPerBox,
                              stripPrice: Math.round(newDrug.sellPrice / (stripsPerBox || 1))
                            });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                          placeholder="1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">شراء الباكيت</label>
                        <input 
                          type="number" 
                          value={newDrug.purchasePrice || ''}
                          onChange={e => setNewDrug({...newDrug, purchasePrice: Number(e.target.value)})}
                          onBlur={e => handlePriceBlur(Number(e.target.value), val => setNewDrug({...newDrug, purchasePrice: val}))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">بيع الباكيت</label>
                        <input 
                          type="number" 
                          value={newDrug.sellPrice || ''}
                          onChange={e => {
                            const sellPrice = Number(e.target.value);
                            setNewDrug({
                              ...newDrug, 
                              sellPrice,
                              stripPrice: Math.round(sellPrice / (newDrug.stripsPerBox || 1))
                            });
                          }}
                          onBlur={e => handlePriceBlur(Number(e.target.value), val => setNewDrug({...newDrug, sellPrice: val, stripPrice: Math.round(val / (newDrug.stripsPerBox || 1))}))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600">سعر بيع الشريط الواحد</label>
                      <input 
                        type="number" 
                        value={newDrug.stripPrice || ''}
                        onChange={e => setNewDrug({...newDrug, stripPrice: Number(e.target.value)})}
                        onBlur={e => handlePriceBlur(Number(e.target.value), val => setNewDrug({...newDrug, stripPrice: val}))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Dates & Batch */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">التواريخ والوجبة</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">تاريخ الإنتاج</label>
                        <input 
                          type="date" 
                          value={newDrug.productionDate}
                          onChange={e => setNewDrug({...newDrug, productionDate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">تاريخ الانتهاء</label>
                        <input 
                          type="date" 
                          value={newDrug.expiryDate}
                          onChange={e => setNewDrug({...newDrug, expiryDate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">معلومات إضافية</h4>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600">المورد</label>
                      <select 
                        value={newDrug.supplierId}
                        onChange={e => setNewDrug({...newDrug, supplierId: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">اختر المورد...</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">رقم الوجبة</label>
                        <input 
                          type="text" 
                          value={newDrug.batchNumber}
                          onChange={e => setNewDrug({...newDrug, batchNumber: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">الباركود</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={newDrug.barcode}
                            onChange={e => setNewDrug({...newDrug, barcode: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-3 pl-10 outline-none focus:ring-2 focus:ring-emerald-500" 
                            placeholder="000000"
                          />
                          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={handleAddDrug}
                  className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  حفظ العلاج والمخزون
                </button>
                <button 
                  onClick={() => setShowAddDrugModal(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showEditDrugModal && editingDrug && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
                <h3 className="text-xl font-bold text-emerald-900">تعديل بيانات العلاج</h3>
                <button onClick={() => setShowEditDrugModal(false)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 text-right">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">المعلومات الأساسية</h4>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600">الاسم التجاري</label>
                      <input 
                        type="text" 
                        value={editingDrug.commercialName}
                        onChange={e => setEditingDrug({...editingDrug, commercialName: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600">الاسم العلمي</label>
                      <input 
                        type="text" 
                        value={editingDrug.scientificName}
                        onChange={e => setEditingDrug({...editingDrug, scientificName: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">الفئة</label>
                        <input 
                          type="text" 
                          value={editingDrug.category}
                          onChange={e => setEditingDrug({...editingDrug, category: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">الباركود</label>
                        <input 
                          type="text" 
                          value={editingDrug.barcode}
                          onChange={e => setEditingDrug({...editingDrug, barcode: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600">الحد الأدنى للمخزون (علب)</label>
                      <input 
                        type="number" 
                        value={editingDrug.minStockLevel}
                        onChange={e => setEditingDrug({...editingDrug, minStockLevel: Number(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">نوع العلاج</h4>
                    <div className="flex gap-2">
                      <select 
                        value={['tablet', 'capsule', 'syrup', 'injection', 'cream', 'other'].includes(editingDrug.type) ? editingDrug.type : 'custom'}
                        onChange={e => {
                          if (e.target.value !== 'custom') {
                            setEditingDrug({...editingDrug, type: e.target.value});
                          } else {
                            setEditingDrug({...editingDrug, type: ''});
                          }
                        }}
                        className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="tablet">حبوب</option>
                        <option value="capsule">كبسول</option>
                        <option value="syrup">شراب</option>
                        <option value="injection">حقنة</option>
                        <option value="cream">مرهم</option>
                        <option value="other">أخرى</option>
                        <option value="custom">مخصص...</option>
                      </select>
                      <input 
                        type="text"
                        value={['tablet', 'capsule', 'syrup', 'injection', 'cream', 'other'].includes(editingDrug.type) ? '' : editingDrug.type}
                        onChange={e => setEditingDrug({...editingDrug, type: e.target.value})}
                        placeholder="نوع نادر..."
                        className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={handleUpdateDrug}
                  className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  تحديث البيانات
                </button>
                <button 
                  onClick={() => setShowEditDrugModal(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showQuickStockModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
                <h3 className="text-xl font-bold text-emerald-900">إضافة سريعة للمخزون</h3>
                <button onClick={() => setShowQuickStockModal(false)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6 text-right">
                {!quickStockDrug ? (
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-600">امسح باركود العلاج</label>
                    <div className="relative">
                      <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        autoFocus
                        type="text" 
                        value={quickStockBarcode}
                        onChange={(e) => {
                          setQuickStockBarcode(e.target.value);
                          if (e.target.value.length >= 6) handleQuickStockScan(e.target.value);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-10 pl-4 outline-none focus:ring-2 focus:ring-emerald-500 font-mono" 
                        placeholder="000000000000"
                      />
                    </div>
                    <p className="text-xs text-slate-400 text-center">سيتم التعرف على العلاج تلقائياً عند المسح</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm">
                        <Pill size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-900">{quickStockDrug.commercialName}</h4>
                        <p className="text-xs text-emerald-600">{quickStockDrug.scientificName}</p>
                      </div>
                      <button 
                        onClick={() => setQuickStockDrug(null)}
                        className="mr-auto text-xs text-slate-400 hover:text-rose-500"
                      >
                        تغيير
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">عدد العلب</label>
                        <input 
                          type="number" 
                          value={quickStockData.quantityBoxes || ''}
                          onChange={e => setQuickStockData({...quickStockData, quantityBoxes: Number(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">تاريخ الانتهاء</label>
                        <input 
                          type="date" 
                          value={quickStockData.expiryDate}
                          onChange={e => setQuickStockData({...quickStockData, expiryDate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">سعر الشراء</label>
                        <input 
                          type="number" 
                          value={quickStockData.purchasePrice || ''}
                          onChange={e => setQuickStockData({...quickStockData, purchasePrice: Number(e.target.value)})}
                          onBlur={e => handlePriceBlur(Number(e.target.value), val => setQuickStockData({...quickStockData, purchasePrice: val}))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">سعر البيع</label>
                        <input 
                          type="number" 
                          value={quickStockData.sellPrice || ''}
                          onChange={e => setQuickStockData({...quickStockData, sellPrice: Number(e.target.value)})}
                          onBlur={e => handlePriceBlur(Number(e.target.value), val => setQuickStockData({...quickStockData, sellPrice: val}))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleAddQuickStock}
                      className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      تأكيد الإضافة للمخزون
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showTransactionModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
                <h3 className="text-xl font-bold text-emerald-900">تسجيل حركة مالية</h3>
                <button onClick={() => setShowTransactionModal(false)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6 text-right">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  <button 
                    onClick={() => setNewTransaction({...newTransaction, type: 'income'})}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${newTransaction.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    إيداع (دخل)
                  </button>
                  <button 
                    onClick={() => setNewTransaction({...newTransaction, type: 'expense'})}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${newTransaction.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    سحب (مصروف)
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">المبلغ</label>
                    <input 
                      type="number" 
                      value={newTransaction.amount || ''}
                      onChange={e => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                      onBlur={e => handlePriceBlur(Number(e.target.value), val => setNewTransaction({...newTransaction, amount: val}))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold" 
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">الوصف</label>
                    <input 
                      type="text" 
                      value={newTransaction.description}
                      onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-500" 
                      placeholder="مثال: فاتورة كهرباء، مبيعات نقدية..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">الفئة</label>
                    <select 
                      value={newTransaction.category}
                      onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="مبيعات">مبيعات</option>
                      <option value="مشتريات">مشتريات</option>
                      <option value="خدمات">خدمات</option>
                      <option value="رواتب">رواتب</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleAddTransaction}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${newTransaction.type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'}`}
                >
                  تأكيد العملية
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showSaleConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
                <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                  <ShoppingCart size={24} />
                  تأكيد عملية البيع
                </h3>
                <button onClick={() => setShowSaleConfirm(false)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Pill size={18} className="text-emerald-500" />
                    قائمة الأدوية المختارة
                  </h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {cart.map((item, idx) => {
                      const drug = drugs.find(d => d.id === item.drugId);
                      return (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{drug?.commercialName}</span>
                            <span className="text-[10px] text-slate-500">{item.quantity} {item.unit === 'box' ? 'علبة' : 'شريط'}</span>
                          </div>
                          <span className="font-bold text-emerald-600">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2 bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الفرعي</span>
                    <span>{formatPrice(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0))}</span>
                  </div>
                  {discountType && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>الخصم</span>
                      <span>- {
                        formatPrice(discountType === 'percent' 
                          ? (cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) * discountValue / 100)
                          : discountValue
                        )
                      }</span>
                    </div>
                  )}
                  <div className="flex justify-between text-2xl font-black text-emerald-900 pt-2 border-t border-emerald-200">
                    <span>الإجمالي النهائي</span>
                    <span>{
                      formatPrice(Math.max(0, 
                        cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) - 
                        (discountType === 'percent' 
                          ? (cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) * discountValue / 100)
                          : discountValue
                        )
                      ))
                    }</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={finalizeSale}
                    className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={24} />
                    تأكيد وإتمام العملية
                  </button>
                  <button 
                    onClick={() => setShowSaleConfirm(false)}
                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showPrintModal && lastCompletedSale && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
                <h3 className="text-xl font-bold text-emerald-900">
                  {printType === 'invoice' ? 'طباعة فاتورة بيع' : 'طباعة وصفة طبية'}
                </h3>
                <button onClick={() => setShowPrintModal(false)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div id="printable-content" className="p-8 bg-white text-right font-sans">
                {printType === 'invoice' ? (
                  /* Invoice Template */
                  <div className="invoice-template">
                    <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                      <h2 className="text-2xl font-bold">صيدلية الشفاء الذكية</h2>
                      <p className="text-sm text-slate-500">بغداد - شارع فلسطين | هاتف: 07800000000</p>
                      <div className="mt-2 text-xs text-slate-400 flex justify-between px-4">
                        <span>رقم الفاتورة: #{lastCompletedSale.id}</span>
                        <span>التاريخ: {new Date(lastCompletedSale.date).toLocaleString('ar-IQ')}</span>
                      </div>
                    </div>

                    {lastCompletedSale.patientName && (
                      <div className="mb-4 text-sm flex justify-between">
                        <div>
                          <span className="font-bold">المريض: </span>
                          <span>{lastCompletedSale.patientName}</span>
                        </div>
                        {lastCompletedSale.paymentMethod === 'debt' && (
                          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">دين</span>
                        )}
                      </div>
                    )}

                    <table className="w-full border-collapse mb-6">
                      <thead>
                        <tr className="bg-slate-100 border-y border-slate-300">
                          <th className="p-2 text-right text-xs font-bold">العلاج</th>
                          <th className="p-2 text-center text-xs font-bold">الكمية</th>
                          <th className="p-2 text-left text-xs font-bold">السعر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lastCompletedSale.items.map((item, idx) => {
                          const drug = drugs.find(d => d.id === item.drugId);
                          return (
                            <tr key={idx}>
                              <td className="p-2 text-sm">{drug?.commercialName}</td>
                              <td className="p-2 text-center text-sm">{item.quantity} {item.unit === 'box' ? 'علبة' : 'شريط'}</td>
                              <td className="p-2 text-left text-sm">{formatPrice(item.price * item.quantity)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-800 font-bold">
                          <td colSpan={2} className="p-2 text-right">المجموع الكلي</td>
                          <td className="p-2 text-left text-emerald-700">{formatPrice(lastCompletedSale.total)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    <div className="text-center text-[10px] text-slate-400 mt-8 border-t pt-4">
                      <p>شكراً لزيارتكم | تمنياتنا لكم بالشفاء العاجل</p>
                    </div>
                  </div>
                ) : (
                  /* Prescription Template */
                  <div className="prescription-template">
                    <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                      <div className="text-right">
                        <h2 className="text-2xl font-bold text-emerald-700">وصفة طبية</h2>
                        <p className="text-xs text-slate-500">صيدلية الشفاء الذكية</p>
                      </div>
                      <div className="text-left text-[10px] text-slate-400">
                        <p>التاريخ: {new Date(lastCompletedSale.date).toLocaleDateString('ar-IQ')}</p>
                        <p>الرقم: {lastCompletedSale.id === 'preview' ? '---' : lastCompletedSale.id.slice(0, 8)}</p>
                      </div>
                    </div>

                    <div className="mb-12 min-h-[200px]">
                      <div className="text-3xl font-serif text-emerald-600 mb-4 italic">Rx</div>
                      <div className="space-y-4 pr-4">
                        {lastCompletedSale.items.map((item, idx) => {
                          const drug = drugs.find(d => d.id === item.drugId);
                          return (
                            <div key={idx} className="flex flex-col">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-lg">{drug?.commercialName} ({drug?.scientificName})</span>
                                <span className="text-sm text-slate-500">الكمية: {item.quantity} {item.unit === 'box' ? 'علبة' : 'شريط'}</span>
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                الاستخدام: ....................................................................................................
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-end mt-12 border-t pt-6">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">ختم الصيدلية</p>
                        <div className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center mt-2">
                          <span className="text-[8px] text-slate-300">الختم هنا</span>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] text-slate-400">توقيع الصيدلي</p>
                        <p className="mt-8 font-serif italic text-slate-300">Signature</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                {lastCompletedSale.id === 'preview' && (
                  <button 
                    onClick={() => {
                      handleSavePrescription();
                      setShowPrintModal(false);
                    }}
                    className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    حفظ الوصفة
                  </button>
                )}
                <button 
                  onClick={() => {
                    const printContent = document.getElementById('printable-content');
                    const printWindow = window.open('', '_blank', 'width=800,height=900');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html dir="rtl">
                          <head>
                            <title>${printType === 'invoice' ? 'فاتورة' : 'وصفة'} - ${lastCompletedSale.id === 'preview' ? 'معاينة' : lastCompletedSale.id}</title>
                            <style>
                              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
                              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
                              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                              th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: right; }
                              th { background-color: #f8fafc; font-size: 12px; }
                              .text-center { text-align: center; }
                              .text-left { text-align: left; }
                              .flex { display: flex; }
                              .justify-between { justify-content: space-between; }
                              .items-center { align-items: center; }
                              .items-end { align-items: flex-end; }
                              .font-bold { font-weight: bold; }
                              .text-2xl { font-size: 24px; }
                              .text-3xl { font-size: 30px; }
                              .text-emerald-700 { color: #047857; }
                              .text-emerald-600 { color: #059669; }
                              .border-b-2 { border-bottom: 2px solid #1e293b; }
                              .border-t { border-top: 1px solid #e2e8f0; }
                              .mb-6 { margin-bottom: 24px; }
                              .mb-8 { margin-bottom: 32px; }
                              .mt-12 { margin-top: 48px; }
                              .italic { font-style: italic; }
                              .font-serif { font-family: serif; }
                              @media print {
                                body { padding: 0; }
                                .no-print { display: none; }
                              }
                            </style>
                          </head>
                          <body>
                            ${printContent?.innerHTML}
                            <script>
                              window.onload = function() {
                                window.print();
                                window.onafterprint = function() { window.close(); };
                              };
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }}
                  className={`flex-1 ${lastCompletedSale.id === 'preview' ? 'bg-slate-800 hover:bg-slate-900' : 'bg-emerald-500 hover:bg-emerald-600'} text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2`}
                >
                  <FileText size={20} />
                  طباعة الآن
                </button>
                <button 
                  onClick={() => setShowPrintModal(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {confirmDeleteBatch && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">تأكيد الحذف</h3>
                <p className="text-slate-500 text-sm">
                  هل أنت متأكد من حذف هذه الوجبة؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>
              <div className="p-4 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => confirmDeleteBatchAction(confirmDeleteBatch)}
                  className="flex-1 bg-rose-500 text-white py-2 rounded-xl font-bold hover:bg-rose-600 transition-all"
                >
                  نعم، احذف
                </button>
                <button 
                  onClick={() => setConfirmDeleteBatch(null)}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 py-2 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
        
        {confirmDeleteUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">تأكيد الحذف</h3>
                <p className="text-slate-500 text-sm">
                  هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>
              <div className="p-4 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => handleDeleteUser(confirmDeleteUser)}
                  className="flex-1 bg-rose-500 text-white py-2 rounded-xl font-bold hover:bg-rose-600 transition-all"
                >
                  نعم، احذف
                </button>
                <button 
                  onClick={() => setConfirmDeleteUser(null)}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 py-2 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
        
        {confirmDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">تأكيد الحذف</h3>
                <p className="text-slate-500 text-sm">
                  هل أنت متأكد من حذف هذا الدواء؟ سيتم حذف كافة الوجبات المرتبطة به أيضاً ولا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>
              <div className="p-4 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => deleteDrug(confirmDelete)}
                  className="flex-1 bg-rose-500 text-white py-2 rounded-xl font-bold hover:bg-rose-600 transition-all"
                >
                  نعم، احذف
                </button>
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 py-2 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showSupplierPaymentModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
                <h3 className="text-xl font-bold text-emerald-900">تسديد دين مورد</h3>
                <button onClick={() => {
                  setShowSupplierPaymentModal(false);
                  setSupplierPaymentAmount(0);
                  setSelectedSupplierDebtId(null);
                }} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 text-right">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">المبلغ المسدد (د.ع)</label>
                  <input 
                    type="number" 
                    value={supplierPaymentAmount || ''}
                    onChange={e => setSupplierPaymentAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold" 
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={handlePaySupplierDebt}
                  className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  تأكيد التسديد
                </button>
                <button 
                  onClick={() => {
                    setShowSupplierPaymentModal(false);
                    setSupplierPaymentAmount(0);
                    setSelectedSupplierDebtId(null);
                  }}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showDebtReport && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-amber-900">كشف الديون التفصيلي - {debtType === 'customer' ? 'الزبائن' : 'الموردين'}</h3>
                  <button 
                    onClick={() => {
                      if (debtType === 'customer') {
                        handleClearCustomerDebt();
                      } else {
                        handleClearSupplierDebt();
                      }
                    }}
                    className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-rose-200 transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    تصفير كل الديون
                  </button>
                </div>
                <button onClick={() => setShowDebtReport(false)} className="p-2 hover:bg-amber-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto text-right">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="p-3">الاسم</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">المبلغ الإجمالي</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {debtType === 'customer' ? (
                      sales.filter(s => s.paymentMethod === 'debt').length > 0 ? (
                        sales.filter(s => s.paymentMethod === 'debt').map(sale => (
                          <tr key={sale.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold">{sale.patientName || 'زبون عام'}</td>
                            <td className="p-3 text-sm">{new Date(sale.date).toLocaleDateString('ar-IQ')}</td>
                            <td className="p-3 font-bold text-rose-600">{formatPrice(sale.total)}</td>
                            <td className="p-3">
                              <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs font-bold">غير مسدد</span>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleClearCustomerDebt(sale.id)}
                                  className="text-emerald-600 text-xs font-bold hover:underline"
                                >
                                  تسديد
                                </button>
                                {sale.patientName && (
                                  <button 
                                    onClick={() => handleClearCustomerDebt(undefined, sale.patientName)}
                                    className="text-rose-600 text-xs font-bold hover:underline"
                                  >
                                    تصفير كل ديون الزبون
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="text-center py-10">
                          <td colSpan={5} className="p-10 text-slate-400">لا توجد ديون زبائن مسجلة حالياً</td>
                        </tr>
                      )
                    ) : (
                      transactions.filter(t => t.type === 'purchase_debt').length > 0 ? (
                        transactions.filter(t => t.type === 'purchase_debt').map(transaction => (
                          <tr key={transaction.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold">{transaction.description.split('(')[1]?.replace(')', '') || 'مورد غير معروف'}</td>
                            <td className="p-3 text-sm">{new Date(transaction.date).toLocaleDateString('ar-IQ')}</td>
                            <td className="p-3 font-bold text-rose-600">{formatPrice(transaction.amount)}</td>
                            <td className="p-3">
                              <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs font-bold">غير مسدد</span>
                            </td>
                            <td className="p-3 flex gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedSupplierDebtId(transaction.id);
                                  setShowSupplierPaymentModal(true);
                                }}
                                className="text-emerald-600 text-xs font-bold hover:underline"
                              >
                                تسديد جزئي/كلي
                              </button>
                              <button 
                                onClick={() => handleClearSupplierDebt(transaction.id)}
                                className="text-rose-600 text-xs font-bold hover:underline"
                              >
                                تصفير
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="text-center py-10">
                          <td colSpan={5} className="p-10 text-slate-400">لا توجد ديون موردين مسجلة حالياً</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}

        {showUserModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
                <h3 className="text-xl font-bold text-emerald-900">إضافة مستخدم جديد</h3>
                <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 text-right">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">الاسم الكامل</label>
                  <input 
                    type="text" 
                    value={newUser.name || ''}
                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">اسم المستخدم</label>
                  <input 
                    type="text" 
                    value={newUser.username || ''}
                    onChange={e => setNewUser({...newUser, username: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">الصلاحية</label>
                    <select 
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="pharmacist">صيدلي</option>
                      <option value="cashier">كاشير</option>
                      <option value="admin">مدير</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">رقم الهاتف</label>
                    <input 
                      type="text" 
                      value={newUser.phone || ''}
                      onChange={e => setNewUser({...newUser, phone: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">بداية الشفت</label>
                    <input 
                      type="time" 
                      value={newUser.shiftStart}
                      onChange={e => setNewUser({...newUser, shiftStart: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">نهاية الشفت</label>
                    <input 
                      type="time" 
                      value={newUser.shiftEnd}
                      onChange={e => setNewUser({...newUser, shiftEnd: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>
                </div>
                <button 
                  onClick={handleAddUser}
                  className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all"
                >
                  إضافة المستخدم
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showSubstituteModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-xl font-bold text-slate-900">إضافة بديل صيدلاني</h3>
                <button onClick={() => setShowSubstituteModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 text-right">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">اسم البديل</label>
                  <input 
                    type="text" 
                    value={newSubstitute.name || ''}
                    onChange={e => setNewSubstitute({...newSubstitute, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                    placeholder="الاسم الكامل"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">اسم الصيدلاني الذي ناب عنه</label>
                  <select
                    value={newSubstitute.replacedPharmacistName || ''}
                    onChange={e => setNewSubstitute({...newSubstitute, replacedPharmacistName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">اختر الصيدلاني...</option>
                    {users.filter(u => u.role === 'pharmacist' || u.role === 'admin').map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">التاريخ</label>
                  <input 
                    type="date" 
                    value={newSubstitute.shiftDate}
                    onChange={e => setNewSubstitute({...newSubstitute, shiftDate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">بداية الشفت</label>
                    <input 
                      type="time" 
                      value={newSubstitute.shiftStart}
                      onChange={e => setNewSubstitute({...newSubstitute, shiftStart: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">نهاية الشفت</label>
                    <input 
                      type="time" 
                      value={newSubstitute.shiftEnd}
                      onChange={e => setNewSubstitute({...newSubstitute, shiftEnd: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">السعر المتفق عليه (د.ع)</label>
                  <input 
                    type="number" 
                    value={newSubstitute.agreedPrice || ''}
                    onChange={e => setNewSubstitute({...newSubstitute, agreedPrice: Number(e.target.value)})}
                    onBlur={e => handlePriceBlur(Number(e.target.value), val => setNewSubstitute({...newSubstitute, agreedPrice: val}))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                    placeholder="0"
                  />
                </div>
                <button 
                  onClick={handleAddSubstitute}
                  className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 mt-4"
                >
                  حفظ البيانات
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showEditUserModal && editingUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50">
                <h3 className="text-xl font-bold text-amber-900">تعديل بيانات المستخدم</h3>
                <button onClick={() => setShowEditUserModal(false)} className="p-2 hover:bg-amber-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 text-right">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">الحالة</label>
                  <select 
                    value={editingUser.status}
                    onChange={e => setEditingUser({...editingUser, status: e.target.value as any})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="active">نشط</option>
                    <option value="restricted">مقيد (قفل الحساب)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">الاسم الكامل</label>
                  <input 
                    type="text" 
                    value={editingUser.name}
                    onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">بداية الشفت</label>
                    <input 
                      type="time" 
                      value={editingUser.shiftStart}
                      onChange={e => setEditingUser({...editingUser, shiftStart: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">نهاية الشفت</label>
                    <input 
                      type="time" 
                      value={editingUser.shiftEnd}
                      onChange={e => setEditingUser({...editingUser, shiftEnd: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleUpdateUser}
                    className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all"
                  >
                    تحديث البيانات
                  </button>
                  <button 
                    onClick={() => {
                      if(window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                        setUsers(users.filter(u => u.id !== editingUser.id));
                        setShowEditUserModal(false);
                      }
                    }}
                    className="flex-1 bg-rose-50 text-rose-600 py-3 rounded-xl font-bold hover:bg-rose-100 transition-all"
                  >
                    حذف المستخدم
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showPatientRequestModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
                <h3 className="text-xl font-bold text-emerald-900">تسجيل طلب مريض</h3>
                <button onClick={() => setShowPatientRequestModal(false)} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 text-right">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">اسم المريض</label>
                  <input 
                    type="text" 
                    value={newPatientRequest.patientName || ''}
                    onChange={e => setNewPatientRequest({...newPatientRequest, patientName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                    placeholder="أدخل اسم المريض..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">الدواء المطلوب</label>
                  <input 
                    type="text" 
                    value={newPatientRequest.drugName || ''}
                    onChange={e => setNewPatientRequest({...newPatientRequest, drugName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500" 
                    placeholder="اسم الدواء والتركيز..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">رقم الهاتف</label>
                  <input 
                    type="text" 
                    value={newPatientRequest.phoneNumber || ''}
                    onChange={e => setNewPatientRequest({...newPatientRequest, phoneNumber: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500 font-mono" 
                    placeholder="07xxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">ملاحظات إضافية</label>
                  <textarea 
                    value={newPatientRequest.notes || ''}
                    onChange={e => setNewPatientRequest({...newPatientRequest, notes: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-emerald-500 h-24 resize-none" 
                    placeholder="أي تفاصيل أخرى..."
                  />
                </div>
                <button 
                  onClick={handleAddPatientRequest}
                  className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  حفظ الطلب
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// Sub-components
function StatCard({ title, value, icon: Icon, color, trend }: { title: string; value: string; icon: any; color: string; trend?: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colors[color]} text-white shadow-lg shadow-${color}-500/20`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  );
}

function AlertItem({ type, title, detail }: { type: 'expiry' | 'stock'; title: string; detail: string }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border-l-4 ${type === 'expiry' ? 'bg-rose-50 border-rose-500' : 'bg-amber-50 border-amber-500'}`}>
      <div className={`p-2 rounded-full ${type === 'expiry' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
        {type === 'expiry' ? <Clock size={20} /> : <Package size={20} />}
      </div>
      <div className="flex-1">
        <h5 className="font-bold text-slate-800">{title}</h5>
        <p className="text-sm text-slate-600">{detail}</p>
      </div>
      <button className="text-slate-400 hover:text-slate-600">
        <ChevronLeft size={20} />
      </button>
    </div>
  );
}
