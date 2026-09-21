import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Car, 
  Check, 
  X, 
  Layers, 
  Database, 
  Sparkles, 
  RefreshCw,
  Edit2
} from 'lucide-react';
import { storage } from '../utils/storage';
import { firebaseSync } from '../firebase';
import { VehicleBrand } from '../types';

export const AdminBrandsManager: React.FC = () => {
  const [brands, setBrands] = useState<VehicleBrand[]>(() => storage.getBrands());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('porsche');
  
  // Add Brand Form State
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandInitialModels, setNewBrandInitialModels] = useState('');
  const [isSavingBrand, setIsSavingBrand] = useState(false);

  // Add Model to Selected Brand State
  const [newModelInput, setNewModelInput] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Synchronize with storage and Firebase
  useEffect(() => {
    setBrands(storage.getBrands());

    const unsubStorage = storage.subscribe(() => {
      setBrands(storage.getBrands());
    });

    const unsubFirebase = firebaseSync.subscribeBrands((fbBrands) => {
      if (fbBrands && fbBrands.length > 0) {
        storage.setBrandsFromFirebase(fbBrands);
        setBrands(storage.getBrands());
      }
    });

    return () => {
      unsubStorage();
      if (typeof unsubFirebase === 'function') {
        unsubFirebase();
      }
    };
  }, []);

  const totalModelsCount = useMemo(() => {
    return brands.reduce((acc, b) => acc + (b.models?.length || 0), 0);
  }, [brands]);

  // Filtered brands by search
  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => {
      const matchBrand = b.name.toLowerCase().includes(q);
      const matchModel = b.models.some((m) => m.toLowerCase().includes(q));
      return matchBrand || matchModel;
    });
  }, [brands, searchQuery]);

  // Active brand
  const activeBrand = useMemo(() => {
    return brands.find((b) => b.id === selectedBrandId) || brands[0] || null;
  }, [brands, selectedBrandId]);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Add a new brand
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newBrandName.trim();
    if (!cleanName) return;

    setIsSavingBrand(true);
    try {
      const modelsList = newBrandInitialModels
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      const created = await storage.addBrand(cleanName);
      if (modelsList.length > 0) {
        for (const m of modelsList) {
          await storage.addModelToBrand(created.name, m);
        }
      }

      setBrands(storage.getBrands());
      setSelectedBrandId(created.id);
      setNewBrandName('');
      setNewBrandInitialModels('');
      setShowAddBrandModal(false);
      showFeedback(`Marca "${created.name}" registrada exitosamente en la base de datos.`);
    } catch (err) {
      console.error('Error creating brand:', err);
    } finally {
      setIsSavingBrand(false);
    }
  };

  // Add model to current active brand
  const handleAddModelToActiveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBrand) return;
    const cleanModel = newModelInput.trim();
    if (!cleanModel) return;

    await storage.addModelToBrand(activeBrand.name, cleanModel);
    setBrands(storage.getBrands());
    setNewModelInput('');
    showFeedback(`Modelo "${cleanModel}" añadido a ${activeBrand.name} en la base de datos.`);
  };

  // Remove model from brand
  const handleRemoveModel = async (modelToRemove: string) => {
    if (!activeBrand) return;
    const confirm = window.confirm(`¿Eliminar el modelo "${modelToRemove}" de ${activeBrand.name}?`);
    if (!confirm) return;

    const updatedModels = activeBrand.models.filter((m) => m !== modelToRemove);
    const updatedBrand: VehicleBrand = {
      ...activeBrand,
      models: updatedModels,
      updatedAt: new Date().toISOString()
    };

    const allBrands = storage.getBrands();
    const idx = allBrands.findIndex((b) => b.id === activeBrand.id);
    if (idx !== -1) {
      allBrands[idx] = updatedBrand;
      storage.saveBrands(allBrands);
      firebaseSync.saveBrand(updatedBrand).catch((err) => console.warn('Firebase error:', err));
      setBrands(storage.getBrands());
      showFeedback(`Modelo "${modelToRemove}" eliminado.`);
    }
  };

  // Delete entire brand
  const handleDeleteBrand = async (brand: VehicleBrand) => {
    const confirm = window.confirm(
      `¿Está seguro de eliminar la marca "${brand.name}" y sus ${brand.models.length} modelos del catálogo de la base de datos?`
    );
    if (!confirm) return;

    const allBrands = storage.getBrands().filter((b) => b.id !== brand.id);
    storage.saveBrands(allBrands);
    // Also delete from Firestore
    try {
      await firebaseSync.deleteBrand(brand.id);
    } catch (err) {
      console.warn('Firebase delete brand:', err);
    }
    setBrands(allBrands);
    if (selectedBrandId === brand.id && allBrands.length > 0) {
      setSelectedBrandId(allBrands[0].id);
    }
    showFeedback(`Marca "${brand.name}" eliminada del catálogo.`);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0a0a] border border-white/10 p-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-base font-serif text-white uppercase tracking-wider font-light">
              Catálogo Oficial de Marcas & Modelos
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Database className="w-3 h-3" />
              Base de Datos Sincronizada
            </span>
          </div>
          <p className="text-white/40 text-xs mt-1">
            Los campos desplegables de marcas y modelos del sistema leen este catálogo. Al añadir una marca o modelo manualmente desde cualquier formulario, se registra automáticamente aquí en la base de datos Firestore.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-white/50">Marcas registradas</div>
            <div className="text-sm font-serif font-bold text-white">
              {brands.length} <span className="text-white/30 text-xs font-sans font-normal">({totalModelsCount} modelos)</span>
            </div>
          </div>
          <button
            onClick={() => setShowAddBrandModal(true)}
            className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#b89528] text-black text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Marca</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATION FEEDBACK */}
      {feedbackMessage && (
        <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#D4AF37]" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-white/40 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SEARCH AND MAIN CATALOG LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: BRANDS LIST (4 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Buscar marca o modelo en la base de datos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 pl-9 pr-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 divide-y divide-white/5 max-h-[640px] overflow-y-auto">
            {filteredBrands.length === 0 ? (
              <div className="p-8 text-center text-white/30 text-xs">
                No se encontraron marcas con la búsqueda "{searchQuery}".
              </div>
            ) : (
              filteredBrands.map((b) => {
                const isSelected = activeBrand?.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBrandId(b.id)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#D4AF37]/10 border-l-2 border-[#D4AF37] text-white'
                        : 'hover:bg-white/5 text-white/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-[#D4AF37] text-black'
                            : 'bg-white/10 text-white/60'
                        }`}
                      >
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-xs text-white flex items-center gap-2">
                          <span>{b.name}</span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                          )}
                        </div>
                        <div className="text-[10px] text-white/40">
                          {b.models.length} {b.models.length === 1 ? 'modelo' : 'modelos'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50 font-mono">
                        {b.models.length}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBrand(b);
                        }}
                        className="p-1.5 text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title={`Eliminar ${b.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE BRAND DETAIL & MODELS (7 cols) */}
        <div className="lg:col-span-7">
          {activeBrand ? (
            <div className="bg-[#0a0a0a] border border-white/10 p-6 space-y-6">
              {/* BRAND HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-serif text-xl font-bold">
                    {activeBrand.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xl font-serif text-white font-medium">
                      {activeBrand.name}
                    </h4>
                    <p className="text-white/40 text-xs">
                      ID de base de datos: <code className="text-[#D4AF37] font-mono">{activeBrand.id}</code>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs px-2.5 py-1 rounded bg-white/10 text-white font-mono">
                    {activeBrand.models.length} Modelos Registrados
                  </span>
                </div>
              </div>

              {/* QUICK ADD MODEL FORM */}
              <form onSubmit={handleAddModelToActiveBrand} className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest text-white/50">
                  Agregar nuevo modelo a {activeBrand.name}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder={`Ej: ${activeBrand.models[0] || 'Nuevo Modelo 2026'}`}
                    value={newModelInput}
                    onChange={(e) => setNewModelInput(e.target.value)}
                    className="flex-1 bg-[#111] border border-white/10 px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#D4AF37] hover:bg-[#b89528] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Guardar Modelo</span>
                  </button>
                </div>
              </form>

              {/* MODELS LIST */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-white/50">
                    Modelos Disponibles en Desplegable ({activeBrand.models.length})
                  </span>
                  <span className="text-[10px] text-white/30">
                    Se ordenan alfabéticamente en los selectores
                  </span>
                </div>

                {activeBrand.models.length === 0 ? (
                  <div className="p-8 text-center text-white/30 text-xs border border-dashed border-white/10">
                    No hay modelos cargados aún para {activeBrand.name}. Utilice el formulario de arriba para añadir el primero.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[460px] overflow-y-auto pr-1">
                    {activeBrand.models.map((m) => (
                      <div
                        key={m}
                        className="flex items-center justify-between bg-[#111] border border-white/5 px-3 py-2 text-xs group hover:border-[#D4AF37]/30 transition-colors"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Car className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                          <span className="text-white/90 truncate">{m}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveModel(m)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-rose-400 transition-opacity"
                          title="Eliminar modelo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#0a0a0a] border border-white/10 p-12 text-center text-white/40 text-xs">
              Seleccione una marca de la lista o registre una nueva.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD NEW BRAND */}
      {showAddBrandModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0a0a0a] border border-[#D4AF37] max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="text-base font-serif text-white">
                  Registrar Nueva Marca en la Base de Datos
                </h4>
              </div>
              <button
                onClick={() => setShowAddBrandModal(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBrand} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                  Nombre de la Marca *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej: Aston Martin, Bentley, McLaren, etc."
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                  Modelos Iniciales (Opcional - Separados por comas)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: DB11, Vantage, DBS Superleggera, DBX"
                  value={newBrandInitialModels}
                  onChange={(e) => setNewBrandInitialModels(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 px-3.5 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37] resize-none"
                />
                <p className="text-[10px] text-white/40 mt-1">
                  Luego podrá añadir más modelos o se registrarán automáticamente cuando los cargue en un vehículo.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddBrandModal(false)}
                  className="px-4 py-2 border border-white/10 text-white/60 hover:text-white text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingBrand}
                  className="px-5 py-2 bg-[#D4AF37] hover:bg-[#b89528] text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  {isSavingBrand ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardar en Base de Datos</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
