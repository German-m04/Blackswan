import React, { useState } from 'react';
import { Car, VehicleInspection } from '../types';
import { 
  ShieldCheck, 
  Wrench, 
  FileCheck, 
  CarFront, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Calendar, 
  Clock, 
  Gauge, 
  Printer, 
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';

interface VehicleInspectionSheetProps {
  car: Car;
  compact?: boolean;
}

export const VehicleInspectionSheet: React.FC<VehicleInspectionSheetProps> = ({ car, compact = false }) => {
  const inspection: VehicleInspection = car.inspection || {};
  const [activeCategory, setActiveCategory] = useState<'all' | 'carroceria' | 'interior' | 'mecanica' | 'accesorios' | 'documentacion'>('all');

  const getStatusBadge = (val?: string) => {
    if (!val) return <span className="text-white/30 text-xs">-</span>;

    const upper = val.toUpperCase().trim();

    if (upper.includes('OPTIMO') || upper.includes('BUENO') || upper.includes('BUEN') || upper === 'SI') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
          {val}
        </span>
      );
    }

    if (upper.includes('REGULAR')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30">
          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
          {val}
        </span>
      );
    }

    if (upper.includes('REPARAR') || upper.includes('MALO') || upper.includes('NO ABRE') || upper === 'NO' || upper.includes('FALLA')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <XCircle className="w-2.5 h-2.5 shrink-0" />
          {val}
        </span>
      );
    }

    // Default neutral / detail badge
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-300 border border-sky-500/30">
        <Info className="w-2.5 h-2.5 shrink-0" />
        {val}
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const bodywork = inspection.bodywork || {};
  const interior = inspection.interior || {};
  const mechanics = inspection.mechanics || {};
  const accessories = inspection.accessories || {};
  const documentation = inspection.documentation || {};

  const contactPhone = car.contactPhone || inspection.contactPhone || '5491140008888';
  const contactPerson = car.contactPerson || inspection.contactPerson || 'Asesor Comercial';
  const unitName = car.locationUnit || inspection.businessUnit || car.location || 'Showroom Central';

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header Card with Inspection Meta */}
      <div className="bg-[#050505] border border-white/15 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-[#D4AF37] text-black">
                Peritaje Técnico Certificado
              </span>
              {car.licensePlate && (
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-widest bg-white/10 text-white border border-white/20">
                  DOMINIO {car.licensePlate}
                </span>
              )}
              {car.bodyType && (
                <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider text-[#D4AF37] border border-[#D4AF37]/30">
                  {car.bodyType}
                </span>
              )}
            </div>
            <h3 className="text-xl font-serif text-white tracking-wide">
              {car.title}
            </h3>
            <span className="text-xs text-white/50 font-light">
              {car.year} • {car.fuel} • {car.color} • {car.transmission}
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#0a0a0a] hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 transition-colors"
              title="Imprimir Ficha de Inspección"
            >
              <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Imprimir Ficha</span>
            </button>

            <a
              href={`https://wa.me/${contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `Hola ${contactPerson}, me pongo en contacto desde la web por la ficha técnica del ${car.title} (Dominio: ${car.licensePlate || 'S/D'}).`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>Preguntar</span>
            </a>
          </div>
        </div>

        {/* Technical Key Data Grid (Exact duplicate of Screenshot 1 & 2) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#0a0a0a] p-3 border border-white/5">
            <span className="text-[9px] text-white/40 uppercase tracking-widest block">Kilometraje</span>
            <span className="text-white font-mono font-bold text-sm">
              {new Intl.NumberFormat('es-AR').format(car.km)} km
            </span>
          </div>

          <div className="bg-[#0a0a0a] p-3 border border-white/5">
            <span className="text-[9px] text-white/40 uppercase tracking-widest block">Horas de Motor</span>
            <span className="text-[#D4AF37] font-mono font-bold text-sm">
              {car.hours || inspection.engineHours || 'No especifica'}
            </span>
          </div>

          <div className="bg-[#0a0a0a] p-3 border border-white/5">
            <span className="text-[9px] text-white/40 uppercase tracking-widest block">Ubicación / Unidad</span>
            <span className="text-white font-serif text-sm truncate block" title={unitName}>
              {unitName}
            </span>
          </div>

          <div className="bg-[#0a0a0a] p-3 border border-white/5">
            <span className="text-[9px] text-white/40 uppercase tracking-widest block">Referente de Venta</span>
            <span className="text-white font-medium text-sm truncate block" title={contactPerson}>
              {contactPerson}
            </span>
            {contactPhone && (
              <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                {contactPhone}
              </span>
            )}
          </div>
        </div>

        {/* Legal Disclaimer Box (Exact screenshot 1 wording) */}
        <div className="bg-[#0a0a0a] border-l-2 border-[#D4AF37] p-3.5 text-xs">
          <div className="flex items-center gap-1.5 text-[#D4AF37] text-[10px] uppercase tracking-widest font-bold mb-1">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Estado del Vehículo & Condiciones</span>
          </div>
          <p className="text-white/70 text-[11px] font-light leading-relaxed">
            {car.conditionDisclaimer || inspection.vehicleConditionDisclaimer || (
              "Vehículo usado vendido en el estado en que se encuentra. El comprador declara haberlo inspeccionado previamente y aceptar sus condiciones. Esta descripción es orientativa y no constituye garantía."
            )}
          </p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider font-bold border-b border-white/10 pb-3">
        {[
          { id: 'all', label: 'Todas las Secciones' },
          { id: 'carroceria', label: 'Carrocería' },
          { id: 'interior', label: 'Interior' },
          { id: 'mecanica', label: 'Mecánica' },
          { id: 'accesorios', label: 'Accesorios' },
          { id: 'documentacion', label: 'Documentación' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id as any)}
            className={`px-3 py-1.5 border transition-all ${
              activeCategory === tab.id
                ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                : 'bg-[#0a0a0a] text-white/60 border-white/10 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. DETAILED INSPECTION SECTIONS */}
      <div className="space-y-6">
        {/* SECTION A: CARROCERÍA */}
        {(activeCategory === 'all' || activeCategory === 'carroceria') && (
          <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h4 className="text-xs font-serif text-white uppercase tracking-widest flex items-center gap-2">
                <CarFront className="w-4 h-4 text-[#D4AF37]" />
                <span>Carrocería</span>
              </h4>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Estado Exterior</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Paragolpe delantero</span>
                {getStatusBadge(bodywork.frontBumper || 'REGULAR')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Paragolpe trasero</span>
                {getStatusBadge(bodywork.rearBumper || 'REGULAR')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Puerta delantera derecha</span>
                {getStatusBadge(bodywork.frontRightDoor || 'DETALLES EN CHAPA')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Puerta delantera izquierda</span>
                {getStatusBadge(bodywork.frontLeftDoor || 'NO ABRE')}
              </div>
              {bodywork.rearRightDoor && (
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/60">Puerta trasera derecha</span>
                  {getStatusBadge(bodywork.rearRightDoor)}
                </div>
              )}
              {bodywork.rearLeftDoor && (
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/60">Puerta trasera izquierda</span>
                  {getStatusBadge(bodywork.rearLeftDoor)}
                </div>
              )}
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Capot</span>
                {getStatusBadge(bodywork.hood || 'REGULAR, CERRADURA NO CIERRA BIEN')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Techo</span>
                {getStatusBadge(bodywork.roof || 'REGULAR')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Parabrisa</span>
                {getStatusBadge(bodywork.windshield || 'BUENO')}
              </div>
            </div>

            {bodywork.generalNotes && (
              <div className="pt-2 text-[11px] text-white/50 italic bg-[#050505] p-2.5 border border-white/5">
                Observaciones carrocería: {bodywork.generalNotes}
              </div>
            )}
          </div>
        )}

        {/* SECTION B: INTERIOR */}
        {(activeCategory === 'all' || activeCategory === 'interior') && (
          <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h4 className="text-xs font-serif text-white uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                <span>Interior & Habitáculo</span>
              </h4>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Detalles de Confort</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Volante</span>
                {getStatusBadge(interior.steeringWheel || 'REGULAR')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Palanca de cambios</span>
                {getStatusBadge(interior.gearShift || 'REGULAR')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Plancha de abordo (torpedo)</span>
                {getStatusBadge(interior.dashboard || 'REGULAR')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Butaca conductor</span>
                {getStatusBadge(interior.driverSeat || 'REGULAR')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Butaca acompañante</span>
                {getStatusBadge(interior.passengerSeat || 'REGULAR')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Aire acondicionado</span>
                {getStatusBadge(interior.airConditioning || 'REGULAR')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Calefacción</span>
                {getStatusBadge(interior.heating || 'REGULAR')}
              </div>
            </div>

            {interior.generalNotes && (
              <div className="pt-2 text-[11px] text-white/50 italic bg-[#050505] p-2.5 border border-white/5">
                Observaciones habitáculo: {interior.generalNotes}
              </div>
            )}
          </div>
        )}

        {/* SECTION C: MECÁNICA */}
        {(activeCategory === 'all' || activeCategory === 'mecanica') && (
          <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h4 className="text-xs font-serif text-white uppercase tracking-widest flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#D4AF37]" />
                <span>Mecánica Integral & Tren de Rodaje</span>
              </h4>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Peritaje Detallado</span>
            </div>

            {/* Tren Delantero */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold block border-b border-white/5 pb-1">
                Tren Delantero
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Cremallera de dirección</span>
                  {getStatusBadge(mechanics.frontRack || 'REGULAR')}
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Bujes / extremos / rótula / precap</span>
                  {getStatusBadge(mechanics.frontBushingsBallJoints || 'A REPARAR')}
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Frenos delanteros</span>
                  {getStatusBadge(mechanics.frontBrakes || 'OPTIMOS')}
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Amortiguadores / cazoleta / crapodina</span>
                  {getStatusBadge(mechanics.frontShocksSprings || 'AMORTIGUADORES EN BUEN ESTADO')}
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Cubiertas delanteras</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-white/10 h-2 overflow-hidden">
                      <div className="bg-[#D4AF37] h-full" style={{ width: mechanics.frontTiresPercent || '40%' }} />
                    </div>
                    {getStatusBadge(mechanics.frontTiresPercent || '40%')}
                  </div>
                </div>
              </div>
            </div>

            {/* Tren Trasero */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold block border-b border-white/5 pb-1">
                Tren Trasero & Suspensión
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Tren trasero estado</span>
                  {getStatusBadge(mechanics.rearAxle || 'REGULAR')}
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Frenos traseros</span>
                  {getStatusBadge(mechanics.rearBrakes || 'REGULAR')}
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Amortiguadores / tope / hojas elásticos</span>
                  {getStatusBadge(mechanics.rearShocksSprings || 'HOJAS DE ELASTICOS REGULARES')}
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Bujes traseros</span>
                  {getStatusBadge(mechanics.rearBushings || 'REGULAR')}
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Elásticos</span>
                  {getStatusBadge(mechanics.rearLeafSprings || 'REGULAR')}
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Cubiertas traseras</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-white/10 h-2 overflow-hidden">
                      <div className="bg-[#D4AF37] h-full" style={{ width: mechanics.rearTiresPercent || '40%' }} />
                    </div>
                    {getStatusBadge(mechanics.rearTiresPercent || '40%')}
                  </div>
                </div>
              </div>
            </div>

            {/* Motor y Transmisión */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold block border-b border-white/5 pb-1">
                Motor & Transmisión
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-white/5">
                  <span className="text-white/60">Motor</span>
                  {getStatusBadge(mechanics.engineCondition || 'BUEN FUNCIONAMIENTO , SE LE CAMBIO JUNTA DE VALVULAS')}
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Doble tracción (4x4)</span>
                  {getStatusBadge(mechanics.allWheelDrive || 'NO')}
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Transmisión / Embrague</span>
                  {getStatusBadge(mechanics.clutchTransmission || 'REGULAR')}
                </div>
              </div>
            </div>

            {mechanics.generalNotes && (
              <div className="pt-2 text-[11px] text-white/50 italic bg-[#050505] p-2.5 border border-white/5">
                Observaciones mecánicas: {mechanics.generalNotes}
              </div>
            )}
          </div>
        )}

        {/* SECTION D: ACCESORIOS */}
        {(activeCategory === 'all' || activeCategory === 'accesorios') && (
          <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h4 className="text-xs font-serif text-white uppercase tracking-widest flex items-center gap-2">
                <Award className="w-4 h-4 text-[#D4AF37]" />
                <span>Accesorios & Equipamiento Adicional</span>
              </h4>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Dotación</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Doble tanque de combustible</span>
                {getStatusBadge(accessories.dualFuelTank || 'SI')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Alfombras</span>
                {getStatusBadge(accessories.floorMats || 'SI')}
              </div>
              {accessories.climatizer && (
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/60">Climatizador / Vigía</span>
                  {getStatusBadge(accessories.climatizer)}
                </div>
              )}
              {accessories.towHook && (
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/60">Enganche para remolque</span>
                  {getStatusBadge(accessories.towHook)}
                </div>
              )}
            </div>

            {accessories.notes && (
              <div className="pt-2 text-[11px] text-white/50 italic bg-[#050505] p-2.5 border border-white/5">
                Notas de accesorios: {accessories.notes}
              </div>
            )}
          </div>
        )}

        {/* SECTION E: DOCUMENTACIÓN */}
        {(activeCategory === 'all' || activeCategory === 'documentacion') && (
          <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h4 className="text-xs font-serif text-white uppercase tracking-widest flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>Documentación & Registral</span>
              </h4>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Estado Legal</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Cédula verde actual</span>
                {getStatusBadge(documentation.greenCardCurrent || 'SI - chapa patente en tramite')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">2da llave</span>
                {getStatusBadge(documentation.secondKey || 'SI')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Manuales de fábrica</span>
                {getStatusBadge(documentation.manuals || 'NO')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Kit de seguridad</span>
                {getStatusBadge(documentation.safetyKit || 'NO')}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-white/60">Matafuegos</span>
                {getStatusBadge(documentation.fireExtinguisher || 'NO')}
              </div>
              {car.vtvValidUntil && (
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-white/60">VTV / RTO Vigente</span>
                  {getStatusBadge(documentation.vtvStatus || `Vigente hasta ${car.vtvValidUntil}`)}
                </div>
              )}
            </div>

            {documentation.notes && (
              <div className="pt-2 text-[11px] text-white/50 italic bg-[#050505] p-2.5 border border-white/5">
                Notas documentales: {documentation.notes}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Contact CTA */}
      <div className="bg-[#050505] border border-white/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-white text-xs font-serif block">
            ¿Deseas consultar o agendar inspección presencial para este vehículo?
          </span>
          <span className="text-[11px] text-white/40 font-light">
            Referente asignado: <strong className="text-white">{contactPerson}</strong> • {unitName}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {contactPhone && (
            <a
              href={`tel:${contactPhone}`}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#0a0a0a] hover:bg-white/10 text-white border border-white/10 text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Llamar</span>
            </a>
          )}
          <a
            href={`https://wa.me/${contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
              `Hola ${contactPerson}! Te escribo por la ficha del ${car.title} (${car.year}, Dominio: ${car.licensePlate || 'S/D'}). Quisiera más detalles.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Preguntar</span>
          </a>
        </div>
      </div>
    </div>
  );
};
