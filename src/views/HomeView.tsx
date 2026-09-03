import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car } from '../types';
import { CarCard } from '../components/CarCard';
import { HeroCarousel } from '../components/HeroCarousel';
import { BrandPresentation } from '../components/BrandPresentation';
import { TradeInForm } from '../components/TradeInForm';
import { HomeSearchWidget } from '../components/HomeSearchWidget';
import { ArrowRight, Sparkles, Filter } from 'lucide-react';

interface HomeViewProps {
  cars: Car[];
  onSelectCar: (car: Car) => void;
  onNavigate: (tab: string, filters?: any) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ cars, onSelectCar, onNavigate }) => {
  // Quick filter tab for the home showcase section
  const [homeFilterCategory, setHomeFilterCategory] = useState<string>('featured');

  // Filtered cars shown on the home preview grid
  const showcasedCars = useMemo(() => {
    let list = cars.filter((c) => c.status === 'Disponible');

    if (homeFilterCategory === 'featured') {
      list = list.filter((c) => c.featured);
    } else if (homeFilterCategory === 'suv') {
      list = list.filter((c) => c.bodyType === 'SUV');
    } else if (homeFilterCategory === 'sedan') {
      list = list.filter((c) => c.bodyType === 'Sedán');
    } else if (homeFilterCategory === 'hybrid') {
      list = list.filter((c) => c.fuel === 'Híbrido');
    } else if (homeFilterCategory === 'under-30k') {
      list = list.filter((c) => c.priceUsd <= 30000);
    } else if (homeFilterCategory === 'low-km') {
      list = list.filter((c) => c.km <= 30000);
    } else if (homeFilterCategory === 'single-owner') {
      list = list.filter((c) => c.singleOwner);
    }

    return list.slice(0, 8);
  }, [cars, homeFilterCategory]);

  const handleShowcaseCategoryChange = (key: string) => {
    setHomeFilterCategory(key);
  };

  const handleOpenFullCategoryCatalog = () => {
    if (homeFilterCategory === 'featured') {
      onNavigate('catalog', { onlyFeatured: true });
    } else if (homeFilterCategory === 'suv') {
      onNavigate('catalog', { bodyType: 'SUV' });
    } else if (homeFilterCategory === 'sedan') {
      onNavigate('catalog', { bodyType: 'Sedán' });
    } else if (homeFilterCategory === 'hybrid') {
      onNavigate('catalog', { fuel: 'Híbrido' });
    } else if (homeFilterCategory === 'under-30k') {
      onNavigate('catalog', { maxPriceUsd: 30000 });
    } else if (homeFilterCategory === 'low-km') {
      onNavigate('catalog', { maxKm: 30000 });
    } else if (homeFilterCategory === 'single-owner') {
      onNavigate('catalog', { onlySingleOwner: true });
    } else {
      onNavigate('catalog');
    }
  };

  return (
    <div className="space-y-16 pb-12 overflow-hidden">
      {/* BRAND PRESENTATION HERO */}
      <BrandPresentation 
        onNavigateCatalog={() => onNavigate('catalog')}
        onNavigateContact={() => onNavigate('contact')}
      />

      {/* SEARCH & FILTERS WIDGET ON HOME */}
      <HomeSearchWidget 
        cars={cars} 
        onNavigateCatalog={(filters) => onNavigate('catalog', filters)}
      />

      {/* HERO MODELS CAROUSEL */}
      <HeroCarousel 
        cars={cars} 
        onSelectCar={onSelectCar} 
        onNavigateCatalog={() => onNavigate('catalog')} 
      />

      {/* FEATURED & FILTERABLE CARS SECTION ON HOME */}
      <section className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="space-y-4 border-b border-white/10 pb-4"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D4AF37] block mb-1">
                Colección en Salón
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-light text-white">
                Unidades Seleccionadas
              </h2>
            </div>
            <button
              onClick={() => onNavigate('catalog')}
              className="text-xs uppercase font-bold tracking-widest text-[#D4AF37] hover:text-white flex items-center gap-2 transition-colors"
            >
              <span>Ver Catálogo Completo ({cars.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Filter Bar within Home Section */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-2 pb-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 shrink-0 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-[#D4AF37]" />
              <span>Filtrar vista:</span>
            </span>
            {[
              { id: 'featured', label: '★ Destacados' },
              { id: 'suv', label: 'SUVs' },
              { id: 'sedan', label: 'Sedanes' },
              { id: 'hybrid', label: 'Híbridos' },
              { id: 'under-30k', label: '< $30k USD' },
              { id: 'low-km', label: '< 30.000 KM' },
              { id: 'single-owner', label: 'Único Dueño' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleShowcaseCategoryChange(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold tracking-wider border shrink-0 transition-all ${
                  homeFilterCategory === tab.id
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-sm'
                    : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Cars Showcase Grid */}
        {showcasedCars.length === 0 ? (
          <div className="bg-[#0a0a0a] border border-white/10 p-8 text-center space-y-2">
            <p className="text-white/40 text-xs">No hay unidades en esta categoría en este momento.</p>
            <button
              onClick={() => setHomeFilterCategory('featured')}
              className="text-[#D4AF37] text-xs underline"
            >
              Ver Destacados
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {showcasedCars.map((car) => (
                <CarCard 
                  key={car.id} 
                  car={car} 
                  onSelect={onSelectCar}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Bottom Bar: Jump to Catalog with Active Filter */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={handleOpenFullCategoryCatalog}
            className="px-6 py-2.5 bg-white/5 border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white/80 text-xs uppercase font-semibold tracking-widest flex items-center gap-2 transition-all"
          >
            <span>Explorar todas las unidades de esta categoría</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* WHY CHOOSE BLACK SWAN */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="bg-[#0a0a0a] border border-white/10 p-8 sm:p-12 space-y-8"
      >
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 text-[#D4AF37] text-[10px] uppercase font-bold tracking-[0.3em]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nuestros Pilares</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-white">
            Excelencia & Confianza en Autos Usados
          </h2>
          <p className="text-white/40 text-xs font-light leading-relaxed">
            Evolucionamos la compra-venta de vehículos pre-owned para brindarle la tranquilidad, seguridad y respaldo de un 0km.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-[#050505] p-6 border border-white/5 space-y-3 hover:border-[#D4AF37]/30 transition-colors"
          >
            <div className="text-xs font-mono text-[#D4AF37] tracking-widest">
              01 / INSPECCIÓN
            </div>
            <h3 className="text-base font-serif text-white">Inspección de 150 Puntos</h3>
            <p className="text-xs text-white/40 font-light leading-relaxed">
              Verificamos escáner de motor, chasis, tren delantero, pintura con medidor de espesor y antecedentes de dominio.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-[#050505] p-6 border border-white/5 space-y-3 hover:border-[#D4AF37]/30 transition-colors"
          >
            <div className="text-xs font-mono text-[#D4AF37] tracking-widest">
              02 / DOCUMENTACIÓN
            </div>
            <h3 className="text-base font-serif text-white">Gestoría Integral</h3>
            <p className="text-xs text-white/40 font-light leading-relaxed">
              Transferencia rápida e inmediata. Garantizamos que la unidad se entrega 100% libre de deudas de patentes o multas.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-[#050505] p-6 border border-white/5 space-y-3 hover:border-[#D4AF37]/30 transition-colors"
          >
            <div className="text-xs font-mono text-[#D4AF37] tracking-widest">
              03 / PERMUTAS
            </div>
            <h3 className="text-base font-serif text-white">Tasación Transparente</h3>
            <p className="text-xs text-white/40 font-light leading-relaxed">
              Tomamos tu vehículo en parte de pago al valor real de mercado. Ofrecemos consignación física custodiada.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* TRADE IN APPRAISAL FORM */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
      >
        <TradeInForm />
      </motion.div>
    </div>
  );
};
