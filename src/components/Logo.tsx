import React from 'react';
import logoImg from '../assets/images/black_swan_logo_1785250463454.jpg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const imageSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
    xl: 'w-24 h-24 sm:w-28 sm:h-28'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        <img 
          src={logoImg} 
          alt="Black Swan Luxury Cars" 
          referrerPolicy="no-referrer"
          className={`${imageSizes[size]} object-cover rounded-md border border-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-transform duration-300 hover:scale-105`}
        />
      </div>
      {showText && (
        <div className="flex flex-col text-left">
          <span className="block text-base sm:text-xl font-serif tracking-[0.2em] text-white uppercase font-light leading-none">
            BLACK SWAN
          </span>
          <span className="block text-[8px] sm:text-[9.5px] tracking-[0.35em] text-[#D4AF37] font-semibold uppercase mt-1">
            LUXURY CARS
          </span>
        </div>
      )}
    </div>
  );
};
