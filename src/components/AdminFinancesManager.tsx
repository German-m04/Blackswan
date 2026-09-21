import React, { useState, useMemo } from 'react';
import { Car, Expense, ExpenseType, ExpenseCategory, ExpensePaymentMethod, ExpenseStatus, VehicleStatus } from '../types';
import { storage } from '../utils/storage';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Receipt, 
  Plus, 
  Search, 
  Download, 
  Filter, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  CarFront, 
  Building2, 
  Wrench, 
  Calendar, 
  CreditCard, 
  X, 
  Edit3, 
  Trash2, 
  ArrowUpDown, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart,
  ChevronRight,
  FileSpreadsheet,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { exportToCsv } from '../utils/imageUtils';

interface AdminFinancesManagerProps {
  cars: Car[];
  expenses: Expense[];
  onExpensesChanged: () => void;
  onEditCar: (car: Car) => void;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Taller Mecánico & Mantenimiento',
  'Chapa y Pintura',
  'Repuestos y Neumáticos',
  'Detailing & Estética',
  'Gestoría, Transferencias & Patentes',
  'Flete & Logística',
  'Verificación Técnica & Peritajes',
  'Alquiler Salón & Showroom',
  'Sueldos, Comisiones & Honorarios',
  'Publicidad, Marketing & Redes',
  'Servicios Públicos (Luz, Internet, etc.)',
  'Impuestos, Tasas & Contabilidad',
  'Seguros de Salón & Flota',
  'Mantenimiento de Instalaciones',
  'Otro Gasto'
];

const PAYMENT_METHODS: ExpensePaymentMethod[] = [
  'Efectivo USD',
  'Efectivo ARS',
  'Transferencia Bancaria',
  'Cheque',
  'Tarjeta / MP',
  'Otro'
];

export const AdminFinancesManager: React.FC<AdminFinancesManagerProps> = ({
  cars,
  expenses,
  onExpensesChanged,
  onEditCar
}) => {
  // Navigation sub-tab
  const [subTab, setSubTab] = useState<'balance' | 'expenses' | 'stock'>('balance');

  // Expense filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'TODOS' | ExpenseType>('TODOS');
  const [categoryFilter, setCategoryFilter] = useState<string>('TODAS');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | ExpenseStatus>('TODOS');
  const [selectedCarFilter, setSelectedCarFilter] = useState<string>('TODOS');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR'>('ALL');

  // Stock filters
  const [stockSearch, setStockSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'TODOS' | VehicleStatus>('TODOS');
  const [stockBrandFilter, setStockBrandFilter] = useState<string>('TODAS');
  const [stockSortBy, setStockSortBy] = useState<'profit-desc' | 'cost-desc' | 'price-desc' | 'roi-desc'>('profit-desc');

  // Modal state for Add/Edit Expense
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form states
  const [formConcept, setFormConcept] = useState('');
  const [formType, setFormType] = useState<ExpenseType>('Directo de Vehículo');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Taller Mecánico & Mantenimiento');
  const [formCarId, setFormCarId] = useState<string>('');
  const [formAmountUsd, setFormAmountUsd] = useState<number | ''>('');
  const [formAmountArs, setFormAmountArs] = useState<number | ''>('');
  const [formExchangeRate, setFormExchangeRate] = useState<number>(1350);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<ExpensePaymentMethod>('Efectivo USD');
  const [formStatus, setFormStatus] = useState<ExpenseStatus>('Pagado');
  const [formSupplier, setFormSupplier] = useState('');
  const [formReceiptNumber, setFormReceiptNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formImpactCarExpenses, setFormImpactCarExpenses] = useState(true);

  // Helpers format
  const formatUsd = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatArs = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val);
  };

  // -----------------------------------------------------------------
  // FINANCIAL CALCULATIONS: STOCK
  // -----------------------------------------------------------------
  const activeStockCars = useMemo(() => {
    return cars.filter((c) => c.status === 'Disponible' || c.status === 'Reservado');
  }, [cars]);

  const soldCars = useMemo(() => {
    return cars.filter((c) => c.status === 'Vendido');
  }, [cars]);

  // Total sales valuation of current stock
  const totalStockSaleUsd = useMemo(() => {
    return activeStockCars.reduce((acc, c) => acc + (c.priceUsd || 0), 0);
  }, [activeStockCars]);

  // Total investment in active stock (Purchase base price + Direct assigned expenses)
  const totalStockPurchaseBaseUsd = useMemo(() => {
    return activeStockCars.reduce((acc, c) => acc + (c.purchasePriceUsd || 0), 0);
  }, [activeStockCars]);

  const totalStockDirectExpensesUsd = useMemo(() => {
    return activeStockCars.reduce((acc, c) => acc + (c.purchaseExpensesUsd || 0), 0);
  }, [activeStockCars]);

  const totalStockInvestmentUsd = useMemo(() => {
    return totalStockPurchaseBaseUsd + totalStockDirectExpensesUsd;
  }, [totalStockPurchaseBaseUsd, totalStockDirectExpensesUsd]);

  // Potential gross margin of active stock
  const potentialGrossProfitUsd = useMemo(() => {
    return totalStockSaleUsd - totalStockInvestmentUsd;
  }, [totalStockSaleUsd, totalStockInvestmentUsd]);

  const potentialGrossMarginPercent = useMemo(() => {
    if (totalStockInvestmentUsd <= 0) return 0;
    return (potentialGrossProfitUsd / totalStockInvestmentUsd) * 100;
  }, [potentialGrossProfitUsd, totalStockInvestmentUsd]);

  // -----------------------------------------------------------------
  // FINANCIAL CALCULATIONS: EXPENSES
  // -----------------------------------------------------------------
  const totalExpensesUsd = useMemo(() => {
    return expenses.reduce((acc, e) => acc + (e.amountUsd || 0), 0);
  }, [expenses]);

  const directVehicleExpensesUsd = useMemo(() => {
    return expenses.filter((e) => e.type === 'Directo de Vehículo').reduce((acc, e) => acc + (e.amountUsd || 0), 0);
  }, [expenses]);

  const operatingExpensesUsd = useMemo(() => {
    return expenses.filter((e) => e.type === 'Operativo / Concesionario').reduce((acc, e) => acc + (e.amountUsd || 0), 0);
  }, [expenses]);

  const paidExpensesUsd = useMemo(() => {
    return expenses.filter((e) => e.status === 'Pagado').reduce((acc, e) => acc + (e.amountUsd || 0), 0);
  }, [expenses]);

  const pendingExpensesUsd = useMemo(() => {
    return expenses.filter((e) => e.status === 'Pendiente').reduce((acc, e) => acc + (e.amountUsd || 0), 0);
  }, [expenses]);

  const pendingExpensesCount = useMemo(() => {
    return expenses.filter((e) => e.status === 'Pendiente').length;
  }, [expenses]);

  // Net Estimated Business Balance = Potential Gross Profit from Stock - Total Operating Dealership Expenses
  const estimatedNetBalanceUsd = useMemo(() => {
    return potentialGrossProfitUsd - operatingExpensesUsd;
  }, [potentialGrossProfitUsd, operatingExpensesUsd]);

  // Breakdown by Category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalUsd: number; type: ExpenseType }> = {};

    expenses.forEach((e) => {
      const cat = e.category || 'Otro Gasto';
      if (!map[cat]) {
        map[cat] = { count: 0, totalUsd: 0, type: e.type };
      }
      map[cat].count++;
      map[cat].totalUsd += e.amountUsd || 0;
    });

    return Object.entries(map)
      .map(([category, data]) => ({
        category,
        count: data.count,
        totalUsd: data.totalUsd,
        type: data.type,
        percentage: totalExpensesUsd > 0 ? (data.totalUsd / totalExpensesUsd) * 100 : 0
      }))
      .sort((a, b) => b.totalUsd - a.totalUsd);
  }, [expenses, totalExpensesUsd]);

  // Breakdown by Payment Method
  const paymentMethodBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalUsd: number }> = {};

    expenses.forEach((e) => {
      const pm = e.paymentMethod || 'Otro';
      if (!map[pm]) {
        map[pm] = { count: 0, totalUsd: 0 };
      }
      map[pm].count++;
      map[pm].totalUsd += e.amountUsd || 0;
    });

    return Object.entries(map)
      .map(([method, data]) => ({
        method,
        count: data.count,
        totalUsd: data.totalUsd,
        percentage: totalExpensesUsd > 0 ? (data.totalUsd / totalExpensesUsd) * 100 : 0
      }))
      .sort((a, b) => b.totalUsd - a.totalUsd);
  }, [expenses, totalExpensesUsd]);

  // -----------------------------------------------------------------
  // FILTERED EXPENSES TABLE
  // -----------------------------------------------------------------
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const currentYear = `${now.getFullYear()}`;

    return expenses.filter((e) => {
      // Search
      const matchesSearch = !searchQuery.trim() ||
        e.concept.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.supplier && e.supplier.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.receiptNumber && e.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.carTitle && e.carTitle.toLowerCase().includes(searchQuery.toLowerCase()));

      // Type
      const matchesType = typeFilter === 'TODOS' || e.type === typeFilter;

      // Category
      const matchesCategory = categoryFilter === 'TODAS' || e.category === categoryFilter;

      // Status
      const matchesStatus = statusFilter === 'TODOS' || e.status === statusFilter;

      // Car
      const matchesCar = selectedCarFilter === 'TODOS' || e.carId === selectedCarFilter;

      // Time
      let matchesTime = true;
      if (timeFilter === 'THIS_MONTH') {
        matchesTime = e.date.startsWith(currentMonth);
      } else if (timeFilter === 'LAST_MONTH') {
        matchesTime = e.date.startsWith(lastMonth);
      } else if (timeFilter === 'THIS_YEAR') {
        matchesTime = e.date.startsWith(currentYear);
      }

      return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesCar && matchesTime;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchQuery, typeFilter, categoryFilter, statusFilter, selectedCarFilter, timeFilter]);

  // -----------------------------------------------------------------
  // FILTERED STOCK TABLE
  // -----------------------------------------------------------------
  const availableBrands = useMemo(() => {
    return Array.from(new Set(cars.map((c) => c.brand))).filter(Boolean).sort();
  }, [cars]);

  const filteredStockCars = useMemo(() => {
    return cars.filter((c) => {
      const searchMatch = !stockSearch.trim() ||
        c.title.toLowerCase().includes(stockSearch.toLowerCase()) ||
        c.brand.toLowerCase().includes(stockSearch.toLowerCase()) ||
        c.model.toLowerCase().includes(stockSearch.toLowerCase()) ||
        (c.licensePlate && c.licensePlate.toLowerCase().includes(stockSearch.toLowerCase()));

      const statusMatch = stockStatusFilter === 'TODOS' || c.status === stockStatusFilter;
      const brandMatch = stockBrandFilter === 'TODAS' || c.brand === stockBrandFilter;

      return searchMatch && statusMatch && brandMatch;
    }).sort((a, b) => {
      const aCost = (a.purchasePriceUsd || 0) + (a.purchaseExpensesUsd || 0);
      const bCost = (b.purchasePriceUsd || 0) + (b.purchaseExpensesUsd || 0);
      const aProfit = (a.priceUsd || 0) - aCost;
      const bProfit = (b.priceUsd || 0) - bCost;
      const aRoi = aCost > 0 ? (aProfit / aCost) * 100 : 0;
      const bRoi = bCost > 0 ? (bProfit / bCost) * 100 : 0;

      if (stockSortBy === 'profit-desc') return bProfit - aProfit;
      if (stockSortBy === 'cost-desc') return bCost - aCost;
      if (stockSortBy === 'price-desc') return (b.priceUsd || 0) - (a.priceUsd || 0);
      if (stockSortBy === 'roi-desc') return bRoi - aRoi;
      return 0;
    });
  }, [cars, stockSearch, stockStatusFilter, stockBrandFilter, stockSortBy]);

  // -----------------------------------------------------------------
  // MODAL HANDLERS FOR EXPENSE
  // -----------------------------------------------------------------
  const openAddExpenseModal = (preselectedCarId?: string) => {
    setEditingExpense(null);
    setFormConcept('');
    setFormType(preselectedCarId ? 'Directo de Vehículo' : 'Directo de Vehículo');
    setFormCategory('Taller Mecánico & Mantenimiento');
    setFormCarId(preselectedCarId || (cars[0]?.id || ''));
    setFormAmountUsd('');
    setFormAmountArs('');
    setFormExchangeRate(1350);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('Efectivo USD');
    setFormStatus('Pagado');
    setFormSupplier('');
    setFormReceiptNumber('');
    setFormNotes('');
    setFormImpactCarExpenses(true);
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormConcept(expense.concept);
    setFormType(expense.type);
    setFormCategory(expense.category);
    setFormCarId(expense.carId || '');
    setFormAmountUsd(expense.amountUsd);
    setFormAmountArs(expense.amountArs || '');
    setFormExchangeRate(expense.exchangeRate || 1350);
    setFormDate(expense.date);
    setFormPaymentMethod(expense.paymentMethod);
    setFormStatus(expense.status);
    setFormSupplier(expense.supplier || '');
    setFormReceiptNumber(expense.receiptNumber || '');
    setFormNotes(expense.notes || '');
    setFormImpactCarExpenses(expense.impactCarExpenses !== false);
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const usdVal = Number(formAmountUsd) || 0;
    if (usdVal <= 0) {
      alert('Por favor ingrese un monto válido mayor a 0 en USD.');
      return;
    }

    const linkedCar = formType === 'Directo de Vehículo' ? cars.find((c) => c.id === formCarId) : null;
    const carTitleStr = linkedCar ? `${linkedCar.brand} ${linkedCar.model} (${linkedCar.year})${linkedCar.licensePlate ? ` [${linkedCar.licensePlate}]` : ''}` : '';

    if (editingExpense) {
      await storage.updateExpense({
        ...editingExpense,
        concept: formConcept.trim(),
        type: formType,
        category: formCategory,
        carId: formType === 'Directo de Vehículo' ? formCarId : undefined,
        carTitle: formType === 'Directo de Vehículo' ? carTitleStr : undefined,
        amountUsd: usdVal,
        amountArs: formAmountArs ? Number(formAmountArs) : undefined,
        exchangeRate: formExchangeRate || 1350,
        date: formDate,
        paymentMethod: formPaymentMethod,
        status: formStatus,
        supplier: formSupplier.trim() || undefined,
        receiptNumber: formReceiptNumber.trim() || undefined,
        notes: formNotes.trim() || undefined,
        impactCarExpenses: formType === 'Directo de Vehículo' ? formImpactCarExpenses : false
      });
    } else {
      await storage.addExpense({
        concept: formConcept.trim(),
        type: formType,
        category: formCategory,
        carId: formType === 'Directo de Vehículo' ? formCarId : undefined,
        carTitle: formType === 'Directo de Vehículo' ? carTitleStr : undefined,
        amountUsd: usdVal,
        amountArs: formAmountArs ? Number(formAmountArs) : undefined,
        exchangeRate: formExchangeRate || 1350,
        date: formDate,
        paymentMethod: formPaymentMethod,
        status: formStatus,
        supplier: formSupplier.trim() || undefined,
        receiptNumber: formReceiptNumber.trim() || undefined,
        notes: formNotes.trim() || undefined,
        impactCarExpenses: formType === 'Directo de Vehículo' ? formImpactCarExpenses : false
      });
    }

    setShowExpenseModal(false);
    onExpensesChanged();
  };

  const handleDeleteExpense = async (id: string, concept: string) => {
    if (window.confirm(`¿Desea eliminar el registro del gasto "${concept}"?`)) {
      await storage.deleteExpense(id);
      onExpensesChanged();
    }
  };

  const handleToggleExpenseStatus = async (expense: Expense) => {
    const nextStatus: ExpenseStatus = expense.status === 'Pagado' ? 'Pendiente' : 'Pagado';
    await storage.updateExpense({
      ...expense,
      status: nextStatus
    });
    onExpensesChanged();
  };

  // Convert ARS to USD or vice versa in modal
  const handleArsChange = (valStr: string) => {
    if (!valStr) {
      setFormAmountArs('');
      return;
    }
    const ars = Number(valStr);
    setFormAmountArs(ars);
    if (formExchangeRate > 0) {
      setFormAmountUsd(Math.round(ars / formExchangeRate));
    }
  };

  const handleUsdChange = (valStr: string) => {
    if (!valStr) {
      setFormAmountUsd('');
      return;
    }
    const usd = Number(valStr);
    setFormAmountUsd(usd);
    if (formExchangeRate > 0) {
      setFormAmountArs(Math.round(usd * formExchangeRate));
    }
  };

  // Quick Action: view expenses for a specific car in the expenses tab
  const handleViewCarExpenses = (carId: string) => {
    setSelectedCarFilter(carId);
    setTypeFilter('Directo de Vehículo');
    setSubTab('expenses');
  };

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* HEADER & SUB-NAVIGATION                                   */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-serif text-white flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
            <span>Finanzas & Control de Gastos</span>
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Gestión integral de valorización de stock, capital inmovilizado, gastos directos de taller y costos operativos del concesionario.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab Switcher */}
          <div className="bg-[#0a0a0a] border border-white/10 p-1 flex items-center gap-1">
            <button
              onClick={() => setSubTab('balance')}
              className={`px-3 py-1.5 text-xs font-bold transition-colors uppercase tracking-wider flex items-center gap-1.5 ${
                subTab === 'balance'
                  ? 'bg-[#D4AF37] text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Balance P&L</span>
            </button>

            <button
              onClick={() => setSubTab('expenses')}
              className={`px-3 py-1.5 text-xs font-bold transition-colors uppercase tracking-wider flex items-center gap-1.5 ${
                subTab === 'expenses'
                  ? 'bg-[#D4AF37] text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Libro de Gastos</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                subTab === 'expenses' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'
              }`}>
                {expenses.length}
              </span>
            </button>

            <button
              onClick={() => setSubTab('stock')}
              className={`px-3 py-1.5 text-xs font-bold transition-colors uppercase tracking-wider flex items-center gap-1.5 ${
                subTab === 'stock'
                  ? 'bg-[#D4AF37] text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <CarFront className="w-3.5 h-3.5" />
              <span>Capital en Stock</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                subTab === 'stock' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'
              }`}>
                {activeStockCars.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => openAddExpenseModal()}
            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* EXECUTIVE SUMMARY KPI BAR (ALWAYS VISIBLE)                 */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Capital en Stock */}
        <div className="bg-[#0a0a0a] border border-white/10 p-3.5">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Capital Invertido</span>
            <Wallet className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div className="text-base font-serif font-bold text-white">
            {formatUsd(totalStockInvestmentUsd)}
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">
            {activeStockCars.length} autos en inventario
          </div>
        </div>

        {/* Valor Venta Proyectada */}
        <div className="bg-[#0a0a0a] border border-white/10 p-3.5">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Venta Proyectada</span>
            <DollarSign className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-base font-serif font-bold text-white">
            {formatUsd(totalStockSaleUsd)}
          </div>
          <div className="text-[10px] text-blue-400/80 mt-0.5">
            Precios de lista activos
          </div>
        </div>

        {/* Margen Bruto de Stock */}
        <div className="bg-[#0a0a0a] border border-white/10 p-3.5">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Margen Bruto Flota</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-serif font-bold text-emerald-400">
            +{formatUsd(potentialGrossProfitUsd)}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">
            ROI +{potentialGrossMarginPercent.toFixed(1)}% s/costo
          </div>
        </div>

        {/* Total Gastos Registrados */}
        <div className="bg-[#0a0a0a] border border-white/10 p-3.5">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Gastos</span>
            <Receipt className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-base font-serif font-bold text-white">
            {formatUsd(totalExpensesUsd)}
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">
            Directos: {formatUsd(directVehicleExpensesUsd)}
          </div>
        </div>

        {/* Gastos Operativos Concesionario */}
        <div className="bg-[#0a0a0a] border border-white/10 p-3.5">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Gastos Operativos</span>
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base font-serif font-bold text-white">
            {formatUsd(operatingExpensesUsd)}
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">
            Alquiler, sueldos, servicios
          </div>
        </div>

        {/* Balance Neto Proyectado */}
        <div className="bg-[#0a0a0a] border border-white/10 p-3.5">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Resultado Neto Est.</span>
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div className={`text-base font-serif font-bold ${estimatedNetBalanceUsd >= 0 ? 'text-[#D4AF37]' : 'text-rose-400'}`}>
            {formatUsd(estimatedNetBalanceUsd)}
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">
            {pendingExpensesCount > 0 ? (
              <span className="text-amber-400 font-semibold">{pendingExpensesCount} pagos pendientes</span>
            ) : (
              <span>Pagos al día</span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-VIEW 1: BALANCE GENERAL & P&L                          */}
      {/* ========================================================= */}
      {subTab === 'balance' && (
        <div className="space-y-6">
          {/* Main Financial Balance Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Estado de Resultados Proyectado */}
            <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-sm font-serif text-white font-bold">Estado de Resultados (P&L)</h3>
                </div>
                <span className="text-[10px] uppercase font-mono text-white/40">Estimado Global</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/70">Ingreso Proyectado por Venta de Stock</span>
                  <span className="font-mono text-white font-bold">+{formatUsd(totalStockSaleUsd)}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/5 text-rose-300">
                  <span className="text-white/70">(-) Costo Base de Adquisición de Autos</span>
                  <span className="font-mono font-bold">-{formatUsd(totalStockPurchaseBaseUsd)}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/5 text-rose-300">
                  <span className="text-white/70">(-) Gastos Directos en Autos (Taller/Chapa/Flete)</span>
                  <span className="font-mono font-bold">-{formatUsd(totalStockDirectExpensesUsd)}</span>
                </div>

                <div className="flex items-center justify-between py-2 bg-white/[0.02] px-2 border-y border-white/10 font-serif">
                  <span className="text-white font-bold">(=) Margen Bruto de Intermediación</span>
                  <span className="font-mono font-bold text-emerald-400">+{formatUsd(potentialGrossProfitUsd)}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/5 text-amber-300">
                  <span className="text-white/70">(-) Gastos Operativos / Fijos de Agencia</span>
                  <span className="font-mono font-bold">-{formatUsd(operatingExpensesUsd)}</span>
                </div>

                <div className="flex items-center justify-between py-2.5 bg-[#D4AF37]/10 px-3 border border-[#D4AF37]/30 text-sm font-serif">
                  <span className="text-white font-bold">(=) Rendimiento Neto Proyectado</span>
                  <span className="font-mono font-bold text-[#D4AF37]">{formatUsd(estimatedNetBalanceUsd)}</span>
                </div>
              </div>

              <div className="p-3 bg-[#050505] border border-white/5 text-[11px] text-white/50 space-y-1">
                <p>
                  * El margen bruto considera únicamente las unidades activas en inventario.
                </p>
                <p>
                  * Cada gasto registrado con opción directa a un vehículo sincroniza automáticamente el costo del vehículo en el stock.
                </p>
              </div>
            </div>

            {/* 2. Desglose de Gastos por Categoría */}
            <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-serif text-white font-bold">Gastos por Categoría</h3>
                </div>
                <span className="text-[10px] uppercase font-mono text-white/40">{expenses.length} registros</span>
              </div>

              {categoryBreakdown.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Receipt className="w-8 h-8 text-white/20 mx-auto" />
                  <p className="text-xs text-white/50">No hay gastos registrados en el sistema.</p>
                  <button
                    onClick={() => openAddExpenseModal()}
                    className="px-3 py-1.5 bg-[#D4AF37] text-black text-[10px] uppercase font-bold tracking-wider hover:bg-[#c4a02e]"
                  >
                    Cargar Primer Gasto
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {categoryBreakdown.map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white truncate max-w-[200px]" title={item.category}>
                          {item.category}
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-white/40 text-[10px]">({item.count})</span>
                          <span className="text-white font-bold">{formatUsd(item.totalUsd)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 overflow-hidden">
                        <div 
                          className={`h-full ${item.type === 'Directo de Vehículo' ? 'bg-[#D4AF37]' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                    <span className="text-white/60">Directos Vehículo ({formatUsd(directVehicleExpensesUsd)})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-white/60">Operativos ({formatUsd(operatingExpensesUsd)})</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Métodos de Pago & Estado de Tesorería */}
            <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-serif text-white font-bold">Medios de Pago & Compromisos</h3>
                </div>
                <span className="text-[10px] uppercase font-mono text-white/40">Tesorería</span>
              </div>

              {/* Status breakdown card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#050505] border border-emerald-500/20 p-3">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pagado / Ejecutado</span>
                  </div>
                  <div className="text-base font-serif font-bold text-white">
                    {formatUsd(paidExpensesUsd)}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">
                    {expenses.filter((e) => e.status === 'Pagado').length} comprobantes cancelados
                  </div>
                </div>

                <div className={`bg-[#050505] p-3 border ${pendingExpensesCount > 0 ? 'border-amber-500/40 bg-amber-500/[0.02]' : 'border-white/10'}`}>
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pendiente de Pago</span>
                  </div>
                  <div className="text-base font-serif font-bold text-amber-400">
                    {formatUsd(pendingExpensesUsd)}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">
                    {pendingExpensesCount} facturas a liquidar
                  </div>
                </div>
              </div>

              {/* Payment method table */}
              <div className="space-y-2 pt-2">
                <div className="text-[10px] uppercase font-mono text-white/40">Egresos por Medio de Pago</div>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {paymentMethodBreakdown.map((pm) => (
                    <div key={pm.method} className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                      <span className="text-white/80">{pm.method}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-white/40 text-[10px]">({pm.count})</span>
                        <span className="text-white font-bold">{formatUsd(pm.totalUsd)}</span>
                        <span className="text-[#D4AF37] text-[10px]">({pm.percentage.toFixed(0)}%)</span>
                      </div>
                    </div>
                  ))}
                  {paymentMethodBreakdown.length === 0 && (
                    <p className="text-xs text-white/40 italic py-2">Sin movimientos registrados</p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSubTab('expenses')}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <span>Ver Libro de Gastos Detallado</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 2: LIBRO DE GASTOS & EGRESOS                      */}
      {/* ========================================================= */}
      {subTab === 'expenses' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#0a0a0a] border border-white/10 p-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search */}
              <div className="relative min-w-[220px] flex-1">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por concepto, taller, comprobante o auto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-[#050505] border border-white/10 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="TODOS">Todos los Tipos</option>
                <option value="Directo de Vehículo">Directo de Vehículo</option>
                <option value="Operativo / Concesionario">Operativo / Concesionario</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#050505] border border-white/10 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] max-w-[180px] truncate"
              >
                <option value="TODAS">Todas las Categorías</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-[#050505] border border-white/10 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="Pagado">Pagado</option>
                <option value="Pendiente">Pendiente</option>
              </select>

              {/* Specific Car Filter */}
              <select
                value={selectedCarFilter}
                onChange={(e) => setSelectedCarFilter(e.target.value)}
                className="bg-[#050505] border border-white/10 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] max-w-[180px] truncate"
              >
                <option value="TODOS">Todos los Autos</option>
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.brand} {c.model} ({c.year}) {c.licensePlate ? `[${c.licensePlate}]` : ''}
                  </option>
                ))}
              </select>

              {/* Time Filter */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="bg-[#050505] border border-white/10 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="ALL">Todo el Historial</option>
                <option value="THIS_MONTH">Este Mes</option>
                <option value="LAST_MONTH">Mes Anterior</option>
                <option value="THIS_YEAR">Este Año</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportToCsv('blackswan_libro_gastos.csv', filteredExpenses)}
                className="px-3 py-1.5 bg-[#050505] border border-white/10 hover:border-white/20 text-xs text-white/70 hover:text-white uppercase font-bold tracking-wider flex items-center gap-1.5"
                title="Exportar gastos filtrados a archivo CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>

              <button
                onClick={() => openAddExpenseModal()}
                className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Gasto</span>
              </button>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white/70">
                <thead className="bg-[#050505] border-b border-white/10 uppercase font-bold text-white/40 tracking-widest text-[10px]">
                  <tr>
                    <th className="p-3.5">Fecha / Comprobante</th>
                    <th className="p-3.5">Concepto & Prestador</th>
                    <th className="p-3.5">Tipo & Categoría</th>
                    <th className="p-3.5">Auto Asignado</th>
                    <th className="p-3.5">Medio de Pago</th>
                    <th className="p-3.5">Monto (USD / ARS)</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Fecha & Comprobante */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-mono text-white block">{exp.date}</span>
                        <span className="text-[10px] text-white/40 font-mono">
                          {exp.receiptNumber ? `Fac/Rec: ${exp.receiptNumber}` : 'S/Comprobante'}
                        </span>
                      </td>

                      {/* Concepto & Proveedor */}
                      <td className="p-3.5">
                        <span className="text-white font-medium block">{exp.concept}</span>
                        {exp.supplier && (
                          <span className="text-[10px] text-white/40 block">
                            Prestador: {exp.supplier}
                          </span>
                        )}
                        {exp.notes && (
                          <span className="text-[10px] text-white/30 italic block max-w-xs truncate">
                            {exp.notes}
                          </span>
                        )}
                      </td>

                      {/* Tipo & Categoría */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 text-[9px] uppercase font-bold border inline-block mb-1 ${
                          exp.type === 'Directo de Vehículo'
                            ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {exp.type === 'Directo de Vehículo' ? 'Directo Auto' : 'Operativo'}
                        </span>
                        <span className="text-[11px] text-white/70 block truncate max-w-[180px]">
                          {exp.category}
                        </span>
                      </td>

                      {/* Auto Asignado */}
                      <td className="p-3.5">
                        {exp.carTitle ? (
                          <div className="flex items-center gap-1.5">
                            <CarFront className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                            <span className="text-white font-medium truncate max-w-[160px]" title={exp.carTitle}>
                              {exp.carTitle}
                            </span>
                          </div>
                        ) : (
                          <span className="text-white/30 italic text-[11px]">General Concesionario</span>
                        )}
                      </td>

                      {/* Medio de Pago */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="text-white/80">{exp.paymentMethod}</span>
                      </td>

                      {/* Monto */}
                      <td className="p-3.5 whitespace-nowrap font-mono">
                        <span className="text-white font-bold block text-sm">
                          {formatUsd(exp.amountUsd)}
                        </span>
                        {exp.amountArs && exp.amountArs > 0 && (
                          <span className="text-[10px] text-white/40 block">
                            {formatArs(exp.amountArs)}
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="p-3.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleExpenseStatus(exp)}
                          className={`px-2 py-1 text-[10px] uppercase font-bold border transition-colors flex items-center gap-1 ${
                            exp.status === 'Pagado'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                          title="Hacer clic para alternar entre Pagado y Pendiente"
                        >
                          {exp.status === 'Pagado' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{exp.status}</span>
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditExpenseModal(exp)}
                            className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                            title="Editar gasto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id, exp.concept)}
                            className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Eliminar gasto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-10 text-center">
                        <div className="max-w-md mx-auto space-y-2">
                          <Receipt className="w-8 h-8 text-white/20 mx-auto" />
                          <p className="text-sm text-white font-serif">
                            {expenses.length === 0 
                              ? 'Libro de gastos vacío' 
                              : 'No se encontraron gastos con los filtros seleccionados'}
                          </p>
                          <p className="text-xs text-white/50">
                            {expenses.length === 0
                              ? 'Registra los gastos de taller, traslados o costos fijos del concesionario para llevar las finanzas al día.'
                              : 'Prueba modificando los términos de búsqueda o filtros.'}
                          </p>
                          {expenses.length === 0 && (
                            <button
                              type="button"
                              onClick={() => openAddExpenseModal()}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#c4a02e] transition-colors mt-2"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Registrar Primer Gasto</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Summary */}
            {filteredExpenses.length > 0 && (
              <div className="bg-[#050505] p-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-white/50">
                  Mostrando <strong className="text-white">{filteredExpenses.length}</strong> de <strong className="text-white">{expenses.length}</strong> gastos
                </span>
                <div className="flex items-center gap-4 font-mono">
                  <span className="text-white/70">
                    Total Filtrado: <strong className="text-[#D4AF37] text-sm">{formatUsd(filteredExpenses.reduce((acc, e) => acc + (e.amountUsd || 0), 0))}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 3: VALORIZACIÓN DE CAPITAL EN STOCK & ROI         */}
      {/* ========================================================= */}
      {subTab === 'stock' && (
        <div className="space-y-4">
          {/* Stock Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0a0a0a] border border-white/10 p-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[200px] flex-1">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por marca, modelo o patente..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                className="bg-[#050505] border border-white/10 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="Disponible">Solo Disponibles</option>
                <option value="Reservado">Solo Reservados</option>
                <option value="Vendido">Solo Vendidos</option>
              </select>

              <select
                value={stockBrandFilter}
                onChange={(e) => setStockBrandFilter(e.target.value)}
                className="bg-[#050505] border border-white/10 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="TODAS">Todas las Marcas</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              <select
                value={stockSortBy}
                onChange={(e) => setStockSortBy(e.target.value as any)}
                className="bg-[#050505] border border-white/10 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="profit-desc">Mayor Ganancia ($)</option>
                <option value="roi-desc">Mayor Margen (ROI %)</option>
                <option value="cost-desc">Mayor Capital Invertido</option>
                <option value="price-desc">Mayor Precio Venta</option>
              </select>
            </div>

            <button
              onClick={() => exportToCsv('blackswan_stock_valorizado.csv', filteredStockCars)}
              className="px-3 py-1.5 bg-[#050505] border border-white/10 hover:border-white/20 text-xs text-white/70 hover:text-white uppercase font-bold tracking-wider flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Exportar Inventario CSV</span>
            </button>
          </div>

          {/* Stock Valuation Table */}
          <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white/70">
                <thead className="bg-[#050505] border-b border-white/10 uppercase font-bold text-white/40 tracking-widest text-[10px]">
                  <tr>
                    <th className="p-3.5">Vehículo & Dominio</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5">Precio Compra</th>
                    <th className="p-3.5">Gastos Asignados</th>
                    <th className="p-3.5">Costo Total</th>
                    <th className="p-3.5">Precio Venta</th>
                    <th className="p-3.5">Margen Est.</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStockCars.map((car) => {
                    const purchaseBase = car.purchasePriceUsd || 0;
                    const purchaseExpenses = car.purchaseExpensesUsd || 0;
                    const totalCost = purchaseBase + purchaseExpenses;
                    const salePrice = car.priceUsd || 0;
                    const profitUsd = salePrice - totalCost;
                    const roiPercent = totalCost > 0 ? (profitUsd / totalCost) * 100 : 0;

                    // Direct expenses recorded for this car
                    const carExpenseCount = expenses.filter((e) => e.carId === car.id).length;

                    return (
                      <tr key={car.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Vehículo & Dominio */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            {car.images && car.images[0] ? (
                              <img 
                                src={car.images[0]} 
                                alt={car.title} 
                                className="w-10 h-8 object-cover rounded bg-white/5 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-8 bg-white/5 rounded flex items-center justify-center flex-shrink-0">
                                <CarFront className="w-4 h-4 text-white/20" />
                              </div>
                            )}
                            <div>
                              <span className="font-serif text-white font-bold block text-xs">{car.title}</span>
                              <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
                                <span>{car.year}</span>
                                {car.licensePlate && (
                                  <span className="px-1 bg-white/5 border border-white/10 text-white/70">
                                    {car.licensePlate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[9px] uppercase font-bold border inline-block ${
                            car.status === 'Disponible'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : car.status === 'Reservado'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-white/5 text-white/40 border-white/10'
                          }`}>
                            {car.status}
                          </span>
                        </td>

                        {/* Precio Compra */}
                        <td className="p-3.5 whitespace-nowrap font-mono text-white/90">
                          {purchaseBase > 0 ? formatUsd(purchaseBase) : (
                            <span className="text-white/30 text-[11px] italic">Sin registrar</span>
                          )}
                        </td>

                        {/* Gastos Asignados */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-mono text-white/90">
                            {purchaseExpenses > 0 ? formatUsd(purchaseExpenses) : '$0'}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleViewCarExpenses(car.id)}
                            className="text-[10px] text-[#D4AF37] hover:underline block font-sans mt-0.5"
                          >
                            {carExpenseCount > 0 ? `${carExpenseCount} gastos cargados` : 'Ver / Cargar gastos'}
                          </button>
                        </td>

                        {/* Costo Total */}
                        <td className="p-3.5 whitespace-nowrap font-mono font-bold text-white">
                          {totalCost > 0 ? formatUsd(totalCost) : (
                            <span className="text-white/30 text-[11px] font-normal italic">S/D</span>
                          )}
                        </td>

                        {/* Precio Venta */}
                        <td className="p-3.5 whitespace-nowrap font-mono font-bold text-blue-400">
                          {salePrice > 0 ? formatUsd(salePrice) : 'A Consultar'}
                        </td>

                        {/* Margen Est. */}
                        <td className="p-3.5 whitespace-nowrap font-mono">
                          {totalCost > 0 && salePrice > 0 ? (
                            <div>
                              <span className={`font-bold block ${profitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {profitUsd >= 0 ? '+' : ''}{formatUsd(profitUsd)}
                              </span>
                              <span className="text-[10px] text-white/40 block">
                                {roiPercent.toFixed(1)}% ROI
                              </span>
                            </div>
                          ) : (
                            <span className="text-white/30 text-[11px] italic">Incompleto</span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openAddExpenseModal(car.id)}
                              className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-[10px] uppercase font-bold transition-colors flex items-center gap-1"
                              title="Cargar nuevo gasto directo a este vehículo"
                            >
                              <Plus className="w-3 h-3 text-[#D4AF37]" />
                              <span>Gasto</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onEditCar(car)}
                              className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                              title="Editar costos y ficha del vehículo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredStockCars.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-10 text-center">
                        <div className="max-w-md mx-auto space-y-2">
                          <CarFront className="w-8 h-8 text-white/20 mx-auto" />
                          <p className="text-sm text-white font-serif">No hay vehículos en inventario</p>
                          <p className="text-xs text-white/50">Carga un vehículo para ver su desglose financiero de compra, gastos y margen.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REGISTRAR / EDITAR GASTO                            */}
      {/* ========================================================= */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#050505]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-serif text-base text-white font-bold">
                  {editingExpense ? 'Editar Registro de Gasto' : 'Registrar Nuevo Gasto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="p-1 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveExpense} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Tipo de Gasto */}
              <div>
                <label className="block text-white/70 font-bold uppercase tracking-wider text-[10px] mb-2">
                  Tipo de Gasto *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormType('Directo de Vehículo')}
                    className={`p-3 border text-left transition-colors flex items-center gap-3 ${
                      formType === 'Directo de Vehículo'
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white'
                        : 'border-white/10 bg-[#050505] text-white/60 hover:text-white'
                    }`}
                  >
                    <CarFront className={`w-4 h-4 ${formType === 'Directo de Vehículo' ? 'text-[#D4AF37]' : 'text-white/40'}`} />
                    <div>
                      <div className="font-bold">Directo de Vehículo</div>
                      <div className="text-[10px] text-white/40">Taller, chapa, repuestos, flete, gestoría</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('Operativo / Concesionario')}
                    className={`p-3 border text-left transition-colors flex items-center gap-3 ${
                      formType === 'Operativo / Concesionario'
                        ? 'border-rose-500 bg-rose-500/10 text-white'
                        : 'border-white/10 bg-[#050505] text-white/60 hover:text-white'
                    }`}
                  >
                    <Building2 className={`w-4 h-4 ${formType === 'Operativo / Concesionario' ? 'text-rose-400' : 'text-white/40'}`} />
                    <div>
                      <div className="font-bold">Operativo / Agencia</div>
                      <div className="text-[10px] text-white/40">Alquiler, sueldos, marketing, servicios</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Si es directo de vehículo, selector de auto */}
              {formType === 'Directo de Vehículo' && (
                <div className="space-y-2 bg-[#050505] p-3.5 border border-[#D4AF37]/30">
                  <label className="block text-white font-bold uppercase tracking-wider text-[10px]">
                    Vehículo Asociado *
                  </label>
                  <select
                    value={formCarId}
                    onChange={(e) => setFormCarId(e.target.value)}
                    required
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Seleccionar vehículo de la flota...</option>
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.brand} {c.model} ({c.year}) - {c.licensePlate ? `Patente: ${c.licensePlate} - ` : ''}Precio: {formatUsd(c.priceUsd)} [{c.status}]
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={formImpactCarExpenses}
                      onChange={(e) => setFormImpactCarExpenses(e.target.checked)}
                      className="accent-[#D4AF37] w-3.5 h-3.5"
                    />
                    <span className="text-white/70 text-[11px]">
                      Sumar automáticamente a los gastos directos del vehículo (<code className="text-[#D4AF37]">purchaseExpensesUsd</code>) en el inventario.
                    </span>
                  </label>
                </div>
              )}

              {/* Categoría y Concepto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Categoría *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    required
                    className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Concepto / Detalle del Gasto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Cambio de pastillas de freno y service oficial..."
                    value={formConcept}
                    onChange={(e) => setFormConcept(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Montos y Tipo de Cambio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#050505] p-3.5 border border-white/5">
                <div>
                  <label className="block text-[#D4AF37] font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Monto en Dólares (USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-mono text-xs">U$S</span>
                    <input
                      type="number"
                      required
                      min={0}
                      step="any"
                      placeholder="0"
                      value={formAmountUsd}
                      onChange={(e) => handleUsdChange(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 pl-10 pr-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Monto en Pesos (ARS)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-mono text-xs">$</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={formAmountArs}
                      onChange={(e) => handleArsChange(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 pl-8 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    T/C Estimado (1 USD =)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formExchangeRate}
                    onChange={(e) => setFormExchangeRate(Number(e.target.value))}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Fecha, Medio de Pago y Estado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/70 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Fecha del Gasto *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-white/70 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Medio de Pago *
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    required
                    className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Estado de Pago *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    required
                    className={`w-full border px-3 py-2 text-xs font-bold focus:outline-none ${
                      formStatus === 'Pagado'
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/40'
                        : 'bg-amber-950/30 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    <option value="Pagado">Pagado / Cancelado</option>
                    <option value="Pendiente">Pendiente de Pago</option>
                  </select>
                </div>
              </div>

              {/* Proveedor y Nº de Comprobante */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Proveedor / Taller / Prestador
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Taller San Cayetano, YPF, Gestoría..."
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-white/70 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Nº de Factura / Recibo / Comprobante
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: A-0001-00049283"
                    value={formReceiptNumber}
                    onChange={(e) => setFormReceiptNumber(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Notas Adicionales */}
              <div>
                <label className="block text-white/70 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                  Observaciones / Notas
                </label>
                <textarea
                  rows={2}
                  placeholder="Información adicional sobre el trabajo o condiciones..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-white/10 text-white/70 hover:text-white uppercase font-bold text-xs tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold uppercase text-xs tracking-wider transition-colors shadow-lg"
                >
                  {editingExpense ? 'Actualizar Gasto' : 'Guardar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
