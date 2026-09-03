import React, { useState } from 'react';
import { storage } from '../utils/storage';
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
          <h2 className="text-2xl sm:text-3xl font-serif text-white font-light">
            Tasación de Vehículo Usado
          </h2>
          <p className="text-white/40 text-xs font-light max-w-lg mx-auto">
            Adquirimos su unidad o la tomamos en parte de pago bajo las mejores condiciones de mercado.
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-8 text-center space-y-3">
            <div className="w-10 h-10 bg-emerald-500 text-black flex items-center justify-center mx-auto">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <h3 className="text-base font-serif text-white">Solicitud Recibida</h3>
            <p className="text-xs text-white/60 font-light max-w-md mx-auto">
              Evaluaremos las especificaciones de su {brand} {model} y le responderemos a la brevedad con una cotización preliminar.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setBrand('');
                setModel('');
                setNotes('');
              }}
              className="mt-4 px-4 py-2.5 bg-[#0a0a0a] text-white/70 border border-white/10 hover:text-white text-[10px] uppercase font-bold tracking-widest"
            >
              Tasar Otro Vehículo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-[#050505] p-6 border border-white/5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-2">
              1. Especificaciones del Vehículo
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Marca *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Porsche"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Modelo & Versión *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Macan S"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Año *</label>
                <input 
                  type="number" 
                  required
                  min="2005"
                  max="2026"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Kilometraje *</label>
                <input 
                  type="number" 
                  required
                  step="1000"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] pt-3 mb-2">
              2. Datos del Propietario
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Nombre *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Roberto Fernandez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Teléfono / WhatsApp *</label>
                <input 
                  type="tel" 
                  required
                  placeholder="+54 11 9999-8888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Observaciones (opcional)</label>
              <textarea 
                rows={2}
                placeholder="Detalles sobre historial de servicios, mantenimiento o interés en algún modelo de nuestra colección..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 font-bold bg-[#D4AF37] hover:bg-[#c4a02e] text-black transition-all text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 mt-4"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Solicitar Cotización</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
