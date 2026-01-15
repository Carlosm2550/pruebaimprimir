

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Cuerda, Gallo, Torneo, TipoGallo, TipoEdad } from '../types';
import { TrashIcon, ChevronDownIcon, ChevronUpIcon, PencilIcon } from './Icons';
import Modal from './Modal';
import { AGE_OPTIONS_BY_MARCA } from '../constants';

// --- Lbs.Oz Weight Conversion Utilities ---
const OUNCES_PER_POUND = 16;

const toLbsOz = (totalOunces: number) => {
    if (isNaN(totalOunces) || totalOunces < 0) return { lbs: 0, oz: 0 };
    const total = Math.round(totalOunces); // Work with integers to avoid floating point issues
    const lbs = Math.floor(total / OUNCES_PER_POUND);
    const oz = total % OUNCES_PER_POUND;
    return { lbs, oz };
};

const fromLbsOz = (lbs: number, oz: number) => {
    return Math.round((lbs * OUNCES_PER_POUND) + oz);
};

const formatWeightLbsOz = (totalOunces: number, withUnit = false): string => {
    const { lbs, oz } = toLbsOz(totalOunces);
    const unit = withUnit ? ' Lb.Oz' : '';
    return `${lbs}.${String(oz).padStart(2, '0')}${unit}`;
};

const parseWeightLbsOz = (value: string): number => {
    let cleanValue = value.replace(/[^0-9.]/g, '');

    // If it's a 3-digit number without a decimal, intelligently convert it.
    // e.g., "512" becomes "5.12" to represent 5 lbs 12 oz.
    if (!cleanValue.includes('.') && cleanValue.length === 3) {
        cleanValue = `${cleanValue.substring(0, 1)}.${cleanValue.substring(1)}`;
    }

    const parts = cleanValue.split('.');
    let lbs = parseInt(parts[0], 10) || 0;
    let oz_input = parts[1] || '0';
    // Ensure oz part is treated as an integer, not octal, and handle partial input like "3."
    let oz = parseInt(oz_input, 10) || 0;

    // Handle ounce overflow, e.g., if user enters "4.20" it becomes "5.04"
    if (oz >= OUNCES_PER_POUND) {
        lbs += Math.floor(oz / OUNCES_PER_POUND);
        oz = oz % OUNCES_PER_POUND;
    }
    
    return fromLbsOz(lbs, oz);
};

// Helper to get age description text
const getAgeDisplayText = (marca: number, ageMonths: number): string => {
    const options = AGE_OPTIONS_BY_MARCA[String(marca)] || [];
    const option = options.find(opt => opt.ageMonths === ageMonths);
    return option ? option.displayText : `${ageMonths} meses`;
};


// --- HELPER & UI COMPONENTS ---
interface LbsOzInputProps {
  label: string;
  value: number; // Total ounces
  onChange: (newValue: number) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  validator?: (value: number) => boolean; // Optional validator function
  showGrid?: boolean;
  minWeight?: number; // Total ounces for grid filtering
  maxWeight?: number; // Total ounces for grid filtering
}
export const LbsOzInput: React.FC<LbsOzInputProps> = ({ label, value, onChange, onBlur, disabled = false, validator, showGrid = true, minWeight, maxWeight }) => {
    const [displayValue, setDisplayValue] = useState(formatWeightLbsOz(value));
    const [isValid, setIsValid] = useState(true);
    const [isGridOpen, setIsGridOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const weightOptions = useMemo(() => {
        const allPossibleWeights = [];
        // Generate a wide range of weights, one ounce at a time
        const startOunces = fromLbsOz(2, 0);
        const endOunces = fromLbsOz(6, 0);
        for (let oz = startOunces; oz <= endOunces; oz++) {
            allPossibleWeights.push(oz);
        }

        if (minWeight !== undefined && maxWeight !== undefined && minWeight > 0 && maxWeight > 0) {
            // Filter the generated list based on the tournament rules
            return allPossibleWeights.filter(w => w >= minWeight && w <= maxWeight);
        }
        
        // Fallback to the original hardcoded list if no range is provided
        const defaultOptions = [];
        for (let oz = 10; oz <= 15; oz++) defaultOptions.push(fromLbsOz(2, oz));
        for (let lbs = 3; lbs <= 4; lbs++) {
            for (let oz = 0; oz <= 15; oz++) defaultOptions.push(fromLbsOz(lbs, oz));
        }
        defaultOptions.push(fromLbsOz(5, 0));
        return defaultOptions;
    }, [minWeight, maxWeight]);

    useEffect(() => {
        setDisplayValue(formatWeightLbsOz(value));
        setIsValid(validator ? validator(value) : true);
    }, [value, validator]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsGridOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayValue(e.target.value);
    };

    const handleBlurInternal = (e: React.FocusEvent<HTMLInputElement>) => {
        const totalOunces = parseWeightLbsOz(displayValue);
        const currentValidity = validator ? validator(totalOunces) : true;
        setIsValid(currentValidity);
        onChange(totalOunces);
        if (onBlur) onBlur(e);
    };

    const handleWeightSelection = (weightInOunces: number) => {
        onChange(weightInOunces);
        setIsGridOpen(false);
    };
    
    const inputId = `input-${label.replace(/\s+/g, '-')}`;
    const validityClasses = !isValid 
        ? 'border-red-500 text-red-400 focus:ring-red-500 focus:border-red-500' 
        : 'border-gray-600 focus:ring-amber-500 focus:border-amber-500';

    return (
        <div ref={containerRef} className="relative">
            <label htmlFor={inputId} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <div className="relative flex items-center">
                <input
                    id={inputId}
                    type="text"
                    value={displayValue}
                    onChange={handleInputChange}
                    onFocus={showGrid ? () => setIsGridOpen(true) : undefined}
                    onBlur={handleBlurInternal}
                    disabled={disabled}
                    className={`w-full bg-gray-700 border text-white rounded-lg px-3 py-2 focus:ring-2 outline-none transition text-center font-mono disabled:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed ${validityClasses}`}
                    inputMode="decimal"
                />
                {showGrid && (
                  <div className="absolute right-0 flex items-center h-full">
                      <button
                          type="button"
                          onClick={() => setIsGridOpen(!isGridOpen)}
                          disabled={disabled}
                          className="text-gray-400 hover:text-white h-full px-2 flex items-center justify-center rounded-r-lg bg-gray-700 border-l border-gray-600 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-expanded={isGridOpen}
                          aria-controls="weight-grid"
                      >
                          <ChevronDownIcon className={`w-5 h-5 transition-transform ${isGridOpen ? 'rotate-180' : ''}`} />
                      </button>
                  </div>
                )}
            </div>
            {showGrid && isGridOpen && !disabled && (
                <div id="weight-grid" className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-10 p-2 max-h-60 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-5 gap-1">
                        {weightOptions.map(weightInOunces => (
                            <button
                                key={weightInOunces}
                                type="button"
                                className="text-center font-mono py-2 rounded-md bg-gray-700 hover:bg-amber-600 hover:text-gray-900 transition-colors text-sm"
                                onClick={() => handleWeightSelection(weightInOunces)}
                            >
                                {formatWeightLbsOz(weightInOunces)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  wrapperClassName?: string;
}
export const InputField: React.FC<InputFieldProps> = ({ label, id, type, wrapperClassName, ...props }) => {
  const inputId = id || `input-${label.replace(/\s+/g, '-')}`;

  return (
    <div className={wrapperClassName}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
      <div className="relative">
        <input
          id={inputId}
          type={type}
          {...props}
          className={`w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:bg-gray-600 disabled:opacity-70`}
        />
      </div>
    </div>
  );
};


interface GalloBulkFormData {
    ringId: string;
    color: string;
    cuerdaId: string;
    weight: number; // total ounces
    ageMonths: string;
    markingId: string;
    breederPlateId: string;
    tipoGallo: TipoGallo;
    marca: string;
}

const GalloFormModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSaveSingle: (gallo: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => void; 
    onAddSingleGallo: (gallo: Omit<Gallo, 'id' | 'tipoEdad'>) => void;
    gallo: Gallo | null;
    cuerdas: Cuerda[];
    gallos: Gallo[];
    torneo: Torneo;
    onDeleteGallo: (galloId: string) => void;
    onEditGallo: (gallo: Gallo) => void;
}> = ({ isOpen, onClose, onSaveSingle, onAddSingleGallo, gallo, cuerdas, gallos, torneo, onDeleteGallo }) => {
    
    // --- State for Single Edit Mode ---
    const [singleForm, setSingleForm] = useState<Omit<Gallo, 'id' | 'tipoEdad'>>({} as any);
    
    // --- State for Bulk Add Mode ---
    const [selectedCuerdaId, setSelectedCuerdaId] = useState('');
    const [activeTabCuerdaId, setActiveTabCuerdaId] = useState('');
    const [editingExistingGallo, setEditingExistingGallo] = useState<Gallo | null>(null);
    const [isRingIdFocused, setIsRingIdFocused] = useState(false);

    const initialGalloFormState: GalloBulkFormData = {
        ringId: '', color: '', cuerdaId: '', weight: 0, ageMonths: '', markingId: '', breederPlateId: '', tipoGallo: TipoGallo.LISO, marca: '',
    };
    const [currentGalloForm, setCurrentGalloForm] = useState<GalloBulkFormData>(initialGalloFormState);
    
    const singleEditTipoEdad = useMemo(() => (Number(singleForm.ageMonths) >= 12 ? TipoEdad.GALLO : TipoEdad.POLLO), [singleForm.ageMonths]);
    const bulkAddTipoEdad = useMemo(() => (Number(currentGalloForm.ageMonths) >= 12 ? TipoEdad.POLLO : TipoEdad.GALLO), [currentGalloForm.ageMonths]);
    const gallosByCuerda = useMemo(() => {
        const grouped = new Map<string, Gallo[]>();
        (gallos || []).forEach(gallo => {
            const list = grouped.get(gallo.cuerdaId) || [];
            list.push(gallo);
            grouped.set(gallo.cuerdaId, list);
        });
        return grouped;
    }, [gallos]);
    
    const lastRingId = useMemo(() => {
        if (gallos && gallos.length > 0) {
            // The gallo ID contains a timestamp. Let's use that to find the most recent one.
            const sortedGallos = [...gallos].sort((a, b) => {
                const timeA = parseInt(a.id.split('-')[1], 10) || 0;
                const timeB = parseInt(b.id.split('-')[1], 10) || 0;
                return timeB - timeA; // Sort descending by time
            });
            return sortedGallos[0].ringId;
        }
        return null;
    }, [gallos]);

    const handleFormKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).nodeName === 'INPUT') {
            e.preventDefault();
        }
    };

    const isWeightInTournamentRange = useCallback((weightInOunces: number) => {
        if (!torneo || weightInOunces === 0) return false;
        return weightInOunces >= torneo.minWeight && weightInOunces <= torneo.maxWeight;
    }, [torneo]);

    useEffect(() => {
        if (isOpen) {
            if (gallo) { // Single Edit Mode
                setSingleForm({ ...gallo });
            } else { // Bulk Add Mode Reset
                setSelectedCuerdaId('');
                setActiveTabCuerdaId('');
                setCurrentGalloForm(initialGalloFormState);
                setEditingExistingGallo(null);
            }
        }
    }, [isOpen, gallo]);
    
    const handleSingleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!singleForm.cuerdaId || !gallo) return;

        const isRingIdUnique = !gallos.some(g => g.ringId.trim().toLowerCase() === singleForm.ringId.trim().toLowerCase() && g.id !== gallo.id);
        if (!isRingIdUnique) {
            alert(`El ID del Anillo "${singleForm.ringId}" ya existe. Por favor, use uno diferente.`);
            return;
        }

        if (!singleForm.marca || !singleForm.ageMonths) {
            alert("Debe seleccionar una Marca y una Edad para el gallo.");
            return;
        }
        if (!isWeightInTournamentRange(singleForm.weight)) {
            alert(`El peso del gallo (${formatWeightLbsOz(singleForm.weight, true)}) debe estar entre ${formatWeightLbsOz(torneo.minWeight, true)} y ${formatWeightLbsOz(torneo.maxWeight, true)}.`);
            return;
        }

        const finalData = { ...singleForm, marca: Number(singleForm.marca), breederPlateId: singleForm.breederPlateId?.trim() || 'N/A' };
        onSaveSingle(finalData, gallo.id);
        onClose();
    };

    const handleCuerdaSelectionChange = (baseCuerdaId: string) => {
        const selected = cuerdas.find(c => c.id === baseCuerdaId);
        if (!selected) return;
        const baseName = selected.name.replace(/\s\(F\d+\)$/, '').trim();
        const firstFront = cuerdas
            .filter(c => c.name.replace(/\s\(F\d+\)$/, '').trim() === baseName)
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))[0];

        setSelectedCuerdaId(baseCuerdaId);
        setActiveTabCuerdaId(firstFront?.id || '');
        setCurrentGalloForm({ ...initialGalloFormState, cuerdaId: firstFront?.id || '' });
        setEditingExistingGallo(null);
    };

    const handleTabClick = (cuerdaId: string) => {
        setActiveTabCuerdaId(cuerdaId);
        setCurrentGalloForm({ ...initialGalloFormState, cuerdaId });
        setEditingExistingGallo(null);
    };

    const handleBulkFormChange = (field: keyof GalloBulkFormData, value: string | number) => {
        const newFormState = { ...currentGalloForm, [field]: String(value) };
        if (field === 'marca') {
            const marcaValue = String(value);
            const ageOptions = AGE_OPTIONS_BY_MARCA[marcaValue] || [];
            if (ageOptions.length === 1) {
                newFormState.ageMonths = String(ageOptions[0].ageMonths);
            } else {
                newFormState.ageMonths = ''; 
            }
        }
        setCurrentGalloForm(newFormState);
    };
    
    const handleBulkFormSubmit = () => {
        const isEditingExisting = editingExistingGallo !== null;
        const isAdding = !isEditingExisting;

        const currentId = isEditingExisting ? editingExistingGallo.id : null;
        const isRingIdUnique = !gallos.some(g => g.ringId.trim().toLowerCase() === currentGalloForm.ringId.trim().toLowerCase() && g.id !== currentId);
        if (!isRingIdUnique) {
            alert(`El ID del Anillo "${currentGalloForm.ringId}" ya existe. Por favor, use uno diferente.`);
            return;
        }

        if (isAdding) {
            const existingCount = gallosByCuerda.get(activeTabCuerdaId)?.length || 0;
            const totalCount = existingCount;
            const limit = torneo.roostersPerTeam;

            if (limit > 0 && totalCount >= limit) {
                const cuerdaName = cuerdas.find(c => c.id === activeTabCuerdaId)?.name || 'Este frente';
                alert(`${cuerdaName} ha alcanzado el límite de ${limit} gallos.`);
                return;
            }
        }
        
        if (!currentGalloForm.marca || !currentGalloForm.ageMonths) {
            alert("Debe seleccionar una Marca y una Edad para el gallo.");
            return;
        }
        if (!isWeightInTournamentRange(currentGalloForm.weight)) {
            alert(`El peso del gallo (${formatWeightLbsOz(currentGalloForm.weight, true)}) debe estar entre ${formatWeightLbsOz(torneo.minWeight, true)} y ${formatWeightLbsOz(torneo.maxWeight, true)}.`);
            return;
        }

        const newGalloData: Omit<Gallo, 'id' | 'tipoEdad'> = {
            ringId: currentGalloForm.ringId, color: currentGalloForm.color, cuerdaId: activeTabCuerdaId, weight: currentGalloForm.weight,
            markingId: currentGalloForm.markingId, breederPlateId: currentGalloForm.breederPlateId?.trim() || 'N/A', tipoGallo: currentGalloForm.tipoGallo,
            ageMonths: Number(currentGalloForm.ageMonths), marca: Number(currentGalloForm.marca),
        };

        if (isEditingExisting) {
            onSaveSingle(newGalloData, editingExistingGallo.id);
            setEditingExistingGallo(null);
        } else {
            onAddSingleGallo(newGalloData);
        }
        
        setCurrentGalloForm({ ...initialGalloFormState, cuerdaId: activeTabCuerdaId });
    };

    const handleEditExistingClick = (galloToEdit: Gallo) => {
        setEditingExistingGallo(galloToEdit);
        setCurrentGalloForm({
            ...galloToEdit,
            breederPlateId: galloToEdit.breederPlateId === 'N/A' ? '' : galloToEdit.breederPlateId,
            ageMonths: String(galloToEdit.ageMonths),
            marca: String(galloToEdit.marca),
        });
    };
    
    const handleDeleteExistingGallo = (gallo: Gallo) => {
        if (window.confirm(`¿Está seguro de que desea eliminar al gallo "${gallo.color}" (Anillo: ${gallo.ringId}) de forma permanente?`)) {
            onDeleteGallo(gallo.id);
        }
    };

    const handleCancelEdit = () => {
        setEditingExistingGallo(null);
        setCurrentGalloForm({ ...initialGalloFormState, cuerdaId: activeTabCuerdaId });
    };

    const groupedBaseCuerdas = useMemo(() => {
        const groups = new Map<string, Cuerda[]>();
        cuerdas.forEach(c => {
            const baseName = c.name.replace(/\s\(F\d+\)$/, '').trim();
            if (!groups.has(baseName)) { groups.set(baseName, []); }
            groups.get(baseName)!.push(c);
        });
        
        return Array.from(groups.entries()).map(([baseName, fronts]) => {
            fronts.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
            const frontLabels = fronts.map(f => f.name.match(/\(F\d+\)/)?.[0] || '').join(' ');
            return { id: fronts[0].id, displayText: `${baseName} ${frontLabels}`.trim() };
        }).sort((a,b) => a.displayText.localeCompare(b.displayText));
    }, [cuerdas]);

    const frontsForSelectedCuerda = useMemo(() => {
        if (!selectedCuerdaId) return [];
        const selected = cuerdas.find(c => c.id === selectedCuerdaId);
        if (!selected) return [];
        const baseName = selected.name.replace(/\s\(F\d+\)$/, '').trim();
        return cuerdas.filter(c => c.name.replace(/\s\(F\d+\)$/, '').trim() === baseName)
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    }, [selectedCuerdaId, cuerdas]);

    const ageOptions = useMemo(() => AGE_OPTIONS_BY_MARCA[String(singleForm.marca)] || [], [singleForm.marca]);
    
    const renderSingleEditForm = () => {
        return (
            <form onSubmit={handleSingleSubmit} onKeyDown={handleFormKeyDown} className="space-y-4">
                <h4 className="text-lg font-semibold text-amber-300 mb-2">Cuerda: {cuerdas.find(c => c.id === singleForm.cuerdaId)?.name || ''}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative">
                        <InputField 
                          label="ID del Anillo (A)" 
                          value={singleForm.ringId || ''} 
                          onChange={e => setSingleForm(p => ({...p, ringId: e.target.value}))} 
                          required 
                          onFocus={() => setIsRingIdFocused(true)}
                          onBlur={() => setIsRingIdFocused(false)}
                          autoComplete="off"
                        />
                        {isRingIdFocused && lastRingId && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-white text-gray-800 text-sm font-semibold px-3 py-1 rounded-md shadow-lg z-20">
                                Anterior: {lastRingId}
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white"></div>
                            </div>
                        )}
                    </div>
                    <InputField label="Número de Placa Marcaje (Pm)" value={singleForm.markingId || ''} onChange={e => setSingleForm(p => ({...p, markingId: e.target.value}))} required />
                    <InputField label="Placa del Criadero (Pc)" value={singleForm.breederPlateId === 'N/A' ? '' : singleForm.breederPlateId || ''} onChange={e => setSingleForm(p => ({...p, breederPlateId: e.target.value}))} placeholder="N/A si se deja vacío" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InputField label="Color del Gallo" value={singleForm.color || ''} onChange={e => setSingleForm(p => ({...p, color: e.target.value}))} required />
                    <LbsOzInput label="Peso (Lb.Oz)" value={singleForm.weight || 0} onChange={v => setSingleForm(p => ({...p, weight: v}))} validator={isWeightInTournamentRange} minWeight={torneo.minWeight} maxWeight={torneo.maxWeight} />
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Marca</label>
                        <select value={singleForm.marca || ''} onChange={e => {
                            const newMarca = e.target.value;
                            const options = AGE_OPTIONS_BY_MARCA[newMarca] || [];
                            setSingleForm(p => ({ ...p, marca: Number(newMarca), ageMonths: options.length > 0 ? options[0].ageMonths : 0 }));
                         }} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                            <option value="" disabled>Seleccionar...</option>
                            {Object.keys(AGE_OPTIONS_BY_MARCA).sort((a,b) => Number(a) - Number(b)).map(m => <option key={m} value={m}>Marca {m}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                         <label className="block text-sm font-medium text-gray-400 mb-1">Edad</label>
                         <select value={singleForm.ageMonths || ''} onChange={e => setSingleForm(p => ({...p, ageMonths: Number(e.target.value)}))} required disabled={!singleForm.marca || ageOptions.length <= 1} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:bg-gray-600">
                             <option value="" disabled>Seleccionar...</option>
                             {ageOptions.map(opt => <option key={opt.ageMonths} value={opt.ageMonths}>{opt.displayText}</option>)}
                         </select>
                    </div>
                    <InputField label="Tipo (Pollo/Gallo)" value={singleEditTipoEdad} disabled />
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Fenotipo</label>
                        <select value={singleForm.tipoGallo} onChange={e => setSingleForm(p => ({...p, tipoGallo: e.target.value as TipoGallo}))} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                            {Object.values(TipoGallo).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end pt-4 space-x-2 border-t border-gray-700 mt-6">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-4 rounded-lg">Guardar Cambios</button>
                </div>
            </form>
        )
    };

    const renderBulkAddForm = () => {
        const isCuerdaSelected = !!selectedCuerdaId;
        const ageOptionsForBulk = AGE_OPTIONS_BY_MARCA[currentGalloForm.marca] || [];
        const existingCount = gallosByCuerda.get(activeTabCuerdaId)?.length || 0;
        
        const isEditingExisting = editingExistingGallo !== null;
        const isEditing = isEditingExisting;

        const isLimitReached = torneo.roostersPerTeam > 0 && existingCount >= torneo.roostersPerTeam;
        const isAddButtonDisabled = (isLimitReached && !isEditing) || !currentGalloForm.ringId || !currentGalloForm.color || currentGalloForm.weight === 0 || !selectedCuerdaId;
        const addButtonText = isLimitReached && !isEditing ? 'Límite de gallos alcanzado' : isEditing ? 'Guardar Cambios' : 'Añadir Gallo a este Frente';

        const existingGallosForTab = gallosByCuerda.get(activeTabCuerdaId) || [];
        const hasAnyGallos = existingGallosForTab.length > 0;

        return (
            <div onKeyDown={handleFormKeyDown}>
                <fieldset disabled={!isCuerdaSelected} className="disabled:opacity-40 transition-opacity">
                     <div className="space-y-2 max-h-24 overflow-y-auto pr-2 mb-4 custom-scrollbar">
                        {isCuerdaSelected && !hasAnyGallos && <p className="text-gray-500 text-center text-sm py-2">Aún no hay gallos para este frente.</p>}
                        {!isCuerdaSelected && <p className="text-gray-500 text-center text-sm py-8">Seleccione una cuerda para añadir gallos.</p>}

                        {/* Display existing gallos */}
                        {existingGallosForTab.map((g) => {
                            const tipoEdad = g.ageMonths < 12 ? TipoEdad.POLLO : TipoEdad.GALLO;
                            const ageDisplayText = getAgeDisplayText(g.marca, g.ageMonths);
                            const fullDescription = `${g.color}: A:${g.ringId} / Pm:${g.markingId} / Pc:${g.breederPlateId} / Marca:${g.marca} / ${ageDisplayText} / ${tipoEdad} / ${g.tipoGallo} / ${formatWeightLbsOz(g.weight)} (Lb.Oz)`;
                            return (
                                <div key={g.id} className="flex items-center justify-between bg-gray-800/40 p-2 rounded-lg text-sm">
                                    <p className="text-white truncate flex-grow text-xs" title={fullDescription}>
                                        <span className="font-bold text-amber-400">{g.color}</span>: A:{g.ringId} / Pm:{g.markingId} / Pc:{g.breederPlateId} / Marca:{g.marca} / {ageDisplayText} / {tipoEdad} / {g.tipoGallo} / {formatWeightLbsOz(g.weight)} (Lb.Oz)
                                    </p>
                                    <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                        <button onClick={() => handleEditExistingClick(g)} className="p-1 text-gray-400 hover:text-amber-400 transition-colors"><PencilIcon className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteExistingGallo(g)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="relative">
                                <InputField 
                                    label="ID del Anillo (A)" 
                                    value={currentGalloForm.ringId} 
                                    onChange={e => handleBulkFormChange('ringId', e.target.value)} 
                                    required 
                                    disabled={(isLimitReached && !isEditing)}
                                    onFocus={() => setIsRingIdFocused(true)}
                                    onBlur={() => setIsRingIdFocused(false)}
                                    autoComplete="off"
                                />
                                {isRingIdFocused && lastRingId && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-white text-gray-800 text-sm font-semibold px-3 py-1 rounded-md shadow-lg z-20">
                                        Anterior: {lastRingId}
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white"></div>
                                    </div>
                                )}
                            </div>
                            <InputField label="Número de Placa Marcaje (Pm)" value={currentGalloForm.markingId} onChange={e => handleBulkFormChange('markingId', e.target.value)} required disabled={(isLimitReached && !isEditing)}/>
                            <InputField label="Placa del Criadero (Pc)" value={currentGalloForm.breederPlateId} onChange={e => handleBulkFormChange('breederPlateId', e.target.value)} placeholder="N/A si se deja vacío" disabled={(isLimitReached && !isEditing)}/>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <InputField label="Color del Gallo" value={currentGalloForm.color} onChange={e => handleBulkFormChange('color', e.target.value)} required disabled={(isLimitReached && !isEditing)}/>
                            <LbsOzInput label="Peso (Lb.Oz)" value={currentGalloForm.weight} onChange={v => handleBulkFormChange('weight', v)} disabled={(isLimitReached && !isEditing)} validator={isWeightInTournamentRange} minWeight={torneo.minWeight} maxWeight={torneo.maxWeight} />
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Marca</label>
                                <select value={currentGalloForm.marca} onChange={e => handleBulkFormChange('marca', e.target.value)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" disabled={(isLimitReached && !isEditing)}>
                                    <option value="" disabled>Seleccionar...</option>
                                    {Object.keys(AGE_OPTIONS_BY_MARCA).sort((a,b) => Number(a) - Number(b)).map(m => <option key={m} value={m}>Marca {m}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Edad</label>
                                <select value={currentGalloForm.ageMonths} onChange={e => handleBulkFormChange('ageMonths', e.target.value)} required disabled={(isLimitReached && !isEditing) || !currentGalloForm.marca || ageOptionsForBulk.length <= 1} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:bg-gray-600">
                                    <option value="" disabled>Seleccionar...</option>
                                    {ageOptionsForBulk.map(opt => <option key={opt.ageMonths} value={opt.ageMonths}>{opt.displayText}</option>)}
                                </select>
                            </div>
                            <InputField label="Tipo (Pollo/Gallo)" value={bulkAddTipoEdad} disabled />
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Fenotipo</label>
                                <select value={currentGalloForm.tipoGallo} onChange={e => handleBulkFormChange('tipoGallo', e.target.value as TipoGallo)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" disabled={(isLimitReached && !isEditing)}>
                                    {Object.values(TipoGallo).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="pt-2">
                            {isEditing ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={handleBulkFormSubmit} disabled={isAddButtonDisabled} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed text-center">
                                        {addButtonText}
                                    </button>
                                    <button type="button" onClick={handleCancelEdit} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
                                        Cancelar Edición
                                    </button>
                                </div>
                            ) : (
                                <button type="button" onClick={handleBulkFormSubmit} disabled={isAddButtonDisabled} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed text-center">
                                    {addButtonText}
                                </button>
                            )}
                        </div>
                    </div>
                </fieldset>
                
                <div className="flex justify-end pt-4 space-x-3 border-t border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-4 rounded-lg">
                        Cerrar
                    </button>
                </div>
            </div>
        );
    };
    
    const bulkModeHeaderContent = (
      <div className="w-72">
          <select 
              value={selectedCuerdaId} 
              onChange={e => handleCuerdaSelectionChange(e.target.value)} 
              required 
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
              aria-label="Seleccionar Cuerda"
          >
              <option value="" disabled>Seleccionar Cuerda...</option>
              {groupedBaseCuerdas.map(group => (<option key={group.id} value={group.id}>{group.displayText}</option>))}
          </select>
      </div>
    );

    const titleWithTabs = (
        <>
            <span className="mr-6 shrink-0">Añadir Gallos</span>
            <div className="flex-grow relative min-w-0">
                <div className="front-tabs-container flex items-center border-b border-transparent -mb-[21px] overflow-x-auto pb-2">
                    {frontsForSelectedCuerda.map((front, index) => {
                        const currentExistingCount = gallosByCuerda.get(front.id)?.length || 0;
                        const totalCount = currentExistingCount;
                        const limit = torneo.roostersPerTeam;
                        const tabText = limit > 0 ? `F${index + 1} (${totalCount}/${limit})` : `F${index + 1} (${totalCount})`;
                        return (
                            <button 
                                key={front.id} 
                                onClick={() => handleTabClick(front.id)} 
                                className={`py-2 px-3 text-sm font-medium transition-all transform whitespace-nowrap ${activeTabCuerdaId === front.id ? 'border-b-2 border-amber-500 text-amber-400' : 'text-gray-300 hover:text-white hover:scale-105'}`}
                            >
                                {tabText}
                            </button>
                        );
                    })}
                     <style>{`
                        .front-tabs-container::-webkit-scrollbar {
                            height: 6px;
                        }
                        .front-tabs-container::-webkit-scrollbar-track {
                            background: #2d3748; 
                            border-radius: 3px;
                        }
                        .front-tabs-container::-webkit-scrollbar-thumb {
                            background: #718096;
                            border-radius: 3px;
                        }
                        .front-tabs-container::-webkit-scrollbar-thumb:hover {
                            background: #a0aec0;
                        }
                    `}</style>
                </div>
            </div>
        </>
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={gallo ? 'Editar Gallo' : titleWithTabs} 
            size="wide"
            headerContent={gallo ? undefined : bulkModeHeaderContent}
        >
            {gallo ? renderSingleEditForm() : renderBulkAddForm()}
        </Modal>
    );
};

export default GalloFormModal;