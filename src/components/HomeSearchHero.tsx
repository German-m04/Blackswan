import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car } from '../types';
import { 
  Search, 
  X, 
  RotateCcw, 
  SlidersHorizontal, 
  Tag, 
  DollarSign, 
  Calendar, 
  Gauge, 
  Fuel, 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Car as CarIcon,
  ShieldCheck,
  ArrowUpDown
} from 'lucide-react';

export interface SearchHeroFilters {
  query: string;
  brand: string;
  model: string;
  bodyType: string;
  pricePreset: string;
  yearPreset: string;
  kmPreset: string;
  transmission: string;
  fuel: string;
  onlyFeatured: boolean;
  onlySingleOwner: boolean;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'year-desc' | 'km-asc';
}

interface HomeSearchHeroProps {
  cars: Car[];
  filters: SearchHeroFilters;
  onFiltersChange: (filters: SearchHeroFilters) => void;
  onReset: () => void;
  matchingCount: number;
}

export const HomeSearchHero: React.FC<HomeSearchHeroProps> = ({
  cars,
  filters,
  onFiltersChange,
  onReset,
  matchingCount
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Available brands list with stock count
  const availableBrands = useMemo(() => {
    const list = Array.from(new Set(cars.map(c => c.brand).filter(Boolean))).sort();
    return list;
  }, [cars]);

  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cars.forEach(c => {
      counts[c.brand] = (counts[c.brand] || 0) + 1;
    });
    return counts;
  }, [cars]);

  // Available models (filtered by selected brand if any)
  const availableModels = useMemo(() => {
    let list = cars;
    if (filters.brand) {
      list = list.filter(c => c.brand === filters.brand);
    }
    const models = Array.from(new Set(list.map(c => c.model).filter(Boolean))).sort();
    return models;
  }, [cars, filters.brand]);

  // Body types in current stock
  const bodyTypes = useMemo(() => {
    const types = ['SUV', 'Sedán', 'Hatchback', 'Pick-up', 'Coupé'];
    return types;
  }, []);

  // Update a single filter field
  const updateFilter = <K extends keyof SearchHeroFilters>(key: K, value: SearchHeroFilters[K]) => {
    const newFilters = { ...filters, [key]: value };
    // If brand changes, reset model if it doesn't exist in new brand
    if (key === 'brand' && value !== filters.brand) {
      newFilters.model = '';
    }
    onFiltersChange(newFilters);
  };

  // Quick preset shortcuts
  const handleShortcutClick = (preset: string) => {
    if (preset === 'all') {
      onReset();
    } else if (preset === 'featured') {
      onFiltersChange({ ...filters, onlyFeatured: !filters.onlyFeatured });
    } else if (preset === 'suv') {
      onFiltersChange({ ...filters, bodyType: filters.bodyType === 'SUV' ? '' : 'SUV' });
    } else if (preset === 'sedan') {
      onFiltersChange({ ...filters, bodyType: filters.bodyType === 'Sedán' ? '' : 'Sedán' });
    } else if (preset === 'pickup') {
      onFiltersChange({ ...filters, bodyType: filters.bodyType === 'Pick-up' ? '' : 'Pick-up' });
    } else if (preset === 'hybrid') {
      onFiltersChange({ ...filters, fuel: filters.fuel === 'Híbrido' ? '' : 'Híbrido' });
    } else if (preset === 'under-30k') {
      onFiltersChange({ ...filters, pricePreset: filters.pricePreset === 'under-30k' ? 'all' : 'under-30k' });
    } else if (preset === 'low-km') {
      onFiltersChange({ ...filters, kmPreset: filters.kmPreset === 'under-30k' ? 'all' : 'under-30k' });
    } else if (preset === 'single-owner') {
      onFiltersChange({ ...filters, onlySingleOwner: !filters.onlySingleOwner });
    }
  };

  const hasActiveFilters = Boolean(
    filters.query.trim() ||
    filters.brand ||
    filters.model ||
    filters.bodyType ||
    filters.pricePreset !== 'all' ||
    filters.yearPreset !== 'all' ||
    filters.kmPreset !== 'all' ||
    filters.transmission ||
    filters.fuel ||
    filters.onlyFeatured ||
    filters.onlySingleOwner
  );

  return (
    <section 
      id="home-search-section"
      className="relative bg-[#070707] border border-white/10 p-5 sm:p-7 lg:p-9 shadow-2xl rounded-sm"
    >
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-1/3 w-80 h-36 bg-[#D4AF37] opacity-[0.035] blur-[100px] pointer-events-none rounded-full" />

      {/* Header Info: Centered Title */}
      <div className="flex flex-col items-center justify-center text-center gap-3 border-b border-white/10 pb-6 mb-6">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white font-light tracking-tight text-center">
          Buscador de Unidades Certificadas
        </h1>
        {hasActiveFilters && (
          <div className="flex items-center justify-center">
            <button
              onClick={onReset}
              className="btn-dark-textured px-3.5 py-1.5 text-[11px] font-medium uppercase font-mono tracking-[0.15em] flex items-center gap-1.5 cursor-pointer rounded-lg"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="w-3 h-3 text-[#D4AF37]" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. PRINCIPAL SEARCH BAR (GRANDE, PROMINENTE Y ELEGANTE)   */}
      {/* ========================================================= */}
      <div className="mb-6">
        <label htmlFor="home-car-search-input" className="sr-only">
          Buscar por marca, modelo o palabra clave
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-4.5 pointer-events-none text-[#D4AF37]">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="home-car-search-input"
            type="text"
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            placeholder="Buscar por marca, modelo o versión (ej: Audi A4, BMW 330i, Hilux, Golf...)"
            className="w-full bg-[#030303] border border-white/15 focus:border-[#D4AF37] text-white placeholder-white/35 pl-13 pr-12 py-3.5 sm:py-4 text-sm sm:text-base tracking-wide transition-all shadow-inner focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xl"
          />
          {filters.query && (
            <button
              onClick={() => updateFilter('query', '')}
              className="absolute right-4 text-white/40 hover:text-white p-1.5 transition-colors rounded-full hover:bg-white/10"
              title="Borrar texto de búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TODOS LOS FILTROS ABAJO DE LA BARRA DE BÚSQUEDA       */}
      {/* ========================================================= */}
      <div className="space-y-4">
        {/* Row 1: Primary Filters (Marca, Modelo, Carrocería, Precio) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Marca */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-mono tracking-[0.2em] text-white/50 flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-[#D4AF37]" />
              <span>Marca</span>
            </label>
            <div className="relative">
              <select
                id="filter-brand-select"
                value={filters.brand}
                onChange={(e) => updateFilter('brand', e.target.value)}
                className="w-full bg-[#030303] border border-white/10 hover:border-white/20 focus:border-[#D4AF37] px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors cursor-pointer appearance-none pr-8 rounded-lg"
              >
                <option value="">Todas las Marcas ({cars.length})</option>
                {availableBrands.map(brand => (
                  <option key={brand} value={brand}>
                    {brand} ({brandCounts[brand] || 0})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Modelo */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-mono tracking-[0.2em] text-white/50 flex items-center gap-1.5">
              <CarIcon className="w-3 h-3 text-[#D4AF37]" />
              <span>Modelo</span>
            </label>
            <div className="relative">
              <select
                id="filter-model-select"
                value={filters.model}
                onChange={(e) => updateFilter('model', e.target.value)}
                disabled={availableModels.length === 0}
                className="w-full bg-[#030303] border border-white/10 hover:border-white/20 focus:border-[#D4AF37] px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors cursor-pointer appearance-none pr-8 disabled:opacity-40 rounded-lg"
              >
                <option value="">
                  {filters.brand ? `Modelos de ${filters.brand}` : 'Todos los Modelos'}
                </option>
                {availableModels.map(model => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Carrocería */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-mono tracking-[0.2em] text-white/50 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3 text-[#D4AF37]" />
              <span>Carrocería</span>
            </label>
            <div className="relative">
              <select
                id="filter-bodytype-select"
                value={filters.bodyType}
                onChange={(e) => updateFilter('bodyType', e.target.value)}
                className="w-full bg-[#030303] border border-white/10 hover:border-white/20 focus:border-[#D4AF37] px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors cursor-pointer appearance-none pr-8 rounded-lg"
              >
                <option value="">Cualquier Carrocería</option>
                {bodyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Rango de Precio USD */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-mono tracking-[0.2em] text-white/50 flex items-center gap-1.5">
              <DollarSign className="w-3 h-3 text-[#D4AF37]" />
              <span>Precio USD</span>
            </label>
            <div className="relative">
              <select
                id="filter-price-select"
                value={filters.pricePreset}
                onChange={(e) => updateFilter('pricePreset', e.target.value)}
                className="w-full bg-[#030303] border border-white/10 hover:border-white/20 focus:border-[#D4AF37] px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors cursor-pointer appearance-none pr-8 rounded-lg"
              >
                <option value="all">Cualquier Valor</option>
                <option value="under-25k">Hasta $25.000 USD</option>
                <option value="under-30k">Hasta $30.000 USD</option>
                <option value="25k-35k">$25.000 - $35.000 USD</option>
                <option value="35k-50k">$35.000 - $50.000 USD</option>
                <option value="over-50k">Más de $50.000 USD</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 2: Secondary Mechanical Filters (Año, Kilometraje, Transmisión, Combustible) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Año */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-mono tracking-[0.2em] text-white/50 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-[#D4AF37]" />
              <span>Año de Fabricación</span>
            </label>
            <div className="relative">
              <select
                id="filter-year-select"
                value={filters.yearPreset}
                onChange={(e) => updateFilter('yearPreset', e.target.value)}
                className="w-full bg-[#030303] border border-white/10 hover:border-white/20 focus:border-[#D4AF37] px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors cursor-pointer appearance-none pr-8 rounded-lg"
              >
                <option value="all">Todos los Años</option>
                <option value="2024-plus">2024 o más nuevo</option>
                <option value="2022-2023">2022 - 2023</option>
                <option value="2020-2021">2020 - 2021</option>
                <option value="2017-2019">2017 - 2019</option>
                <option value="older">2016 o anteriores</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Kilometraje */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-mono tracking-[0.2em] text-white/50 flex items-center gap-1.5">
              <Gauge className="w-3 h-3 text-[#D4AF37]" />
              <span>Kilometraje</span>
            </label>
            <div className="relative">
              <select
                id="filter-km-select"
                value={filters.kmPreset}
                onChange={(e) => updateFilter('kmPreset', e.target.value)}
                className="w-full bg-[#030303] border border-white/10 hover:border-white/20 focus:border-[#D4AF37] px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors cursor-pointer appearance-none pr-8 rounded-lg"
              >
                <option value="all">Cualquier Kilometraje</option>
                <option value="under-30k">Menos de 30.000 KM</option>
                <option value="under-60k">Menos de 60.000 KM</option>
                <option value="under-100k">Menos de 100.000 KM</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Transmisión */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-mono tracking-[0.2em] text-white/50 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3 text-[#D4AF37]" />
              <span>Transmisión</span>
            </label>
            <div className="relative">
              <select
                id="filter-transmission-select"
                value={filters.transmission}
                onChange={(e) => updateFilter('transmission', e.target.value)}
                className="w-full bg-[#030303] border border-white/10 hover:border-white/20 focus:border-[#D4AF37] px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors cursor-pointer appearance-none pr-8 rounded-lg"
              >
                <option value="">Cualquier Transmisión</option>
                <option value="Automática">Automática</option>
                <option value="Manual">Manual</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Combustible */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-mono tracking-[0.2em] text-white/50 flex items-center gap-1.5">
              <Fuel className="w-3 h-3 text-[#D4AF37]" />
              <span>Combustible</span>
            </label>
            <div className="relative">
              <select
                id="filter-fuel-select"
                value={filters.fuel}
                onChange={(e) => updateFilter('fuel', e.target.value)}
                className="w-full bg-[#030303] border border-white/10 hover:border-white/20 focus:border-[#D4AF37] px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors cursor-pointer appearance-none pr-8 rounded-lg"
              >
                <option value="">Cualquier Combustible</option>
                <option value="Nafta">Nafta</option>
                <option value="Diésel">Diésel</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Eléctrico">Eléctrico</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 3: Direct Quick Filter Pills */}
        <div className="pt-3.5 border-t border-white/10">
          {/* Quick Filter Buttons Track */}
          <div className="flex flex-wrap items-center gap-2 py-1">
            <span className="text-[9px] uppercase font-mono tracking-[0.25em] text-white/40 shrink-0 mr-1 hidden sm:inline select-none">
              Filtro Rápido:
            </span>

            {/* All */}
            <button
              type="button"
              onClick={() => handleShortcutClick('all')}
              className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-medium shrink-0 cursor-pointer whitespace-nowrap focus:outline-none select-none transition-all ${
                !hasActiveFilters
                  ? 'btn-pill-active'
                  : 'btn-pill-textured text-white/70'
              }`}
            >
              Todos ({cars.length})
            </button>

            {/* Destacados */}
            <button
              type="button"
              onClick={() => handleShortcutClick('featured')}
              className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-medium shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap focus:outline-none select-none transition-all ${
                filters.onlyFeatured
                  ? 'btn-pill-active'
                  : 'btn-pill-textured text-white/70'
              }`}
            >
              <span className={filters.onlyFeatured ? 'text-black' : 'text-[#D4AF37]'}>★</span>
              <span>Destacados ({cars.filter(c => c.featured).length})</span>
            </button>

            {/* SUVs */}
            <button
              type="button"
              onClick={() => handleShortcutClick('suv')}
              className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-medium shrink-0 cursor-pointer whitespace-nowrap focus:outline-none select-none transition-all ${
                filters.bodyType === 'SUV'
                  ? 'btn-pill-active'
                  : 'btn-pill-textured text-white/70'
              }`}
            >
              SUVs ({cars.filter(c => c.bodyType === 'SUV').length})
            </button>

            {/* Sedanes */}
            <button
              type="button"
              onClick={() => handleShortcutClick('sedan')}
              className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-medium shrink-0 cursor-pointer whitespace-nowrap focus:outline-none select-none transition-all ${
                filters.bodyType === 'Sedán'
                  ? 'btn-pill-active'
                  : 'btn-pill-textured text-white/70'
              }`}
            >
              Sedanes ({cars.filter(c => c.bodyType === 'Sedán').length})
            </button>

            {/* Pick-ups */}
            <button
              type="button"
              onClick={() => handleShortcutClick('pickup')}
              className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-medium shrink-0 cursor-pointer whitespace-nowrap focus:outline-none select-none transition-all ${
                filters.bodyType === 'Pick-up'
                  ? 'btn-pill-active'
                  : 'btn-pill-textured text-white/70'
              }`}
            >
              Pick-ups ({cars.filter(c => c.bodyType === 'Pick-up').length})
            </button>

            {/* Híbridos */}
            <button
              type="button"
              onClick={() => handleShortcutClick('hybrid')}
              className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-medium shrink-0 cursor-pointer whitespace-nowrap focus:outline-none select-none transition-all ${
                filters.fuel === 'Híbrido'
                  ? 'btn-pill-active'
                  : 'btn-pill-textured text-white/70'
              }`}
            >
              Híbridos
            </button>

            {/* Único dueño */}
            <button
              type="button"
              onClick={() => handleShortcutClick('single-owner')}
              className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-medium shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap focus:outline-none select-none transition-all ${
                filters.onlySingleOwner
                  ? 'btn-pill-active'
                  : 'btn-pill-textured text-white/70'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Único Dueño ({cars.filter(c => c.singleOwner).length})</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
