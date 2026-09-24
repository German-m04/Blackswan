import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, AgencySettings } from '../types';
import { CarCard } from '../components/CarCard';
import { HeroCarousel } from '../components/HeroCarousel';
import { BrandPresentation } from '../components/BrandPresentation';
import { TradeInForm } from '../components/TradeInForm';
import { HomeSearchHero, SearchHeroFilters } from '../components/HomeSearchHero';
import { ArrowRight, Sparkles, RotateCcw, MessageCircle } from 'lucide-react';

interface HomeViewProps {
  cars: Car[];
  onSelectCar: (car: Car) => void;
  onNavigate: (tab: string, filters?: any) => void;
  agencySettings?: AgencySettings;
}

const defaultFilters: SearchHeroFilters = {
  query: '',
  brand: '',
  model: '',
  bodyType: '',
  pricePreset: 'all',
  yearPreset: 'all',
  kmPreset: 'all',
  transmission: '',
  fuel: '',
  onlyFeatured: false,
  onlySingleOwner: false,
  sortBy: 'featured',
};

export const HomeView: React.FC<HomeViewProps> = ({ cars, onSelectCar, onNavigate, agencySettings }) => {
  // Real-time search and filter state for the home hero
  const [filters, setFilters] = useState<SearchHeroFilters>(defaultFilters);

  // Filtered cars shown on the live home results grid
  const filteredCars = useMemo(() => {
    let list = cars.filter((c) => c.status === 'Disponible');

    // 1. Text Search query
    if (filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      list = list.filter((car) => {
        const fullTitle = `${car.brand} ${car.model} ${car.version || ''}`.toLowerCase();
        const desc = (car.description || '').toLowerCase();
        const yearStr = car.year.toString();
        const engine = (car.engine || '').toLowerCase();
        const fuel = (car.fuel || '').toLowerCase();
        const transmission = (car.transmission || '').toLowerCase();

        return (
          fullTitle.includes(q) ||
          desc.includes(q) ||
          yearStr.includes(q) ||
          engine.includes(q) ||
          fuel.includes(q) ||
          transmission.includes(q)
        );
      });
    }

    // 2. Brand
    if (filters.brand) {
      list = list.filter((c) => c.brand.toLowerCase() === filters.brand.toLowerCase());
    }

    // 3. Model
    if (filters.model) {
      list = list.filter((c) => c.model.toLowerCase() === filters.model.toLowerCase());
    }

    // 4. Body Type
    if (filters.bodyType) {
      list = list.filter((c) => c.bodyType === filters.bodyType);
    }

    // 5. Price Preset
    if (filters.pricePreset === 'under-25k') {
      list = list.filter((c) => c.priceUsd <= 25000);
    } else if (filters.pricePreset === 'under-30k') {
      list = list.filter((c) => c.priceUsd <= 30000);
    } else if (filters.pricePreset === '25k-35k') {
      list = list.filter((c) => c.priceUsd >= 25000 && c.priceUsd <= 35000);
    } else if (filters.pricePreset === '35k-50k') {
      list = list.filter((c) => c.priceUsd >= 35000 && c.priceUsd <= 50000);
    } else if (filters.pricePreset === 'over-50k') {
      list = list.filter((c) => c.priceUsd >= 50000);
    }

    // 6. Year Preset
    if (filters.yearPreset === '2024-plus') {
      list = list.filter((c) => c.year >= 2024);
    } else if (filters.yearPreset === '2022-2023') {
      list = list.filter((c) => c.year >= 2022 && c.year <= 2023);
    } else if (filters.yearPreset === '2020-2021') {
      list = list.filter((c) => c.year >= 2020 && c.year <= 2021);
    } else if (filters.yearPreset === '2017-2019') {
      list = list.filter((c) => c.year >= 2017 && c.year <= 2019);
    } else if (filters.yearPreset === 'older') {
      list = list.filter((c) => c.year <= 2016);
    }

    // 7. Mileage Preset
    if (filters.kmPreset === 'under-30k') {
      list = list.filter((c) => c.km <= 30000);
    } else if (filters.kmPreset === 'under-60k') {
      list = list.filter((c) => c.km <= 60000);
    } else if (filters.kmPreset === 'under-100k') {
      list = list.filter((c) => c.km <= 100000);
    }

    // 8. Transmission
    if (filters.transmission) {
      list = list.filter((c) => c.transmission === filters.transmission);
    }

    // 9. Fuel
    if (filters.fuel) {
      list = list.filter((c) => c.fuel === filters.fuel);
    }

    // 10. Only Featured
    if (filters.onlyFeatured) {
      list = list.filter((c) => c.featured);
    }

    // 11. Only Single Owner
    if (filters.onlySingleOwner) {
      list = list.filter((c) => c.singleOwner);
    }

    // Sorting
    const sorted = [...list].sort((a, b) => {
      if (filters.sortBy === 'price-asc') {
        return a.priceUsd - b.priceUsd;
      }
      if (filters.sortBy === 'price-desc') {
        return b.priceUsd - a.priceUsd;
      }
      if (filters.sortBy === 'year-desc') {
        return b.year - a.year;
      }
      if (filters.sortBy === 'km-asc') {
        return a.km - b.km;
      }
      // 'featured'
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.year - a.year;
    });

    return sorted;
  }, [cars, filters]);

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const handleOpenInFullCatalog = () => {
    onNavigate('catalog', {
      searchQuery: filters.query.trim() || undefined,
      brand: filters.brand || undefined,
      bodyType: filters.bodyType || undefined,
      transmission: filters.transmission || undefined,
      fuel: filters.fuel || undefined,
      onlyFeatured: filters.onlyFeatured || undefined,
      onlySingleOwner: filters.onlySingleOwner || undefined,
      sortBy: filters.sortBy,
    });
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
    <div className="space-y-16 pb-16 overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. SECCIÓN INMEDIATA AL ENTRAR: BARRA DE BÚSQUEDA Y TODOS LOS FILTROS     */}
      {/* ========================================================================= */}
      <HomeSearchHero
        cars={cars}
        filters={filters}
        onFiltersChange={setFilters}
        onReset={handleResetFilters}
        matchingCount={filteredCars.length}
      />

      {/* ========================================================================= */}
      {/* 2. GRILLA DE RESULTADOS EN TIEMPO REAL ABAJO DE LA BÚSQUEDA Y FILTROS    */}
      {/* ========================================================================= */}
      <section className="space-y-6" id="inventory-results-grid">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-white/10 pb-5"
        >
          <div>
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#D4AF37] block mb-1.5">
              Inventario Disponible
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-light text-white tracking-tight">
              {hasActiveFilters ? (
                <>Resultados de Búsqueda <span className="text-[#D4AF37] text-xl font-mono">({filteredCars.length})</span></>
              ) : (
                <>Colección de Unidades Seleccionadas <span className="text-white/40 text-xl font-mono">({filteredCars.length})</span></>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] uppercase font-medium tracking-[0.15em] text-white/50 hover:text-[#D4AF37] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Mostrar todos</span>
              </button>
            )}

            <button
              onClick={handleOpenInFullCatalog}
              className="text-[11px] uppercase font-semibold tracking-[0.18em] text-[#D4AF37] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Catálogo Completo ({cars.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Cars Grid */}
        {filteredCars.length === 0 ? (
          <div className="bg-[#070707] border border-white/10 p-10 sm:p-14 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] mx-auto">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-serif text-white">No encontramos vehículos con estos filtros</h3>
              <p className="text-white/40 text-xs font-light max-w-md mx-auto">
                No hay unidades disponibles que coincidan exactamente con todos los criterios seleccionados. Intente ajustar el precio, año o marca.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Restablecer Filtros
              </button>
              <a
                href={`https://wa.me/${agencySettings?.whatsappClean || '5491140008888'}?text=${encodeURIComponent('Hola ' + (agencySettings?.agencyShortName || 'Black Swan') + ', estoy buscando un vehículo específico que no encontré en el inventario.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] font-semibold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Pedir vehículo a medida por WhatsApp</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredCars.map((car) => (
                <CarCard 
                  key={car.id} 
                  car={car} 
                  onSelect={onSelectCar}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Bottom Bar: Quick link to catalog */}
        <div className="pt-3 flex justify-center">
          <button
            onClick={handleOpenInFullCatalog}
            className="px-8 py-3.5 bg-white/5 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white/80 text-[11px] uppercase font-medium tracking-[0.2em] flex items-center gap-2.5 transition-all cursor-pointer"
          >
            <span>Ver Inventario Completo en Formato Extendido</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECCIONES INSTITUCIONALES AL FONDO: CARRUSEL, PRESENTACIÓN, PILARES Y TASACIÓN */}
      {/* ========================================================================= */}
      <div className="border-t border-white/10 pt-16 space-y-16">
        {/* Section title transition */}
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <span className="text-[9.5px] font-mono uppercase tracking-[0.3em] text-[#D4AF37] block">
            Compromiso & Respaldo
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-light text-white tracking-tight">
            Excelencia {agencySettings?.agencyName || 'Black Swan Luxury Cars'}
          </h2>
        </div>

        {/* HERO MODELS CAROUSEL (LLEVADO AL FONDO) */}
        <HeroCarousel 
          cars={cars} 
          onSelectCar={onSelectCar} 
          onNavigateCatalog={() => onNavigate('catalog')} 
        />

        {/* BRAND PRESENTATION HERO (LLEVADO AL FONDO) */}
        <BrandPresentation 
          onNavigateCatalog={() => onNavigate('catalog')}
          onNavigateContact={() => onNavigate('contact')}
          agencySettings={agencySettings}
        />

        {/* WHY CHOOSE BLACK SWAN (NUESTROS PILARES) */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="bg-[#0a0a0a] border border-white/10 p-8 sm:p-12 space-y-10"
        >
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="flex items-center justify-center gap-2 text-[#D4AF37] text-[9.5px] uppercase font-mono tracking-[0.3em]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Estándar de Calidad</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-white font-light tracking-tight">
              {agencySettings?.pillarsTitle || 'Rigurosidad Técnica & Seguridad Jurídica'}
            </h2>
            <p className="text-white/45 text-xs sm:text-sm font-light leading-relaxed max-w-xl mx-auto">
              {agencySettings?.pillarsSubtitle || 'Cada vehículo es sometido a estrictos controles antes de su exhibición para asegurar máxima confiabilidad y entrega inmediata.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-[#050505] p-7 border border-white/5 space-y-3 hover:border-[#D4AF37]/30 transition-colors"
            >
              <div className="text-xs font-mono text-[#D4AF37] tracking-widest">
                01 / INSPECCIÓN
              </div>
              <h3 className="text-lg font-serif text-white font-light">
                {agencySettings?.pillar1Title || 'Peritaje Técnico de 150 Puntos'}
              </h3>
              <p className="text-xs text-white/45 font-light leading-relaxed">
                {agencySettings?.pillar1Desc || 'Diagnóstico electrónico por escáner, verificación de tren rodante, estado de frenos, chasis y medición micrométrica de pintura.'}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-[#050505] p-7 border border-white/5 space-y-3 hover:border-[#D4AF37]/30 transition-colors"
            >
              <div className="text-xs font-mono text-[#D4AF37] tracking-widest">
                02 / GESTORÍA
              </div>
              <h3 className="text-lg font-serif text-white font-light">
                {agencySettings?.pillar2Title || 'Seguridad Documental Garantizada'}
              </h3>
              <p className="text-xs text-white/45 font-light leading-relaxed">
                {agencySettings?.pillar2Desc || 'Auditoría registral completa ante DNRPA. Entregas 100% libres de gravámenes, inhibiciones, multas o deudas de patentes.'}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-[#050505] p-7 border border-white/5 space-y-3 hover:border-[#D4AF37]/30 transition-colors"
            >
              <div className="text-xs font-mono text-[#D4AF37] tracking-widest">
                03 / PERMUTAS
              </div>
              <h3 className="text-lg font-serif text-white font-light">
                {agencySettings?.pillar3Title || 'Valuación Transparente'}
              </h3>
              <p className="text-xs text-white/45 font-light leading-relaxed">
                {agencySettings?.pillar3Desc || 'Cotización profesional de su unidad usada referenciada a valores reales de mercado para aplicarlo como parte de pago.'}
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* TRADE IN APPRAISAL FORM (TASACIÓN AL FONDO) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          <TradeInForm />
        </motion.div>
      </div>
    </div>
  );
};
