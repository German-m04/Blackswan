import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Award } from 'lucide-react';
import { AgencySettings } from '../types';

interface BrandPresentationProps {
  onNavigateCatalog?: () => void;
  onNavigateContact?: () => void;
  agencySettings?: AgencySettings;
}

export const BrandPresentation: React.FC<BrandPresentationProps> = ({ agencySettings }) => {
  const settings = agencySettings;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative bg-[#070707] border border-white/10 p-6 sm:p-10 lg:p-14 overflow-hidden"
    >
      {/* Background Decorative Lighting */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#D4AF37] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[300px] h-[300px] bg-[#D4AF37] opacity-[0.02] blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8 text-center sm:text-left">
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 border-b border-white/10 pb-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col items-center sm:items-start space-y-1.5"
          >
            <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-[#D4AF37]">
              {settings?.agencySlogan || 'Casa de Automóviles Seleccionados'}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white font-light tracking-wide">
              {settings?.agencyShortName || 'BLACK SWAN'} <span className="text-[#D4AF37] italic font-serif">Luxury Cars</span>
            </h1>
          </motion.div>
        </div>

        {/* Brand Narrative / Core Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-2">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-7 space-y-4 text-left"
          >
            <h2 className="text-xl sm:text-2xl font-serif text-white font-light leading-snug">
              {settings?.heroSubtitle || 'Transparencia absoluta en vehículos premium y seminuevos'}
            </h2>
            <p className="text-xs sm:text-sm text-white/60 font-light leading-relaxed">
              {settings?.heroDescription || 'Curamos cada unidad con rigurosidad técnica y jurídica. Brindamos un servicio integral de adquisición, permuta y consignación física con peritaje mecánico previo y documentación garantizada para entrega inmediata.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-white/70">
              <div className="flex items-center gap-2.5 bg-white/5 p-3 border border-white/5">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="tracking-wide">Certificación Registral Libre de Deudas</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/5 p-3 border border-white/5">
                <Award className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="tracking-wide">Valuación Transparente y Trato Directo</span>
              </div>
            </div>
          </motion.div>

          {/* Key Stat Highlights */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-5 grid grid-cols-2 gap-4"
          >
            <div className="bg-[#030303] p-4 sm:p-5 border border-white/10 text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-serif text-[#D4AF37] font-normal block">
                {settings?.statsDeliveredCars || '+500'}
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 block font-mono">
                {settings?.statsDeliveredLabel || 'Unidades Entregadas'}
              </span>
            </div>
            <div className="bg-[#030303] p-4 sm:p-5 border border-white/10 text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-serif text-[#D4AF37] font-normal block">
                {settings?.statsInspectionPoints || '150'}
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 block font-mono">
                {settings?.statsInspectionLabel || 'Puntos de Peritaje'}
              </span>
            </div>
            <div className="bg-[#030303] p-4 sm:p-5 border border-white/10 text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-serif text-[#D4AF37] font-normal block">
                {settings?.statsVerifiedDomain || '100%'}
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 block font-mono">
                {settings?.statsVerifiedLabel || 'Dominio Verificado'}
              </span>
            </div>
            <div className="bg-[#030303] p-4 sm:p-5 border border-white/10 text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-serif text-[#D4AF37] font-normal block">
                {settings?.statsRegistrationHours || '48hs'}
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 block font-mono">
                {settings?.statsRegistrationLabel || 'Gestión Registral'}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};
