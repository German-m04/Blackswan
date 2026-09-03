import React, { useState } from 'react';
import { Car } from '../types';
import { storage } from '../utils/storage';
import { VehicleInspectionSheet } from './VehicleInspectionSheet';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  MessageCircle, 
  Calendar, 
  Gauge, 
  Zap, 
  Fuel, 
  ShieldCheck, 
  MapPin, 
  Calculator, 
  Phone, 
  Send, 
  Check,
  FileCheck,
  Tag,
  Clock,
  CarFront,
  Printer
} from 'lucide-react';

interface CarDetailModalProps {
  car: Car | null;
  onClose: () => void;
}

export const CarDetailModal: React.FC<CarDetailModalProps> = ({ car, onClose }) => {
  if (!car) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'inspection' | 'details' | 'financing' | 'contact'>('inspection');

  // Contact form state
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryType, setInquiryType] = useState<'Consulta' | 'TestDrive' | 'Financiacion'>('Consulta');
  const [inquiryMessage, setInquiryMessage] = useState(
    `Hola Black Swan, estoy interesado en recibir información y peritaje sobre el ${car.title}${car.licensePlate ? ` (Dominio: ${car.licensePlate})` : ''}.`
  );
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Financing Simulator state inside modal
  const [downPaymentUsd, setDownPaymentUsd] = useState(Math.round((car.priceUsd || 30000) * 0.4));
  const [months, setMonths] = useState(24);
  const interestRate = 0.085; // Annual financing rate estimate

  const effectivePrice = car.priceUsd || 30000;
  const remainingUsd = Math.max(0, effectivePrice - downPaymentUsd);
  const monthlyPaymentUsd = months > 0 
    ? Math.round((remainingUsd * (1 + interestRate * (months / 12))) / months)
    : 0;

  const formatPriceUsd = (num: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  const formatPriceArs = (num: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % car.images.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + car.images.length) % car.images.length);
  };

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryPhone) return;

    storage.addInquiry({
      name: inquiryName,
      phone: inquiryPhone,
      email: inquiryEmail || 'Sin email',
      type: inquiryType,
      carId: car.id,
      carTitle: car.title,
      message: inquiryMessage
    });

    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      onClose();
    }, 2500);
  };

  const contactPhoneClean = (car.contactPhone || '5491140008888').replace(/[^0-9]/g, '');
  const priceDisplay = car.priceOnDemand ? 'A consultar' : formatPriceUsd(car.priceUsd);

  const whatsappMessage = encodeURIComponent(
    `Hola! Vengo de la web y me interesa consultar por el ${car.title} (${car.year})${car.licensePlate ? ` Dominio: ${car.licensePlate}` : ''} publicado en ${priceDisplay}.`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-5xl bg-[#050505] border border-white/10 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#0a0a0a]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.25em]">
                {car.brand} • {car.year} • {car.bodyType}
              </span>
              {car.licensePlate && (
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest bg-white/10 text-white border border-white/20">
                  DOMINIO {car.licensePlate}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-light text-white">
              {car.title}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-[#050505] text-white/40 hover:text-white hover:border-[#D4AF37] border border-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Grid */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Overview: Gallery + Quick Specs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {/* Main Active Image Display */}
              <div className="relative aspect-[16/10] bg-[#0a0a0a] border border-white/10 overflow-hidden group">
                <img 
                  src={car.images[activeImageIndex]} 
                  alt={`${car.title} foto ${activeImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />

                {car.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-[#050505]/80 text-white hover:bg-[#D4AF37] hover:text-black border border-white/10 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#050505]/80 text-white hover:bg-[#D4AF37] hover:text-black border border-white/10 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-3 left-3 bg-[#050505]/90 px-2.5 py-1 text-[10px] font-mono text-white/60 border border-white/10">
                  {activeImageIndex + 1} / {car.images.length}
                </div>
              </div>

              {/* Thumbnails row */}
              {car.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {car.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-14 overflow-hidden border shrink-0 transition-all ${
                        activeImageIndex === idx ? 'border-[#D4AF37]' : 'border-white/10 opacity-50 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price & Quick Info Sidebar */}
            <div className="space-y-4">
              <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-4">
                {car.priceOnDemand ? (
                  <div>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium block">
                      PRECIO DE VENTA
                    </span>
                    <div className="text-3xl font-serif text-emerald-400 font-bold my-1">
                      A consultar
                    </div>
                    {car.contactPerson && (
                      <div className="text-xs text-white/60 font-light">
                        Referente: <strong className="text-white font-medium">{car.contactPerson}</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium block">
                      Precio Especial Contado
                    </span>
                    <div className="text-3xl font-serif text-[#D4AF37]">
                      {formatPriceUsd(car.priceUsd)}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5 font-light">
                      Equivalente: <span className="text-white/80 font-mono">{formatPriceArs(car.priceArs)}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#050505] p-2.5 border border-white/5">
                    <span className="text-white/40 text-[9px] block uppercase tracking-widest">Kilometraje</span>
                    <span className="text-white font-mono">{new Intl.NumberFormat('es-AR').format(car.km)} km</span>
                  </div>

                  <div className="bg-[#050505] p-2.5 border border-white/5">
                    <span className="text-white/40 text-[9px] block uppercase tracking-widest">
                      {car.hours ? 'Horas de Motor' : 'Año'}
                    </span>
                    <span className="text-white font-serif">{car.hours || car.year}</span>
                  </div>

                  <div className="bg-[#050505] p-2.5 border border-white/5">
                    <span className="text-white/40 text-[9px] block uppercase tracking-widest">Tipo</span>
                    <span className="text-[#D4AF37] font-bold uppercase text-[11px]">{car.bodyType}</span>
                  </div>

                  <div className="bg-[#050505] p-2.5 border border-white/5">
                    <span className="text-white/40 text-[9px] block uppercase tracking-widest">Ubicación</span>
                    <span className="text-white text-[11px] truncate block" title={car.locationUnit || car.location}>
                      {car.locationUnit || car.location}
                    </span>
                  </div>
                </div>

                {/* Direct WhatsApp CTA */}
                <a
                  href={`https://wa.me/${contactPhoneClean}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>{car.priceOnDemand ? 'Preguntar Precio / WhatsApp' : 'WhatsApp Directo'}</span>
                </a>

                <button
                  onClick={() => setActiveTab('contact')}
                  className="w-full py-3 px-4 font-bold bg-[#D4AF37] hover:bg-[#c4a02e] text-black transition-all text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Agendar Visita / Inspección</span>
                </button>
              </div>

              {/* Guarantees / Inspection Status Box */}
              <div className="bg-[#0a0a0a] border border-white/10 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Ficha & Certificación Black Swan</span>
                </div>
                <ul className="space-y-1 text-white/50 font-light text-[11px] pl-5 list-disc">
                  {car.licensePlate && <li>Dominio verificado: {car.licensePlate}</li>}
                  {car.vtvValidUntil && <li>VTV vigente hasta {car.vtvValidUntil}</li>}
                  {car.singleOwner && <li>Único dueño certificado</li>}
                  <li>Inspección técnica integral disponible</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-white/10 flex flex-wrap gap-4 sm:gap-6 text-xs uppercase tracking-widest font-bold">
            <button
              onClick={() => setActiveTab('inspection')}
              className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'inspection' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Ficha Técnica Completa & Peritaje</span>
            </button>

            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'details' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              <CarFront className="w-3.5 h-3.5" />
              <span>Equipamiento & Reseña</span>
            </button>

            {!car.priceOnDemand && (
              <button
                onClick={() => setActiveTab('financing')}
                className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'financing' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-white/40 hover:text-white'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Financiación</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('contact')}
              className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'contact' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Consulta Directa</span>
            </button>
          </div>

          {/* TAB 1: VEHICLE INSPECTION SHEET (PERITAJE COMPLETO) */}
          {activeTab === 'inspection' && (
            <VehicleInspectionSheet car={car} />
          )}

          {/* TAB 2: SPECS & DESCRIPTION */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.2em] font-bold mb-2">
                  Reseña del Vehículo
                </h4>
                <p className="text-white/70 text-xs font-light leading-relaxed bg-[#0a0a0a] p-4 border border-white/5">
                  {car.description}
                </p>
              </div>

              {/* Specs Grid */}
              <div>
                <h4 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.2em] font-bold mb-3">
                  Especificaciones Principales
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#0a0a0a] p-3 border border-white/5">
                    <span className="text-white/40 text-[9px] uppercase tracking-widest block">Motor</span>
                    <span className="text-white font-serif">{car.engine}</span>
                  </div>
                  <div className="bg-[#0a0a0a] p-3 border border-white/5">
                    <span className="text-white/40 text-[9px] uppercase tracking-widest block">Tracción</span>
                    <span className="text-white font-serif">{car.traction}</span>
                  </div>
                  <div className="bg-[#0a0a0a] p-3 border border-white/5">
                    <span className="text-white/40 text-[9px] uppercase tracking-widest block">Color</span>
                    <span className="text-white font-serif">{car.color}</span>
                  </div>
                  <div className="bg-[#0a0a0a] p-3 border border-white/5">
                    <span className="text-white/40 text-[9px] uppercase tracking-widest block">Puertas</span>
                    <span className="text-white font-serif">{car.doors} puertas</span>
                  </div>
                </div>
              </div>

              {/* Equipment Checklist */}
              {car.equipment && car.equipment.length > 0 && (
                <div>
                  <h4 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.2em] font-bold mb-3">
                    Equipamiento de Serie & Opcionales
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {car.equipment.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-[#0a0a0a] p-2.5 border border-white/5 text-xs text-white/70 font-light">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Financing Calculator */}
          {activeTab === 'financing' && !car.priceOnDemand && (
            <div className="space-y-6">
              <div className="bg-[#0a0a0a] border border-white/10 p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-serif text-white uppercase tracking-wider flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#D4AF37]" />
                    Simulador de Cuotas
                  </h3>
                  <p className="text-xs text-white/40 font-light mt-1">
                    Financiación directa prendaria de hasta el 60% del valor publicado.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Controls */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-white/50 text-[10px] uppercase tracking-widest">Anticipo</span>
                        <span className="text-[#D4AF37] font-mono">{formatPriceUsd(downPaymentUsd)} USD</span>
                      </div>
                      <input 
                        type="range" 
                        min={Math.round(effectivePrice * 0.2)}
                        max={Math.round(effectivePrice * 0.8)}
                        step={500}
                        value={downPaymentUsd}
                        onChange={(e) => setDownPaymentUsd(Number(e.target.value))}
                        className="w-full accent-[#D4AF37] cursor-pointer"
                      />
                    </div>

                    <div>
                      <span className="text-white/50 text-[10px] uppercase tracking-widest block mb-2">Plazo en meses</span>
                      <div className="grid grid-cols-4 gap-2">
                        {[12, 24, 36, 48].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMonths(m)}
                            className={`py-2 text-[10px] uppercase font-bold tracking-wider transition-all border ${
                              months === m
                                ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                                : 'bg-[#050505] text-white/50 border-white/10 hover:text-white'
                            }`}
                          >
                            {m}M
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Estimated Result Box */}
                  <div className="bg-[#050505] border border-[#D4AF37]/30 p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] text-white/40 uppercase tracking-widest block">Cuota Estimada</span>
                      <div className="text-3xl font-serif text-[#D4AF37] my-1">
                        {formatPriceUsd(monthlyPaymentUsd)} <span className="text-xs font-mono text-white/40 font-normal">/ mes</span>
                      </div>
                      <span className="text-[10px] text-white/40 font-mono">
                        Financiando: {formatPriceUsd(remainingUsd)} USD en {months} cuotas.
                      </span>
                    </div>

                    <a
                      href={`https://wa.me/${contactPhoneClean}?text=${encodeURIComponent(
                        `Hola Black Swan, querría solicitar la pre-aprobación para financiar el ${car.title} con un anticipo de USD ${downPaymentUsd} y el resto en ${months} cuotas.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 font-bold bg-[#D4AF37] hover:bg-[#c4a02e] text-black transition-all text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Pre-Aprobar por WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Contact Form */}
          {activeTab === 'contact' && (
            <div>
              {formSubmitted ? (
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-8 text-center space-y-3">
                  <div className="w-10 h-10 bg-emerald-500 text-black flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <h3 className="text-base font-serif text-white">Consulta Enviada</h3>
                  <p className="text-xs text-white/60 font-light max-w-md mx-auto">
                    Un asesor especializado se comunicará en breve para atender su solicitud sobre el {car.title}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitInquiry} className="bg-[#0a0a0a] border border-white/10 p-6 space-y-4">
                  <h3 className="text-sm font-serif text-white mb-2">
                    Consulta sobre {car.title}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5">Nombre Completo *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej: Juan Perez"
                        value={inquiryName}
                        onChange={(e) => setInquiryName(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5">Teléfono / WhatsApp *</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="Ej: +54 11 1234-5678"
                        value={inquiryPhone}
                        onChange={(e) => setInquiryPhone(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5">Correo Electrónico</label>
                      <input 
                        type="email" 
                        placeholder="ejemplo@correo.com"
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5">Motivo</label>
                      <select
                        value={inquiryType}
                        onChange={(e) => setInquiryType(e.target.value as any)}
                        className="w-full bg-[#050505] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      >
                        <option value="Consulta">Consulta General</option>
                        <option value="TestDrive">Inspección / Visita</option>
                        <option value="Financiacion">Consultar Financiación</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1.5">Mensaje</label>
                    <textarea 
                      rows={3}
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 font-bold bg-[#D4AF37] hover:bg-[#c4a02e] text-black transition-all text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Consulta</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

