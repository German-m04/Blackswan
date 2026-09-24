import React from 'react';
import { motion } from 'motion/react';
import { Car } from '../types';
import { 
  Gauge, 
  Calendar, 
  Zap, 
  Fuel, 
  Eye, 
  MessageCircle, 
  ShieldCheck, 
  Tag, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface CarListRowProps {
  car: Car;
  onSelect: (car: Car) => void;
}

export const CarListRow: React.FC<CarListRowProps> = ({ car, onSelect }) => {
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
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`group bg-[#0a0a0a] border hover:border-[#D4AF37]/70 transition-all duration-300 flex flex-col md:flex-row overflow-hidden relative ${
        car.featured ? 'border-[#D4AF37]/40' : 'border-white/10'
      }`}
    >
      {/* Thumbnail */}
      <div 
        className="md:w-72 h-48 md:h-auto relative bg-[#050505] shrink-0 cursor-pointer overflow-hidden"
        onClick={() => onSelect(car)}
      >
        <img 
          src={car.images[0] || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80'} 
          alt={car.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0a0a0a] via-transparent to-black/30" />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 z-10">
          {car.featured && (
            <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider bg-[#D4AF37] text-black flex items-center gap-1">
              <Tag className="w-2.5 h-2.5 fill-black" />
              Destacado
            </span>
          )}
          {!isAvailable && (
            <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold ${
              isReserved ? 'bg-amber-600 text-white' : 'bg-rose-900 text-white'
            }`}>
              {car.status}
            </span>
          )}
        </div>

        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur-md text-[9px] uppercase text-white/70 border border-white/10 flex items-center gap-1">
          <Eye className="w-2.5 h-2.5 text-[#D4AF37]" />
          <span>{car.images.length} fotos</span>
        </div>
      </div>

      {/* Info & Specs */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] font-semibold">
              {car.brand} • {car.bodyType} • {car.color}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {car.singleOwner && (
                <span className="text-[9px] uppercase tracking-wider text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5">
                  Único Dueño
                </span>
              )}
              {car.isConsignment && (
                <span className="text-[9px] uppercase tracking-wider text-purple-300 bg-purple-950/70 border border-purple-500/40 px-2 py-0.5 font-medium">
                  A Concesión
                </span>
              )}
            </div>
          </div>

          <h3 
            onClick={() => onSelect(car)}
            className="text-lg sm:text-xl font-serif text-white group-hover:text-[#D4AF37] transition-colors cursor-pointer leading-snug"
          >
            {car.title}
          </h3>

          <p className="text-xs text-white/50 line-clamp-2 mt-1.5 font-light">
            {car.description}
          </p>
        </div>

        {/* Specs Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-white/70 py-2 border-y border-white/5">
          <div className="flex items-center gap-2 bg-[#050505] p-2 border border-white/5">
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <div>
              <span className="text-[8px] text-white/40 block uppercase">Año</span>
              <span className="font-semibold text-white">{car.year}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#050505] p-2 border border-white/5">
            <Gauge className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <div>
              <span className="text-[8px] text-white/40 block uppercase">{car.hours ? 'Horas / KM' : 'Kilómetros'}</span>
              <span className="font-semibold text-white">{car.hours || formatKm(car.km)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#050505] p-2 border border-white/5">
            <Zap className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <div>
              <span className="text-[8px] text-white/40 block uppercase">Caja</span>
              <span className="font-semibold text-white truncate">{car.transmission}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#050505] p-2 border border-white/5">
            <Fuel className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <div>
              <span className="text-[8px] text-white/40 block uppercase">Combustible</span>
              <span className="font-semibold text-white truncate">{car.fuel}</span>
            </div>
          </div>
        </div>

        {/* Price & CTA Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <span className="text-[9px] text-white/40 uppercase tracking-widest block font-medium">
              {car.priceOnDemand ? 'Precio' : 'Precio Contado'}
            </span>
            {car.priceOnDemand ? (
              <div className="flex items-center gap-2">
                <span className="text-xl font-serif text-emerald-400 font-bold">
                  A consultar
                </span>
                {car.licensePlate && (
                  <span className="px-2 py-0.5 bg-white/10 text-white font-mono text-[10px] font-bold border border-white/20">
                    {car.licensePlate}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-serif text-[#D4AF37] font-semibold">
                  {formatPriceUsd(car.priceUsd)}
                </span>
                <span className="text-xs text-white/40 font-mono">
                  / {formatPriceArs(car.priceArs)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelect(car)}
              className="px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-white bg-white/5 hover:bg-white/15 border border-white/15 transition-all flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Ficha Técnica</span>
            </button>

            <a
              href={`https://wa.me/5491140008888?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-black bg-[#D4AF37] hover:bg-[#c4a02e] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Consultar</span>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
