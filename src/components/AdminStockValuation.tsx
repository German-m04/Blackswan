import React, { useState, useMemo } from 'react';
import { Car, VehicleStatus } from '../types';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Layers, 
  Search, 
  Download, 
  Copy, 
  Check, 
  Edit3, 
  MapPin, 
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Wallet,
  Percent,
  PlusCircle,
  HelpCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Handshake,
  CarFront
} from 'lucide-react';
import { exportToCsv } from '../utils/imageUtils';

interface AdminStockValuationProps {
  cars: Car[];
  onEditCar: (car: Car) => void;
}

export const AdminStockValuation: React.FC<AdminStockValuationProps> = ({
  cars,
  onEditCar
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | VehicleStatus>('TODOS');
  const [brandFilter, setBrandFilter] = useState<string>('TODAS');
  const [costFilter, setCostFilter] = useState<'ALL' | 'WITH_COST' | 'MISSING_COST'>('ALL');
  const [originFilter, setOriginFilter] = useState<'ALL' | 'OWN' | 'CONSIGNMENT'>('ALL');
  const [sortBy, setSortBy] = useState<
    'profit-desc' | 'profit-asc' | 'roi-desc' | 'purchase-desc' | 'price-desc' | 'price-asc' | 'year-desc' | 'km-asc'
  >('profit-desc');
  const [copiedSummary, setCopiedSummary] = useState(false);

  const formatPriceUsd = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatPriceArs = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Extract unique brands present in current fleet
  const availableBrands = useMemo(() => {
    const brands = Array.from(new Set(cars.map((c) => c.brand))).filter(Boolean);
    return brands.sort();
  }, [cars]);

  // Overall Fleet Segmentation
  const activeStockCars = useMemo(() => {
    return cars.filter((c) => c.status === 'Disponible' || c.status === 'Reservado');
  }, [cars]);

  const availableCars = useMemo(() => {
    return cars.filter((c) => c.status === 'Disponible');
  }, [cars]);

  const reservedCars = useMemo(() => {
    return cars.filter((c) => c.status === 'Reservado');
  }, [cars]);

  const soldCars = useMemo(() => {
    return cars.filter((c) => c.status === 'Vendido');
  }, [cars]);

  // Selling Values (Active Stock)
  const totalStockUsd = useMemo(() => {
    return activeStockCars.reduce((acc, c) => acc + (c.priceUsd || 0), 0);
  }, [activeStockCars]);

  const totalStockArs = useMemo(() => {
    return activeStockCars.reduce((acc, c) => acc + (c.priceArs || (c.priceUsd || 0) * 1350), 0);
  }, [activeStockCars]);

  const availableStockUsd = useMemo(() => {
    return availableCars.reduce((acc, c) => acc + (c.priceUsd || 0), 0);
  }, [availableCars]);

  const reservedStockUsd = useMemo(() => {
    return reservedCars.reduce((acc, c) => acc + (c.priceUsd || 0), 0);
  }, [reservedCars]);

  const soldStockUsd = useMemo(() => {
    return soldCars.reduce((acc, c) => acc + (c.priceUsd || 0), 0);
  }, [soldCars]);

  // -----------------------------------------------------------------
  // Purchase & Yield / Profitability Calculations (Active Stock)
  // -----------------------------------------------------------------
  const activeCarsWithPurchase = useMemo(() => {
    return activeStockCars.filter((c) => typeof c.purchasePriceUsd === 'number' && c.purchasePriceUsd > 0);
  }, [activeStockCars]);

  const activeCarsMissingPurchase = useMemo(() => {
    return activeStockCars.filter((c) => !c.purchasePriceUsd || c.purchasePriceUsd <= 0);
  }, [activeStockCars]);

  // Total investment cost in active stock (Purchase price + Expenses)
  const totalPurchaseCostActiveUsd = useMemo(() => {
    return activeStockCars.reduce((acc, c) => acc + (c.purchasePriceUsd || 0) + (c.purchaseExpensesUsd || 0), 0);
  }, [activeStockCars]);

  const totalPurchaseBaseActiveUsd = useMemo(() => {
    return activeStockCars.reduce((acc, c) => acc + (c.purchasePriceUsd || 0), 0);
  }, [activeStockCars]);

  const totalPurchaseExpensesActiveUsd = useMemo(() => {
    return activeStockCars.reduce((acc, c) => acc + (c.purchaseExpensesUsd || 0), 0);
  }, [activeStockCars]);

  // Projected profit on units where purchase price has been recorded
  const projectedProfitActiveUsd = useMemo(() => {
    return activeCarsWithPurchase.reduce((acc, c) => {
      const totalCost = (c.purchasePriceUsd || 0) + (c.purchaseExpensesUsd || 0);
      const salePrice = c.priceUsd || 0;
      return acc + (salePrice - totalCost);
    }, 0);
  }, [activeCarsWithPurchase]);

  // Cost basis of priced units
  const costOfPricedActiveUnits = useMemo(() => {
    return activeCarsWithPurchase.reduce((acc, c) => acc + (c.purchasePriceUsd || 0) + (c.purchaseExpensesUsd || 0), 0);
  }, [activeCarsWithPurchase]);

  // Margin / ROI % across active fleet
  const projectedMarginPercent = useMemo(() => {
    if (costOfPricedActiveUnits <= 0) return 0;
    return (projectedProfitActiveUsd / costOfPricedActiveUnits) * 100;
  }, [projectedProfitActiveUsd, costOfPricedActiveUnits]);

  // -----------------------------------------------------------------
  // Realized Profitability on Sold Units
  // -----------------------------------------------------------------
  const soldCarsWithPurchase = useMemo(() => {
    return soldCars.filter((c) => typeof c.purchasePriceUsd === 'number' && c.purchasePriceUsd > 0);
  }, [soldCars]);

  const realizedProfitSoldUsd = useMemo(() => {
    return soldCarsWithPurchase.reduce((acc, c) => {
      const totalCost = (c.purchasePriceUsd || 0) + (c.purchaseExpensesUsd || 0);
      const salePrice = c.priceUsd || 0;
      return acc + (salePrice - totalCost);
    }, 0);
  }, [soldCarsWithPurchase]);

  const costOfSoldPricedUnits = useMemo(() => {
    return soldCarsWithPurchase.reduce((acc, c) => acc + (c.purchasePriceUsd || 0) + (c.purchaseExpensesUsd || 0), 0);
  }, [soldCarsWithPurchase]);

  const realizedMarginSoldPercent = useMemo(() => {
    if (costOfSoldPricedUnits <= 0) return 0;
    return (realizedProfitSoldUsd / costOfSoldPricedUnits) * 100;
  }, [realizedProfitSoldUsd, costOfSoldPricedUnits]);

  // Priced units average (excluding unpriced / on-demand units with price 0)
  const pricedActiveCars = useMemo(() => {
    return activeStockCars.filter((c) => (c.priceUsd || 0) > 0);
  }, [activeStockCars]);

  const averagePriceUsd = useMemo(() => {
    if (pricedActiveCars.length === 0) return 0;
    return totalStockUsd / pricedActiveCars.length;
  }, [totalStockUsd, pricedActiveCars]);

  // Units without set price
  const unpricedUnits = useMemo(() => {
    return activeStockCars.filter((c) => !c.priceUsd || c.priceUsd <= 0 || c.priceOnDemand);
  }, [activeStockCars]);

  // Allocation / breakdown by Brand
  const brandAllocations = useMemo(() => {
    const map: Record<
      string, 
      { count: number; totalUsd: number; totalCostUsd: number; profitUsd: number; highestCar: Car; availableCount: number }
    > = {};

    activeStockCars.forEach((c) => {
      const b = c.brand || 'Otras';
      if (!map[b]) {
        map[b] = { count: 0, totalUsd: 0, totalCostUsd: 0, profitUsd: 0, highestCar: c, availableCount: 0 };
      }
      map[b].count++;
      const saleVal = c.priceUsd || 0;
      const costVal = (c.purchasePriceUsd || 0) + (c.purchaseExpensesUsd || 0);
      map[b].totalUsd += saleVal;
      map[b].totalCostUsd += costVal;
      if (typeof c.purchasePriceUsd === 'number' && c.purchasePriceUsd > 0) {
        map[b].profitUsd += (saleVal - costVal);
      }
      if (c.status === 'Disponible') {
        map[b].availableCount++;
      }
      if (saleVal > (map[b].highestCar.priceUsd || 0)) {
        map[b].highestCar = c;
      }
    });

    return Object.entries(map)
      .map(([brand, data]) => ({
        brand,
        count: data.count,
        availableCount: data.availableCount,
        totalUsd: data.totalUsd,
        totalCostUsd: data.totalCostUsd,
        profitUsd: data.profitUsd,
        percentage: totalStockUsd > 0 ? (data.totalUsd / totalStockUsd) * 100 : 0,
        averageUsd: data.count > 0 ? data.totalUsd / data.count : 0,
        highestCar: data.highestCar
      }))
      .sort((a, b) => b.totalUsd - a.totalUsd);
  }, [activeStockCars, totalStockUsd]);

  // Filtered & Sorted Cars for Detailed Valuation List
  const filteredCars = useMemo(() => {
    return cars.filter((c) => {
      // Search
      const searchMatch = !searchTerm.trim() || 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.licensePlate && c.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.location && c.location.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status
      const statusMatch = statusFilter === 'TODOS' || c.status === statusFilter;

      // Brand
      const brandMatch = brandFilter === 'TODAS' || c.brand === brandFilter;

      // Cost Filter
      let costMatch = true;
      const hasCost = typeof c.purchasePriceUsd === 'number' && c.purchasePriceUsd > 0;
      if (costFilter === 'WITH_COST') costMatch = hasCost;
      if (costFilter === 'MISSING_COST') costMatch = !hasCost;

      // Origin Filter
      let originMatch = true;
      if (originFilter === 'OWN') originMatch = !c.isConsignment;
      if (originFilter === 'CONSIGNMENT') originMatch = !!c.isConsignment;

      return searchMatch && statusMatch && brandMatch && costMatch && originMatch;
    }).sort((a, b) => {
      const aCost = (a.purchasePriceUsd || 0) + (a.purchaseExpensesUsd || 0);
      const bCost = (b.purchasePriceUsd || 0) + (b.purchaseExpensesUsd || 0);
      const aProfit = (a.priceUsd || 0) - aCost;
      const bProfit = (b.priceUsd || 0) - bCost;
      const aRoi = aCost > 0 ? (aProfit / aCost) * 100 : -999;
      const bRoi = bCost > 0 ? (bProfit / bCost) * 100 : -999;

      if (sortBy === 'profit-desc') return bProfit - aProfit;
      if (sortBy === 'profit-asc') return aProfit - bProfit;
      if (sortBy === 'roi-desc') return bRoi - aRoi;
      if (sortBy === 'purchase-desc') return bCost - aCost;
      if (sortBy === 'price-desc') return (b.priceUsd || 0) - (a.priceUsd || 0);
      if (sortBy === 'price-asc') return (a.priceUsd || 0) - (b.priceUsd || 0);
      if (sortBy === 'year-desc') return b.year - a.year;
      if (sortBy === 'km-asc') return a.km - b.km;
      return 0;
    });
  }, [cars, searchTerm, statusFilter, brandFilter, costFilter, sortBy]);

  // Export CSV
  const handleExportCsv = () => {
    const rows = filteredCars.map((c) => {
      const priceVal = c.priceUsd || 0;
      const purchasePrice = c.purchasePriceUsd || 0;
      const expenses = c.purchaseExpensesUsd || 0;
      const totalCost = purchasePrice + expenses;
      const profitVal = purchasePrice > 0 ? priceVal - totalCost : 'N/D';
      const roiVal = purchasePrice > 0 && totalCost > 0 ? (((priceVal - totalCost) / totalCost) * 100).toFixed(1) + '%' : 'N/D';
      const pctOfTotal = totalStockUsd > 0 ? ((priceVal / totalStockUsd) * 100).toFixed(2) + '%' : '0%';

      return {
        ID: c.id,
        Marca: c.brand,
        Modelo: c.model,
        Titulo: c.title,
        Año: c.year,
        Estado: c.status,
        Patente: c.licensePlate || 'N/D',
        Kilometraje: c.km,
        Horas_Uso: c.hours || 'N/D',
        Fecha_Compra: c.purchaseDate || 'N/D',
        Precio_Compra_USD: purchasePrice,
        Gastos_Adicionales_USD: expenses,
        Costo_Total_Invertido_USD: totalCost,
        Precio_Venta_USD: priceVal,
        Precio_Venta_ARS: c.priceArs || priceVal * 1350,
        Rendimiento_Bruto_USD: profitVal,
        Margen_ROI: roiVal,
        Porcentaje_Total_Stock: pctOfTotal,
        Ubicacion: c.locationUnit || c.location || 'Showroom Vicente López'
      };
    });

    const timestamp = new Date().toISOString().split('T')[0];
    exportToCsv(`BlackSwan_Valorizacion_Rendimiento_${timestamp}.csv`, rows);
  };

  // Copy Executive Summary
  const handleCopySummary = () => {
    const summary = `BLACK SWAN MOTORS - REPORTE EJECUTIVO DE VALORIZACIÓN Y RENDIMIENTO
Fecha: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}
----------------------------------------------------------------------
1. VALORIZACIÓN Y CAPITAL ACTIVO EN STOCK:
* Capital Total de Venta: ${formatPriceUsd(totalStockUsd)} (aprox. ${formatPriceArs(totalStockArs)})
* Capital Invertido en Compra: ${formatPriceUsd(totalPurchaseCostActiveUsd)}
  - Compra Base: ${formatPriceUsd(totalPurchaseBaseActiveUsd)}
  - Gastos Puesta a Punto: ${formatPriceUsd(totalPurchaseExpensesActiveUsd)}
* Rendimiento Proyectado en Stock: ${projectedProfitActiveUsd >= 0 ? '+' : ''}${formatPriceUsd(projectedProfitActiveUsd)}
* Margen Promedio sobre Costo (ROI): ${projectedMarginPercent.toFixed(1)}%
* Unidades Activas: ${activeStockCars.length} vehículos (${activeCarsWithPurchase.length} con costo registrado)

2. DISPONIBILIDAD Y OPERACIONES:
* Disponibles para Venta Inmediata: ${availableCars.length} unidades (${formatPriceUsd(availableStockUsd)})
* Capital Comprometido en Reservas: ${reservedCars.length} unidades (${formatPriceUsd(reservedStockUsd)})
* Rendimiento Realizado en Vendidos: ${realizedProfitSoldUsd >= 0 ? '+' : ''}${formatPriceUsd(realizedProfitSoldUsd)} (${soldCars.length} unidades vendidas)
* Ticket Promedio Venta / Auto: ${formatPriceUsd(averagePriceUsd)}

3. CONCENTRACIÓN POR MARCA:
${brandAllocations.map((b) => `- ${b.brand}: Venta ${formatPriceUsd(b.totalUsd)} | Invertido ${formatPriceUsd(b.totalCostUsd)} | Ganancia ${formatPriceUsd(b.profitUsd)} (${b.count} un.)`).join('\n')}
----------------------------------------------------------------------`;

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      {/* ------------------------------------------------------------- */}
      {/* HEADER WITH EXPORT ACTIONS                                     */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-xl sm:text-2xl font-serif text-white uppercase tracking-wider font-light">
              Valorización de Stock & Rendimiento Comercial
            </h2>
          </div>
          <p className="text-xs text-white/50">
            Control integral del costo de adquisición, precios de venta, utilidad neta proyectada y retorno de capital (ROI).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopySummary}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs uppercase tracking-wider font-medium flex items-center gap-2 transition-all active:scale-95"
            title="Copiar balance y rendimiento al portapapeles"
          >
            {copiedSummary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡Reporte Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white/60" />
                <span>Copiar Balance</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-[#D4AF37] hover:bg-[#c59f2d] text-black text-xs uppercase tracking-wider font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV Completo</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* EXECUTIVE KPI FINANCIAL CARDS: VALORIZACIÓN & RENDIMIENTO      */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Capital Invertido (Compra de Flota) */}
        <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/50 uppercase tracking-widest block font-bold">
              Capital Invertido (Compra)
            </span>
            <div className="p-1.5 rounded bg-white/5 text-[#D4AF37]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-white font-light">
            {formatPriceUsd(totalPurchaseCostActiveUsd)}
          </div>
          <div className="pt-1 flex flex-col gap-0.5 border-t border-white/5">
            <span className="text-[11px] text-white/60 font-mono flex items-center justify-between">
              <span>Gastos adicionales:</span>
              <span className="text-white/80">{formatPriceUsd(totalPurchaseExpensesActiveUsd)}</span>
            </span>
            <span className="text-[10px] text-white/40">
              {activeCarsWithPurchase.length} de {activeStockCars.length} autos con costo registrado
            </span>
          </div>
        </div>

        {/* Card 2: Capital en Venta (Valorización Total) */}
        <div className="bg-[#0a0a0a] border border-[#D4AF37]/30 p-5 space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/50 uppercase tracking-widest block font-bold">
              Capital en Venta (Stock)
            </span>
            <div className="p-1.5 rounded bg-[#D4AF37]/10 text-[#D4AF37]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#D4AF37] font-light">
            {formatPriceUsd(totalStockUsd)}
          </div>
          <div className="pt-1 flex flex-col gap-0.5 border-t border-white/5">
            <span className="text-[11px] text-white/60 font-mono">
              ≈ {formatPriceArs(totalStockArs)}
            </span>
            <span className="text-[10px] text-white/40">
              {activeStockCars.length} unidades en stock activo
            </span>
          </div>
        </div>

        {/* Card 3: Rendimiento Proyectado (Utilidad en Stock) */}
        <div className="bg-[#0a0a0a] border border-emerald-500/20 p-5 space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 uppercase tracking-widest block font-bold">
              Rendimiento Proyectado
            </span>
            <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400">
              {projectedProfitActiveUsd >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
              )}
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-serif font-light ${
            projectedProfitActiveUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {projectedProfitActiveUsd >= 0 ? '+' : ''}{formatPriceUsd(projectedProfitActiveUsd)}
          </div>
          <div className="pt-1 flex items-center justify-between text-[10px] text-white/40 border-t border-white/5">
            <span>Retorno de Capital (ROI):</span>
            <span className={`font-mono font-bold px-1.5 py-0.2 rounded ${
              projectedMarginPercent >= 0 
                ? 'bg-emerald-500/20 text-emerald-300' 
                : 'bg-rose-500/20 text-rose-300'
            }`}>
              {projectedMarginPercent >= 0 ? '+' : ''}{projectedMarginPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Card 4: Rendimiento Realizado en Vendidos */}
        <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/50 uppercase tracking-widest block font-bold">
              Ganancia en Vendidos
            </span>
            <div className="p-1.5 rounded bg-white/5 text-white/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-white font-light">
            {realizedProfitSoldUsd >= 0 ? '+' : ''}{formatPriceUsd(realizedProfitSoldUsd)}
          </div>
          <div className="pt-1 flex items-center justify-between text-[10px] text-white/40 border-t border-white/5">
            <span>{soldCars.length} autos vendidos</span>
            <span className="font-mono text-emerald-400">
              {costOfSoldPricedUnits > 0 ? `+${realizedMarginSoldPercent.toFixed(1)}% ROI` : 'Realizado'}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Operations Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#050505] border border-white/5 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider block">Disponibles Inmediatos</span>
            <span className="text-base font-serif text-white font-medium">{formatPriceUsd(availableStockUsd)}</span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold">
            {availableCars.length} unidades
          </span>
        </div>

        <div className="bg-[#050505] border border-white/5 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider block">Operaciones en Reserva</span>
            <span className="text-base font-serif text-amber-300 font-medium">{formatPriceUsd(reservedStockUsd)}</span>
          </div>
          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-mono font-bold">
            {reservedCars.length} unidades
          </span>
        </div>

        <div className="bg-[#050505] border border-white/5 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider block">Ticket Promedio por Auto</span>
            <span className="text-base font-serif text-white font-medium">{formatPriceUsd(averagePriceUsd)}</span>
          </div>
          <span className="text-[10px] font-mono text-white/50">
            {pricedActiveCars.length} cotizados
          </span>
        </div>
      </div>

      {/* Notice for cars missing purchase cost */}
      {activeCarsMissingPurchase.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="font-semibold">
                Hay {activeCarsMissingPurchase.length} vehículo(s) sin registrar costo de compra:
              </p>
              <span className="text-[10px] text-amber-400/70 font-mono">
                Carga el precio de compra para calcular con precisión el rendimiento neto.
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {activeCarsMissingPurchase.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onEditCar(u)}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
                >
                  <span>{u.title}</span>
                  <PlusCircle className="w-3 h-3 text-[#D4AF37]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unpriced warning notice if any */}
      {unpricedUnits.length > 0 && (
        <div className="p-4 bg-white/5 border border-white/10 text-white/70 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D4AF37]" />
          <div className="space-y-1">
            <p className="font-semibold text-white">
              Existen {unpricedUnits.length} unidad(es) con precio "A consultar" o en $0 USD:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {unpricedUnits.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onEditCar(u)}
                  className="px-2 py-1 bg-white/10 hover:bg-white/15 border border-white/20 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
                >
                  <span>{u.title}</span>
                  <Edit3 className="w-3 h-3 text-[#D4AF37]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BRAND ASSET ALLOCATION & PROFIT DISTRIBUTION                  */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#0a0a0a] border border-white/10 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-sm font-serif text-white font-medium uppercase tracking-wider">
              Distribución de Capital & Rendimiento por Marca
            </h3>
          </div>
          <span className="text-[10px] text-white/40 font-mono">
            {brandAllocations.length} marcas en stock activo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {brandAllocations.map((item) => {
            const hasProf = item.profitUsd !== 0;
            const roi = item.totalCostUsd > 0 ? (item.profitUsd / item.totalCostUsd) * 100 : 0;
            return (
              <div key={item.brand} className="bg-[#050505] border border-white/5 p-4 space-y-3 hover:border-white/15 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm text-white font-medium">{item.brand}</span>
                  <span className="text-xs font-serif text-[#D4AF37] font-semibold">
                    {formatPriceUsd(item.totalUsd)}
                  </span>
                </div>

                {/* Progress visual bar */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#D4AF37] transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(4, item.percentage))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
                    <span>{item.percentage.toFixed(1)}% de la venta</span>
                    <span>{item.count} un. ({item.availableCount} disp.)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-white/40">Rendimiento:</span>
                  <span className={item.profitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {item.profitUsd >= 0 ? '+' : ''}{formatPriceUsd(item.profitUsd)} ({roi >= 0 ? '+' : ''}{roi.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DETAILED VALUATION & YIELD TABLE WITH SEARCH FILTERS          */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#0a0a0a] border border-white/10 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-serif text-white font-medium uppercase tracking-wider">
              Detalle Individual de Compra, Venta & Rendimiento por Vehículo
            </h3>
            <p className="text-[11px] text-white/40">
              Compara a cuánto se compró cada unidad y cuánto margen o rendimiento comercial se le extrae.
            </p>
          </div>

          <div className="text-xs text-white/50 font-mono">
            Mostrando <span className="text-[#D4AF37] font-bold">{filteredCars.length}</span> de {cars.length} vehículos
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar modelo, patente, marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="Disponible">Solo Disponibles (En Stock)</option>
              <option value="Reservado">Solo Reservados</option>
              <option value="Vendido">Solo Vendidos</option>
            </select>
          </div>

          {/* Origin Filter (Propio vs Concesión) */}
          <div>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value as any)}
              className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="ALL">Origen: Todos ({cars.length})</option>
              <option value="OWN">Solo Stock Propio ({cars.filter(c => !c.isConsignment).length})</option>
              <option value="CONSIGNMENT">Solo A Concesión ({cars.filter(c => !!c.isConsignment).length})</option>
            </select>
          </div>

          {/* Cost Status Filter */}
          <div>
            <select
              value={costFilter}
              onChange={(e) => setCostFilter(e.target.value as any)}
              className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="ALL">Costos: Todos</option>
              <option value="WITH_COST">Con Costo Registrado</option>
              <option value="MISSING_COST">Pendientes de Costo</option>
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="TODAS">Todas las Marcas</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Sorting Order */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="profit-desc">Mayor Rendimiento ($ USD)</option>
              <option value="profit-asc">Menor Rendimiento ($ USD)</option>
              <option value="roi-desc">Mayor Margen / ROI (%)</option>
              <option value="purchase-desc">Mayor Costo Compra ($)</option>
              <option value="price-desc">Mayor Precio Venta ($)</option>
              <option value="price-asc">Menor Precio Venta ($)</option>
              <option value="year-desc">Año Más Reciente</option>
              <option value="km-asc">Menor Kilometraje</option>
            </select>
          </div>
        </div>

        {/* Valuation & Yield Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-white/40 uppercase tracking-widest bg-white/[0.02]">
                <th className="py-3 px-3">Vehículo</th>
                <th className="py-3 px-3">Año / Km</th>
                <th className="py-3 px-3">Patente / Radicación</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 text-right">Costo Compra USD</th>
                <th className="py-3 px-3 text-right">Precio Venta USD</th>
                <th className="py-3 px-3 text-right">Rendimiento USD</th>
                <th className="py-3 px-3 text-center">Margen ROI</th>
                <th className="py-3 px-3 text-center">% Stock</th>
                <th className="py-3 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCars.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-white/40 font-mono">
                    No se encontraron vehículos que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredCars.map((car) => {
                  const carPriceUsd = car.priceUsd || 0;
                  const purchasePrice = car.purchasePriceUsd || 0;
                  const expenses = car.purchaseExpensesUsd || 0;
                  const totalCost = purchasePrice + expenses;
                  const hasPurchase = typeof car.purchasePriceUsd === 'number' && car.purchasePriceUsd > 0;
                  const profitUsd = hasPurchase ? carPriceUsd - totalCost : null;
                  const roiPercent = hasPurchase && totalCost > 0 ? (profitUsd! / totalCost) * 100 : null;
                  const incidencePct = totalStockUsd > 0 ? (carPriceUsd / totalStockUsd) * 100 : 0;

                  return (
                    <tr key={car.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Car title & photo */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={car.images[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80'}
                            alt={car.title}
                            className="w-12 h-9 object-cover rounded bg-neutral-900 border border-white/10 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-serif text-white font-medium block">
                              {car.title}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[10px] text-white/40 font-mono">
                                {car.brand} {car.model}
                              </span>
                              {car.isConsignment ? (
                                <span className="px-1.5 py-0.2 bg-purple-950/70 text-purple-300 border border-purple-500/40 text-[8px] uppercase tracking-wider font-bold rounded flex items-center gap-1">
                                  <Handshake className="w-2.5 h-2.5 text-purple-400" />
                                  A Concesión
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 bg-white/5 text-white/40 border border-white/10 text-[8px] uppercase tracking-wider rounded">
                                  Propio
                                </span>
                              )}
                            </div>
                            {car.isConsignment && car.consignmentOwnerName && (
                              <span className="text-[9px] text-purple-300/80 block font-mono mt-0.5">
                                Dueño: {car.consignmentOwnerName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Year & km */}
                      <td className="py-3.5 px-3 font-mono text-white/70">
                        <div>{car.year}</div>
                        <div className="text-[10px] text-white/40">
                          {car.hours ? `${car.hours}` : `${car.km.toLocaleString('es-AR')} km`}
                        </div>
                      </td>

                      {/* License plate & Location */}
                      <td className="py-3.5 px-3 text-white/60">
                        <div className="font-mono font-bold text-white/80">
                          {car.licensePlate || 'Sin registrar'}
                        </div>
                        <div className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5 truncate max-w-[140px]">
                          <MapPin className="w-2.5 h-2.5 shrink-0 text-[#D4AF37]" />
                          <span>{car.locationUnit || car.location || 'Showroom Vicente López'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold border ${
                            car.status === 'Disponible'
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                              : car.status === 'Reservado'
                              ? 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                              : 'bg-white/5 text-white/40 border-white/10'
                          }`}
                        >
                          {car.status}
                        </span>
                      </td>

                      {/* Purchase Cost (USD) */}
                      <td className="py-3.5 px-3 text-right">
                        {hasPurchase ? (
                          <div>
                            <span className="font-mono text-white font-medium text-xs block">
                              {formatPriceUsd(totalCost)}
                            </span>
                            {expenses > 0 ? (
                              <span className="text-[9px] text-white/40 font-mono block">
                                Base: {formatPriceUsd(purchasePrice)} + {formatPriceUsd(expenses)} gst
                              </span>
                            ) : car.purchaseDate ? (
                              <span className="text-[9px] text-white/40 font-mono block">
                                Ingreso: {car.purchaseDate}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <button
                            onClick={() => onEditCar(car)}
                            className="text-[10px] text-[#D4AF37] hover:underline font-mono inline-flex items-center gap-1"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>Cargar Costo</span>
                          </button>
                        )}
                      </td>

                      {/* Selling Price (USD) */}
                      <td className="py-3.5 px-3 text-right font-serif">
                        {car.priceOnDemand || carPriceUsd <= 0 ? (
                          <span className="text-amber-300 text-[11px] font-mono font-semibold">
                            A Consultar
                          </span>
                        ) : (
                          <span className="text-white font-medium text-sm">
                            {formatPriceUsd(carPriceUsd)}
                          </span>
                        )}
                      </td>

                      {/* Yield / Profit (USD) */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        {profitUsd !== null && !car.priceOnDemand ? (
                          <div className="space-y-0.5">
                            <span className={`font-bold text-xs ${
                              profitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {profitUsd >= 0 ? '+' : ''}{formatPriceUsd(profitUsd)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-white/30 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Margin / ROI (%) */}
                      <td className="py-3.5 px-3 text-center">
                        {roiPercent !== null && !car.priceOnDemand ? (
                          <span className={`inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold border ${
                            roiPercent >= 0 
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' 
                              : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                          }`}>
                            {roiPercent >= 0 ? '+' : ''}{roiPercent.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-white/30 text-[11px] font-mono">-</span>
                        )}
                      </td>

                      {/* Incidence % */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono text-[11px] text-white/50">
                          {incidencePct.toFixed(1)}%
                        </span>
                      </td>

                      {/* Edit car action */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => onEditCar(car)}
                          className="px-2.5 py-1.5 bg-white/5 hover:bg-[#D4AF37]/10 border border-white/10 hover:border-[#D4AF37]/40 text-white/70 hover:text-[#D4AF37] text-[10px] uppercase tracking-wider font-bold transition-all inline-flex items-center gap-1.5"
                          title="Editar precio, costo de compra y especificaciones"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Row */}
        {filteredCars.length > 0 && (
          <div className="pt-4 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-white/50 gap-3">
            <div>
              Total en vista: <span className="text-white font-medium">{filteredCars.length} vehículos</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
              <span>
                Costo Compra: <strong className="text-white font-medium">
                  {formatPriceUsd(filteredCars.reduce((a, b) => a + (b.purchasePriceUsd || 0) + (b.purchaseExpensesUsd || 0), 0))}
                </strong>
              </span>
              <span>
                Precio Venta:{' '}
                <strong className="text-[#D4AF37] font-serif text-sm">
                  {formatPriceUsd(filteredCars.reduce((a, b) => a + (b.priceUsd || 0), 0))}
                </strong>
              </span>
              {(() => {
                const totalFilteredCost = filteredCars.reduce((a, b) => a + (b.purchasePriceUsd || 0) + (b.purchaseExpensesUsd || 0), 0);
                const totalFilteredSale = filteredCars.reduce((a, b) => a + (b.priceUsd || 0), 0);
                const totalFilteredProfit = totalFilteredSale - totalFilteredCost;
                const filteredRoi = totalFilteredCost > 0 ? (totalFilteredProfit / totalFilteredCost) * 100 : 0;
                return (
                  <span>
                    Rendimiento Vista:{' '}
                    <strong className={totalFilteredProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {totalFilteredProfit >= 0 ? '+' : ''}{formatPriceUsd(totalFilteredProfit)} ({filteredRoi >= 0 ? '+' : ''}{filteredRoi.toFixed(1)}%)
                    </strong>
                  </span>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
