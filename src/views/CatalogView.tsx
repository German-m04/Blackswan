import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, FilterState } from '../types';
import { CarCard } from '../components/CarCard';
import { CarListRow } from '../components/CarListRow';
import { 
  Search, 
  X, 
  RotateCcw, 
  SlidersHorizontal,
  Sparkles,
  ArrowUpDown,
  LayoutGrid,
  List,
  DollarSign,
  Gauge,
  Calendar,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';

interface CatalogViewProps {
  cars: Car[];
  onSelectCar: (car: Car) => void;
  initialFilters?: Partial<FilterState>;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ cars, onSelectCar, initialFilters }) => {
  // Inventory Bounds & Metadata
  const bounds = useMemo(() => {
    if (cars.length === 0) {
      return { minPrice: 10000, maxPrice: 100000, minYear: 2012, maxYear: 2026, maxKm: 200000 };
    }
    const prices = cars.map(c => Number(c.priceUsd));
    const years = cars.map(c => Number(c.year));
    const kms = cars.map(c => Number(c.km));

    return {
      minPrice: Math.floor(Math.min(...prices) / 5000) * 5000,
      maxPrice: Math.ceil(Math.max(...prices) / 5000) * 5000,
      minYear: Math.min(...years),
      maxYear: Math.max(...years, 2026),
      maxKm: Math.ceil(Math.max(...kms) / 10000) * 10000
    };
  }, [cars]);

  // Main Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(initialFilters?.brand || '');
  const [selectedBodyType, setSelectedBodyType] = useState(initialFilters?.bodyType || '');
  const [selectedTransmission, setSelectedTransmission] = useState(initialFilters?.transmission || '');
  const [selectedFuel, setSelectedFuel] = useState(initialFilters?.fuel || '');
  
  // Advanced Price Range State
  const [minPriceUsd, setMinPriceUsd] = useState<number>(initialFilters?.minPriceUsd ?? 0);
  const [maxPriceUsd, setMaxPriceUsd] = useState<number>(initialFilters?.maxPriceUsd ?? bounds.maxPrice);
  const [selectedPricePreset, setSelectedPricePreset] = useState<string>('all');

  // Advanced Mileage Range State
  const [minKm, setMinKm] = useState<number>(initialFilters?.minKm ?? 0);
  const [maxKm, setMaxKm] = useState<number>(initialFilters?.maxKm ?? bounds.maxKm);
  const [selectedKmPreset, setSelectedKmPreset] = useState<string>('all');

  // Advanced Year Range State
  const [minYear, setMinYear] = useState<number>(initialFilters?.minYear ?? bounds.minYear);
  const [maxYear, setMaxYear] = useState<number>(initialFilters?.maxYear ?? bounds.maxYear);
  const [selectedYearPreset, setSelectedYearPreset] = useState<string>('all');

  // View & UI State
  const [sortBy, setSortBy] = useState<FilterState['sortBy']>(initialFilters?.sortBy || 'featured');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [onlyFeatured, setOnlyFeatured] = useState<boolean>(false);
  const [onlySingleOwner, setOnlySingleOwner] = useState<boolean>(false);

  // Quick Top Shortcuts
  const [activeShortcut, setActiveShortcut] = useState<string>('all');

  // Collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    price: false,
    km: false,
    year: false,
    specs: false
  });

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Sync initial filters if updated
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.searchQuery !== undefined) setSearchQuery(initialFilters.searchQuery);
      if (initialFilters.brand !== undefined) setSelectedBrand(initialFilters.brand);
      if (initialFilters.bodyType !== undefined) setSelectedBodyType(initialFilters.bodyType);
      if (initialFilters.transmission !== undefined) setSelectedTransmission(initialFilters.transmission);
      if (initialFilters.fuel !== undefined) setSelectedFuel(initialFilters.fuel);
      if (initialFilters.minPriceUsd !== undefined) setMinPriceUsd(initialFilters.minPriceUsd);
      if (initialFilters.maxPriceUsd !== undefined) setMaxPriceUsd(initialFilters.maxPriceUsd);
      if (initialFilters.minKm !== undefined) setMinKm(initialFilters.minKm);
      if (initialFilters.maxKm !== undefined) setMaxKm(initialFilters.maxKm);
      if (initialFilters.minYear !== undefined) setMinYear(initialFilters.minYear);
      if (initialFilters.maxYear !== undefined) setMaxYear(initialFilters.maxYear);
      if (initialFilters.onlyFeatured !== undefined) setOnlyFeatured(initialFilters.onlyFeatured);
      if (initialFilters.onlySingleOwner !== undefined) setOnlySingleOwner(initialFilters.onlySingleOwner);
      if (initialFilters.sortBy) setSortBy(initialFilters.sortBy);
    }
  }, [initialFilters]);

  // Unique Lists for selects
  const availableBrands = useMemo(() => {
    const brands = Array.from(new Set(cars.map((c) => c.brand)));
    return brands.sort();
  }, [cars]);

  const availableYears: number[] = useMemo(() => {
    const yearSet = new Set<number>(cars.map((c) => Number(c.year)));
    return Array.from(yearSet).sort((a: number, b: number) => b - a);
  }, [cars]);

  // Brand Counts for badges
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cars.forEach(c => {
      counts[c.brand] = (counts[c.brand] || 0) + 1;
    });
    return counts;
  }, [cars]);

  // Price Presets Handler
  const handlePricePreset = (preset: string) => {
    setSelectedPricePreset(preset);
    if (preset === 'all') {
      setMinPriceUsd(0);
      setMaxPriceUsd(bounds.maxPrice);
    } else if (preset === 'under-25k') {
      setMinPriceUsd(0);
      setMaxPriceUsd(25000);
    } else if (preset === '25k-35k') {
      setMinPriceUsd(25000);
      setMaxPriceUsd(35000);
    } else if (preset === '35k-50k') {
      setMinPriceUsd(35000);
      setMaxPriceUsd(50000);
    } else if (preset === 'over-50k') {
      setMinPriceUsd(50000);
      setMaxPriceUsd(bounds.maxPrice);
    }
  };

  // KM Presets Handler
  const handleKmPreset = (preset: string) => {
    setSelectedKmPreset(preset);
    if (preset === 'all') {
      setMinKm(0);
      setMaxKm(bounds.maxKm);
    } else if (preset === 'under-30k') {
      setMinKm(0);
      setMaxKm(30000);
    } else if (preset === '30k-60k') {
      setMinKm(30000);
      setMaxKm(60000);
    } else if (preset === '60k-100k') {
      setMinKm(60000);
      setMaxKm(100000);
    } else if (preset === 'over-100k') {
      setMinKm(100000);
      setMaxKm(bounds.maxKm);
    }
  };

  // Year Presets Handler
  const handleYearPreset = (preset: string) => {
    setSelectedYearPreset(preset);
    if (preset === 'all') {
      setMinYear(bounds.minYear);
      setMaxYear(bounds.maxYear);
    } else if (preset === '2023-plus') {
      setMinYear(2023);
      setMaxYear(bounds.maxYear);
    } else if (preset === '2020-2022') {
      setMinYear(2020);
      setMaxYear(2022);
    } else if (preset === '2017-2019') {
      setMinYear(2017);
      setMaxYear(2019);
    } else if (preset === 'older') {
      setMinYear(bounds.minYear);
      setMaxYear(2016);
    }
  };

  // Quick Top Shortcut Buttons Handler
  const handleQuickShortcut = (key: string) => {
    setActiveShortcut(key);
    if (key === 'all') {
      resetFilters();
    } else if (key === 'featured') {
      resetFilters();
      setOnlyFeatured(true);
      setActiveShortcut('featured');
    } else if (key === 'under-30k') {
      resetFilters();
      setMaxPriceUsd(30000);
      setSelectedPricePreset('under-25k');
      setActiveShortcut('under-30k');
    } else if (key === 'low-km') {
      resetFilters();
      setMaxKm(30000);
      setSelectedKmPreset('under-30k');
      setActiveShortcut('low-km');
    } else if (key === 'new-years') {
      resetFilters();
      setMinYear(2022);
      setSelectedYearPreset('2023-plus');
      setActiveShortcut('new-years');
    } else if (key === 'suv') {
      resetFilters();
      setSelectedBodyType('SUV');
      setActiveShortcut('suv');
    } else if (key === 'hybrid') {
      resetFilters();
      setSelectedFuel('Híbrido');
      setActiveShortcut('hybrid');
    }
  };

  // Filter and Sort Engine
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      // Search query (title, brand, model, engine, description)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = car.title.toLowerCase().includes(q);
        const matchBrand = car.brand.toLowerCase().includes(q);
        const matchModel = car.model.toLowerCase().includes(q);
        const matchEngine = car.engine?.toLowerCase().includes(q);
        if (!matchTitle && !matchBrand && !matchModel && !matchEngine) return false;
      }

      // Brand
      if (selectedBrand && car.brand !== selectedBrand) return false;

      // Body Type
      if (selectedBodyType && car.bodyType !== selectedBodyType) return false;

      // Transmission
      if (selectedTransmission && car.transmission !== selectedTransmission) return false;

      // Fuel
      if (selectedFuel && car.fuel !== selectedFuel) return false;

      // Price USD Range
      if (car.priceUsd < minPriceUsd || car.priceUsd > maxPriceUsd) return false;

      // Kilometrage Range
      if (car.km < minKm || car.km > maxKm) return false;

      // Year Range
      if (car.year < minYear || car.year > maxYear) return false;

      // Only Featured toggle
      if (onlyFeatured && !car.featured) return false;

      // Only Single Owner toggle
      if (onlySingleOwner && !car.singleOwner) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'featured') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.year - a.year;
      }
      if (sortBy === 'price-asc') return a.priceUsd - b.priceUsd;
      if (sortBy === 'price-desc') return b.priceUsd - a.priceUsd;
      if (sortBy === 'year-desc') return b.year - a.year;
      if (sortBy === 'km-asc') return a.km - b.km;
      return 0;
    });
  }, [
    cars,
    searchQuery,
    selectedBrand,
    selectedBodyType,
    selectedTransmission,
    selectedFuel,
    minPriceUsd,
    maxPriceUsd,
    minKm,
    maxKm,
    minYear,
    maxYear,
    onlyFeatured,
    onlySingleOwner,
    sortBy
  ]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedBrand('');
    setSelectedBodyType('');
    setSelectedTransmission('');
    setSelectedFuel('');
    setMinPriceUsd(0);
    setMaxPriceUsd(bounds.maxPrice);
    setSelectedPricePreset('all');
    setMinKm(0);
    setMaxKm(bounds.maxKm);
    setSelectedKmPreset('all');
    setMinYear(bounds.minYear);
    setMaxYear(bounds.maxYear);
    setSelectedYearPreset('all');
    setOnlyFeatured(false);
    setOnlySingleOwner(false);
    setSortBy('featured');
    setActiveShortcut('all');
  };

  // Active filters count & list for pill tags
  const activeFilters = useMemo(() => {
    const list: Array<{ id: string; label: string; onRemove: () => void }> = [];

    if (searchQuery.trim()) {
      list.push({
        id: 'search',
        label: `Búsqueda: "${searchQuery}"`,
        onRemove: () => setSearchQuery('')
      });
    }

    if (selectedBrand) {
      list.push({
        id: 'brand',
        label: `Marca: ${selectedBrand}`,
        onRemove: () => setSelectedBrand('')
      });
    }

    if (selectedBodyType) {
      list.push({
        id: 'body',
        label: `Carrocería: ${selectedBodyType}`,
        onRemove: () => setSelectedBodyType('')
      });
    }

    if (minPriceUsd > 0 || maxPriceUsd < bounds.maxPrice) {
      list.push({
        id: 'price',
        label: `Precio: $${minPriceUsd.toLocaleString()} - $${maxPriceUsd.toLocaleString()} USD`,
        onRemove: () => {
          setMinPriceUsd(0);
          setMaxPriceUsd(bounds.maxPrice);
          setSelectedPricePreset('all');
        }
      });
    }

    if (minKm > 0 || maxKm < bounds.maxKm) {
      list.push({
        id: 'km',
        label: `KM: ${minKm.toLocaleString()} - ${maxKm.toLocaleString()} km`,
        onRemove: () => {
          setMinKm(0);
          setMaxKm(bounds.maxKm);
          setSelectedKmPreset('all');
        }
      });
    }

    if (minYear > bounds.minYear || maxYear < bounds.maxYear) {
      list.push({
        id: 'year',
        label: `Año: ${minYear} - ${maxYear}`,
        onRemove: () => {
          setMinYear(bounds.minYear);
          setMaxYear(bounds.maxYear);
          setSelectedYearPreset('all');
        }
      });
    }

    if (selectedTransmission) {
      list.push({
        id: 'transmission',
        label: `Caja: ${selectedTransmission}`,
        onRemove: () => setSelectedTransmission('')
      });
    }

    if (selectedFuel) {
      list.push({
        id: 'fuel',
        label: `Combustible: ${selectedFuel}`,
        onRemove: () => setSelectedFuel('')
      });
    }

    if (onlyFeatured) {
      list.push({
        id: 'featured',
        label: 'Solo Destacados',
        onRemove: () => setOnlyFeatured(false)
      });
    }

    if (onlySingleOwner) {
      list.push({
        id: 'singleOwner',
        label: 'Solo Único Dueño',
        onRemove: () => setOnlySingleOwner(false)
      });
    }

    return list;
  }, [
    searchQuery,
    selectedBrand,
    selectedBodyType,
    minPriceUsd,
    maxPriceUsd,
    minKm,
    maxKm,
    minYear,
    maxYear,
    selectedTransmission,
    selectedFuel,
    onlyFeatured,
    onlySingleOwner,
    bounds
  ]);

  const formatPriceUsd = (num: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  const formatKm = (num: number) =>
    new Intl.NumberFormat('es-AR').format(num) + ' km';

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#0a0a0a] border border-white/10 p-6 sm:p-10 space-y-3 relative overflow-hidden"
      >
        <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-xs uppercase tracking-[0.3em]">
          <Sparkles className="w-4 h-4" />
          <span>Curated Inventory</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif text-white font-light">
          Colección de Usados Seleccionados
        </h1>
        <p className="text-white/40 text-xs font-light max-w-2xl leading-relaxed">
          Encuentre su vehículo ideal utilizando los filtros de alta precisión por rango de precio USD, kilometraje certificado, año y características mecánicas.
        </p>

        {/* Quick Shortcut Pills */}
        <div className="pt-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 shrink-0 mr-1">
            Accesos rápidos:
          </span>
          <button
            onClick={() => handleQuickShortcut('all')}
            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-none border shrink-0 transition-all ${
              activeShortcut === 'all' && activeFilters.length === 0
                ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30 hover:text-white'
            }`}
          >
            Todos ({cars.length})
          </button>
          <button
            onClick={() => handleQuickShortcut('featured')}
            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-none border shrink-0 transition-all ${
              activeShortcut === 'featured' || onlyFeatured
                ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30 hover:text-white'
            }`}
          >
            ★ Destacados
          </button>
          <button
            onClick={() => handleQuickShortcut('under-30k')}
            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-none border shrink-0 transition-all ${
              activeShortcut === 'under-30k'
                ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30 hover:text-white'
            }`}
          >
            &lt; $30.000 USD
          </button>
          <button
            onClick={() => handleQuickShortcut('low-km')}
            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-none border shrink-0 transition-all ${
              activeShortcut === 'low-km'
                ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30 hover:text-white'
            }`}
          >
            &lt; 30.000 km
          </button>
          <button
            onClick={() => handleQuickShortcut('new-years')}
            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-none border shrink-0 transition-all ${
              activeShortcut === 'new-years'
                ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30 hover:text-white'
            }`}
          >
            Modelos 2022+
          </button>
          <button
            onClick={() => handleQuickShortcut('suv')}
            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-none border shrink-0 transition-all ${
              activeShortcut === 'suv'
                ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30 hover:text-white'
            }`}
          >
            SUVs
          </button>
          <button
            onClick={() => handleQuickShortcut('hybrid')}
            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-none border shrink-0 transition-all ${
              activeShortcut === 'hybrid'
                ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30 hover:text-white'
            }`}
          >
            Híbridos
          </button>
        </div>
      </motion.div>

      {/* Main Grid with Filters Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* ============================================================== */}
        {/* DESKTOP ADVANCED SIDEBAR FILTERS */}
        {/* ============================================================== */}
        <aside className="hidden lg:block space-y-5 bg-[#0a0a0a] border border-white/10 p-5 h-fit sticky top-24">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xs font-serif text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Filtros Avanzados</span>
              {activeFilters.length > 0 && (
                <span className="px-1.5 py-0.2 bg-[#D4AF37] text-black text-[9px] font-bold">
                  {activeFilters.length}
                </span>
              )}
            </h3>
            {activeFilters.length > 0 && (
              <button
                onClick={resetFilters}
                className="text-[10px] uppercase font-bold tracking-wider text-white/40 hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
                title="Restablecer todos los filtros"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          {/* 1. ADVANCED PRICE RANGE (RANGO DE PRECIO) */}
          <div className="border-b border-white/5 pb-4 space-y-3">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('price')}
            >
              <label className="text-white text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5 cursor-pointer">
                <DollarSign className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Rango de Precio (USD)</span>
              </label>
              {collapsedSections.price ? (
                <ChevronDown className="w-3.5 h-3.5 text-white/40" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-white/40" />
              )}
            </div>

            {!collapsedSections.price && (
              <div className="space-y-3 pt-1">
                {/* Presets Chips */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', label: 'Cualquiera' },
                    { id: 'under-25k', label: '< $25.000' },
                    { id: '25k-35k', label: '$25k - $35k' },
                    { id: '35k-50k', label: '$35k - $50k' },
                    { id: 'over-50k', label: '> $50.000' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => handlePricePreset(p.id)}
                      className={`text-[10px] py-1 px-2 border transition-all text-left ${
                        selectedPricePreset === p.id && (minPriceUsd > 0 || maxPriceUsd < bounds.maxPrice || p.id === 'all')
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] font-semibold'
                          : 'border-white/5 bg-[#050505] text-white/60 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Min / Max Inputs */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Mínimo USD</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 text-xs">$</span>
                      <input
                        type="number"
                        min={0}
                        max={maxPriceUsd}
                        step={1000}
                        value={minPriceUsd || ''}
                        placeholder="0"
                        onChange={(e) => {
                          setSelectedPricePreset('custom');
                          setMinPriceUsd(Math.max(0, Number(e.target.value)));
                        }}
                        className="w-full bg-[#050505] border border-white/10 pl-6 pr-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Máximo USD</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 text-xs">$</span>
                      <input
                        type="number"
                        min={minPriceUsd}
                        max={150000}
                        step={1000}
                        value={maxPriceUsd || ''}
                        placeholder={bounds.maxPrice.toString()}
                        onChange={(e) => {
                          setSelectedPricePreset('custom');
                          setMaxPriceUsd(Number(e.target.value));
                        }}
                        className="w-full bg-[#050505] border border-white/10 pl-6 pr-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>

                {/* Range Slider for Max Price */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-white/40 font-mono">
                    <span>{formatPriceUsd(minPriceUsd)}</span>
                    <span className="text-[#D4AF37] font-semibold">{formatPriceUsd(maxPriceUsd)}</span>
                  </div>
                  <input
                    type="range"
                    min={minPriceUsd || 10000}
                    max={100000}
                    step={2500}
                    value={maxPriceUsd}
                    onChange={(e) => {
                      setSelectedPricePreset('custom');
                      setMaxPriceUsd(Number(e.target.value));
                    }}
                    className="w-full accent-[#D4AF37] cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. ADVANCED MILEAGE RANGE (KILOMETRAJE) */}
          <div className="border-b border-white/5 pb-4 space-y-3">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('km')}
            >
              <label className="text-white text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5 cursor-pointer">
                <Gauge className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Kilometraje (KM)</span>
              </label>
              {collapsedSections.km ? (
                <ChevronDown className="w-3.5 h-3.5 text-white/40" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-white/40" />
              )}
            </div>

            {!collapsedSections.km && (
              <div className="space-y-3 pt-1">
                {/* Presets Chips */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', label: 'Cualquier km' },
                    { id: 'under-30k', label: '< 30.000 km' },
                    { id: '30k-60k', label: '30k - 60k km' },
                    { id: '60k-100k', label: '60k - 100k km' },
                    { id: 'over-100k', label: '> 100.000 km' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleKmPreset(p.id)}
                      className={`text-[10px] py-1 px-2 border transition-all text-left ${
                        selectedKmPreset === p.id && (minKm > 0 || maxKm < bounds.maxKm || p.id === 'all')
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] font-semibold'
                          : 'border-white/5 bg-[#050505] text-white/60 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Min / Max Inputs */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Mínimo km</span>
                    <input
                      type="number"
                      min={0}
                      max={maxKm}
                      step={5000}
                      value={minKm || ''}
                      placeholder="0"
                      onChange={(e) => {
                        setSelectedKmPreset('custom');
                        setMinKm(Math.max(0, Number(e.target.value)));
                      }}
                      className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Máximo km</span>
                    <input
                      type="number"
                      min={minKm}
                      max={200000}
                      step={5000}
                      value={maxKm || ''}
                      placeholder={bounds.maxKm.toString()}
                      onChange={(e) => {
                        setSelectedKmPreset('custom');
                        setMaxKm(Number(e.target.value));
                      }}
                      className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Range Slider for Max KM */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-white/40 font-mono">
                    <span>{formatKm(minKm)}</span>
                    <span className="text-[#D4AF37] font-semibold">{formatKm(maxKm)}</span>
                  </div>
                  <input
                    type="range"
                    min={minKm || 0}
                    max={200000}
                    step={5000}
                    value={maxKm}
                    onChange={(e) => {
                      setSelectedKmPreset('custom');
                      setMaxKm(Number(e.target.value));
                    }}
                    className="w-full accent-[#D4AF37] cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. ADVANCED YEAR RANGE (RANGO DE AÑO) */}
          <div className="border-b border-white/5 pb-4 space-y-3">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('year')}
            >
              <label className="text-white text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5 cursor-pointer">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Rango de Año</span>
              </label>
              {collapsedSections.year ? (
                <ChevronDown className="w-3.5 h-3.5 text-white/40" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-white/40" />
              )}
            </div>

            {!collapsedSections.year && (
              <div className="space-y-3 pt-1">
                {/* Presets Chips */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', label: 'Todos los años' },
                    { id: '2023-plus', label: '2023+ (Nuevos)' },
                    { id: '2020-2022', label: '2020 - 2022' },
                    { id: '2017-2019', label: '2017 - 2019' },
                    { id: 'older', label: '≤ 2016' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleYearPreset(p.id)}
                      className={`text-[10px] py-1 px-2 border transition-all text-left ${
                        selectedYearPreset === p.id && (minYear > bounds.minYear || maxYear < bounds.maxYear || p.id === 'all')
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] font-semibold'
                          : 'border-white/5 bg-[#050505] text-white/60 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Dual Selects: Año Desde y Año Hasta */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Año Desde</span>
                    <select
                      value={minYear}
                      onChange={(e) => {
                        setSelectedYearPreset('custom');
                        setMinYear(Number(e.target.value));
                      }}
                      className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
                    >
                      {[...availableYears].sort((a, b) => a - b).map((y) => (
                        <option key={`from-${y}`} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Año Hasta</span>
                    <select
                      value={maxYear}
                      onChange={(e) => {
                        setSelectedYearPreset('custom');
                        setMaxYear(Number(e.target.value));
                      }}
                      className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
                    >
                      {[...availableYears].sort((a, b) => b - a).map((y) => (
                        <option key={`to-${y}`} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. BRAND & BODY TYPE & MECHANICS */}
          <div className="border-b border-white/5 pb-4 space-y-3">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('specs')}
            >
              <label className="text-white text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5 cursor-pointer">
                <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Marca & Mecánica</span>
              </label>
              {collapsedSections.specs ? (
                <ChevronDown className="w-3.5 h-3.5 text-white/40" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-white/40" />
              )}
            </div>

            {!collapsedSections.specs && (
              <div className="space-y-3 pt-1">
                {/* Brand */}
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Marca</span>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Todas las Marcas ({cars.length})</option>
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>
                        {b} ({brandCounts[b] || 0})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Body Type */}
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Carrocería</span>
                  <select
                    value={selectedBodyType}
                    onChange={(e) => setSelectedBodyType(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Todas las Carrocerías</option>
                    <option value="Sedán">Sedán</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="SUV">SUV</option>
                    <option value="Pick-up">Pick-up</option>
                    <option value="Coupé">Coupé</option>
                  </select>
                </div>

                {/* Transmission */}
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Transmisión</span>
                  <select
                    value={selectedTransmission}
                    onChange={(e) => setSelectedTransmission(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Cualquier Transmisión</option>
                    <option value="Automática">Automática</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                {/* Fuel */}
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Combustible</span>
                  <select
                    value={selectedFuel}
                    onChange={(e) => setSelectedFuel(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Cualquier Combustible</option>
                    <option value="Nafta">Nafta</option>
                    <option value="Diésel">Diésel</option>
                    <option value="Híbrido">Híbrido</option>
                  </select>
                </div>

                {/* Checkboxes: Unique Owner & Featured */}
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <label className="flex items-center gap-2 text-xs text-white/70 hover:text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlySingleOwner}
                      onChange={(e) => setOnlySingleOwner(e.target.checked)}
                      className="accent-[#D4AF37] rounded-none cursor-pointer"
                    />
                    <span>Solo Primer Dueño</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-white/70 hover:text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyFeatured}
                      onChange={(e) => setOnlyFeatured(e.target.checked)}
                      className="accent-[#D4AF37] rounded-none cursor-pointer"
                    />
                    <span>Solo Destacados</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ============================================================== */}
        {/* CONTENT COLUMN: SEARCH, CONTROLS & RESULTS */}
        {/* ============================================================== */}
        <div className="lg:col-span-3 space-y-5">
          {/* Top Bar: Search, Sorting & View Toggles */}
          <div className="bg-[#0a0a0a] border border-white/10 p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar por marca, modelo, versión o motor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 pl-9 pr-8 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
              {/* Mobile filter button */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden px-3 py-2 bg-[#050505] border border-white/10 text-xs text-white hover:border-[#D4AF37] flex items-center gap-2"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[10px] uppercase tracking-wider font-bold">Filtros</span>
                {activeFilters.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#D4AF37] text-black text-[9px] font-bold">
                    {activeFilters.length}
                  </span>
                )}
              </button>

              {/* Sort dropdown */}
              <div className="flex items-center gap-1.5 bg-[#050505] border border-white/10 px-2.5 py-1.5 text-xs text-white">
                <ArrowUpDown className="w-3 h-3 text-[#D4AF37] shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white focus:outline-none text-xs cursor-pointer"
                >
                  <option value="featured">Destacados primero</option>
                  <option value="price-asc">Menor Precio USD</option>
                  <option value="price-desc">Mayor Precio USD</option>
                  <option value="year-desc">Año Más Nuevo</option>
                  <option value="km-asc">Menor Kilometraje</option>
                </select>
              </div>

              {/* View Mode Switcher (Grid / List) */}
              <div className="hidden sm:flex items-center border border-white/10 bg-[#050505] p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-[#D4AF37] text-black shadow-sm' 
                      : 'text-white/40 hover:text-white'
                  }`}
                  title="Vista Cuadrícula"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-[#D4AF37] text-black shadow-sm' 
                      : 'text-white/40 hover:text-white'
                  }`}
                  title="Vista Lista Detallada"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Badges Pill Bar */}
          {activeFilters.length > 0 && (
            <div className="bg-[#0a0a0a] border border-white/10 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 mr-1">
                  Filtros activos:
                </span>
                {activeFilters.map((af) => (
                  <span 
                    key={af.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/15 text-white text-[11px] hover:border-[#D4AF37]/50 transition-colors"
                  >
                    <span>{af.label}</span>
                    <button 
                      onClick={af.onRemove} 
                      className="text-white/40 hover:text-white ml-0.5"
                      title="Quitar filtro"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <button
                onClick={resetFilters}
                className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] hover:underline whitespace-nowrap ml-auto"
              >
                Limpiar Todo
              </button>
            </div>
          )}

          {/* Results Counter Summary */}
          <div className="flex items-center justify-between text-xs text-white/50 px-1">
            <div>
              Mostrando <strong className="text-[#D4AF37] font-semibold">{filteredCars.length}</strong> de {cars.length} vehículos certificados
            </div>
            {filteredCars.length > 0 && (
              <span className="text-[11px] text-white/40 font-mono">
                Actualizado en tiempo real
              </span>
            )}
          </div>

          {/* Cars Grid or List */}
          {filteredCars.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#0a0a0a] border border-white/10 p-12 text-center space-y-4"
            >
              <Search className="w-10 h-10 text-white/20 mx-auto" />
              <h3 className="text-lg font-serif text-white">No se encontraron unidades</h3>
              <p className="text-xs text-white/40 max-w-md mx-auto font-light leading-relaxed">
                No hay resultados que coincidan con sus criterios de búsqueda o rangos aplicados. Intente ajustar el rango de precio, kilometraje o año.
              </p>
              <div className="pt-2">
                <button
                  onClick={resetFilters}
                  className="px-6 py-2.5 bg-[#D4AF37] text-black text-[10px] uppercase font-bold tracking-widest hover:bg-[#c4a02e] transition-all"
                >
                  Restablecer Todos los Filtros
                </button>
              </div>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCars.map((car) => (
                <CarCard 
                  key={car.id} 
                  car={car} 
                  onSelect={onSelectCar}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCars.map((car) => (
                <CarListRow 
                  key={car.id} 
                  car={car} 
                  onSelect={onSelectCar}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MOBILE FULL ADVANCED FILTERS DRAWER */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex justify-end lg:hidden">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-[#050505] h-full flex flex-col border-l border-white/10"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/10 p-5 shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="font-serif text-white text-base tracking-wide">Filtros Avanzados</h3>
                </div>
                <button 
                  onClick={() => setShowMobileFilters(false)} 
                  className="text-white/40 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body Scrollable */}
              <div className="p-5 overflow-y-auto flex-1 space-y-6 text-xs">
                {/* Price Filter Mobile */}
                <div className="space-y-3 border-b border-white/10 pb-5">
                  <label className="text-white uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Rango de Precio (USD)</span>
                  </label>

                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'all', label: 'Cualquiera' },
                      { id: 'under-25k', label: '< $25k' },
                      { id: '25k-35k', label: '$25k - $35k' },
                      { id: '35k-50k', label: '$35k - $50k' },
                      { id: 'over-50k', label: '> $50k' }
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => handlePricePreset(p.id)}
                        className={`text-[10px] py-1.5 px-2 border transition-all text-left ${
                          selectedPricePreset === p.id
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] font-semibold'
                            : 'border-white/10 bg-[#0a0a0a] text-white/70'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Mínimo USD</span>
                      <input
                        type="number"
                        min={0}
                        max={maxPriceUsd}
                        step={1000}
                        value={minPriceUsd || ''}
                        placeholder="0"
                        onChange={(e) => {
                          setSelectedPricePreset('custom');
                          setMinPriceUsd(Math.max(0, Number(e.target.value)));
                        }}
                        className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Máximo USD</span>
                      <input
                        type="number"
                        min={minPriceUsd}
                        max={150000}
                        step={1000}
                        value={maxPriceUsd || ''}
                        placeholder={bounds.maxPrice.toString()}
                        onChange={(e) => {
                          setSelectedPricePreset('custom');
                          setMaxPriceUsd(Number(e.target.value));
                        }}
                        className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* KM Filter Mobile */}
                <div className="space-y-3 border-b border-white/10 pb-5">
                  <label className="text-white uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Kilometraje (KM)</span>
                  </label>

                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'all', label: 'Cualquiera' },
                      { id: 'under-30k', label: '< 30.000 km' },
                      { id: '30k-60k', label: '30k - 60k km' },
                      { id: '60k-100k', label: '60k - 100k km' },
                      { id: 'over-100k', label: '> 100k km' }
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleKmPreset(p.id)}
                        className={`text-[10px] py-1.5 px-2 border transition-all text-left ${
                          selectedKmPreset === p.id
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] font-semibold'
                            : 'border-white/10 bg-[#0a0a0a] text-white/70'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Mínimo km</span>
                      <input
                        type="number"
                        min={0}
                        max={maxKm}
                        step={5000}
                        value={minKm || ''}
                        placeholder="0"
                        onChange={(e) => {
                          setSelectedKmPreset('custom');
                          setMinKm(Math.max(0, Number(e.target.value)));
                        }}
                        className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Máximo km</span>
                      <input
                        type="number"
                        min={minKm}
                        max={200000}
                        step={5000}
                        value={maxKm || ''}
                        placeholder={bounds.maxKm.toString()}
                        onChange={(e) => {
                          setSelectedKmPreset('custom');
                          setMaxKm(Number(e.target.value));
                        }}
                        className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Year Filter Mobile */}
                <div className="space-y-3 border-b border-white/10 pb-5">
                  <label className="text-white uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Rango de Año</span>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Desde</span>
                      <select
                        value={minYear}
                        onChange={(e) => setMinYear(Number(e.target.value))}
                        className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-2 text-white"
                      >
                        {[...availableYears].sort((a, b) => a - b).map((y) => (
                          <option key={`m-from-${y}`} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-1">Hasta</span>
                      <select
                        value={maxYear}
                        onChange={(e) => setMaxYear(Number(e.target.value))}
                        className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-2 text-white"
                      >
                        {[...availableYears].sort((a, b) => b - a).map((y) => (
                          <option key={`m-to-${y}`} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Brand & Body Type Mobile */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/50 text-[10px] uppercase tracking-widest font-medium mb-1">Marca</label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white"
                    >
                      <option value="">Todas las Marcas</option>
                      {availableBrands.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/50 text-[10px] uppercase tracking-widest font-medium mb-1">Carrocería</label>
                    <select
                      value={selectedBodyType}
                      onChange={(e) => setSelectedBodyType(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white"
                    >
                      <option value="">Todas</option>
                      <option value="Sedán">Sedán</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="SUV">SUV</option>
                      <option value="Pick-up">Pick-up</option>
                      <option value="Coupé">Coupé</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-white/10 bg-[#070707] space-y-2 shrink-0">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full py-3 bg-[#D4AF37] text-black font-bold uppercase tracking-widest text-[10px] hover:bg-[#c4a02e] transition-all shadow-lg"
                >
                  Ver {filteredCars.length} Vehículos
                </button>
                <button
                  onClick={resetFilters}
                  className="w-full py-2 bg-transparent text-white/50 hover:text-white font-medium uppercase tracking-wider text-[10px]"
                >
                  Limpiar Todos los Filtros
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
