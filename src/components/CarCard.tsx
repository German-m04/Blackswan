import React from 'react';
import { motion } from 'motion/react';
import { Car } from '../types';
import { 
  Gauge, 
  Calendar, 
  Zap, 
  Fuel, 
  ShieldCheck, 
  MessageCircle, 
  Eye, 
  Tag,
  CheckCircle2,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface CarCardProps {
  car: Car;
  onSelect: (car: Car) => void;
  onFinanceClick?: (car: Car) => void;
}

export const CarCard: React.FC<CarCardProps> = ({ car, onSelect }) => {
  const isAvailable = car.status === 'Disponible';
  const isReserved = car.status === 'Reservado';

  const formatPriceUsd = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  const formatPriceArs = (price: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
  };

  const formatKm = (km: number) => {
    return new Intl.NumberFormat('es-AR').format(km) + ' km';
  };

  const whatsappMessage = encodeURIComponent(
    `Hola Black Swan! Me interesa consultar por el ${car.title} (${car.year}) publicado en ${formatPriceUsd(car.priceUsd)}.`
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className={`group bg-[#0a0a0a] border rounded-xl transition-all duration-300 flex flex-col justify-between hover:border-[#D4AF37]/70 hover:shadow-[0_16px_36px_rgba(212,175,55,0.12)] relative overflow-hidden ${
        car.featured ? 'border-[#D4AF37]/40' : 'border-white/10'
      }`}
    >
      <div>
        {/* Thumbnail Header with Hover Details Overlay */}
        <div className="relative aspect-[16/10] bg-[#050505] overflow-hidden cursor-pointer" onClick={() => onSelect(car)}>
          <img 
            src={car.images[0] || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80'} 
            alt={car.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
            loading="lazy"
          />

          {/* Dark Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/40 opacity-80 group-hover:opacity-40 transition-opacity" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
            <div className="flex flex-wrap gap-1.5">
              {car.featured && (
                <span className="px-2.5 py-1 text-[9px] uppercase font-bold tracking-widest bg-[#D4AF37] text-black flex items-center gap-1 shadow-md rounded-md">
                  <Tag className="w-2.5 h-2.5 fill-black" />
                  Destacado
                </span>
              )}
              {car.singleOwner && (
                <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider bg-black/80 border border-white/20 text-white/80 backdrop-blur-md rounded-md">
                  Único Dueño
                </span>
              )}
            </div>

            {/* Status Pill */}
            {!isAvailable && (
              <span className={`px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold rounded-md ${
                isReserved 
                  ? 'bg-amber-600/90 text-white border border-amber-400/40' 
                  : 'bg-rose-900/90 text-white border border-rose-500/30'
              }`}>
                {car.status}
              </span>
            )}
          </div>

          {/* Photo Count Pill */}
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-md text-[10px] uppercase tracking-wider text-white/70 border border-white/10 flex items-center gap-1 z-10 group-hover:border-[#D4AF37]/50 group-hover:text-[#D4AF37] transition-colors">
            <Eye className="w-3 h-3 text-[#D4AF37]" />
            <span>{car.images.length} fotos</span>
          </div>

          {/* HOVER OVERLAY: REVEAL EXTENDED DETAILS & SPECS */}
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/95 to-black/80 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out border-t border-[#D4AF37]/40 z-20 flex flex-col justify-end">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Ficha de Precisión
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-[#D4AF37]/15 text-[#D4AF37] font-mono border border-[#D4AF37]/30">
                Verificado
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-white/90 mb-2">
              <div className="flex items-center gap-1.5 bg-white/5 p-1.5 border border-white/10">
                <Zap className="w-3 h-3 text-[#D4AF37] shrink-0" />
                <span className="truncate font-serif font-medium">{car.engine}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 p-1.5 border border-white/10">
                <Fuel className="w-3 h-3 text-[#D4AF37] shrink-0" />
                <span className="truncate">{car.fuel} • {car.traction}</span>
              </div>
            </div>

            {car.equipment && car.equipment.length > 0 && (
              <div className="space-y-1 pt-1.5 border-t border-white/10">
                <span className="text-[9px] uppercase tracking-wider text-white/40 block font-semibold">Equipamiento Premium</span>
                <div className="flex flex-wrap gap-1">
                  {car.equipment.slice(0, 3).map((item, idx) => (
                    <span key={idx} className="text-[9px] bg-black/60 border border-white/10 px-1.5 py-0.5 text-white/80 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-[#D4AF37]" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-2.5 pt-2 border-t border-white/10 flex justify-between items-center text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold">
              <span>Abrir Ficha Técnica Completa</span>
              <ArrowUpRight className="w-3 h-3 text-[#D4AF37]" />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Title & Brand */}
          <div>
            <div className="text-[9px] uppercase font-mono tracking-[0.25em] text-[#D4AF37] mb-1.5 flex items-center justify-between">
              <span>{car.brand} • {car.bodyType}</span>
              <span className="text-white/35 text-[9px] font-mono">{car.color}</span>
            </div>
            <h3 
              onClick={() => onSelect(car)}
              className="text-lg font-serif text-white group-hover:text-[#D4AF37] transition-colors cursor-pointer line-clamp-1 font-light tracking-wide"
            >
              {car.title}
            </h3>
          </div>

          {/* Pricing Box */}
          <div className="bg-[#050505] border border-white/10 p-3.5 flex items-baseline justify-between group-hover:border-[#D4AF37]/30 transition-colors">
            {car.priceOnDemand ? (
              <div className="w-full flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-white/40 uppercase font-mono tracking-[0.2em] block font-normal">Valor de Referencia</span>
                  <span className="text-lg font-serif text-emerald-400 font-normal">
                    A consultar
                  </span>
                </div>
                {car.licensePlate && (
                  <span className="px-2 py-0.5 bg-white/10 text-white font-mono text-[9px] tracking-widest border border-white/20">
                    {car.licensePlate}
                  </span>
                )}
              </div>
            ) : (
              <>
                <div>
                  <span className="text-[9px] text-white/40 uppercase font-mono tracking-[0.2em] block font-normal">Precio de Venta</span>
                  <span className="text-2xl font-serif text-[#D4AF37] font-normal tracking-tight group-hover:scale-105 transition-transform origin-left inline-block">
                    {formatPriceUsd(car.priceUsd)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-white/30 uppercase font-mono tracking-wider block">Equiv. ARS</span>
                  <span className="text-xs font-mono text-white/70">
                    {formatPriceArs(car.priceArs)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Key Features Grid */}
          <div className="grid grid-cols-3 gap-2 text-[11px] text-white/60 pt-1">
            <div className="flex items-center gap-1.5 bg-[#050505] p-2 border border-white/5 group-hover:border-white/15 transition-colors rounded-lg">
              <Calendar className="w-3 h-3 text-[#D4AF37] shrink-0" />
              <span className="font-mono text-[11px]">{car.year}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#050505] p-2 border border-white/5 group-hover:border-white/15 transition-colors rounded-lg">
              <Gauge className="w-3 h-3 text-[#D4AF37] shrink-0" />
              <span className="truncate font-mono text-[10px]">{car.hours ? car.hours : formatKm(car.km)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#050505] p-2 border border-white/5 group-hover:border-white/15 transition-colors rounded-lg">
              <Zap className="w-3 h-3 text-[#D4AF37] shrink-0" />
              <span className="truncate text-[10px]">{car.transmission}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-5 pt-0 grid grid-cols-2 gap-2.5 mt-2">
        <button
          onClick={() => onSelect(car)}
          className="btn-dark-textured w-full py-2.5 px-3 text-[10px] uppercase font-medium tracking-[0.16em] flex items-center justify-center gap-1.5 cursor-pointer rounded-lg"
        >
          <Eye className="w-3 h-3 text-[#D4AF37]" />
          <span>Ficha Técnica</span>
        </button>

        <a
          href={`https://wa.me/5491140008888?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold-textured w-full py-2.5 px-3 text-[10px] uppercase font-semibold tracking-[0.16em] flex items-center justify-center gap-1.5 rounded-lg"
        >
          <MessageCircle className="w-3 h-3" />
          <span>Consultar</span>
        </a>
      </div>
    </motion.div>
  );
};

