import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  MessageCircle, 
  Calendar, 
  Gauge, 
  Zap
} from 'lucide-react';

interface HeroCarouselProps {
  cars: Car[];
  onSelectCar: (car: Car) => void;
  onNavigateCatalog: () => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ cars, onSelectCar }) => {
  // Available cars or default to top cars
  const carouselCars = cars.filter(c => c.status === 'Disponible').length > 0 
    ? cars.filter(c => c.status === 'Disponible') 
    : cars;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Touch Swipe Handling for Mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const currentCar = carouselCars[currentIndex] || cars[0];

  useEffect(() => {
    if (isAutoPlaying && carouselCars.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setDirection(1);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselCars.length);
      }, 5000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, carouselCars.length, currentIndex]);

  if (!currentCar) return null;

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % carouselCars.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + carouselCars.length) % carouselCars.length);
  };

  const handleSelectIndex = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const formatPriceUsd = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  const formatKm = (km: number) => {
    return new Intl.NumberFormat('es-AR').format(km) + ' km';
  };

  const whatsappMessage = encodeURIComponent(
    `Hola, estoy interesado en el vehículo ${currentCar.brand} ${currentCar.title} (${currentCar.year}) publicado en la web.`
  );

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98
    })
  };

  return (
    <div 
      className="relative rounded-none border border-white/10 bg-[#050505] overflow-hidden group flex flex-col justify-between"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background Texture Radial Glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#D4AF37] opacity-[0.04] blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#D4AF37] opacity-[0.03] blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Main Slide Carousel Area */}
      <div className="relative z-10 flex-1 min-h-[440px] lg:min-h-[480px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentCar.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.25 }
            }}
            className="w-full h-full grid grid-cols-1 lg:grid-cols-12 items-center p-4 sm:p-8 lg:p-10 gap-6 lg:gap-8"
          >
            {/* Image Box - First on Mobile, Right on Desktop */}
            <div className="order-1 lg:order-2 lg:col-span-7 h-[220px] sm:h-[320px] lg:h-[380px] relative overflow-hidden border border-white/10 group/img cursor-pointer" onClick={() => onSelectCar(currentCar)}>
              <img
                src={currentCar.images[0] || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80'}
                alt={currentCar.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/img:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/30" />

              {/* Photo Count Badge overlay */}
              <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 border border-white/10 text-[9px] sm:text-[10px] text-white/70 uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3 h-3 text-[#D4AF37]" />
                <span>{currentCar.images.length} fotos</span>
              </div>

              {/* Navigation Arrows Positioned Over Image Container */}
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 bg-black/75 hover:bg-[#D4AF37] hover:text-black text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all shadow-lg"
                aria-label="Anterior vehículo"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 bg-black/75 hover:bg-[#D4AF37] hover:text-black text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all shadow-lg"
                aria-label="Siguiente vehículo"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Car Information Details - Second on Mobile, Left on Desktop */}
            <div className="order-2 lg:order-1 lg:col-span-5 flex flex-col justify-center space-y-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] block mb-1">
                  {currentCar.brand}
                </span>
                <h2 
                  onClick={() => onSelectCar(currentCar)}
                  className="text-xl sm:text-3xl lg:text-4xl font-serif text-white group-hover:text-[#D4AF37] transition-colors cursor-pointer leading-tight font-light"
                >
                  {currentCar.title}
                </h2>
                <div className="mt-1.5 text-xl sm:text-2xl font-serif text-[#D4AF37] font-medium">
                  {formatPriceUsd(currentCar.priceUsd)}
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 py-2 border-y border-white/10 text-[10px] sm:text-[11px] text-white/70">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 p-2 border border-white/5">
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[8px] sm:text-[9px] text-white/40 block uppercase">Año</span>
                    <span className="font-semibold text-white truncate block">{currentCar.year}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 p-2 border border-white/5">
                  <Gauge className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[8px] sm:text-[9px] text-white/40 block uppercase">KM</span>
                    <span className="font-semibold text-white truncate block">{formatKm(currentCar.km)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 p-2 border border-white/5">
                  <Zap className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[8px] sm:text-[9px] text-white/40 block uppercase">Caja</span>
                    <span className="font-semibold text-white truncate block">{currentCar.transmission}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  onClick={() => onSelectCar(currentCar)}
                  className="w-full sm:w-auto px-5 py-2.5 text-[10px] uppercase font-bold tracking-[0.15em] text-black bg-[#D4AF37] hover:bg-[#c4a02e] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Ficha Técnica</span>
                </button>

                <a
                  href={`https://wa.me/5491140008888?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 text-[10px] uppercase font-bold tracking-[0.15em] text-white bg-white/5 hover:bg-white/10 border border-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Consultar</span>
                </a>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Thumbnail Strip Navigation */}
      <div className="relative z-10 bg-[#0a0a0a] border-t border-white/10 p-2.5 sm:p-4 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 sm:gap-3 min-w-max mx-auto justify-start sm:justify-center">
          {carouselCars.map((car, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={car.id}
                onClick={() => handleSelectIndex(idx)}
                className={`flex items-center gap-2 p-1 pr-2.5 text-left transition-all border ${
                  isSelected 
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white shadow-[0_0_15px_rgba(212,175,55,0.15)]' 
                    : 'border-white/10 bg-black/40 text-white/40 hover:border-white/30 hover:text-white/70'
                }`}
              >
                <div className="w-9 h-6 sm:w-10 sm:h-7 overflow-hidden bg-black shrink-0 relative">
                  <img 
                    src={car.images[0]} 
                    alt={car.title} 
                    className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-100' : 'opacity-60'}`}
                  />
                  {isSelected && <div className="absolute inset-0 border border-[#D4AF37]" />}
                </div>
                <div className="text-[9px] sm:text-[10px] leading-tight">
                  <span className="block font-bold truncate max-w-[90px] sm:max-w-[110px]">{car.brand} {car.model}</span>
                  <span className="text-[8px] sm:text-[9px] font-mono text-[#D4AF37]">USD {new Intl.NumberFormat('en-US').format(car.priceUsd)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

