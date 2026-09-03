import React, { useState } from 'react';
import { TradeInForm } from '../components/TradeInForm';
import { storage } from '../utils/storage';
import { Phone, Mail, MessageCircle, MapPin, Send, Check, ShieldCheck } from 'lucide-react';

export const ContactView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'tradeIn' | 'general'>('tradeIn');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) return;

    storage.addInquiry({
      name,
      phone,
      email: 'Sin email',
      type: 'Consulta',
      message
    });

    setSubmitted(true);
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Banner */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 sm:p-10 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 text-[#D4AF37] text-[10px] font-semibold uppercase tracking-[0.25em]">
          <Phone className="w-3.5 h-3.5" />
          <span>Atención Directa</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-light text-white">
          Contacto & Asesoramiento
        </h1>
        <p className="text-white/40 text-xs font-light max-w-2xl leading-relaxed">
          Estamos a su entera disposición para brindar asesoramiento personalizado sobre nuestra flota de vehículos, esquemas de financiación y cotizaciones.
        </p>
      </div>

      {/* Direct Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a 
          href="https://wa.me/5491140008888" 
          target="_blank" 
          rel="noreferrer"
          className="bg-emerald-950/20 border border-emerald-500/30 p-6 flex items-center gap-4 hover:border-emerald-500/60 transition-all group"
        >
          <div className="w-10 h-10 bg-emerald-500 text-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">WhatsApp Business</span>
            <span className="text-base font-serif text-white block">+54 9 11 4000-8888</span>
            <span className="text-[10px] text-white/40 font-light">Atención ejecutiva inmediata</span>
          </div>
        </a>

        <a 
          href="tel:+541140008888" 
          className="bg-[#0a0a0a] border border-white/10 p-6 flex items-center gap-4 hover:border-[#D4AF37] transition-all group"
        >
          <div className="w-10 h-10 bg-[#D4AF37] text-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest block">Central Telefónica</span>
            <span className="text-base font-serif text-white block">011 4000-8888</span>
            <span className="text-[10px] text-white/40 font-light">Lunes a Viernes 9 a 19 hs</span>
          </div>
        </a>

        <div className="bg-[#0a0a0a] border border-white/10 p-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#050505] border border-white/10 text-[#D4AF37] flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block">Showroom Central</span>
            <span className="text-sm font-serif text-white block">Av. del Libertador 4800</span>
            <span className="text-[10px] text-white/40 font-light">Vicente López, Buenos Aires</span>
          </div>
        </div>
      </div>

      {/* Tabs for Trade-In vs General Inquiry */}
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-6 border-b border-white/10 pb-3 text-xs uppercase tracking-widest font-bold">
          <button
            onClick={() => setActiveSubTab('tradeIn')}
            className={`pb-2 transition-colors border-b-2 ${
              activeSubTab === 'tradeIn' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            Tasación de Usados
          </button>
          <button
            onClick={() => setActiveSubTab('general')}
            className={`pb-2 transition-colors border-b-2 ${
              activeSubTab === 'general' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            Consulta General
          </button>
        </div>

        {activeSubTab === 'tradeIn' ? (
          <TradeInForm />
        ) : (
          <div className="bg-[#0a0a0a] border border-white/10 p-6 sm:p-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-lg font-serif text-white mb-2">Enviar Mensaje de Consulta</h2>

            {submitted ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-6 text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-base font-serif text-white">Consulta Enviada</h3>
                <p className="text-xs text-white/60 font-light">Le responderemos a la brevedad.</p>
              </div>
            ) : (
              <form onSubmit={handleGeneralSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Gabriel Varela"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5">Teléfono / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+54 11 9999-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5">Mensaje *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Escriba su inquietud comercial..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Mensaje</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
