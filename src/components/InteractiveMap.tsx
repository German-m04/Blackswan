import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Phone, 
  Calendar, 
  Car, 
  CheckCircle2, 
  ExternalLink, 
  MessageCircle, 
  Coffee, 
  Shield 
} from 'lucide-react';
import { AgencySettings } from '../types';

interface InteractiveMapProps {
  agencySettings?: AgencySettings;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ agencySettings }) => {
  const [selectedRoute, setSelectedRoute] = useState<'cabaro' | 'norte' | 'oeste'>('cabaro');
  const settings = agencySettings;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 sm:p-8 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-[#D4AF37] text-[10px] font-semibold uppercase tracking-[0.25em]">
              <MapPin className="w-3.5 h-3.5" />
              <span>{settings?.showroomName || 'Showroom Central Black Swan'}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-serif font-light text-white">
              Showroom de Exhibición
            </h2>

            <p className="text-white/40 text-xs font-light leading-relaxed">
              {settings?.showroomDescription || 'Ubicados sobre la arteria principal de Zona Norte, contamos con un espacio boutique de exhibición climatizado de más de 800m², espresso lounge y estacionamiento privado para nuestros clientes.'}
            </p>

            <div className="flex flex-wrap gap-2.5 text-xs text-white/70 pt-2">
              {(settings?.locationFeatures || ['Espresso Lounge', 'Parking Custodiado', 'Pista Test Drive', 'Showroom Climatizado 800m²']).map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#050505] px-3.5 py-2 border border-white/5 rounded-lg">
                  <Coffee className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span className="text-[11px]">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#050505] border border-white/10 p-6 space-y-4">
            <h3 className="text-xs font-serif text-white uppercase tracking-[0.2em] border-b border-white/10 pb-2">
              Información de Visita
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <span className="text-white/80 font-semibold block uppercase text-[10px] tracking-wider">Ubicación:</span>
                  <span className="text-white/40 font-light">
                    {settings?.fullAddress || 'Av. del Libertador 4800, Vicente López'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <span className="text-white/80 font-semibold block uppercase text-[10px] tracking-wider">Horarios:</span>
                  <p className="text-white/40 font-light">Lunes a Viernes: {settings?.scheduleWeekdays || '09:00 a 19:00 hs'}</p>
                  <p className="text-white/40 font-light">Sábados: {settings?.scheduleSaturdays || '09:00 a 14:00 hs'}</p>
                  {settings?.scheduleSundays && (
                    <p className="text-white/30 font-light text-[11px]">Domingos: {settings.scheduleSundays}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <span className="text-white/80 font-semibold block uppercase text-[10px] tracking-wider">Atención Telefónica:</span>
                  <span className="text-white/40 font-light">{settings?.phone || '+54 (11) 4000-8888'}</span>
                </div>
              </div>
            </div>

            <a
              href={settings?.googleMapsUrl || "https://maps.google.com/?q=Av.+del+Libertador+4800,+Vicente+Lopez"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 font-bold bg-[#D4AF37] hover:bg-[#c4a02e] text-black transition-all text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Stylized Interactive Map Preview */}
      <div className="bg-[#0a0a0a] border border-white/10 p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-serif text-white">Indicaciones de Acceso</h3>
            <p className="text-xs text-white/40 font-light">Seleccione su punto de partida para consultar el trayecto sugerido.</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setSelectedRoute('cabaro')}
              className={`px-3 py-1.5 border text-[10px] uppercase font-bold tracking-wider transition-all ${
                selectedRoute === 'cabaro' ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#050505] text-white/50 border-white/10 hover:text-white'
              }`}
            >
              Desde CABA / Belgrano
            </button>
            <button
              onClick={() => setSelectedRoute('norte')}
              className={`px-3 py-1.5 border text-[10px] uppercase font-bold tracking-wider transition-all ${
                selectedRoute === 'norte' ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#050505] text-white/50 border-white/10 hover:text-white'
              }`}
            >
              Desde Zona Norte
            </button>
            <button
              onClick={() => setSelectedRoute('oeste')}
              className={`px-3 py-1.5 border text-[10px] uppercase font-bold tracking-wider transition-all ${
                selectedRoute === 'oeste' ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#050505] text-white/50 border-white/10 hover:text-white'
              }`}
            >
              Desde Acc. Norte / Gral Paz
            </button>
          </div>
        </div>

        {/* Visual Map Canvas / Embed */}
        <div className="relative aspect-[21/9] min-h-[300px] w-full bg-[#050505] border border-white/10 overflow-hidden group">
          {/* Mock Map graphics canvas / iframe view */}
          <iframe 
            title="Ubicacion Black Swan"
            className="w-full h-full grayscale opacity-80 group-hover:grayscale-0 transition-all duration-700"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3287.411132644265!2d-58.47291122342938!3d-34.5178229529683!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb13554e2f9d5%3A0x6b7720970b556f89!2sAv.%20del%20Libertador%204800%2C%20Vicente%20L%C3%B3pez%2C%20Provincia%20de%20Buenos%20Aires!5e0!3m2!1ses-419!2sar!4v1710000000000!5m2!1ses-419!2sar"
            loading="lazy"
          />

          {/* Floating badge over map */}
          <div className="absolute top-4 left-4 bg-[#050505]/95 backdrop-blur-md border border-[#D4AF37]/40 p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#D4AF37] text-black flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-serif text-white uppercase block tracking-widest">BLACK SWAN SHOWROOM</span>
              <span className="text-[10px] text-[#D4AF37] font-mono">Av. del Libertador 4800</span>
            </div>
          </div>
        </div>

        {/* Route Details Box */}
        <div className="bg-[#050505] p-4 border border-white/5 text-xs text-white/60 font-light">
          {selectedRoute === 'cabaro' && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span><strong>Desde Belgrano/Nuñez:</strong> Avance por Av. del Libertador hacia el Norte. Tras cruzar Av. General Paz, continúe 800 metros. El showroom cuenta con dársena de ingreso privado sobre mano derecha.</span>
            </div>
          )}
          {selectedRoute === 'norte' && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span><strong>Desde San Isidro/Tigre:</strong> Tome Av. del Libertador hacia CABA. El showroom se encuentra sobre mano izquierda, realizando la maniobra en el retome señalizado de Av. San Martín.</span>
            </div>
          )}
          {selectedRoute === 'oeste' && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span><strong>Desde Acceso Norte / Gral. Paz:</strong> Desvíe en Salida Av. del Libertador Norte. Avance 5 cuadras directo por Libertador hasta el número 4800.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
