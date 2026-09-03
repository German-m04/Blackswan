import React, { useState, useMemo } from 'react';
import { Car, VehicleStatus } from '../types';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Layers, 
  CarFront, 
  Search, 
  Download, 
  Copy, 
  Check, 
  Edit3, 
  MapPin, 
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Eye
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
  const [sortBy, setSortBy] = useState<'price-desc' | 'price-asc' | 'year-desc' | 'km-asc'>('price-desc');
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

  // Overall Financial Calculations
  const activeStockCars = useMemo(() => {
    return cars.filter((c) => c.status === 'Disponible' || c.status === 'Reservado');
  }, [cars]);

  const totalStockUsd = useMemo(() => {
    return activeStockCars.reduce((acc, c) => acc + (c.priceUsd || 0), 0);
  }, [activeStockCars]);

  const totalStockArs = useMemo(() => {
    return activeStockCars.reduce((acc, c) => acc + (c.priceArs || (c.priceUsd || 0) * 1350), 0);
  }, [activeStockCars]);

  const availableCars = useMemo(() => {
    return cars.filter((c) => c.status === 'Disponible');
  }, [cars]);

  const availableStockUsd = useMemo(() => {
    return availableCars.reduce((acc, c) => acc + (c.priceUsd || 0), 0);
  }, [availableCars]);

  const reservedCars = useMemo(() => {
    return cars.filter((c) => c.status === 'Reservado');
  }, [cars]);

  const reservedStockUsd = useMemo(() => {
    return reservedCars.reduce((acc, c) => acc + (c.priceUsd || 0), 0);
  }, [reservedCars]);

  const soldCars = useMemo(() => {
    return cars.filter((c) => c.status === 'Vendido');
  }, [cars]);

  const soldStockUsd = useMemo(() => {
    return soldCars.reduce((acc, c) => acc + (c.priceUsd || 0), 0);
  }, [soldCars]);

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
    const map: Record<string, { count: number; totalUsd: number; highestCar: Car; availableCount: number }> = {};

    activeStockCars.forEach((c) => {
      const b = c.brand || 'Otras';
      if (!map[b]) {
        map[b] = { count: 0, totalUsd: 0, highestCar: c, availableCount: 0 };
      }
      map[b].count++;
      map[b].totalUsd += (c.priceUsd || 0);
      if (c.status === 'Disponible') {
        map[b].availableCount++;
      }
      if ((c.priceUsd || 0) > (map[b].highestCar.priceUsd || 0)) {
        map[b].highestCar = c;
      }
    });

    return Object.entries(map)
      .map(([brand, data]) => ({
        brand,
        count: data.count,
        availableCount: data.availableCount,
        totalUsd: data.totalUsd,
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

      return searchMatch && statusMatch && brandMatch;
    }).sort((a, b) => {
      if (sortBy === 'price-desc') return (b.priceUsd || 0) - (a.priceUsd || 0);
      if (sortBy === 'price-asc') return (a.priceUsd || 0) - (b.priceUsd || 0);
      if (sortBy === 'year-desc') return b.year - a.year;
      if (sortBy === 'km-asc') return a.km - b.km;
      return 0;
    });
  }, [cars, searchTerm, statusFilter, brandFilter, sortBy]);

  // Export CSV
  const handleExportCsv = () => {
    const rows = filteredCars.map((c) => {
      const priceVal = c.priceUsd || 0;
      const pct = totalStockUsd > 0 ? ((priceVal / totalStockUsd) * 100).toFixed(2) + '%' : '0%';
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
        Precio_USD: priceVal,
        Precio_ARS: c.priceArs || priceVal * 1350,
        Porcentaje_Total_Stock: pct,
        Ubicacion: c.locationUnit || c.location || 'Showroom Vicente López'
      };
    });

    const timestamp = new Date().toISOString().split('T')[0];
    exportToCsv(`BlackSwan_Valorizacion_Stock_${timestamp}.csv`, rows);
  };

  // Copy Summary
  const handleCopySummary = () => {
    const summary = `BLACK SWAN MOTORS - REPORTE EJECUTIVO DE VALORIZACIÓN DE STOCK
Fecha: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}
--------------------------------------------------
* Capital Total Activo en Stock: ${formatPriceUsd(totalStockUsd)} (aprox. ${formatPriceArs(totalStockArs)})
* Unidades Activas: ${activeStockCars.length} vehículos
* Disponibles para Venta Inmediata: ${availableCars.length} unidades (${formatPriceUsd(availableStockUsd)})
* Capital Comprometido en Reservas: ${reservedCars.length} unidades (${formatPriceUsd(reservedStockUsd)})
* Histórico Facturado en Vendidos: ${soldCars.length} unidades (${formatPriceUsd(soldStockUsd)})
* Valor Promedio por Unidad: ${formatPriceUsd(averagePriceUsd)}

CONCENTRACIÓN POR MARCA:
${brandAllocations.map((b) => `- ${b.brand}: ${formatPriceUsd(b.totalUsd)} (${b.count} un. | ${b.percentage.toFixed(1)}% del stock)`).join('\n')}
--------------------------------------------------`;

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      {/* ------------------------------------------------------------- */}
      {/* HEADER WITH EXPORT ACTIONS                                     */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0a0a] border border-white/10 p-5 sm:p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-serif text-white font-medium">
              Valorización de Activos & Capital en Stock
            </h2>
          </div>
          <p className="text-xs text-white/50 pl-10">
            Valuación patrimonial consolidada, capital inmovilizado y distribución de portfolio en showroom.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopySummary}
            className="px-3.5 py-2 bg-[#050505] hover:bg-white/5 border border-white/15 text-xs text-white/80 hover:text-white uppercase tracking-wider font-semibold transition-all flex items-center gap-2"
            title="Copiar balance de capital al portapapeles"
          >
            {copiedSummary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Copiar Balance</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#b89528] text-black text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 shadow-lg shadow-[#D4AF37]/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV de Stock</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* EXECUTIVE KPI FINANCIAL CARDS                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Stock */}
        <div className="bg-[#0a0a0a] border border-[#D4AF37]/30 p-5 space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/50 uppercase tracking-widest block font-bold">
              Capital Activo Total
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
              {activeStockCars.length} unidades en inventario activo
            </span>
          </div>
        </div>

        {/* Available Stock */}
        <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/50 uppercase tracking-widest block font-bold">
              Disponibles para Venta
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
              {availableCars.length} Unidades
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-white font-light">
            {formatPriceUsd(availableStockUsd)}
          </div>
          <div className="pt-1 flex items-center justify-between text-[10px] text-white/40 border-t border-white/5">
            <span>Capital realizable</span>
            <span className="font-mono text-emerald-400">
              {totalStockUsd > 0 ? ((availableStockUsd / totalStockUsd) * 100).toFixed(0) : 0}% del stock
            </span>
          </div>
        </div>

        {/* Reserved Capital */}
        <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/50 uppercase tracking-widest block font-bold">
              Capital en Reserva
            </span>
            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
              {reservedCars.length} Unidades
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-amber-300 font-light">
            {formatPriceUsd(reservedStockUsd)}
          </div>
          <div className="pt-1 flex items-center justify-between text-[10px] text-white/40 border-t border-white/5">
            <span>Operaciones en curso</span>
            <span className="font-mono text-amber-400">
              {totalStockUsd > 0 ? ((reservedStockUsd / totalStockUsd) * 100).toFixed(0) : 0}% del stock
            </span>
          </div>
        </div>

        {/* Average Unit Price */}
        <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/50 uppercase tracking-widest block font-bold">
              Ticket Promedio / Auto
            </span>
            <div className="p-1.5 rounded bg-white/5 text-white/60">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-white font-light">
            {formatPriceUsd(averagePriceUsd)}
          </div>
          <div className="pt-1 flex items-center justify-between text-[10px] text-white/40 border-t border-white/5">
            <span>Base de cálculo</span>
            <span className="font-mono text-white/60">
              {pricedActiveCars.length} unidades cotizadas
            </span>
          </div>
        </div>
      </div>

      {/* Unpriced warning notice if any */}
      {unpricedUnits.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">
              Existen {unpricedUnits.length} unidad(es) con precio "A consultar" o en $0 USD:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {unpricedUnits.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onEditCar(u)}
                  className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
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
      {/* BRAND ASSET ALLOCATION / CAPITAL DISTRIBUTION                 */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#0a0a0a] border border-white/10 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-sm font-serif text-white font-medium uppercase tracking-wider">
              Distribución de Capital por Marca (Portfolio Share)
            </h3>
          </div>
          <span className="text-[10px] text-white/40 font-mono">
            {brandAllocations.length} marcas en stock activo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {brandAllocations.map((item) => (
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
                  <span>{item.percentage.toFixed(1)}% del capital</span>
                  <span>{item.count} un. ({item.availableCount} disp.)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-white/40">Promedio / unidad:</span>
                <span className="text-white/80 font-mono">{formatPriceUsd(item.averageUsd)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DETAILED VALUATION TABLE & SEARCH FILTERS                     */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#0a0a0a] border border-white/10 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-serif text-white font-medium uppercase tracking-wider">
              Detalle Individual de Valorización por Vehículo
            </h3>
            <p className="text-[11px] text-white/40">
              Listado completo con incidencias individuales sobre el balance total de activos.
            </p>
          </div>

          <div className="text-xs text-white/50 font-mono">
            Mostrando <span className="text-[#D4AF37] font-bold">{filteredCars.length}</span> de {cars.length} vehículos
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              <option value="price-desc">Mayor Valor (USD)</option>
              <option value="price-asc">Menor Valor (USD)</option>
              <option value="year-desc">Año Más Reciente</option>
              <option value="km-asc">Menor Kilometraje</option>
            </select>
          </div>
        </div>

        {/* Valuation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-white/40 uppercase tracking-widest bg-white/[0.02]">
                <th className="py-3 px-3">Vehículo</th>
                <th className="py-3 px-3">Año / Km</th>
                <th className="py-3 px-3">Patente / Radicación</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 text-right">Valorización USD</th>
                <th className="py-3 px-3 text-right">Equivalente ARS</th>
                <th className="py-3 px-3 text-center">% Incidencia</th>
                <th className="py-3 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCars.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-white/40 font-mono">
                    No se encontraron vehículos que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredCars.map((car) => {
                  const carPriceUsd = car.priceUsd || 0;
                  const carPriceArs = car.priceArs || carPriceUsd * 1350;
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
                            <span className="text-[10px] text-white/40 font-mono">
                              {car.brand} {car.model}
                            </span>
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
                        <div className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5 truncate max-w-[150px]">
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

                      {/* Valuation USD */}
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

                      {/* Valuation ARS */}
                      <td className="py-3.5 px-3 text-right font-mono text-white/50 text-[11px]">
                        {car.priceOnDemand || carPriceUsd <= 0 ? (
                          <span>-</span>
                        ) : (
                          formatPriceArs(carPriceArs)
                        )}
                      </td>

                      {/* Incidence % */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 font-mono text-[11px] text-white/70">
                          <span>{incidencePct.toFixed(1)}%</span>
                        </div>
                      </td>

                      {/* Edit car action */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => onEditCar(car)}
                          className="px-2.5 py-1.5 bg-white/5 hover:bg-[#D4AF37]/10 border border-white/10 hover:border-[#D4AF37]/40 text-white/70 hover:text-[#D4AF37] text-[10px] uppercase tracking-wider font-bold transition-all inline-flex items-center gap-1.5"
                          title="Editar precio y especificaciones de la unidad"
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
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-2">
            <div>
              Total filtrado en pantalla: <span className="text-white font-medium">{filteredCars.length} vehículos</span>
            </div>
            <div className="flex items-center gap-4 font-mono">
              <span>
                Suma filtrada:{' '}
                <strong className="text-[#D4AF37] font-serif text-sm">
                  {formatPriceUsd(filteredCars.reduce((a, b) => a + (b.priceUsd || 0), 0))}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
