import React, { useState } from 'react';
import { InteractiveMap } from '../components/InteractiveMap';
import { storage } from '../utils/storage';
import { Calendar, Clock, Check, Send, Sparkles } from 'lucide-react';
import { AgencySettings } from '../types';

interface LocationViewProps {
  agencySettings?: AgencySettings;
}

export const LocationView: React.FC<LocationViewProps> = ({ agencySettings }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('11:00');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    storage.addInquiry({
      name,
      phone,
      email: email || 'Sin email',
      type: 'TestDrive',
      message: `Cita agendada para showroom: ${date || 'Fecha a confirmar'} a las ${time} hs.`
    });

    setSubmitted(true);
  };

  return (
    <div className="space-y-12 pb-12">
      <InteractiveMap agencySettings={agencySettings} />

      {/* Appointment Scheduler Box */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 sm:p-10 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 text-[#D4AF37] text-[10px] font-semibold uppercase tracking-[0.25em]">
            <Calendar className="w-3.5 h-3.5" />
            <span>Atención Privada VIP</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-white font-light">
            Agendar Visita o Test Drive
          </h2>
          <p className="text-white/40 text-xs font-light max-w-lg mx-auto">
            {agencySettings?.scheduleNote || 'Reserve un horario preferencial para ser recibido por un ejecutivo comercial en nuestro showroom.'}
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-8 text-center space-y-2">
            <Check className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-base font-serif text-white">Cita Confirmada</h3>
            <p className="text-xs text-white/60 font-light">
              Le esperamos el {date || 'día indicado'} a las {time} hs. Un asesor se comunicará por WhatsApp para validar el ingreso.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-[#050505] p-6 border border-white/5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Rossi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5">Teléfono / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="+54 11 1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5">Fecha de Visita</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5">Horario Preferido</label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="10:00">10:00 hs</option>
                  <option value="11:30">11:30 hs</option>
                  <option value="14:00">14:00 hs</option>
                  <option value="16:00">16:00 hs</option>
                  <option value="18:00">18:00 hs</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 transition-all mt-4"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Confirmar Reserva</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
