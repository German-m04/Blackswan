import React, { useState } from 'react';
import { Calculator, MessageCircle, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';

interface FinancingCalculatorProps {
  onContactClick?: () => void;
}

export const FinancingCalculator: React.FC<FinancingCalculatorProps> = ({ onContactClick }) => {
  const [vehicleValue, setVehicleValue] = useState(25000);
  const [downPayment, setDownPayment] = useState(10000);
  const [termMonths, setTermMonths] = useState(24);

  const interestRateAnnual = 0.085; // 8.5% annual rate
  const loanAmount = Math.max(0, vehicleValue - downPayment);
  
  const estimatedMonthlyUsd = termMonths > 0
    ? Math.round((loanAmount * (1 + interestRateAnnual * (termMonths / 12))) / termMonths)
    : 0;

  const formatPriceUsd = (num: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  const whatsappMessage = encodeURIComponent(
    `Hola Black Swan, usé la calculadora de la web: Valor aprox. USD ${vehicleValue}, anticipo USD ${downPayment}, en ${termMonths} cuotas. ¿Podrían asesorarme?`
  );

  return (
    <section className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column Description */}
        <div className="lg:col-span-5 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Calculator className="w-3.5 h-3.5" />
            <span>Financiación Exclusiva Black Swan</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white font-serif leading-tight">
            Calculá tu cuota ideal a medida
          </h2>

          <p className="text-zinc-400 text-sm leading-relaxed">
            Financiá hasta el <strong className="text-zinc-200">60% del valor del vehículo</strong> únicamente con tu DNI. Aprobación crediticia en el acto con las tasas más competitivas del mercado de seleccionados.
          </p>

          <div className="space-y-2.5 pt-2 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Aprobación rápida en menos de 24 horas laborables</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Cuotas fijas en pesos o dólares según tu preferencia</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Aceptamos tu usado en parte de pago como anticipo</span>
            </div>
          </div>
        </div>

        {/* Right Column Simulator Box */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Slider 1: Vehicle Value */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-zinc-400 uppercase tracking-wider">Valor estimado del auto</span>
              <span className="text-amber-400 text-sm">{formatPriceUsd(vehicleValue)} USD</span>
            </div>
            <input 
              type="range"
              min={10000}
              max={80000}
              step={1000}
              value={vehicleValue}
              onChange={(e) => {
                const val = Number(e.target.value);
                setVehicleValue(val);
                if (downPayment > val * 0.8) setDownPayment(Math.round(val * 0.5));
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
              <span>$10,000 USD</span>
              <span>$80,000 USD</span>
            </div>
          </div>

          {/* Slider 2: Down Payment */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-zinc-400 uppercase tracking-wider">Anticipo / Tu Usado</span>
              <span className="text-amber-400 text-sm">{formatPriceUsd(downPayment)} USD</span>
            </div>
            <input 
              type="range"
              min={Math.round(vehicleValue * 0.2)}
              max={Math.round(vehicleValue * 0.8)}
              step={500}
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
              <span>Min. 20% ({formatPriceUsd(Math.round(vehicleValue * 0.2))})</span>
              <span>Max. 80% ({formatPriceUsd(Math.round(vehicleValue * 0.8))})</span>
            </div>
          </div>

          {/* Term Selector Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Plazo del Crédito</span>
            <div className="grid grid-cols-4 gap-2">
              {[12, 24, 36, 48].map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setTermMonths(months)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    termMonths === months
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md scale-[1.02]'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {months} Meses
                </button>
              ))}
            </div>
          </div>

          {/* Result Highlight */}
          <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-zinc-400 font-semibold block uppercase tracking-wider">Cuota mensual estimada</span>
              <div className="text-3xl font-black text-amber-400 font-serif my-0.5">
                {formatPriceUsd(estimatedMonthlyUsd)} <span className="text-xs font-sans text-zinc-400 font-normal">/ mes</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Saldo a financiar: {formatPriceUsd(loanAmount)} USD. Tasa informativa sujeta a aprobación scoring.
              </p>
            </div>

            <a
              href={`https://wa.me/5491140008888?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-emerald-500/20"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Solicitar Asesoramiento</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
