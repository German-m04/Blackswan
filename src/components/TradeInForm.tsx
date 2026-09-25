import React, { useState } from 'react';
import { storage } from '../utils/storage';
import { BrandModelSelector } from './BrandModelSelector';
import { Car, Send, Check, AlertCircle } from 'lucide-react';

export const TradeInForm: React.FC = () => {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2020');
  const [km, setKm] = useState('50000');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !model || !name || !phone) return;

    storage.ensureBrandAndModel(brand, model).catch(err => console.warn('Ensure brand notice:', err));

    storage.addInquiry({
      name,
      phone,
      email: email || 'Sin email',
      type: 'Tasacion',
      message: `Tasación solicitada para: ${brand} ${model} (${year}), ${km} km. Notas: ${notes || 'Sin observaciones'}`,
      tradeInCar: {
        brand,
        model,
        year: Number(year),
        km: Number(km)
      }
    });

    setSubmitted(true);
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 p-6 sm:p-10 relative overflow-hidden">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#D4AF37] block">
            Servicio de Valuación & Permutas
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-white font-light tracking-tight">
            Tasación Oficial & Toma de Vehículos
          </h2>
          <p className="text-white/45 text-xs sm:text-sm font-light max-w-lg mx-auto">
            Cotizamos su unidad con parámetros de mercado verificados para adquisición directa o entrega en parte de pago.
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-8 text-center space-y-3">
            <div className="w-10 h-10 bg-emerald-500 text-black flex items-center justify-center mx-auto">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <h3 className="text-base font-serif text-white">Solicitud Recibida</h3>
            <p className="text-xs text-white/60 font-light max-w-md mx-auto">
              Evaluaremos las especificaciones de su {brand} {model} y nos contactaremos para coordinar la inspección.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setBrand('');
                setModel('');
                setNotes('');
              }}
              className="mt-4 px-4 py-2.5 bg-[#0a0a0a] text-white/70 border border-white/10 hover:text-white text-[10px] uppercase font-mono tracking-widest cursor-pointer"
            >
              Tasar Otro Vehículo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 bg-[#050505] p-6 sm:p-8 border border-white/10">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
              <span className="text-[9.5px] font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
                01. Especificaciones del Vehículo
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-8">
                <BrandModelSelector
                  selectedBrand={brand}
                  selectedModel={model}
                  onBrandChange={(b) => setBrand(b)}
                  onModelChange={(m) => setModel(m)}
                  brandLabel="Marca *"
                  modelLabel="Modelo & Versión *"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 lg:col-span-4">
                <div>
                  <label className="block text-[9px] uppercase font-mono tracking-[0.2em] text-white/50 mb-1.5">Año *</label>
                  <input 
                    type="number" 
                    required
                    min="2005"
                    max="2026"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-mono tracking-[0.2em] text-white/50 mb-1.5">Kilómetros *</label>
                  <input 
                    type="number" 
                    required
                    step="1000"
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 border-b border-white/10 pb-2.5 pt-2">
              <span className="text-[9.5px] font-mono uppercase tracking-[0.25em] text-[#D4AF37]">
                02. Datos de Contacto
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] uppercase font-mono tracking-[0.2em] text-white/50 mb-1.5">Nombre & Apellido *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Roberto Fernandez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-mono tracking-[0.2em] text-white/50 mb-1.5">Teléfono / WhatsApp *</label>
                <input 
                  type="tel" 
                  required
                  placeholder="+54 11 9999-8888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-mono tracking-[0.2em] text-white/50 mb-1.5">Correo Electrónico</label>
                <input 
                  type="email" 
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] uppercase font-mono tracking-[0.2em] text-white/50 mb-1.5">Observaciones Adicionales (opcional)</label>
              <textarea 
                rows={2}
                placeholder="Historial de mantenimientos, estado general o si desea permutar por una unidad de nuestro salón..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 font-semibold bg-[#D4AF37] hover:bg-[#c4a02e] text-black transition-all text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Solicitar Valuación Profesional</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
