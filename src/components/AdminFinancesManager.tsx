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
  'Efectivo ARS',
  'Transferencia Bancaria',
  'Efectivo USD',
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

  // Reference Exchange rate (ARS per 1 USD) - customizable and persisted in localStorage
  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const saved = localStorage.getItem('blackswan_finance_exchange_rate');
    return saved ? Number(saved) || 1350 : 1350;
  });

  const handleExchangeRateChange = (val: number) => {
    const validVal = Math.max(1, val);
    setExchangeRate(validVal);
    localStorage.setItem('blackswan_finance_exchange_rate', String(validVal));
  };

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

  // Modal state for Confirm Delete Expense
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  // Form states (Default to ARS as primary currency)
  const [formConcept, setFormConcept] = useState('');
  const [formType, setFormType] = useState<ExpenseType>('Directo de Vehículo');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Taller Mecánico & Mantenimiento');
  const [formCarId, setFormCarId] = useState<string>('');
  const [formAmountArs, setFormAmountArs] = useState<number | ''>('');
  const [formAmountUsd, setFormAmountUsd] = useState<number | ''>('');
  const [formExchangeRate, setFormExchangeRate] = useState<number>(exchangeRate);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<ExpensePaymentMethod>('Efectivo ARS');
  const [formStatus, setFormStatus] = useState<ExpenseStatus>('Pagado');
  const [formSupplier, setFormSupplier] = useState('');
  const [formReceiptNumber, setFormReceiptNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formImpactCarExpenses, setFormImpactCarExpenses] = useState(true);

  // Helpers format
  const formatArs = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatUsd = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Helper to normalize an expense into both ARS (primary) and USD (secondary)
  const getExpenseAmounts = (e: Expense) => {
    const rate = e.exchangeRate || exchangeRate || 1350;
    let ars = typeof e.amountArs === 'number' && e.amountArs > 0 ? e.amountArs : 0;
    let usd = typeof e.amountUsd === 'number' && e.amountUsd > 0 ? e.amountUsd : 0;

    if (ars > 0 && usd <= 0) {
      usd = Math.round(ars / rate);
    } else if (usd > 0 && ars <= 0) {
      ars = Math.round(usd * rate);
    }
    return { ars, usd };
  };

  // Helper to calculate financials for a car in both ARS and USD
  const getCarFinancials = (c: Car) => {
    const rate = exchangeRate || 1350;

    const purchaseBaseUsd = c.purchasePriceUsd || 0;
    const purchaseBaseArs = purchaseBaseUsd * rate;

    const directExpensesUsd = c.purchaseExpensesUsd || 0;
    const directExpensesArs = directExpensesUsd * rate;

    const totalCostUsd = purchaseBaseUsd + directExpensesUsd;
    const totalCostArs = purchaseBaseArs + directExpensesArs;

    const salePriceArs = c.priceArs || ((c.priceUsd || 0) * rate);
    const salePriceUsd = c.priceUsd || (c.priceArs ? Math.round(c.priceArs / rate) : 0);

    const profitUsd = salePriceUsd - totalCostUsd;
    const profitArs = salePriceArs - totalCostArs;
    const roiPercent = totalCostUsd > 0 ? (profitUsd / totalCostUsd) * 100 : 0;

    return {
      purchaseBaseUsd,
      purchaseBaseArs,
      directExpensesUsd,
      directExpensesArs,
      totalCostUsd,
      totalCostArs,
      salePriceUsd,
      salePriceArs,
      profitUsd,
      profitArs,
      roiPercent
    };
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

  // Aggregate stock financial figures
  const stockTotals = useMemo(() => {
    let saleArs = 0;
    let saleUsd = 0;
    let costArs = 0;
    let costUsd = 0;
    let purchaseBaseArs = 0;
    let purchaseBaseUsd = 0;
    let directExpensesArs = 0;
    let directExpensesUsd = 0;

    activeStockCars.forEach((c) => {
      const f = getCarFinancials(c);
      saleArs += f.salePriceArs;
      saleUsd += f.salePriceUsd;
      costArs += f.totalCostArs;
      costUsd += f.totalCostUsd;
      purchaseBaseArs += f.purchaseBaseArs;
      purchaseBaseUsd += f.purchaseBaseUsd;
      directExpensesArs += f.directExpensesArs;
      directExpensesUsd += f.directExpensesUsd;
    });

    const grossProfitArs = saleArs - costArs;
    const grossProfitUsd = saleUsd - costUsd;
    const grossMarginPercent = costUsd > 0 ? (grossProfitUsd / costUsd) * 100 : 0;

    return {
      saleArs,
      saleUsd,
      costArs,
      costUsd,
      purchaseBaseArs,
      purchaseBaseUsd,
      directExpensesArs,
      directExpensesUsd,
      grossProfitArs,
      grossProfitUsd,
      grossMarginPercent
    };
  }, [activeStockCars, exchangeRate]);

  // -----------------------------------------------------------------
  // FINANCIAL CALCULATIONS: EXPENSES
  // -----------------------------------------------------------------
  const expensesTotals = useMemo(() => {
    let totalArs = 0;
    let totalUsd = 0;
    let directArs = 0;
    let directUsd = 0;
    let operatingArs = 0;
    let operatingUsd = 0;
    let paidArs = 0;
    let paidUsd = 0;
    let pendingArs = 0;
    let pendingUsd = 0;

    expenses.forEach((e) => {
      const { ars, usd } = getExpenseAmounts(e);
      totalArs += ars;
      totalUsd += usd;

      if (e.type === 'Directo de Vehículo') {
        directArs += ars;
        directUsd += usd;
      } else {
        operatingArs += ars;
        operatingUsd += usd;
      }

      if (e.status === 'Pagado') {
        paidArs += ars;
        paidUsd += usd;
      } else {
        pendingArs += ars;
        pendingUsd += usd;
      }
    });

    const netBalanceArs = stockTotals.grossProfitArs - operatingArs;
    const netBalanceUsd = stockTotals.grossProfitUsd - operatingUsd;

    return {
      totalArs,
      totalUsd,
      directArs,
      directUsd,
      operatingArs,
      operatingUsd,
      paidArs,
      paidUsd,
      pendingArs,
      pendingUsd,
      netBalanceArs,
      netBalanceUsd
    };
  }, [expenses, stockTotals, exchangeRate]);

  const pendingExpensesCount = useMemo(() => {
    return expenses.filter((e) => e.status === 'Pendiente').length;
  }, [expenses]);

  // Breakdown by Category (ARS primary, USD secondary)
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalArs: number; totalUsd: number; type: ExpenseType }> = {};

    expenses.forEach((e) => {
      const cat = e.category || 'Otro Gasto';
      const { ars, usd } = getExpenseAmounts(e);
      if (!map[cat]) {
        map[cat] = { count: 0, totalArs: 0, totalUsd: 0, type: e.type };
      }
      map[cat].count++;
      map[cat].totalArs += ars;
      map[cat].totalUsd += usd;
    });

    return Object.entries(map)
      .map(([category, data]) => ({
        category,
        count: data.count,
        totalArs: data.totalArs,
        totalUsd: data.totalUsd,
        type: data.type,
        percentage: expensesTotals.totalArs > 0 ? (data.totalArs / expensesTotals.totalArs) * 100 : 0
      }))
      .sort((a, b) => b.totalArs - a.totalArs);
  }, [expenses, expensesTotals.totalArs, exchangeRate]);

  // Breakdown by Payment Method (ARS primary, USD secondary)
  const paymentMethodBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalArs: number; totalUsd: number }> = {};

    expenses.forEach((e) => {
      const pm = e.paymentMethod || 'Otro';
      const { ars, usd } = getExpenseAmounts(e);
      if (!map[pm]) {
        map[pm] = { count: 0, totalArs: 0, totalUsd: 0 };
      }
      map[pm].count++;
      map[pm].totalArs += ars;
      map[pm].totalUsd += usd;
    });

    return Object.entries(map)
      .map(([method, data]) => ({
        method,
        count: data.count,
        totalArs: data.totalArs,
        totalUsd: data.totalUsd,
        percentage: expensesTotals.totalArs > 0 ? (data.totalArs / expensesTotals.totalArs) * 100 : 0
      }))
      .sort((a, b) => b.totalArs - a.totalArs);
  }, [expenses, expensesTotals.totalArs, exchangeRate]);

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
      const matchesSearch = !searchQuery.trim() ||
        e.concept.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.supplier && e.supplier.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.receiptNumber && e.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.carTitle && e.carTitle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = typeFilter === 'TODOS' || e.type === typeFilter;
      const matchesCategory = categoryFilter === 'TODAS' || e.category === categoryFilter;
      const matchesStatus = statusFilter === 'TODOS' || e.status === statusFilter;
      const matchesCar = selectedCarFilter === 'TODOS' || e.carId === selectedCarFilter;

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

  // Totals for the filtered list of expenses
  const filteredExpensesTotals = useMemo(() => {
    let ars = 0;
    let usd = 0;
    filteredExpenses.forEach((e) => {
      const a = getExpenseAmounts(e);
      ars += a.ars;
      usd += a.usd;
    });
    return { ars, usd };
  }, [filteredExpenses, exchangeRate]);

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
      const aF = getCarFinancials(a);
      const bF = getCarFinancials(b);

      if (stockSortBy === 'profit-desc') return bF.profitArs - aF.profitArs;
      if (stockSortBy === 'cost-desc') return bF.totalCostArs - aF.totalCostArs;
      if (stockSortBy === 'price-desc') return bF.salePriceArs - aF.salePriceArs;
      if (stockSortBy === 'roi-desc') return bF.roiPercent - aF.roiPercent;
      return 0;
    });
  }, [cars, stockSearch, stockStatusFilter, stockBrandFilter, stockSortBy, exchangeRate]);

  // Totals for the filtered list of cars
  const filteredStockTotals = useMemo(() => {
    let costArs = 0;
    let costUsd = 0;
    let saleArs = 0;
    let saleUsd = 0;
    let profitArs = 0;
    let profitUsd = 0;

    filteredStockCars.forEach((c) => {
      const f = getCarFinancials(c);
      costArs += f.totalCostArs;
      costUsd += f.totalCostUsd;
      saleArs += f.salePriceArs;
      saleUsd += f.salePriceUsd;
      profitArs += f.profitArs;
      profitUsd += f.profitUsd;
    });

    return { costArs, costUsd, saleArs, saleUsd, profitArs, profitUsd };
  }, [filteredStockCars, exchangeRate]);

  // -----------------------------------------------------------------
  // MODAL HANDLERS FOR EXPENSE (DEFAULT ARS)
  // -----------------------------------------------------------------
  const openAddExpenseModal = (preselectedCarId?: string) => {
    setEditingExpense(null);
    setFormConcept('');
    setFormType(preselectedCarId ? 'Directo de Vehículo' : 'Directo de Vehículo');
    setFormCategory('Taller Mecánico & Mantenimiento');
    setFormCarId(preselectedCarId || (cars[0]?.id || ''));
    setFormAmountArs('');
    setFormAmountUsd('');
    setFormExchangeRate(exchangeRate);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('Efectivo ARS');
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

    const rate = expense.exchangeRate || exchangeRate || 1350;
    setFormExchangeRate(rate);

    const { ars, usd } = getExpenseAmounts(expense);
    setFormAmountArs(ars > 0 ? ars : '');
    setFormAmountUsd(usd > 0 ? usd : '');

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
    const arsVal = Number(formAmountArs) || 0;
    let usdVal = Number(formAmountUsd) || 0;
    const rate = formExchangeRate || exchangeRate || 1350;

    // Automatic bidirectional fallback
    if (arsVal > 0 && usdVal <= 0) {
      usdVal = Math.round(arsVal / rate);
    } else if (usdVal > 0 && arsVal <= 0) {
      // computed below
    }

    const finalArs = arsVal > 0 ? arsVal : Math.round(usdVal * rate);
    const finalUsd = usdVal > 0 ? usdVal : Math.round(arsVal / rate);

    if (finalArs <= 0 && finalUsd <= 0) {
      alert('Por favor ingrese un monto válido mayor a 0 en Pesos Argentinos (ARS) o USD.');
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
        amountArs: finalArs,
        amountUsd: finalUsd,
        exchangeRate: rate,
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
        amountArs: finalArs,
        amountUsd: finalUsd,
        exchangeRate: rate,
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

  const handleDeleteExpense = (expense: Expense) => {
    setExpenseToDelete(expense);
  };

  const handleConfirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setIsDeletingExpense(true);
    try {
      await storage.deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
      onExpensesChanged();
    } catch (err) {
      console.error('Error al eliminar gasto:', err);
    } finally {
      setIsDeletingExpense(false);
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

  // Convert ARS (Primary) to USD (Secondary) or vice versa in modal
  const handleArsChange = (valStr: string) => {
    if (!valStr) {
      setFormAmountArs('');
      setFormAmountUsd('');
      return;
    }
    const ars = Number(valStr);
    setFormAmountArs(ars);
    const rate = formExchangeRate || exchangeRate || 1350;
    if (rate > 0) {
      setFormAmountUsd(Math.round(ars / rate));
    }
  };

  const handleUsdChange = (valStr: string) => {
    if (!valStr) {
      setFormAmountUsd('');
      return;
    }
    const usd = Number(valStr);
    setFormAmountUsd(usd);
    const rate = formExchangeRate || exchangeRate || 1350;
    if (rate > 0) {
      setFormAmountArs(Math.round(usd * rate));
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
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-serif text-white flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
              <span>Finanzas & Control de Gastos</span>
            </h2>
            <span className="px-2 py-0.5 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-bold uppercase tracking-wider">
              ARS ($) Predeterminado
            </span>
          </div>
          <p className="text-xs text-white/50">
            Moneda principal: <strong className="text-white">Pesos Argentinos (ARS)</strong> · Moneda secundaria: <strong className="text-white/70">Dólares (USD)</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Reference exchange rate controller */}
          <div className="flex items-center gap-1.5 bg-[#0a0a0a] border border-white/10 px-2.5 py-1 text-xs">
            <span className="text-[10px] uppercase font-mono text-white/50">T/C Ref: 1 USD =</span>
            <div className="relative flex items-center">
              <span className="text-[11px] text-[#D4AF37] font-mono mr-0.5">$</span>
              <input
                type="number"
                min={1}
                value={exchangeRate}
                onChange={(e) => handleExchangeRateChange(Number(e.target.value))}
                className="w-16 bg-[#050505] border border-white/10 px-1.5 py-0.5 text-xs font-mono text-[#D4AF37] font-bold text-center focus:outline-none focus:border-[#D4AF37]"
                title="Tipo de cambio de referencia (ARS por USD)"
              />
            </div>
          </div>

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
          <div className="text-base font-serif font-bold text-white truncate" title={formatArs(stockTotals.costArs)}>
            {formatArs(stockTotals.costArs)}
          </div>
          <div className="text-[10px] text-white/50 font-mono mt-0.5 truncate">
            {formatUsd(stockTotals.costUsd)} · {activeStockCars.length} autos
          </div>
        </div>

        {/* Valor Venta Proyectada */}
        <div className="bg-[#0a0a0a] border border-white/10 p-3.5">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Venta Proyectada</span>
            <DollarSign className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-base font-serif font-bold text-white truncate" title={formatArs(stockTotals.saleArs)}>
            {formatArs(stockTotals.saleArs)}
          </div>
          <div className="text-[10px] text-blue-400/80 font-mono mt-0.5 truncate">
            {formatUsd(stockTotals.saleUsd)} · Lista activa
          </div>
        </div>

        {/* Margen Bruto de Stock */}
        <div className="bg-[#0a0a0a] border border-white/10 p-3.5">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Margen Bruto Flota</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-serif font-bold text-emerald-400 truncate" title={`+${formatArs(stockTotals.grossProfitArs)}`}>
            +{formatArs(stockTotals.grossProfitArs)}
          </div>
          <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5 truncate">
            +{formatUsd(stockTotals.grossProfitUsd)} · ROI +{stockTotals.grossMarginPercent.toFixed(1)}%
          </div>
        </div>

        {/* Total Gastos Registrados */}
        <div className="bg-[#0a0a0a] border border-white/10 p-3.5">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Gastos</span>
            <Receipt className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-base font-serif font-bold text-white truncate" title={formatArs(expensesTotals.totalArs)}>
            {formatArs(expensesTotals.totalArs)}
          </div>
          <div className="text-[10px] text-white/50 font-mono mt-0.5 truncate">
            {formatUsd(expensesTotals.totalUsd)} · Directos: {formatArs(expensesTotals.directArs)}
          </div>
        </div>

        {/* Gastos Operativos Concesionario */}
        <div className="bg-[#0a0a0a] border border-white/10 p-3.5">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Gastos Operativos</span>
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base font-serif font-bold text-white truncate" title={formatArs(expensesTotals.operatingArs)}>
            {formatArs(expensesTotals.operatingArs)}
          </div>
          <div className="text-[10px] text-white/50 font-mono mt-0.5 truncate">
            {formatUsd(expensesTotals.operatingUsd)} · Agencia/Fijos
          </div>
        </div>

        {/* Balance Neto Proyectado */}
        <div className="bg-[#0a0a0a] border border-white/10 p-3.5">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Resultado Neto Est.</span>
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div className={`text-base font-serif font-bold truncate ${expensesTotals.netBalanceArs >= 0 ? 'text-[#D4AF37]' : 'text-rose-400'}`} title={formatArs(expensesTotals.netBalanceArs)}>
            {formatArs(expensesTotals.netBalanceArs)}
          </div>
          <div className="text-[10px] text-white/50 font-mono mt-0.5 truncate">
            {formatUsd(expensesTotals.netBalanceUsd)} · {pendingExpensesCount > 0 ? (
              <span className="text-amber-400">{pendingExpensesCount} pendientes</span>
            ) : (
              <span>Al día</span>
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
                  <div className="text-right font-mono">
                    <span className="text-white font-bold block">+{formatArs(stockTotals.saleArs)}</span>
                    <span className="text-white/40 text-[10px] block">+{formatUsd(stockTotals.saleUsd)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/5 text-rose-300">
                  <span className="text-white/70">(-) Costo Base de Adquisición de Autos</span>
                  <div className="text-right font-mono">
                    <span className="font-bold block">-{formatArs(stockTotals.purchaseBaseArs)}</span>
                    <span className="text-rose-400/60 text-[10px] block">-{formatUsd(stockTotals.purchaseBaseUsd)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/5 text-rose-300">
                  <span className="text-white/70">(-) Gastos Directos en Autos (Taller/Chapa/Flete)</span>
                  <div className="text-right font-mono">
                    <span className="font-bold block">-{formatArs(stockTotals.directExpensesArs)}</span>
                    <span className="text-rose-400/60 text-[10px] block">-{formatUsd(stockTotals.directExpensesUsd)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 bg-white/[0.02] px-2 border-y border-white/10 font-serif">
                  <span className="text-white font-bold">(=) Margen Bruto de Intermediación</span>
                  <div className="text-right font-mono">
                    <span className="font-bold text-emerald-400 block">+{formatArs(stockTotals.grossProfitArs)}</span>
                    <span className="text-emerald-400/60 text-[10px] block">+{formatUsd(stockTotals.grossProfitUsd)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-white/5 text-amber-300">
                  <span className="text-white/70">(-) Gastos Operativos / Fijos de Agencia</span>
                  <div className="text-right font-mono">
                    <span className="font-bold block">-{formatArs(expensesTotals.operatingArs)}</span>
                    <span className="text-amber-400/60 text-[10px] block">-{formatUsd(expensesTotals.operatingUsd)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2.5 bg-[#D4AF37]/10 px-3 border border-[#D4AF37]/30 text-sm font-serif">
                  <span className="text-white font-bold">(=) Rendimiento Neto Proyectado</span>
                  <div className="text-right font-mono">
                    <span className="font-bold text-[#D4AF37] block">{formatArs(expensesTotals.netBalanceArs)}</span>
                    <span className="text-[#D4AF37]/70 text-[10px] block">{formatUsd(expensesTotals.netBalanceUsd)}</span>
                  </div>
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
                        <span className="text-white truncate max-w-[180px]" title={item.category}>
                          {item.category}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-right">
                          <span className="text-white/40 text-[10px]">({item.count})</span>
                          <span className="text-white font-bold">{formatArs(item.totalArs)}</span>
                          <span className="text-white/40 text-[10px]">({formatUsd(item.totalUsd)})</span>
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
                    <span className="text-white/60">Directos: {formatArs(expensesTotals.directArs)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-white/60">Operativos: {formatArs(expensesTotals.operatingArs)}</span>
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
                  <div className="text-base font-serif font-bold text-white truncate" title={formatArs(expensesTotals.paidArs)}>
                    {formatArs(expensesTotals.paidArs)}
                  </div>
                  <div className="text-[10px] text-white/50 font-mono mt-0.5 truncate">
                    {formatUsd(expensesTotals.paidUsd)} · {expenses.filter((e) => e.status === 'Pagado').length} comp.
                  </div>
                </div>

                <div className={`bg-[#050505] p-3 border ${pendingExpensesCount > 0 ? 'border-amber-500/40 bg-amber-500/[0.02]' : 'border-white/10'}`}>
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pendiente de Pago</span>
                  </div>
                  <div className="text-base font-serif font-bold text-amber-400 truncate" title={formatArs(expensesTotals.pendingArs)}>
                    {formatArs(expensesTotals.pendingArs)}
                  </div>
                  <div className="text-[10px] text-amber-400/80 font-mono mt-0.5 truncate">
                    {formatUsd(expensesTotals.pendingUsd)} · {pendingExpensesCount} fac.
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
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-white/40 text-[10px]">({pm.count})</span>
                        <span className="text-white font-bold">{formatArs(pm.totalArs)}</span>
                        <span className="text-white/40 text-[10px]">({formatUsd(pm.totalUsd)})</span>
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
                    <th className="p-3.5">Monto (ARS / USD)</th>
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

                      {/* Monto (ARS Primary / USD Secondary) */}
                      <td className="p-3.5 whitespace-nowrap font-mono">
                        {(() => {
                          const { ars, usd } = getExpenseAmounts(exp);
                          return (
                            <div>
                              <span className="text-white font-bold block text-sm">
                                {formatArs(ars)}
                              </span>
                              <span className="text-[10px] text-white/40 block">
                                {formatUsd(usd)}
                              </span>
                            </div>
                          );
                        })()}
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
                            onClick={() => handleDeleteExpense(exp)}
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
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-white/70">
                    Total Filtrado:{' '}
                    <strong className="text-[#D4AF37] text-sm">
                      {formatArs(
                        filteredExpenses.reduce((acc, e) => acc + getExpenseAmounts(e).ars, 0)
                      )}
                    </strong>
                    <span className="text-white/40 text-xs ml-1.5">
                      ({formatUsd(
                        filteredExpenses.reduce((acc, e) => acc + getExpenseAmounts(e).usd, 0)
                      )})
                    </span>
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
                    const f = getCarFinancials(car);
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

                        {/* Precio Compra (ARS Primary / USD Secondary) */}
                        <td className="p-3.5 whitespace-nowrap font-mono">
                          {f.purchaseBaseArs > 0 ? (
                            <div>
                              <span className="text-white/90 font-bold block">{formatArs(f.purchaseBaseArs)}</span>
                              <span className="text-[10px] text-white/40 block">{formatUsd(f.purchaseBaseUsd)}</span>
                            </div>
                          ) : (
                            <span className="text-white/30 text-[11px] italic">Sin registrar</span>
                          )}
                        </td>

                        {/* Gastos Asignados (ARS Primary / USD Secondary) */}
                        <td className="p-3.5 whitespace-nowrap font-mono">
                          <div>
                            <span className="text-white/90 font-bold block">{formatArs(f.directExpensesArs)}</span>
                            <span className="text-[10px] text-white/40 block">{formatUsd(f.directExpensesUsd)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleViewCarExpenses(car.id)}
                            className="text-[10px] text-[#D4AF37] hover:underline block font-sans mt-0.5"
                          >
                            {carExpenseCount > 0 ? `${carExpenseCount} gastos cargados` : 'Ver / Cargar gastos'}
                          </button>
                        </td>

                        {/* Costo Total (ARS Primary / USD Secondary) */}
                        <td className="p-3.5 whitespace-nowrap font-mono">
                          {f.totalCostArs > 0 ? (
                            <div>
                              <span className="text-white font-bold block">{formatArs(f.totalCostArs)}</span>
                              <span className="text-[10px] text-white/50 block">{formatUsd(f.totalCostUsd)}</span>
                            </div>
                          ) : (
                            <span className="text-white/30 text-[11px] font-normal italic">S/D</span>
                          )}
                        </td>

                        {/* Precio Venta (ARS Primary / USD Secondary) */}
                        <td className="p-3.5 whitespace-nowrap font-mono font-bold">
                          {f.salePriceArs > 0 ? (
                            <div>
                              <span className="text-blue-400 block">{formatArs(f.salePriceArs)}</span>
                              <span className="text-[10px] text-blue-400/60 block">{formatUsd(f.salePriceUsd)}</span>
                            </div>
                          ) : (
                            <span className="text-white/40 text-xs">A Consultar</span>
                          )}
                        </td>

                        {/* Margen Est. (ARS Primary / USD Secondary) */}
                        <td className="p-3.5 whitespace-nowrap font-mono">
                          {f.totalCostArs > 0 && f.salePriceArs > 0 ? (
                            <div>
                              <span className={`font-bold block ${f.profitArs >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {f.profitArs >= 0 ? '+' : ''}{formatArs(f.profitArs)}
                              </span>
                              <span className="text-[10px] text-white/40 block">
                                {f.profitUsd >= 0 ? '+' : ''}{formatUsd(f.profitUsd)} · {f.roiPercent.toFixed(1)}% ROI
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

            {/* Table Footer / Summary */}
            {filteredStockCars.length > 0 && (
              <div className="bg-[#050505] p-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-white/50">
                  Mostrando <strong className="text-white">{filteredStockCars.length}</strong> de <strong className="text-white">{cars.length}</strong> vehículos
                </span>
                <div className="flex flex-wrap items-center gap-4 font-mono">
                  {(() => {
                    const sumInversionArs = filteredStockCars.reduce((acc, c) => acc + getCarFinancials(c).totalCostArs, 0);
                    const sumInversionUsd = filteredStockCars.reduce((acc, c) => acc + getCarFinancials(c).totalCostUsd, 0);
                    const sumVentaArs = filteredStockCars.reduce((acc, c) => acc + getCarFinancials(c).salePriceArs, 0);
                    const sumVentaUsd = filteredStockCars.reduce((acc, c) => acc + getCarFinancials(c).salePriceUsd, 0);
                    const sumMargenArs = sumVentaArs - sumInversionArs;
                    const sumMargenUsd = sumVentaUsd - sumInversionUsd;
                    return (
                      <>
                        <span className="text-white/70">
                          Inversión: <strong className="text-white font-bold">{formatArs(sumInversionArs)}</strong> <span className="text-white/40 text-[11px]">({formatUsd(sumInversionUsd)})</span>
                        </span>
                        <span className="text-white/70">
                          Venta: <strong className="text-blue-400 font-bold">{formatArs(sumVentaArs)}</strong> <span className="text-white/40 text-[11px]">({formatUsd(sumVentaUsd)})</span>
                        </span>
                        <span className="text-white/70">
                          Margen: <strong className="text-emerald-400 font-bold">+{formatArs(sumMargenArs)}</strong> <span className="text-emerald-400/60 text-[11px]">(+{formatUsd(sumMargenUsd)})</span>
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
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

              {/* Montos y Tipo de Cambio - ARS Predeterminado / USD Secundario */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#050505] p-3.5 border border-white/5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[#D4AF37] font-bold uppercase tracking-wider text-[10px]">
                      Monto en Pesos (ARS) *
                    </label>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#D4AF37]/90 bg-[#D4AF37]/10 px-1.5 py-0.5 border border-[#D4AF37]/30">
                      Predeterminado
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-mono text-xs font-bold">$</span>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="0"
                      value={formAmountArs}
                      onChange={(e) => handleArsChange(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#D4AF37]/40 pl-8 pr-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                    Equivalente en Dólares (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-mono text-xs">U$S</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      placeholder="0"
                      value={formAmountUsd}
                      onChange={(e) => handleUsdChange(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 pl-10 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
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

      {/* ========================================================= */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE GASTO                     */}
      {/* ========================================================= */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-rose-500/30 p-6 sm:p-7 w-full max-w-md space-y-5 shadow-2xl relative text-left">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif text-white font-bold">
                    Eliminar Gasto
                  </h3>
                  <p className="text-[11px] text-white/50">
                    Confirmación de baja en el libro contable
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#050505] border border-white/10 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-white/60">
                <span>Concepto:</span>
                <strong className="text-white font-serif">{expenseToDelete.concept}</strong>
              </div>
              <div className="flex items-center justify-between text-white/60">
                <span>Categoría:</span>
                <span className="text-white/80">{expenseToDelete.category}</span>
              </div>
              <div className="flex items-center justify-between text-white/60">
                <span>Fecha:</span>
                <span className="text-white/80 font-mono">{expenseToDelete.date}</span>
              </div>
              <div className="flex items-center justify-between text-white/60 pt-2 border-t border-white/10">
                <span>Importe:</span>
                <div className="text-right">
                  <strong className="text-rose-400 font-mono text-sm block">
                    {formatArs(getExpenseAmounts(expenseToDelete).ars)}
                  </strong>
                  <span className="text-[10px] text-white/40 font-mono">
                    ({formatUsd(getExpenseAmounts(expenseToDelete).usd)})
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              ¿Confirmás que deseas eliminar este gasto de forma definitiva? Se actualizarán los balances contables y métricas financieras de inmediato.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingExpense}
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 border border-white/10 text-white/70 hover:text-white uppercase font-bold text-xs tracking-wider transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingExpense}
                onClick={handleConfirmDeleteExpense}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase text-xs tracking-wider transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                {isDeletingExpense ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Gasto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
