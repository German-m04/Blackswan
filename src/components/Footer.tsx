import React from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Instagram, 
  Facebook, 
  MessageCircle,
  Car
} from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#050505] border-t border-white/5 text-white/50 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-8 h-8 rounded bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-white/50 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-8 h-8 rounded bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-white/50 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all"
                aria-label="Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a 
                href="https://wa.me/5491140008888" 
                target="_blank" 
                rel="noreferrer"
                className="w-8 h-8 rounded bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-500/50 transition-all"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-white font-serif text-xs uppercase tracking-[0.2em] mb-4 border-b border-white/10 pb-2">
              Navegación
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-[#D4AF37] transition-colors">
                  Inicio
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog')} className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Catálogo
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('reviews')} className="hover:text-[#D4AF37] transition-colors">
                  Reseñas
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('location')} className="hover:text-[#D4AF37] transition-colors">
                  Ubicación & Showroom
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-[#D4AF37] transition-colors">
                  Tasación de Usado
                </button>
              </li>
              <li className="pt-1">
                <button 
                  onClick={() => onNavigate('admin')} 
                  className="hover:text-[#D4AF37] text-white/40 transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Ingresar como Administrador</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Showroom & Horarios */}
          <div>
            <h4 className="text-white font-serif text-xs uppercase tracking-[0.2em] mb-4 border-b border-white/10 pb-2">
              Showroom
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                <span className="text-white/70">Av. del Libertador 4800, Vicente López</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <p className="text-white/80 font-medium">Lunes a Viernes:</p>
                  <p className="text-white/40">09:00 hs a 19:00 hs</p>
                  <p className="text-white/80 font-medium mt-1">Sábados:</p>
                  <p className="text-white/40">09:00 hs a 14:00 hs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Col 4: Contact & Support */}
          <div>
            <h4 className="text-white font-serif text-xs uppercase tracking-[0.2em] mb-4 border-b border-white/10 pb-2">
              Atención Directa
            </h4>
            <div className="space-y-3 text-xs">
              <a href="tel:+541140008888" className="flex items-center gap-2.5 hover:text-[#D4AF37] transition-colors">
                <Phone className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span className="text-white/80">+54 (11) 4000-8888</span>
              </a>
              <a href="mailto:inquiry@blackswan.cars" className="flex items-center gap-2.5 hover:text-[#D4AF37] transition-colors">
                <Mail className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span className="text-white/80">inquiry@blackswan.cars</span>
              </a>
              <div className="p-3 rounded bg-[#0a0a0a] border border-white/10 mt-2">
                <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-xs mb-1 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Garantía Black Swan</span>
                </div>
                <p className="text-[11px] text-white/40 font-light">
                  6 meses de garantía mecánica y certificación de dominio de precisión en cada unidad.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/30 gap-4 uppercase tracking-wider">
          <p>© {new Date().getFullYear()} Black Swan. Precision Pre-Owned Vehicles.</p>
          <div className="flex items-center space-x-4">
            <span className="hover:text-white/60 cursor-pointer">Términos</span>
            <span>•</span>
            <span className="hover:text-white/60 cursor-pointer">Privacidad</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
