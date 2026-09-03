import React, { useState } from 'react';
import { 
  VehicleInspection, 
  VehicleBodyworkInspection, 
  VehicleInteriorInspection, 
  VehicleMechanicsInspection, 
  VehicleAccessories, 
  VehicleDocumentation 
} from '../types';
import { 
  ClipboardCheck, 
  Car, 
  Wrench, 
  FileText, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Phone, 
  MapPin, 
  Clock, 
  ShieldAlert,
  Info
} from 'lucide-react';

interface AdminInspectionFormProps {
  inspection: VehicleInspection;
  onChange: (inspection: VehicleInspection) => void;
  // Top-level linked fields
  priceOnDemand: boolean;
  onPriceOnDemandChange: (val: boolean) => void;
  hours: string;
  onHoursChange: (val: string) => void;
  licensePlate: string;
  onLicensePlateChange: (val: string) => void;
  locationUnit: string;
  onLocationUnitChange: (val: string) => void;
  contactPerson: string;
  onContactPersonChange: (val: string) => void;
  contactPhone: string;
  onContactPhoneChange: (val: string) => void;
  conditionDisclaimer: string;
  onConditionDisclaimerChange: (val: string) => void;
}

export const AdminInspectionForm: React.FC<AdminInspectionFormProps> = ({
  inspection,
  onChange,
  priceOnDemand,
  onPriceOnDemandChange,
  hours,
  onHoursChange,
  licensePlate,
  onLicensePlateChange,
  locationUnit,
  onLocationUnitChange,
  contactPerson,
  onContactPersonChange,
  contactPhone,
  onContactPhoneChange,
  conditionDisclaimer,
  onConditionDisclaimerChange
}) => {
  const [activeTab, setActiveTab] = useState<'referente' | 'carroceria' | 'interior' | 'mecanica' | 'documentacion'>('referente');

  // Helper updates for nested inspection objects
  const updateBodywork = (field: keyof VehicleBodyworkInspection, val: string) => {
    onChange({
      ...inspection,
      bodywork: {
        ...(inspection.bodywork || {}),
        [field]: val
      }
    });
  };

  const updateInterior = (field: keyof VehicleInteriorInspection, val: string) => {
    onChange({
      ...inspection,
      interior: {
        ...(inspection.interior || {}),
        [field]: val
      }
    });
  };

  const updateMechanics = (field: keyof VehicleMechanicsInspection, val: string) => {
    onChange({
      ...inspection,
      mechanics: {
        ...(inspection.mechanics || {}),
        [field]: val
      }
    });
  };

  const updateAccessories = (field: keyof VehicleAccessories, val: string) => {
    onChange({
      ...inspection,
      accessories: {
        ...(inspection.accessories || {}),
        [field]: val
      }
    });
  };

  const updateDocumentation = (field: keyof VehicleDocumentation, val: string) => {
    onChange({
      ...inspection,
      documentation: {
        ...(inspection.documentation || {}),
        [field]: val
      }
    });
  };

  // Preset quick loaders
  const handleLoadFordCargoPreset = () => {
    onPriceOnDemandChange(true);
    onHoursChange('21.349 hs');
    onLicensePlateChange('JTL158');
    onLocationUnitChange('UN - LA CANDELARIA');
    onContactPersonChange('Leandro Cardozo');
    onContactPhoneChange('2396 549940');
    const legalNotice = 'Vehículo usado vendido en el estado en que se encuentra. El comprador declara haberlo inspeccionado previamente y aceptar sus condiciones. Esta descripción es orientativa y no constituye garantía.';
    onConditionDisclaimerChange(legalNotice);

    onChange({
      businessUnit: 'UN - LA CANDELARIA',
      contactPerson: 'Leandro Cardozo',
      contactPhone: '2396 549940',
      engineHours: '21349 hs',
      vehicleConditionDisclaimer: legalNotice,
      bodywork: {
        frontBumper: 'REGULAR',
        rearBumper: 'REGULAR',
        frontRightDoor: 'DETALLES EN CHAPA',
        frontLeftDoor: 'NO ABRE',
        hood: 'REGULAR, CERRADURA NO CIERRA BIEN',
        roof: 'REGULAR',
        windshield: 'BUENO',
        generalNotes: 'Cabina con desgaste acorde al uso operativo comercial.'
      },
      interior: {
        steeringWheel: 'REGULAR',
        gearShift: 'REGULAR',
        dashboard: 'REGULAR',
        driverSeat: 'REGULAR',
        passengerSeat: 'REGULAR',
        airConditioning: 'REGULAR',
        heating: 'REGULAR',
        generalNotes: 'Habitáculo original con desgaste de uso de trabajo.'
      },
      mechanics: {
        frontRack: 'REGULAR',
        frontBushingsBallJoints: 'A REPARAR',
        frontBrakes: 'OPTIMOS',
        frontShocksSprings: 'AMORTIGUADORES EN BUEN ESTADO',
        frontTiresPercent: '40%',
        rearAxle: 'REGULAR',
        rearBrakes: 'REGULAR',
        rearShocksSprings: 'HOJAS DE ELASTICOS REGULARES',
        rearBushings: 'REGULAR',
        rearLeafSprings: 'REGULAR',
        rearTiresPercent: '40%',
        engineCondition: 'BUEN FUNCIONAMIENTO , SE LE CAMBIO JUNTA DE VALVULAS',
        allWheelDrive: 'NO',
        clutchTransmission: 'REGULAR',
        generalNotes: 'Motor funcionando bien, se le cambió junta de válvulas.'
      },
      accessories: {
        dualFuelTank: 'SI',
        floorMats: 'SI',
        notes: 'Doble tanque de combustible operativo.'
      },
      documentation: {
        greenCardCurrent: 'SI - chapa patente en tramite',
        secondKey: 'SI',
        manuals: 'NO',
        safetyKit: 'NO',
        fireExtinguisher: 'NO',
        vtvStatus: 'Consultar vigencia',
        notes: 'Chapa patente en trámite registral.'
      },
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectorName: 'Peritaje Concesionario Oficial'
    });
  };

  const handleLoadOptimoPreset = () => {
    onPriceOnDemandChange(false);
    onConditionDisclaimerChange('Vehículo revisado y peritado técnicamente bajo los más rigurosos estándares de control de calidad.');
    onChange({
      businessUnit: locationUnit || 'Showroom Vicente López',
      contactPerson: contactPerson || 'Asesor Comercial Black Swan',
      contactPhone: contactPhone || '5491140008888',
      engineHours: hours || '',
      vehicleConditionDisclaimer: 'Vehículo en óptimas condiciones mecánicas y estéticas, verificado.',
      bodywork: {
        frontBumper: 'OPTIMO',
        rearBumper: 'OPTIMO',
        frontRightDoor: 'BUENO',
        frontLeftDoor: 'BUENO',
        hood: 'OPTIMO',
        roof: 'OPTIMO',
        windshield: 'OPTIMO',
        generalNotes: 'Pintura original de fábrica sin abolladuras ni rayones significativos.'
      },
      interior: {
        steeringWheel: 'OPTIMO',
        gearShift: 'OPTIMO',
        dashboard: 'OPTIMO',
        driverSeat: 'OPTIMO',
        passengerSeat: 'OPTIMO',
        airConditioning: 'OPTIMO',
        heating: 'OPTIMO',
        generalNotes: 'Tapizados limpios e higienizados, todos los mandos y comandos operativos.'
      },
      mechanics: {
        frontRack: 'BUENO',
        frontBushingsBallJoints: 'OPTIMOS',
        frontBrakes: 'OPTIMOS',
        frontShocksSprings: 'OPTIMOS',
        frontTiresPercent: '85%',
        rearAxle: 'OPTIMO',
        rearBrakes: 'OPTIMOS',
        rearShocksSprings: 'OPTIMOS',
        rearBushings: 'OPTIMOS',
        rearLeafSprings: 'N/A',
        rearTiresPercent: '85%',
        engineCondition: 'EXCELENTE ESTADO, SERVICES AL DIA',
        allWheelDrive: 'NO',
        clutchTransmission: 'OPTIMO',
        generalNotes: 'Sin pérdidas de fluidos, batería en perfecto estado de carga.'
      },
      accessories: {
        dualFuelTank: 'NO',
        floorMats: 'SI',
        climatizer: 'SI',
        notes: 'Equipamiento completo de fábrica original.'
      },
      documentation: {
        greenCardCurrent: 'SI',
        secondKey: 'SI',
        manuals: 'SI',
        safetyKit: 'SI',
        fireExtinguisher: 'SI',
        vtvStatus: 'Vigente',
        notes: 'Documentación 100% al día para transferencia inmediata.'
      },
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectorName: 'Perito Técnico Black Swan'
    });
  };

  const handleClear = () => {
    onChange({});
  };

  // Quick chips component
  const QuickChips = ({ options, onSelect }: { options: string[]; onSelect: (val: string) => void }) => (
    <div className="flex flex-wrap gap-1 mt-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className="text-[9px] px-1.5 py-0.5 bg-white/5 hover:bg-[#D4AF37] hover:text-black text-white/60 border border-white/10 transition-colors uppercase"
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const statusPresets = ['OPTIMO', 'BUENO', 'REGULAR', 'A REPARAR', 'NO FUNCIONA'];

  return (
    <div className="bg-[#080808] border border-[#D4AF37]/30 p-4 sm:p-5 space-y-4">
      {/* Header & Preset Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-[#D4AF37]" />
            <h4 className="text-xs font-serif text-white uppercase tracking-wider">
              Ficha Técnica & Peritaje Detallado del Vehículo
            </h4>
          </div>
          <p className="text-[10px] text-white/50 mt-0.5">
            Carga todos los datos de inspección física, mecánica, unidad de negocio, horas y aviso legal para el catálogo.
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLoadFordCargoPreset}
            className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-black transition-all flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>Ejemplo Real (Ford Cargo 1722)</span>
          </button>
          <button
            type="button"
            onClick={handleLoadOptimoPreset}
            className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Cargar Óptimo</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-white/5 text-white/40 hover:text-rose-400 border border-white/10 transition-all flex items-center gap-1"
            title="Limpiar datos de peritaje"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('referente')}
          className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 border ${
            activeTab === 'referente'
              ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
              : 'bg-[#050505] text-white/60 border-white/10 hover:text-white'
          }`}
        >
          <User className="w-3 h-3" />
          <span>Referente & Datos Ficha</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('carroceria')}
          className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 border ${
            activeTab === 'carroceria'
              ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
              : 'bg-[#050505] text-white/60 border-white/10 hover:text-white'
          }`}
        >
          <Car className="w-3 h-3" />
          <span>Carrocería</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('interior')}
          className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 border ${
            activeTab === 'interior'
              ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
              : 'bg-[#050505] text-white/60 border-white/10 hover:text-white'
          }`}
        >
          <Info className="w-3 h-3" />
          <span>Habitáculo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mecanica')}
          className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 border ${
            activeTab === 'mecanica'
              ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
              : 'bg-[#050505] text-white/60 border-white/10 hover:text-white'
          }`}
        >
          <Wrench className="w-3 h-3" />
          <span>Mecánica & Trenes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documentacion')}
          className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 border ${
            activeTab === 'documentacion'
              ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
              : 'bg-[#050505] text-white/60 border-white/10 hover:text-white'
          }`}
        >
          <FileText className="w-3 h-3" />
          <span>Accesorios & Documentos</span>
        </button>
      </div>

      {/* TAB CONTENT 1: REFERENTE & DATOS FICHA */}
      {activeTab === 'referente' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                Dominio / Patente (Chapa)
              </label>
              <input
                type="text"
                placeholder="Ej: JTL158 o AF 123 CD"
                value={licensePlate}
                onChange={(e) => onLicensePlateChange(e.target.value.toUpperCase())}
                className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <span className="text-[9px] text-white/30 block mt-0.5">Visible en la ficha y buscador</span>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                Horas de Motor (hs)
              </label>
              <input
                type="text"
                placeholder="Ej: 21.349 hs o 21349 hs"
                value={hours}
                onChange={(e) => {
                  onHoursChange(e.target.value);
                  onChange({ ...inspection, engineHours: e.target.value });
                }}
                className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <span className="text-[9px] text-white/30 block mt-0.5">Para camiones, maquinaria o utilitarios</span>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                Modalidad de Precio
              </label>
              <div className="bg-[#050505] border border-white/10 p-2 flex items-center justify-between">
                <span className="text-xs text-white">Precio "A Consultar"</span>
                <input
                  type="checkbox"
                  checked={priceOnDemand}
                  onChange={(e) => onPriceOnDemandChange(e.target.checked)}
                  className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                />
              </div>
              <span className="text-[9px] text-white/30 block mt-0.5">Muestra badge verde "A consultar" en el catálogo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                Lugar / Unidad de Negocio
              </label>
              <input
                type="text"
                placeholder="Ej: UN - LA CANDELARIA / Pehuajó"
                value={locationUnit}
                onChange={(e) => {
                  onLocationUnitChange(e.target.value);
                  onChange({ ...inspection, businessUnit: e.target.value });
                }}
                className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                Referente de Venta
              </label>
              <input
                type="text"
                placeholder="Ej: Leandro Cardozo"
                value={contactPerson}
                onChange={(e) => {
                  onContactPersonChange(e.target.value);
                  onChange({ ...inspection, contactPerson: e.target.value });
                }}
                className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                Teléfono / WhatsApp de Contacto
              </label>
              <input
                type="text"
                placeholder="Ej: 2396 549940"
                value={contactPhone}
                onChange={(e) => {
                  onContactPhoneChange(e.target.value);
                  onChange({ ...inspection, contactPhone: e.target.value });
                }}
                className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
              Aclaración sobre el Estado del Vehículo (Aviso Legal en Ficha)
            </label>
            <textarea
              rows={2}
              value={conditionDisclaimer}
              onChange={(e) => {
                onConditionDisclaimerChange(e.target.value);
                onChange({ ...inspection, vehicleConditionDisclaimer: e.target.value });
              }}
              placeholder="Vehículo usado vendido en el estado en que se encuentra..."
              className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: CARROCERIA */}
      {activeTab === 'carroceria' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Paragolpe Delantero</label>
              <input
                type="text"
                placeholder="Ej: REGULAR / OPTIMO / A REPARAR"
                value={inspection.bodywork?.frontBumper || ''}
                onChange={(e) => updateBodywork('frontBumper', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <QuickChips options={['OPTIMO', 'BUENO', 'REGULAR', 'A REPARAR']} onSelect={(v) => updateBodywork('frontBumper', v)} />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Paragolpe Trasero</label>
              <input
                type="text"
                placeholder="Ej: REGULAR"
                value={inspection.bodywork?.rearBumper || ''}
                onChange={(e) => updateBodywork('rearBumper', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <QuickChips options={['OPTIMO', 'BUENO', 'REGULAR', 'A REPARAR']} onSelect={(v) => updateBodywork('rearBumper', v)} />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Puerta Delantera Derecha</label>
              <input
                type="text"
                placeholder="Ej: DETALLES EN CHAPA"
                value={inspection.bodywork?.frontRightDoor || ''}
                onChange={(e) => updateBodywork('frontRightDoor', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <QuickChips options={['BUENO', 'REGULAR', 'DETALLES EN CHAPA', 'NO ABRE']} onSelect={(v) => updateBodywork('frontRightDoor', v)} />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Puerta Delantera Izquierda</label>
              <input
                type="text"
                placeholder="Ej: NO ABRE / BUENO"
                value={inspection.bodywork?.frontLeftDoor || ''}
                onChange={(e) => updateBodywork('frontLeftDoor', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <QuickChips options={['BUENO', 'REGULAR', 'NO ABRE', 'DETALLES EN CHAPA']} onSelect={(v) => updateBodywork('frontLeftDoor', v)} />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Capot / Cerradura</label>
              <input
                type="text"
                placeholder="Ej: REGULAR, CERRADURA NO CIERRA BIEN"
                value={inspection.bodywork?.hood || ''}
                onChange={(e) => updateBodywork('hood', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <QuickChips options={['OPTIMO', 'BUENO', 'REGULAR', 'CERRADURA NO CIERRA BIEN']} onSelect={(v) => updateBodywork('hood', v)} />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Techo</label>
              <input
                type="text"
                placeholder="Ej: REGULAR / BUENO"
                value={inspection.bodywork?.roof || ''}
                onChange={(e) => updateBodywork('roof', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <QuickChips options={['OPTIMO', 'BUENO', 'REGULAR']} onSelect={(v) => updateBodywork('roof', v)} />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Parabrisas</label>
              <input
                type="text"
                placeholder="Ej: BUENO / FISURADO"
                value={inspection.bodywork?.windshield || ''}
                onChange={(e) => updateBodywork('windshield', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <QuickChips options={['OPTIMO', 'BUENO', 'REGULAR', 'FISURADO / A CAMBIAR']} onSelect={(v) => updateBodywork('windshield', v)} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Observaciones de Carrocería</label>
            <input
              type="text"
              placeholder="Detalles adicionales de pintura, chapa o desgaste exterior..."
              value={inspection.bodywork?.generalNotes || ''}
              onChange={(e) => updateBodywork('generalNotes', e.target.value)}
              className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: INTERIOR */}
      {activeTab === 'interior' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Volante</label>
              <input
                type="text"
                placeholder="Ej: REGULAR / BUENO"
                value={inspection.interior?.steeringWheel || ''}
                onChange={(e) => updateInterior('steeringWheel', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <QuickChips options={statusPresets} onSelect={(v) => updateInterior('steeringWheel', v)} />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Palanca de Cambios</label>
              <input
                type="text"
                placeholder="Ej: REGULAR / BUENO"
                value={inspection.interior?.gearShift || ''}
                onChange={(e) => updateInterior('gearShift', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <QuickChips options={statusPresets} onSelect={(v) => updateInterior('gearShift', v)} />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Plancha de Abordo (Torpedo)</label>
              <input
                type="text"
                placeholder="Ej: REGULAR / BUENO"
                value={inspection.interior?.dashboard || ''}
                onChange={(e) => updateInterior('dashboard', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <QuickChips options={statusPresets} onSelect={(v) => updateInterior('dashboard', v)} />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Butaca Conductor</label>
              <input
                type="text"
                placeholder="Ej: REGULAR / DESGASTE EN TELA"
                value={inspection.interior?.driverSeat || ''}
                onChange={(e) => updateInterior('driverSeat', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <QuickChips options={['OPTIMO', 'BUENO', 'REGULAR', 'DESGASTE']} onSelect={(v) => updateInterior('driverSeat', v)} />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Butaca Acompañante</label>
              <input
                type="text"
                placeholder="Ej: REGULAR / BUENO"
                value={inspection.interior?.passengerSeat || ''}
                onChange={(e) => updateInterior('passengerSeat', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <QuickChips options={['OPTIMO', 'BUENO', 'REGULAR']} onSelect={(v) => updateInterior('passengerSeat', v)} />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Aire Acondicionado</label>
              <input
                type="text"
                placeholder="Ej: REGULAR / ENFRIA BIEN / NO ENFRIA"
                value={inspection.interior?.airConditioning || ''}
                onChange={(e) => updateInterior('airConditioning', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <QuickChips options={['OPTIMO', 'BUENO', 'REGULAR', 'NO ENFRIA / CARGAR GAS']} onSelect={(v) => updateInterior('airConditioning', v)} />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Calefacción</label>
              <input
                type="text"
                placeholder="Ej: REGULAR / BUENO"
                value={inspection.interior?.heating || ''}
                onChange={(e) => updateInterior('heating', e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
              <QuickChips options={statusPresets} onSelect={(v) => updateInterior('heating', v)} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Observaciones de Habitáculo</label>
            <input
              type="text"
              placeholder="Detalles de tapizado, comandos o instrumental..."
              value={inspection.interior?.generalNotes || ''}
              onChange={(e) => updateInterior('generalNotes', e.target.value)}
              className="w-full bg-[#050505] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: MECANICA & TRENES */}
      {activeTab === 'mecanica' && (
        <div className="space-y-4">
          {/* Tren delantero */}
          <div className="bg-[#050505] p-3 border border-white/10 space-y-3">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
              1. Tren Delantero
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Cremallera</label>
                <input
                  type="text"
                  placeholder="Ej: REGULAR"
                  value={inspection.mechanics?.frontRack || ''}
                  onChange={(e) => updateMechanics('frontRack', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={statusPresets} onSelect={(v) => updateMechanics('frontRack', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Bujes / Extremos / Rótula</label>
                <input
                  type="text"
                  placeholder="Ej: A REPARAR / BUENO"
                  value={inspection.mechanics?.frontBushingsBallJoints || ''}
                  onChange={(e) => updateMechanics('frontBushingsBallJoints', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['OPTIMO', 'BUENO', 'REGULAR', 'A REPARAR']} onSelect={(v) => updateMechanics('frontBushingsBallJoints', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Frenos Delanteros</label>
                <input
                  type="text"
                  placeholder="Ej: OPTIMOS / BUENO"
                  value={inspection.mechanics?.frontBrakes || ''}
                  onChange={(e) => updateMechanics('frontBrakes', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['OPTIMOS', 'BUENO', 'REGULAR', 'PASTILLAS A CAMBIAR']} onSelect={(v) => updateMechanics('frontBrakes', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Amortiguadores / Cazoleta</label>
                <input
                  type="text"
                  placeholder="Ej: EN BUEN ESTADO"
                  value={inspection.mechanics?.frontShocksSprings || ''}
                  onChange={(e) => updateMechanics('frontShocksSprings', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['OPTIMO', 'BUEN ESTADO', 'REGULAR', 'A REPARAR']} onSelect={(v) => updateMechanics('frontShocksSprings', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Cubiertas Delanteras (%)</label>
                <input
                  type="text"
                  placeholder="Ej: 40% o 80%"
                  value={inspection.mechanics?.frontTiresPercent || ''}
                  onChange={(e) => updateMechanics('frontTiresPercent', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['90%', '75%', '50%', '40%', '20% (A CAMBIAR)']} onSelect={(v) => updateMechanics('frontTiresPercent', v)} />
              </div>
            </div>
          </div>

          {/* Tren trasero */}
          <div className="bg-[#050505] p-3 border border-white/10 space-y-3">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
              2. Tren Trasero & Suspensión
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Tren Trasero General</label>
                <input
                  type="text"
                  placeholder="Ej: REGULAR"
                  value={inspection.mechanics?.rearAxle || ''}
                  onChange={(e) => updateMechanics('rearAxle', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={statusPresets} onSelect={(v) => updateMechanics('rearAxle', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Frenos Traseros</label>
                <input
                  type="text"
                  placeholder="Ej: REGULAR / BUENO"
                  value={inspection.mechanics?.rearBrakes || ''}
                  onChange={(e) => updateMechanics('rearBrakes', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['OPTIMO', 'BUENO', 'REGULAR', 'A REPARAR']} onSelect={(v) => updateMechanics('rearBrakes', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Amortiguadores / Elásticos</label>
                <input
                  type="text"
                  placeholder="Ej: HOJAS DE ELASTICOS REGULARES"
                  value={inspection.mechanics?.rearShocksSprings || ''}
                  onChange={(e) => updateMechanics('rearShocksSprings', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['OPTIMO', 'HOJAS DE ELASTICOS REGULARES', 'REGULAR']} onSelect={(v) => updateMechanics('rearShocksSprings', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Bujes Traseros</label>
                <input
                  type="text"
                  placeholder="Ej: REGULAR"
                  value={inspection.mechanics?.rearBushings || ''}
                  onChange={(e) => updateMechanics('rearBushings', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={statusPresets} onSelect={(v) => updateMechanics('rearBushings', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Elásticos</label>
                <input
                  type="text"
                  placeholder="Ej: REGULAR / BUEN ESTADO"
                  value={inspection.mechanics?.rearLeafSprings || ''}
                  onChange={(e) => updateMechanics('rearLeafSprings', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['OPTIMO', 'BUEN ESTADO', 'REGULAR', 'N/A']} onSelect={(v) => updateMechanics('rearLeafSprings', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Cubiertas Traseras (%)</label>
                <input
                  type="text"
                  placeholder="Ej: 40% o 70%"
                  value={inspection.mechanics?.rearTiresPercent || ''}
                  onChange={(e) => updateMechanics('rearTiresPercent', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['90%', '75%', '50%', '40%', '20% (A CAMBIAR)']} onSelect={(v) => updateMechanics('rearTiresPercent', v)} />
              </div>
            </div>
          </div>

          {/* Motor y transmision */}
          <div className="bg-[#050505] p-3 border border-white/10 space-y-3">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
              3. Motor & Transmisión
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">
                  Estado del Motor & Observaciones
                </label>
                <input
                  type="text"
                  placeholder="Ej: BUEN FUNCIONAMIENTO , SE LE CAMBIO JUNTA DE VALVULAS"
                  value={inspection.mechanics?.engineCondition || ''}
                  onChange={(e) => updateMechanics('engineCondition', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips 
                  options={[
                    'BUEN FUNCIONAMIENTO , SE LE CAMBIO JUNTA DE VALVULAS',
                    'OPTIMO FUNCIONAMIENTO, SIN FUGAS',
                    'SERVICE COMPLETO AL DIA',
                    'REGULAR'
                  ]} 
                  onSelect={(v) => updateMechanics('engineCondition', v)} 
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Doble Tracción</label>
                <input
                  type="text"
                  placeholder="NO / SI"
                  value={inspection.mechanics?.allWheelDrive || ''}
                  onChange={(e) => updateMechanics('allWheelDrive', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['NO', 'SI', '4X4 OPERATIVA', '4X2']} onSelect={(v) => updateMechanics('allWheelDrive', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Embrague / Transmisión</label>
                <input
                  type="text"
                  placeholder="Ej: REGULAR / OPTIMO"
                  value={inspection.mechanics?.clutchTransmission || ''}
                  onChange={(e) => updateMechanics('clutchTransmission', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={statusPresets} onSelect={(v) => updateMechanics('clutchTransmission', v)} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Observaciones Generales de Mecánica</label>
                <input
                  type="text"
                  placeholder="Detalles sobre frenos, tren delantero o mantenimiento realizado..."
                  value={inspection.mechanics?.generalNotes || ''}
                  onChange={(e) => updateMechanics('generalNotes', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: ACCESORIOS & DOCUMENTACION */}
      {activeTab === 'documentacion' && (
        <div className="space-y-4">
          <div className="bg-[#050505] p-3 border border-white/10 space-y-3">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
              Accesorios del Vehículo
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Doble Tanque Combustible</label>
                <input
                  type="text"
                  placeholder="SI / NO"
                  value={inspection.accessories?.dualFuelTank || ''}
                  onChange={(e) => updateAccessories('dualFuelTank', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['SI', 'NO']} onSelect={(v) => updateAccessories('dualFuelTank', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Alfombras</label>
                <input
                  type="text"
                  placeholder="SI / NO"
                  value={inspection.accessories?.floorMats || ''}
                  onChange={(e) => updateAccessories('floorMats', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['SI', 'NO']} onSelect={(v) => updateAccessories('floorMats', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Climatizador / Vigía</label>
                <input
                  type="text"
                  placeholder="SI / NO"
                  value={inspection.accessories?.climatizer || ''}
                  onChange={(e) => updateAccessories('climatizer', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['SI', 'NO']} onSelect={(v) => updateAccessories('climatizer', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Enganche</label>
                <input
                  type="text"
                  placeholder="SI / NO"
                  value={inspection.accessories?.towHook || ''}
                  onChange={(e) => updateAccessories('towHook', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['SI', 'NO']} onSelect={(v) => updateAccessories('towHook', v)} />
              </div>
            </div>
          </div>

          <div className="bg-[#050505] p-3 border border-white/10 space-y-3">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
              Documentación & Elementos de Seguridad
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Cédula Verde Actual</label>
                <input
                  type="text"
                  placeholder="Ej: SI - chapa patente en tramite"
                  value={inspection.documentation?.greenCardCurrent || ''}
                  onChange={(e) => updateDocumentation('greenCardCurrent', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['SI', 'SI - chapa patente en tramite', 'AL DIA', 'NO']} onSelect={(v) => updateDocumentation('greenCardCurrent', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">2da Llave</label>
                <input
                  type="text"
                  placeholder="SI / NO"
                  value={inspection.documentation?.secondKey || ''}
                  onChange={(e) => updateDocumentation('secondKey', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['SI', 'NO']} onSelect={(v) => updateDocumentation('secondKey', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Manuales de Fábrica</label>
                <input
                  type="text"
                  placeholder="SI / NO"
                  value={inspection.documentation?.manuals || ''}
                  onChange={(e) => updateDocumentation('manuals', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['SI', 'NO']} onSelect={(v) => updateDocumentation('manuals', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Kit de Seguridad</label>
                <input
                  type="text"
                  placeholder="SI / NO"
                  value={inspection.documentation?.safetyKit || ''}
                  onChange={(e) => updateDocumentation('safetyKit', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['SI', 'NO']} onSelect={(v) => updateDocumentation('safetyKit', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Matafuegos</label>
                <input
                  type="text"
                  placeholder="SI / NO"
                  value={inspection.documentation?.fireExtinguisher || ''}
                  onChange={(e) => updateDocumentation('fireExtinguisher', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['SI', 'NO']} onSelect={(v) => updateDocumentation('fireExtinguisher', v)} />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">VTV / RTO</label>
                <input
                  type="text"
                  placeholder="Ej: Vigente / En trámite"
                  value={inspection.documentation?.vtvStatus || ''}
                  onChange={(e) => updateDocumentation('vtvStatus', e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <QuickChips options={['Vigente', 'Consultar vigencia', 'En trámite', 'Vencida']} onSelect={(v) => updateDocumentation('vtvStatus', v)} />
              </div>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Observaciones de Documentación</label>
              <input
                type="text"
                placeholder="Observaciones de radicación o transferencias..."
                value={inspection.documentation?.notes || ''}
                onChange={(e) => updateDocumentation('notes', e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 px-2 py-1 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
