import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Check, X, Car, ChevronDown } from 'lucide-react';
import { storage } from '../utils/storage';
import { firebaseSync } from '../firebase';
import { VehicleBrand } from '../types';

interface BrandModelSelectorProps {
  selectedBrand: string;
  selectedModel: string;
  onBrandChange: (brand: string) => void;
  onModelChange: (model: string) => void;
  brandLabel?: string;
  modelLabel?: string;
  required?: boolean;
  className?: string;
  brandClassName?: string;
  modelClassName?: string;
  showLabels?: boolean;
}

export const BrandModelSelector: React.FC<BrandModelSelectorProps> = ({
  selectedBrand,
  selectedModel,
  onBrandChange,
  onModelChange,
  brandLabel = 'Marca *',
  modelLabel = 'Modelo *',
  required = true,
  className = 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  brandClassName = '',
  modelClassName = '',
  showLabels = true
}) => {
  const [brands, setBrands] = useState<VehicleBrand[]>(() => storage.getBrands());
  const [isAddingNewBrand, setIsAddingNewBrand] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState('');
  const [isAddingNewModel, setIsAddingNewModel] = useState(false);
  const [newModelInput, setNewModelInput] = useState('');

  // Subscribe to storage updates & Firebase real-time catalog
  useEffect(() => {
    // Initial fetch from storage
    setBrands(storage.getBrands());

    // Local storage listener
    const unsubscribeStorage = storage.subscribe(() => {
      setBrands(storage.getBrands());
    });

    // Firebase live catalog listener
    const unsubscribeFirebase = firebaseSync.subscribeBrands((fbBrands) => {
      if (fbBrands && fbBrands.length > 0) {
        storage.setBrandsFromFirebase(fbBrands);
        setBrands(storage.getBrands());
      }
    });

    return () => {
      unsubscribeStorage();
      if (typeof unsubscribeFirebase === 'function') {
        unsubscribeFirebase();
      }
    };
  }, []);

  // Find the selected brand object
  const currentBrandObj = useMemo(() => {
    if (!selectedBrand) return null;
    const lower = selectedBrand.trim().toLowerCase();
    return brands.find((b) => b.name.toLowerCase() === lower) || null;
  }, [brands, selectedBrand]);

  // Models list for current brand
  const availableModels = useMemo(() => {
    if (!currentBrandObj) {
      return selectedModel ? [selectedModel] : [];
    }
    const list = [...currentBrandObj.models];
    if (selectedModel && !list.some((m) => m.toLowerCase() === selectedModel.trim().toLowerCase())) {
      list.push(selectedModel);
    }
    return list.sort((a, b) => a.localeCompare(b));
  }, [currentBrandObj, selectedModel]);

  // Handle adding a new brand manually
  const handleConfirmNewBrand = async () => {
    const trimmed = newBrandInput.trim();
    if (!trimmed) {
      setIsAddingNewBrand(false);
      return;
    }

    const brand = await storage.addBrand(trimmed);
    setBrands(storage.getBrands());
    onBrandChange(brand.name);
    setNewBrandInput('');
    setIsAddingNewBrand(false);
  };

  // Handle adding a new model manually
  const handleConfirmNewModel = async () => {
    const trimmed = newModelInput.trim();
    if (!trimmed) {
      setIsAddingNewModel(false);
      return;
    }

    if (selectedBrand) {
      await storage.addModelToBrand(selectedBrand, trimmed);
      setBrands(storage.getBrands());
    }
    onModelChange(trimmed);
    setNewModelInput('');
    setIsAddingNewModel(false);
  };

  return (
    <div className={className}>
      {/* BRAND SELECTOR FIELD */}
      <div className={`space-y-1.5 ${brandClassName}`}>
        {showLabels && (
          <div className="flex items-center justify-between">
            <label className="block text-[10px] uppercase tracking-widest text-white/50">
              {brandLabel}
            </label>
            {!isAddingNewBrand && (
              <button
                type="button"
                onClick={() => {
                  setIsAddingNewBrand(true);
                  setNewBrandInput('');
                }}
                className="text-[10px] text-[#D4AF37] hover:text-[#f3cc5b] tracking-wider uppercase flex items-center gap-1 font-semibold transition-colors"
                title="Agregar una nueva marca no listada"
              >
                <Plus className="w-3 h-3" />
                <span>+ Nueva Marca</span>
              </button>
            )}
          </div>
        )}

        {isAddingNewBrand ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              placeholder="Escriba el nombre de la nueva marca..."
              value={newBrandInput}
              onChange={(e) => setNewBrandInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirmNewBrand();
                } else if (e.key === 'Escape') {
                  setIsAddingNewBrand(false);
                }
              }}
              className="flex-1 bg-[#0a0a0a] border border-[#D4AF37] px-3 py-2 text-white text-xs focus:outline-none placeholder:text-white/30"
            />
            <button
              type="button"
              onClick={handleConfirmNewBrand}
              className="p-2 bg-[#D4AF37] hover:bg-[#b89528] text-black font-bold transition-colors"
              title="Guardar marca"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsAddingNewBrand(false)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <select
              required={required}
              value={selectedBrand}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__ADD_NEW__') {
                  setIsAddingNewBrand(true);
                  setNewBrandInput('');
                } else {
                  onBrandChange(val);
                }
              }}
              className="w-full bg-[#0a0a0a] border border-white/10 px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37] appearance-none pr-8 cursor-pointer"
            >
              <option value="" className="bg-[#111] text-white/50">
                -- Seleccionar Marca --
              </option>
              {brands.map((b) => (
                <option key={b.id} value={b.name} className="bg-[#111] text-white">
                  {b.name}
                </option>
              ))}
              <option value="__ADD_NEW__" className="bg-[#1a1811] text-[#D4AF37] font-semibold">
                + Agregar nueva marca...
              </option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-white/40">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>

      {/* MODEL SELECTOR FIELD */}
      <div className={`space-y-1.5 ${modelClassName}`}>
        {showLabels && (
          <div className="flex items-center justify-between">
            <label className="block text-[10px] uppercase tracking-widest text-white/50">
              {modelLabel}
            </label>
            {!isAddingNewModel && selectedBrand && (
              <button
                type="button"
                onClick={() => {
                  setIsAddingNewModel(true);
                  setNewModelInput('');
                }}
                className="text-[10px] text-[#D4AF37] hover:text-[#f3cc5b] tracking-wider uppercase flex items-center gap-1 font-semibold transition-colors"
                title="Agregar un nuevo modelo para esta marca"
              >
                <Plus className="w-3 h-3" />
                <span>+ Nuevo Modelo</span>
              </button>
            )}
          </div>
        )}

        {isAddingNewModel ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              placeholder={`Nuevo modelo para ${selectedBrand || 'la marca'}...`}
              value={newModelInput}
              onChange={(e) => setNewModelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirmNewModel();
                } else if (e.key === 'Escape') {
                  setIsAddingNewModel(false);
                }
              }}
              className="flex-1 bg-[#0a0a0a] border border-[#D4AF37] px-3 py-2 text-white text-xs focus:outline-none placeholder:text-white/30"
            />
            <button
              type="button"
              onClick={handleConfirmNewModel}
              className="p-2 bg-[#D4AF37] hover:bg-[#b89528] text-black font-bold transition-colors"
              title="Guardar modelo"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsAddingNewModel(false)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <select
              required={required}
              disabled={!selectedBrand}
              value={selectedModel}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__ADD_NEW__') {
                  setIsAddingNewModel(true);
                  setNewModelInput('');
                } else {
                  onModelChange(val);
                }
              }}
              className={`w-full bg-[#0a0a0a] border px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4AF37] appearance-none pr-8 ${
                !selectedBrand
                  ? 'border-white/5 opacity-50 cursor-not-allowed text-white/30'
                  : 'border-white/10 cursor-pointer'
              }`}
            >
              {!selectedBrand ? (
                <option value="" className="bg-[#111] text-white/40">
                  -- Primero elija una marca --
                </option>
              ) : (
                <>
                  <option value="" className="bg-[#111] text-white/50">
                    -- Seleccionar Modelo --
                  </option>
                  {availableModels.map((m) => (
                    <option key={m} value={m} className="bg-[#111] text-white">
                      {m}
                    </option>
                  ))}
                  <option value="__ADD_NEW__" className="bg-[#1a1811] text-[#D4AF37] font-semibold">
                    + Agregar nuevo modelo...
                  </option>
                </>
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-white/40">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
