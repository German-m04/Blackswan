import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  phoneNumber = "5491140008888",
  defaultMessage = "Hola Black Swan, quisiera realizar una consulta por un vehículo."
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    // Activa la animación suave de entrada (fade-in y slide-up) al montar el componente
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 120);

    // Inicia la animación de float sutil continua una vez completada la entrada
    const floatTimer = setTimeout(() => {
      setIsFloating(true);
    }, 850);

    return () => {
      clearTimeout(timer);
      clearTimeout(floatTimer);
    };
  }, []);

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div
      id="floating-whatsapp-container"
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 group transition-all duration-700 ease-out transform ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6 pointer-events-none'
      } ${isFloating ? 'animate-float' : ''}`}
    >
      {/* Tooltip / Label */}
      <a
        id="floating-whatsapp-tooltip"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-[#0a0a0a]/95 hover:bg-black text-white text-[11px] font-mono tracking-wider border border-white/15 rounded-full backdrop-blur-md shadow-2xl transition-all duration-300 opacity-90 group-hover:opacity-100 group-hover:border-[#25D366]/60 group-hover:shadow-[0_0_20px_rgba(37,211,102,0.25)]"
      >
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
        <span className="tracking-widest uppercase text-[10px]">Atención Personalizada</span>
      </a>

      {/* Floating Button */}
      <a
        id="floating-whatsapp-button"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-[0_4px_25px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_30px_rgba(37,211,102,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
      >
        {/* Pulse ring effect */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none" />
        <MessageCircle className="w-7 h-7 fill-white text-[#25D366] relative z-10" />
      </a>
    </div>
  );
};
