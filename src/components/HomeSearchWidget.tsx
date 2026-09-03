import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car } from '../types';
import { 
  Search, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  ArrowRight, 
  Sparkles,
  Tag,
  DollarSign,
  Gauge,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface HomeSearchWidgetProps {
  cars: Car[];
  onNavigateCatalog: (filters?: any) => void;
}

export const HomeSearchWidget: React.FC<HomeSearchWidgetProps> = ({ cars, onNavigateCatalog }) => {
  // Available brands and body types from cars
  const brands = useMemo(() => {
    const list = Array.from(new Set(cars.map(c => c.brand))).sort();
    return list;
  }, [cars]);

  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cars.forEach(c => {
      counts[c.brand] = (counts[c.brand] || 0) + 1;
    });
    return counts;
  }, [cars]);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedBodyType, setSelectedBodyType] = useState('');
  const [pricePreset, setPricePreset] = useState('all');
  const [yearPreset, setYearPreset] = useState('all');
  const [kmPreset, setKmPreset] = useState('all');
  const [selectedTransmission, setSelectedTransmission] = useState('');
  const [selectedFuel, setSelectedFuel] = useState('');
  const [onlySingleOwner, setOnlySingleOwner] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  // Advanced filters expansion toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Convert presets into min/max bounds
  const filterParams = useMemo(() => {
    let minPriceUsd: number | undefined = undefined;
    let maxPriceUsd: number | undefined = undefined;
    if (pricePreset === 'under-25k') {
      minPriceUsd = 0;
      maxPriceUsd = 25000;
    } else if (pricePreset === '25k-35k') {
      minPriceUsd = 25000;
      maxPriceUsd = 35000;
    } else if (pricePreset === '35k-50k') {
      minPriceUsd = 35000;
      maxPriceUsd = 50000;
    } else if (pricePreset === 'over-50k') {
      minPriceUsd = 50000;
    }

    let minYear: number | undefined = undefined;
    let maxYear: number | undefined = undefined;
    if (yearPreset === '2023-plus') {
      minYear = 2023;
    } else if (yearPreset === '2020-2022') {
      minYear = 2020;
      maxYear = 2022;
    } else if (yearPreset === '2017-2019') {
      minYear = 2017;
      maxYear = 2019;
    } else if (yearPreset === 'older') {
      maxYear = 2016;
    }

    let maxKm: number | undefined = undefined;
    if (kmPreset === 'under-30k') {
      maxKm = 30000;
    } else if (kmPreset === 'under-60k') {
      maxKm = 60000;
    } else if (kmPreset === 'under-100k') {
      maxKm = 100000;
    }

    return {
      searchQuery: searchQuery.trim() || undefined,
      brand: selectedBrand || undefined,
      bodyType: selectedBodyType || undefined,
      minPriceUsd,
      maxPriceUsd,
      minYear,
      maxYear,
      maxKm,
      transmission: selectedTransmission || undefined,
      fuel: selectedFuel || undefined,
      onlySingleOwner: onlySingleOwner ? true : undefined,
      onlyFeatured: onlyFeatured ? true : undefined
    };
  }, [
    searchQuery,
    selectedBrand,
    selectedBodyType,
    pricePreset,
    yearPreset,
    kmPreset,
    selectedTransmission,
    selectedFuel,
    onlySingleOwner,
    onlyFeatured
  ]);

  // Compute matching count in real-time
  const matchingCars = useMemo(() => {
    return cars.filter(car => {
      if (filterParams.searchQuery) {
        const q = filterParams.searchQuery.toLowerCase();
        const match = 
          car.title.toLowerCase().includes(q) ||
          car.brand.toLowerCase().includes(q) ||
          car.model.toLowerCase().includes(q) ||
          (car.engine && car.engine.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filterParams.brand && car.brand !== filterParams.brand) return false;
      if (filterParams.bodyType && car.bodyType !== filterParams.bodyType) return false;
      if (filterParams.minPriceUsd !== undefined && car.priceUsd < filterParams.minPriceUsd) return false;
      if (filterParams.maxPriceUsd !== undefined && car.priceUsd > filterParams.maxPriceUsd) return false;
      if (filterParams.minYear !== undefined && car.year < filterParams.minYear) return false;
      if (filterParams.maxYear !== undefined && car.year > filterParams.maxYear) return false;
      if (filterParams.maxKm !== undefined && car.km > filterParams.maxKm) return false;
      if (filterParams.transmission && car.transmission !== filterParams.transmission) return false;
      if (filterParams.fuel && car.fuel !== filterParams.fuel) return false;
      if (filterParams.onlySingleOwner && !car.singleOwner) return false;
      if (filterParams.onlyFeatured && !car.featured) return false;
      return true;
    });
  }, [cars, filterParams]);

  // Has any active filter
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedBrand ||
    selectedBodyType ||
    pricePreset !== 'all' ||
    yearPreset !== 'all' ||
    kmPreset !== 'all' ||
    selectedTransmission ||
    selectedFuel ||
    onlySingleOwner ||
    onlyFeatured
  );

  const handleReset = () => {
    setSearchQuery('');
    setSelectedBrand('');
    setSelectedBodyType('');
    setPricePreset('all');
    setYearPreset('all');
    setKmPreset('all');
    setSelectedTransmission('');
    setSelectedFuel('');
    setOnlySingleOwner(false);
    setOnlyFeatured(false);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onNavigateCatalog(filterParams);
  };

  // Quick shortcut clicker
  const handleQuickCategory = (categoryFilters: any) => {
    onNavigateCatalog(categoryFilters);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="bg-[#090909] border border-white/10 relative p-6 sm:p-8 lg:p-10 shadow-2xl"
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-10 w-96 h-48 bg-[#D4AF37] opacity-[0.03] blur-[90px] rounded-full pointer-events-none" />

      {/* Header & Quick Intro */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[#D4AF37] text-[10px] uppercase font-bold tracking-[0.3em] mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Buscador Inteligente</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-white font-light">
            Encuentre su Próximo Auto Seleccionado
          </h2>
          <p className="text-white/40 text-xs font-light mt-1">
            Filtre por marca, carrocería, rango de precio USD, kilometraje y año desde nuestra portada.
          </p>
        </div>

        {/* Live Matching Count Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-white/5 border border-white/10 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs text-white/80 font-mono">
              <strong className="text-[#D4AF37] font-bold">{matchingCars.length}</strong> de {cars.length} unidades disponibles
            </span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-[11px] uppercase font-semibold tracking-wider text-white/40 hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
              title="Restablecer filtros"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Category / Popular Filter Badges */}
      <div className="mb-6 space-y-2">
        <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 block">
          Accesos Directos Populares:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleQuickCategory({ onlyFeatured: true })}
            className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white/80 transition-colors flex items-center gap-1.5"
          >
            <span className="text-[#D4AF37]">★</span>
            <span>Destacados ({cars.filter(c => c.featured).length})</span>
          </button>
          <button
            onClick={() => handleQuickCategory({ bodyType: 'SUV' })}
            className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white/80 transition-colors"
          >
            SUVs ({cars.filter(c => c.bodyType === 'SUV').length})
          </button>
          <button
            onClick={() => handleQuickCategory({ maxPriceUsd: 30000 })}
            className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white/80 transition-colors"
          >
            &lt; $30.000 USD
          </button>
          <button
            onClick={() => handleQuickCategory({ maxKm: 30000 })}
            className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white/80 transition-colors"
          >
            &lt; 30.000 KM
          </button>
          <button
            onClick={() => handleQuickCategory({ minYear: 2023 })}
            className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white/80 transition-colors"
          >
            Modelos 2023+
          </button>
          <button
            onClick={() => handleQuickCategory({ fuel: 'Híbrido' })}
            className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white/80 transition-colors"
          >
            Híbridos
          </button>
          <button
            onClick={() => handleQuickCategory({ onlySingleOwner: true })}
            className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white/80 transition-colors"
          >
            Único Dueño ({cars.filter(c => c.singleOwner).length})
          </button>
          <button
            onClick={() => handleQuickCategory({ bodyType: 'Pick-up' })}
            className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white/80 transition-colors"
          >
            Pick-ups
          </button>
        </div>
      </div>

      {/* Main Filter Form */}
      <form onSubmit={handleSearchSubmit} className="space-y-4">
        {/* Row 1: Search Input + Main Criteria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1 font-semibold flex items-center gap-1">
              <Search className="w-3 h-3 text-[#D4AF37]" />
              <span>Búsqueda</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ej: BMW, Audi, Hilux..."
                className="w-full bg-[#050505] border border-white/10 px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
          </div>

          {/* Brand Select */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1 font-semibold flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#D4AF37]" />
              <span>Marca</span>
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer"
            >
              <option value="">Todas las Marcas ({cars.length})</option>
              {brands.map(b => (
                <option key={b} value={b}>
                  {b} ({brandCounts[b] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Body Type Select */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1 font-semibold">
              Carrocería
            </label>
            <select
              value={selectedBodyType}
              onChange={(e) => setSelectedBodyType(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer"
            >
              <option value="">Cualquier Carrocería</option>
              <option value="Sedán">Sedán</option>
              <option value="SUV">SUV</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Pick-up">Pick-up</option>
              <option value="Coupé">Coupé</option>
            </select>
          </div>

          {/* Price Preset Select */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1 font-semibold flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-[#D4AF37]" />
              <span>Precio USD</span>
            </label>
            <select
              value={pricePreset}
              onChange={(e) => setPricePreset(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer"
            >
              <option value="all">Cualquier Precio</option>
              <option value="under-25k">Hasta $25.000 USD</option>
              <option value="25k-35k">$25.000 - $35.000 USD</option>
              <option value="35k-50k">$35.000 - $50.000 USD</option>
              <option value="over-50k">Más de $50.000 USD</option>
            </select>
          </div>
        </div>

        {/* Row 2: Secondary Criteria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Year Range */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1 font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#D4AF37]" />
              <span>Año</span>
            </label>
            <select
              value={yearPreset}
              onChange={(e) => setYearPreset(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer"
            >
              <option value="all">Todos los Años</option>
              <option value="2023-plus">2023+ (Más Recientes)</option>
              <option value="2020-2022">2020 - 2022</option>
              <option value="2017-2019">2017 - 2019</option>
              <option value="older">2016 o Anterior</option>
            </select>
          </div>

          {/* Kilometrage */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1 font-semibold flex items-center gap-1">
              <Gauge className="w-3 h-3 text-[#D4AF37]" />
              <span>Kilometraje</span>
            </label>
            <select
              value={kmPreset}
              onChange={(e) => setKmPreset(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer"
            >
              <option value="all">Cualquier Kilometraje</option>
              <option value="under-30k">Menos de 30.000 km</option>
              <option value="under-60k">Menos de 60.000 km</option>
              <option value="under-100k">Menos de 100.000 km</option>
            </select>
          </div>

          {/* Quick toggle advanced filters button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full h-[38px] bg-white/5 border border-white/10 hover:border-white/20 text-white/70 hover:text-white px-3 py-2 text-xs flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{showAdvanced ? 'Menos Filtros' : 'Más Filtros Mecánicos'}</span>
              </span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Criteria (Transmission, Fuel, Checkboxes) */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-[#050505] border border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                {/* Transmission */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1 font-semibold">
                    Transmisión
                  </label>
                  <select
                    value={selectedTransmission}
                    onChange={(e) => setSelectedTransmission(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Cualquier Transmisión</option>
                    <option value="Automática">Automática</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                {/* Fuel */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/50 block mb-1 font-semibold">
                    Combustible
                  </label>
                  <select
                    value={selectedFuel}
                    onChange={(e) => setSelectedFuel(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Cualquier Combustible</option>
                    <option value="Nafta">Nafta</option>
                    <option value="Diésel">Diésel</option>
                    <option value="Híbrido">Híbrido</option>
                  </select>
                </div>

                {/* Checkbox: Único Dueño */}
                <label className="flex items-center gap-2 text-xs text-white/80 hover:text-white cursor-pointer select-none pt-2 sm:pt-4">
                  <input
                    type="checkbox"
                    checked={onlySingleOwner}
                    onChange={(e) => setOnlySingleOwner(e.target.checked)}
                    className="accent-[#D4AF37] cursor-pointer"
                  />
                  <span>Solo Primer / Único Dueño</span>
                </label>

                {/* Checkbox: Destacados */}
                <label className="flex items-center gap-2 text-xs text-white/80 hover:text-white cursor-pointer select-none pt-2 sm:pt-4">
                  <input
                    type="checkbox"
                    checked={onlyFeatured}
                    onChange={(e) => setOnlyFeatured(e.target.checked)}
                    className="accent-[#D4AF37] cursor-pointer"
                  />
                  <span>Solo Unidades Destacadas</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Bottom Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-white/10">
          <div className="text-xs text-white/50 font-light flex items-center gap-2">
            <span>Resultados previstos en tiempo real:</span>
            <span className="font-mono text-[#D4AF37] font-semibold">
              {matchingCars.length} {matchingCars.length === 1 ? 'vehículo' : 'vehículos'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs uppercase font-semibold tracking-wider transition-colors"
              >
                Limpiar
              </button>
            )}

            <button
              type="submit"
              className="flex-1 sm:flex-none px-7 py-3 bg-[#D4AF37] hover:bg-[#c4a02e] text-black text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[#D4AF37]/20"
            >
              <span>Ver Catálogo Filtrado ({matchingCars.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </motion.section>
  );
};
