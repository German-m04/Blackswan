import React, { useState } from 'react';
import { AgencySettings } from '../types';
import { storage } from '../utils/storage';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  Globe, 
  Sparkles, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  ExternalLink, 
  CheckCircle2, 
  Plus, 
  X, 
  Award, 
  Coffee, 
  Car, 
  MessageCircle, 
  Instagram, 
  Facebook,
  Eye,
  Sliders,
  AlertCircle
} from 'lucide-react';

interface AdminAgencySettingsProps {
  initialSettings?: AgencySettings;
  onSettingsSaved?: (newSettings: AgencySettings) => void;
}

export const AdminAgencySettings: React.FC<AdminAgencySettingsProps> = ({
  initialSettings,
  onSettingsSaved
}) => {
  const currentStored = initialSettings || storage.getAgencySettings();
  const [formData, setFormData] = useState<AgencySettings>({ ...currentStored });
  const [activeSubSection, setActiveSubSection] = useState<'location' | 'hours' | 'contact' | 'home' | 'stats' | 'pillars'>('location');
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleChange = <K extends keyof AgencySettings>(key: K, value: AgencySettings[K]) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value
    }));
    setSaveSuccess(false);
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    const clean = newFeatureInput.trim();
    if (!formData.locationFeatures.includes(clean)) {
      handleChange('locationFeatures', [...formData.locationFeatures, clean]);
    }
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (feature: string) => {
    handleChange(
      'locationFeatures',
      formData.locationFeatures.filter((f) => f !== feature)
    );
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Auto compute fullAddress if empty or updated
      const fullAddr = formData.fullAddress?.trim() 
        ? formData.fullAddress.trim() 
        : `${formData.address || ''}, ${formData.city || ''}`.trim();

      // Clean phone for tel:
      const cleanPhone = formData.phone ? formData.phone.replace(/[^0-9+]/g, '') : '+541140008888';
      // Clean whatsapp for wa.me:
      const cleanWhatsapp = formData.whatsapp ? formData.whatsapp.replace(/[^0-9]/g, '') : '5491140008888';

      const payload: AgencySettings = {
        ...formData,
        fullAddress: fullAddr,
        phoneClean: cleanPhone,
        whatsappClean: cleanWhatsapp,
        updatedAt: new Date().toISOString()
      };

      storage.saveAgencySettings(payload);
      setFormData(payload);
      if (onSettingsSaved) {
        onSettingsSaved(payload);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (error) {
      console.error('Error saving agency settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('¿Está seguro de restablecer toda la información a los valores oficiales predeterminados? Se perderán las modificaciones no guardadas.')) {
      const reset = storage.resetAgencySettings();
      setFormData({ ...reset });
      if (onSettingsSaved) {
        onSettingsSaved(reset);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="bg-[#0a0a0a] border border-white/15 p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-mono font-semibold uppercase tracking-[0.25em] rounded-full">
              <Sliders className="w-3.5 h-3.5" />
              <span>Configuración del Sitio & Negocio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-white font-light">
              Datos de la Agencia & Portada
            </h1>
            <p className="text-white/50 text-xs sm:text-sm font-light max-w-2xl leading-relaxed">
              Personalice aquí el domicilio, los horarios de atención, las líneas de contacto directo y todos los textos e indicadores que se reflejan en la página de inicio, ubicación y pie de página.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                previewMode 
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]' 
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{previewMode ? 'Ocultar Vista Previa' : 'Ver Vista Previa'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold text-xs font-mono uppercase tracking-[0.15em] flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios en Vivo'}</span>
            </button>
          </div>
        </div>

        {/* Save success banner */}
        {saveSuccess && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">¡Cambios guardados con éxito!</span>
              <span className="text-emerald-400/80 ml-1.5">
                La información de la agencia, domicilio, horarios y textos de la página de inicio se han actualizado en tiempo real.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Live Preview Card if active */}
      {previewMode && (
        <div className="bg-[#050505] border-2 border-[#D4AF37]/40 p-6 sm:p-8 rounded-2xl space-y-6 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-mono uppercase tracking-widest font-semibold">
                Vista Previa en Tiempo Real de la Portada & Tarjeta Institucional
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Datos Actuales en Pantalla
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-[#0a0a0a] p-6 rounded-xl border border-white/10">
            <div className="lg:col-span-8 space-y-3 text-left">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#D4AF37] block">
                {formData.agencySlogan}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-white font-light">
                {formData.agencyName}
              </h2>
              <h3 className="text-base sm:text-lg text-white/90 font-light">
                {formData.heroSubtitle}
              </h3>
              <p className="text-xs text-white/60 font-light leading-relaxed">
                {formData.heroDescription}
              </p>

              {/* Badges preview */}
              <div className="flex flex-wrap gap-2 pt-2">
                <div className="flex items-center gap-2 text-[11px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-white/80">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{formData.fullAddress}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-white/80">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Lun-Vie: {formData.scheduleWeekdays}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-white/80">
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{formData.phone}</span>
                </div>
              </div>
            </div>

            {/* Metrics preview */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              <div className="bg-[#030303] p-3 border border-white/10 text-center rounded-lg">
                <span className="text-xl font-serif text-[#D4AF37] block">{formData.statsDeliveredCars}</span>
                <span className="text-[9px] uppercase tracking-wider text-white/50 block font-mono">{formData.statsDeliveredLabel}</span>
              </div>
              <div className="bg-[#030303] p-3 border border-white/10 text-center rounded-lg">
                <span className="text-xl font-serif text-[#D4AF37] block">{formData.statsInspectionPoints}</span>
                <span className="text-[9px] uppercase tracking-wider text-white/50 block font-mono">{formData.statsInspectionLabel}</span>
              </div>
              <div className="bg-[#030303] p-3 border border-white/10 text-center rounded-lg">
                <span className="text-xl font-serif text-[#D4AF37] block">{formData.statsVerifiedDomain}</span>
                <span className="text-[9px] uppercase tracking-wider text-white/50 block font-mono">{formData.statsVerifiedLabel}</span>
              </div>
              <div className="bg-[#030303] p-3 border border-white/10 text-center rounded-lg">
                <span className="text-xl font-serif text-[#D4AF37] block">{formData.statsRegistrationHours}</span>
                <span className="text-[9px] uppercase tracking-wider text-white/50 block font-mono">{formData.statsRegistrationLabel}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubSection('location')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeSubSection === 'location'
              ? 'bg-[#D4AF37] text-black font-bold shadow-md shadow-[#D4AF37]/20'
              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>1. Domicilio & Showroom</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('hours')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeSubSection === 'hours'
              ? 'bg-[#D4AF37] text-black font-bold shadow-md shadow-[#D4AF37]/20'
              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>2. Horarios de Atención</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('contact')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeSubSection === 'contact'
              ? 'bg-[#D4AF37] text-black font-bold shadow-md shadow-[#D4AF37]/20'
              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>3. Contacto & Redes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('home')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeSubSection === 'home'
              ? 'bg-[#D4AF37] text-black font-bold shadow-md shadow-[#D4AF37]/20'
              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>4. Textos de Portada (Inicio)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('stats')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeSubSection === 'stats'
              ? 'bg-[#D4AF37] text-black font-bold shadow-md shadow-[#D4AF37]/20'
              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>5. Métricas de Inicio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('pillars')}
          className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeSubSection === 'pillars'
              ? 'bg-[#D4AF37] text-black font-bold shadow-md shadow-[#D4AF37]/20'
              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>6. Pilares de Calidad</span>
        </button>
      </div>

      {/* Main Form Fields Container */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* ========================================================================= */}
        {/* SECCIÓN 1: DOMICILIO & SHOWROOM                                          */}
        {/* ========================================================================= */}
        {activeSubSection === 'location' && (
          <div className="bg-[#0a0a0a] border border-white/15 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif text-white font-medium">
                  Domicilio Físico & Ubicación de la Agencia
                </h3>
                <p className="text-xs text-white/50 font-light">
                  Se refleja en el pie de página (footer), sección de ubicación, mapa interactivo y encabezados de stock.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Nombre Oficial del Showroom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.showroomName}
                  onChange={(e) => handleChange('showroomName', e.target.value)}
                  placeholder="Ej: Showroom Central Black Swan"
                  className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <span className="text-[10px] text-white/40 block">Nombre del local o salón comercial.</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Dirección / Domicilio (Calle y Altura) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Ej: Av. del Libertador 4800"
                  className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <span className="text-[10px] text-white/40 block">Avenida o calle y número de puerta.</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Localidad / Partido / Provincia *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Ej: Vicente López, Buenos Aires"
                  className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <span className="text-[10px] text-white/40 block">Ciudad o zona metropolitana.</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Dirección Completa Consolidada (para Footer y Tarjetas)
                </label>
                <input
                  type="text"
                  value={formData.fullAddress}
                  onChange={(e) => handleChange('fullAddress', e.target.value)}
                  placeholder="Ej: Av. del Libertador 4800, Vicente López"
                  className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <span className="text-[10px] text-white/40 block">Formato unificado visible para el usuario.</span>
              </div>
            </div>

            {/* Google Maps link */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                Enlace / URL a Google Maps
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.googleMapsUrl}
                  onChange={(e) => handleChange('googleMapsUrl', e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className="flex-1 bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                {formData.googleMapsUrl && (
                  <a
                    href={formData.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-[#D4AF37] text-xs font-mono flex items-center gap-2 transition-colors"
                  >
                    <span>Probar Mapa</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <span className="text-[10px] text-white/40 block">
                Al hacer clic en el botón de navegación del mapa o ubicación, los visitantes se dirigirán a esta dirección.
              </span>
            </div>

            {/* Showroom description */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                Descripción del Espacio Showroom (Página de Ubicación)
              </label>
              <textarea
                rows={3}
                value={formData.showroomDescription}
                onChange={(e) => handleChange('showroomDescription', e.target.value)}
                placeholder="Describa el showroom, superficie, comodidades..."
                className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] resize-none"
              />
            </div>

            {/* Location features / amenities */}
            <div className="space-y-3 pt-2">
              <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                Comodidades y Atributos del Showroom (Chips en Ubicación)
              </label>
              
              <div className="flex flex-wrap gap-2">
                {formData.locationFeatures.map((feat) => (
                  <span
                    key={feat}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white text-xs"
                  >
                    <span>{feat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(feat)}
                      className="text-white/40 hover:text-red-400 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={newFeatureInput}
                  onChange={(e) => setNewFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  placeholder="Ej: Valet Parking, Cafetería de Especialidad..."
                  className="flex-1 bg-[#050505] border border-white/15 px-3 py-2 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN 2: HORARIOS DE ATENCIÓN                                           */}
        {/* ========================================================================= */}
        {activeSubSection === 'hours' && (
          <div className="bg-[#0a0a0a] border border-white/15 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif text-white font-medium">
                  Horarios de Atención al Público & Citas
                </h3>
                <p className="text-xs text-white/50 font-light">
                  Se reflejan en el pie de página, en el banner de showroom, en la ficha de contacto y en la reserva de visitas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Lunes a Viernes *
                </label>
                <input
                  type="text"
                  required
                  value={formData.scheduleWeekdays}
                  onChange={(e) => handleChange('scheduleWeekdays', e.target.value)}
                  placeholder="09:00 hs a 19:00 hs"
                  className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <span className="text-[10px] text-white/40 block">Horario corrido días hábiles.</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Sábados *
                </label>
                <input
                  type="text"
                  required
                  value={formData.scheduleSaturdays}
                  onChange={(e) => handleChange('scheduleSaturdays', e.target.value)}
                  placeholder="09:00 hs a 14:00 hs"
                  className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <span className="text-[10px] text-white/40 block">Jornada de sábado.</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Domingos & Feriados
                </label>
                <input
                  type="text"
                  value={formData.scheduleSundays}
                  onChange={(e) => handleChange('scheduleSundays', e.target.value)}
                  placeholder="Cerrado (Atención con Cita Previa)"
                  className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <span className="text-[10px] text-white/40 block">Régimen dominical o feriados.</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                Aclaración / Política de Reservas VIP
              </label>
              <textarea
                rows={2}
                value={formData.scheduleNote || ''}
                onChange={(e) => handleChange('scheduleNote', e.target.value)}
                placeholder="Reserve un horario preferencial para ser recibido por un ejecutivo..."
                className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] resize-none"
              />
              <span className="text-[10px] text-white/40 block">Nota aclaratoria para test drive y atención personalizada.</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN 3: CONTACTO DIRECTO & REDES SOCIALES                             */}
        {/* ========================================================================= */}
        {activeSubSection === 'contact' && (
          <div className="bg-[#0a0a0a] border border-white/15 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif text-white font-medium">
                  Canales de Comunicación, WhatsApp & Redes Sociales
                </h3>
                <p className="text-xs text-white/50 font-light">
                  Configura el botón flotante de WhatsApp, enlaces de redes del footer y números de llamada directa.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Teléfono Central Visible *
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+54 (11) 4000-8888"
                  className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <span className="text-[10px] text-white/40 block">Texto visible en cabeceras y pie de página.</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Correo Electrónico Comercial *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="inquiry@blackswan.cars"
                  className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <span className="text-[10px] text-white/40 block">Casilla para recepción de consultas y cotizaciones.</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Número de WhatsApp Visible
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  placeholder="+54 9 11 4000-8888"
                  className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Número Limpio WhatsApp (para botón flotante & enlaces wa.me) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.whatsappClean}
                  onChange={(e) => handleChange('whatsappClean', e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="5491140008888"
                  className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <span className="text-[10px] text-white/40 block">Código de país + área sin espacios ni signos (ej: 5491140008888).</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                Mensaje Predeterminado del Botón de WhatsApp
              </label>
              <input
                type="text"
                value={formData.whatsappDefaultMessage}
                onChange={(e) => handleChange('whatsappDefaultMessage', e.target.value)}
                placeholder="Hola Black Swan, quisiera realizar una consulta por un vehículo."
                className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
              <span className="text-[10px] text-white/40 block">Texto precargado cuando el cliente abre WhatsApp desde el botón flotante.</span>
            </div>

            {/* Redes Sociales */}
            <div className="border-t border-white/10 pt-6 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
                Redes Sociales & Presencia Digital
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                    URL de Instagram
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.instagramUrl}
                      onChange={(e) => handleChange('instagramUrl', e.target.value)}
                      placeholder="https://instagram.com/blackswan.cars"
                      className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                    URL de Facebook
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.facebookUrl}
                      onChange={(e) => handleChange('facebookUrl', e.target.value)}
                      placeholder="https://facebook.com"
                      className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN 4: TEXTOS DE PORTADA (PÁGINA DE INICIO)                          */}
        {/* ========================================================================= */}
        {activeSubSection === 'home' && (
          <div className="bg-[#0a0a0a] border border-white/15 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif text-white font-medium">
                  Identidad & Declaraciones en Página de Inicio (Home)
                </h3>
                <p className="text-xs text-white/50 font-light">
                  Edita los títulos principales, lema comercial y narrativa institucional que ven los clientes al entrar al sitio.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Nombre Completo de la Marca / Agencia *
                </label>
                <input
                  type="text"
                  required
                  value={formData.agencyName}
                  onChange={(e) => handleChange('agencyName', e.target.value)}
                  placeholder="BLACK SWAN Luxury Cars"
                  className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs font-serif focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Nombre Corto / Sigla *
                </label>
                <input
                  type="text"
                  required
                  value={formData.agencyShortName}
                  onChange={(e) => handleChange('agencyShortName', e.target.value)}
                  placeholder="BLACK SWAN"
                  className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                Lema / Badge Superior de la Portada
              </label>
              <input
                type="text"
                value={formData.agencySlogan}
                onChange={(e) => handleChange('agencySlogan', e.target.value)}
                placeholder="Casa de Automóviles Seleccionados"
                className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
              <span className="text-[10px] text-white/40 block">Aparece en letras doradas mayúsculas sobre el título en la portada.</span>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                Promesa Principal / Título Destacado de Portada *
              </label>
              <input
                type="text"
                required
                value={formData.heroSubtitle}
                onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                placeholder="Transparencia absoluta en vehículos premium y seminuevos"
                className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs sm:text-sm font-serif focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                Párrafo de Presentación Institucional (Brand Narrative) *
              </label>
              <textarea
                rows={4}
                required
                value={formData.heroDescription}
                onChange={(e) => handleChange('heroDescription', e.target.value)}
                placeholder="Curamos cada unidad con rigurosidad técnica y jurídica..."
                className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] leading-relaxed resize-none"
              />
              <span className="text-[10px] text-white/40 block">Texto de respaldo explicativo mostrado en la sección de presentación del Home.</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN 5: MÉTRICAS & CIFRAS CLAVE EN INICIO                             */}
        {/* ========================================================================= */}
        {activeSubSection === 'stats' && (
          <div className="bg-[#0a0a0a] border border-white/15 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif text-white font-medium">
                  Cifras & Estadísticas de Portada
                </h3>
                <p className="text-xs text-white/50 font-light">
                  Los 4 bloques numéricos destacados que respaldan la trayectoria de la agencia frente a los clientes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Métrica 1 */}
              <div className="bg-[#050505] p-5 rounded-xl border border-white/10 space-y-3">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider block">Métrica 1</span>
                <div>
                  <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Cifra / Valor</label>
                  <input
                    type="text"
                    value={formData.statsDeliveredCars}
                    onChange={(e) => handleChange('statsDeliveredCars', e.target.value)}
                    placeholder="+500"
                    className="w-full bg-[#0a0a0a] border border-white/15 px-3 py-2 rounded-lg text-[#D4AF37] font-serif text-lg font-normal"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Etiqueta</label>
                  <input
                    type="text"
                    value={formData.statsDeliveredLabel}
                    onChange={(e) => handleChange('statsDeliveredLabel', e.target.value)}
                    placeholder="Unidades Entregadas"
                    className="w-full bg-[#0a0a0a] border border-white/15 px-3 py-2 rounded-lg text-white/80 text-xs"
                  />
                </div>
              </div>

              {/* Métrica 2 */}
              <div className="bg-[#050505] p-5 rounded-xl border border-white/10 space-y-3">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider block">Métrica 2</span>
                <div>
                  <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Cifra / Valor</label>
                  <input
                    type="text"
                    value={formData.statsInspectionPoints}
                    onChange={(e) => handleChange('statsInspectionPoints', e.target.value)}
                    placeholder="150"
                    className="w-full bg-[#0a0a0a] border border-white/15 px-3 py-2 rounded-lg text-[#D4AF37] font-serif text-lg font-normal"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Etiqueta</label>
                  <input
                    type="text"
                    value={formData.statsInspectionLabel}
                    onChange={(e) => handleChange('statsInspectionLabel', e.target.value)}
                    placeholder="Puntos de Peritaje"
                    className="w-full bg-[#0a0a0a] border border-white/15 px-3 py-2 rounded-lg text-white/80 text-xs"
                  />
                </div>
              </div>

              {/* Métrica 3 */}
              <div className="bg-[#050505] p-5 rounded-xl border border-white/10 space-y-3">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider block">Métrica 3</span>
                <div>
                  <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Cifra / Valor</label>
                  <input
                    type="text"
                    value={formData.statsVerifiedDomain}
                    onChange={(e) => handleChange('statsVerifiedDomain', e.target.value)}
                    placeholder="100%"
                    className="w-full bg-[#0a0a0a] border border-white/15 px-3 py-2 rounded-lg text-[#D4AF37] font-serif text-lg font-normal"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Etiqueta</label>
                  <input
                    type="text"
                    value={formData.statsVerifiedLabel}
                    onChange={(e) => handleChange('statsVerifiedLabel', e.target.value)}
                    placeholder="Dominio Verificado"
                    className="w-full bg-[#0a0a0a] border border-white/15 px-3 py-2 rounded-lg text-white/80 text-xs"
                  />
                </div>
              </div>

              {/* Métrica 4 */}
              <div className="bg-[#050505] p-5 rounded-xl border border-white/10 space-y-3">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider block">Métrica 4</span>
                <div>
                  <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Cifra / Valor</label>
                  <input
                    type="text"
                    value={formData.statsRegistrationHours}
                    onChange={(e) => handleChange('statsRegistrationHours', e.target.value)}
                    placeholder="48hs"
                    className="w-full bg-[#0a0a0a] border border-white/15 px-3 py-2 rounded-lg text-[#D4AF37] font-serif text-lg font-normal"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Etiqueta</label>
                  <input
                    type="text"
                    value={formData.statsRegistrationLabel}
                    onChange={(e) => handleChange('statsRegistrationLabel', e.target.value)}
                    placeholder="Gestión Registral"
                    className="w-full bg-[#0a0a0a] border border-white/15 px-3 py-2 rounded-lg text-white/80 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN 6: PILARES DE EXCELENCIA (PÁGINA DE INICIO)                      */}
        {/* ========================================================================= */}
        {activeSubSection === 'pillars' && (
          <div className="bg-[#0a0a0a] border border-white/15 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif text-white font-medium">
                  Pilares de Calidad Institucional (Página de Inicio)
                </h3>
                <p className="text-xs text-white/50 font-light">
                  Sección explicativa de los 3 pilares de servicio (Inspección técnica, Seguridad jurídica y Permutas).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Título General de la Sección de Pilares *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pillarsTitle}
                  onChange={(e) => handleChange('pillarsTitle', e.target.value)}
                  placeholder="Rigurosidad Técnica & Seguridad Jurídica"
                  className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs font-serif focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-white/70 uppercase tracking-wider">
                  Subtítulo Explicativo de la Sección *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pillarsSubtitle}
                  onChange={(e) => handleChange('pillarsSubtitle', e.target.value)}
                  placeholder="Cada vehículo es sometido a estrictos controles antes de su exhibición..."
                  className="w-full bg-[#050505] border border-white/15 px-4 py-3 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            {/* Los 3 pilares */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Pilar 1 */}
              <div className="bg-[#050505] p-5 rounded-xl border border-white/10 space-y-3">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest block">01 / Inspección</span>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest">Título</label>
                  <input
                    type="text"
                    value={formData.pillar1Title}
                    onChange={(e) => handleChange('pillar1Title', e.target.value)}
                    placeholder="Peritaje Técnico de 150 Puntos"
                    className="w-full bg-[#0a0a0a] border border-white/15 px-3 py-2 rounded-lg text-white font-serif text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest">Descripción</label>
                  <textarea
                    rows={4}
                    value={formData.pillar1Desc}
                    onChange={(e) => handleChange('pillar1Desc', e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/15 px-3 py-2 rounded-lg text-white/70 text-xs resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Pilar 2 */}
              <div className="bg-[#050505] p-5 rounded-xl border border-white/10 space-y-3">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest block">02 / Gestoría</span>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest">Título</label>
                  <input
                    type="text"
                    value={formData.pillar2Title}
                    onChange={(e) => handleChange('pillar2Title', e.target.value)}
                    placeholder="Seguridad Documental Garantizada"
                    className="w-full bg-[#0a0a0a] border border-white/15 px-3 py-2 rounded-lg text-white font-serif text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest">Descripción</label>
                  <textarea
                    rows={4}
                    value={formData.pillar2Desc}
                    onChange={(e) => handleChange('pillar2Desc', e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/15 px-3 py-2 rounded-lg text-white/70 text-xs resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Pilar 3 */}
              <div className="bg-[#050505] p-5 rounded-xl border border-white/10 space-y-3">
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest block">03 / Permutas</span>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest">Título</label>
                  <input
                    type="text"
                    value={formData.pillar3Title}
                    onChange={(e) => handleChange('pillar3Title', e.target.value)}
                    placeholder="Valuación Transparente"
                    className="w-full bg-[#0a0a0a] border border-white/15 px-3 py-2 rounded-lg text-white font-serif text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-white/50 uppercase tracking-widest">Descripción</label>
                  <textarea
                    rows={4}
                    value={formData.pillar3Desc}
                    onChange={(e) => handleChange('pillar3Desc', e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/15 px-3 py-2 rounded-lg text-white/70 text-xs resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="p-4 sm:p-6 bg-[#0a0a0a] border border-white/15 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-2 text-white/60 text-xs font-mono">
            <AlertCircle className="w-4 h-4 text-[#D4AF37]" />
            <span>Los cambios guardados impactan de forma instantánea en toda la web y para todos los visitantes.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleReset}
              className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="w-1/2 sm:w-auto px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold text-xs font-mono uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
