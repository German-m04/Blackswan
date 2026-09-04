import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Logo } from './Logo';
import { 
  Car, 
  MapPin, 
  Star, 
  Phone, 
  MessageCircle, 
  Menu, 
  X, 
  Sparkles,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { isUserAdmin } from '../firebase';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  carCount: number;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentTab, 
  onNavigate, 
  carCount,
  user,
  onSignIn,
  onSignOut
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = isUserAdmin(user);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Inicio', icon: Sparkles },
    { id: 'catalog', label: 'Catálogo', icon: Car, badge: carCount },
    { id: 'reviews', label: 'Reseñas', icon: Star },
    { id: 'location', label: 'Ubicación', icon: MapPin },
    { id: 'contact', label: 'Contacto', icon: Phone },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${
      isScrolled ? 'bg-[#050505]/95 backdrop-blur-md border-b border-white/10 shadow-2xl py-3' : 'bg-[#050505] border-b border-white/5 py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <button 
          onClick={() => handleItemClick('home')}
          className="flex items-center text-left group focus:outline-none"
        >
          <Logo size="md" showText={true} />
        </button>

        {/* Desktop Nav Links (Hidden in Admin Tab) */}
        {currentTab === 'admin' ? (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Panel de Control Ejecutivo</span>
          </div>
        ) : (
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`text-[11px] uppercase tracking-[0.2em] transition-all relative py-1 flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#D4AF37] font-semibold border-b border-[#D4AF37]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-[#D4AF37] text-black font-bold' : 'bg-white/10 text-white/70'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Action Button & Auth */}
        <div className="hidden lg:flex items-center gap-3">
          {currentTab === 'admin' ? (
            <button
              onClick={() => handleItemClick('home')}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#D4AF37]/50 text-white/90 hover:text-white text-[10px] uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5"
              title="Volver a la tienda pública"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Volver al Sitio Web</span>
            </button>
          ) : user ? (
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-none">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Usuario'} 
                  className="w-6 h-6 rounded-full object-cover border border-white/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-[#D4AF37]" />
              )}
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-white/90 font-medium leading-none truncate max-w-[120px]">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                {isAdmin ? (
                  <span className="text-[8px] text-[#D4AF37] uppercase font-bold tracking-wider">
                    Admin
                  </span>
                ) : (
                  <span className="text-[8px] text-white/40 uppercase tracking-wider">
                    Usuario
                  </span>
                )}
              </div>
              {isAdmin && (
                <button
                  onClick={() => onNavigate('admin')}
                  className="p-1 text-[#D4AF37] hover:text-white transition-colors ml-1"
                  title="Panel de Administración"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onSignOut}
                className="p-1 text-white/40 hover:text-rose-400 transition-colors ml-0.5"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Single unified button fulfilling both admin & Google sign-in */
            <button
              onClick={async () => {
                onNavigate('admin');
                if (onSignIn) {
                  try {
                    await onSignIn();
                  } catch (err) {
                    console.log('Sign-in processed', err);
                  }
                }
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#D4AF37] text-white hover:text-[#D4AF37] text-[10px] uppercase font-semibold tracking-wider transition-all flex items-center gap-1.5"
              title="Ingresar y acceder al Panel de Administración"
            >
              <LogIn className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Ingresar</span>
            </button>
          )}

          {currentTab !== 'admin' && (
            <button
              onClick={() => handleItemClick('contact')}
              className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#c4a02e] text-black text-[10px] uppercase font-bold tracking-widest transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
            >
              <span>Tasá tu Usado</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-[#0a0a0a] text-white/80 hover:text-white border border-white/10 focus:outline-none"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#050505]/98 backdrop-blur-xl px-4 pt-4 pb-6 mt-3 space-y-3">
          {currentTab === 'admin' ? (
            <div className="space-y-3">
              <button
                onClick={() => handleItemClick('home')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#D4AF37] text-black text-xs uppercase font-bold tracking-wider"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Sitio Web Principal</span>
              </button>

              {user ? (
                <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="avatar" 
                        className="w-6 h-6 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <UserIcon className="w-4 h-4 text-[#D4AF37]" />
                    )}
                    <span className="text-white/90 text-xs font-medium">{user.displayName || user.email}</span>
                  </div>
                  <button
                    onClick={onSignOut}
                    className="text-rose-400 text-xs uppercase tracking-wider font-bold"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onSignIn();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-white/10 bg-white/5 text-white text-xs uppercase tracking-wider font-semibold"
                >
                  <LogIn className="w-4 h-4 text-[#D4AF37]" />
                  <span>Conectar Cuenta Google</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs uppercase tracking-widest font-semibold transition-all ${
                      isActive
                        ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30'
                        : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-white/40'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/80 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Mobile Auth & Admin Entry - Single Unified Button */}
              <div className="pt-2">
                {user ? (
                  <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 text-xs">
                    <div className="flex items-center gap-2 text-left">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="avatar" 
                          className="w-6 h-6 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <UserIcon className="w-4 h-4 text-[#D4AF37]" />
                      )}
                      <div>
                        <span className="text-white/90 text-xs font-medium block max-w-[170px] truncate">{user.displayName || user.email}</span>
                        {isAdmin ? (
                          <button
                            onClick={() => {
                              onNavigate('admin');
                              setMobileMenuOpen(false);
                            }}
                            className="text-[9px] text-[#D4AF37] font-bold uppercase hover:underline block text-left"
                          >
                            Panel Admin →
                          </button>
                        ) : (
                          <span className="text-[9px] text-white/40 font-mono">Usuario Conectado</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={onSignOut}
                      className="text-rose-400 text-xs uppercase tracking-wider font-semibold"
                    >
                      Salir
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      onNavigate('admin');
                      setMobileMenuOpen(false);
                      if (onSignIn) {
                        try {
                          await onSignIn();
                        } catch (err) {
                          console.log('Mobile sign-in processed', err);
                        }
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 border border-[#D4AF37]/40 bg-white/5 text-white hover:text-[#D4AF37] text-xs uppercase tracking-wider font-semibold transition-all"
                  >
                    <LogIn className="w-4 h-4 text-[#D4AF37]" />
                    <span>Ingresar</span>
                  </button>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                <a
                  href="https://wa.me/5491140008888?text=Hola%20Black%20Swan,%20quiero%20consultar%20por%20un%20auto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs uppercase tracking-widest font-bold bg-emerald-600/90 text-white hover:bg-emerald-500 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Consultar por WhatsApp</span>
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};
