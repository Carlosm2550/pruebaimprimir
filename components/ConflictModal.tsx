import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Torneo, Cuerda } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon, ChevronDownIcon } from './Icons';

type ExceptionOption = {
    id: string;
    type: 'city' | 'cuerda';
    name: string;
    city: string;
};

// This component was moved from SetupScreen.tsx as it's only used here now.
const SearchableExceptionSelect: React.FC<{
    options: ExceptionOption[];
    selectedValue: ExceptionOption | null;
    onSelect: (value: ExceptionOption) => void;
    disabledValue?: ExceptionOption | null;
    placeholder: string;
    disabled?: boolean;
}> = ({ options, selectedValue, onSelect, disabledValue, placeholder, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const selectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { filteredCities, filteredCuerdas } = useMemo(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const filtered = options.filter(opt => {
            const isDisabled = disabledValue?.type === 'cuerda' && opt.id === disabledValue.id;
            if (isDisabled) {
                return false;
            }
            return (
                opt.name.toLowerCase().includes(lowerSearchTerm) ||
                (opt.city && opt.city.toLowerCase().includes(lowerSearchTerm))
            );
        });
        return {
            filteredCities: filtered.filter(opt => opt.type === 'city'),
            filteredCuerdas: filtered.filter(opt => opt.type === 'cuerda'),
        };
    }, [options, searchTerm, disabledValue]);

    const getDisplayValue = () => {
        if (!selectedValue) {
            return <span className="text-gray-400">{placeholder}</span>;
        }
        if (selectedValue.type === 'city') {
            return <><span className="font-semibold text-blue-300">CIUDAD:</span> {selectedValue.name}</>;
        }
        return <>{selectedValue.name} <span className="text-gray-400">({selectedValue.city})</span></>;
    };

    return (
        <div ref={selectRef} className="relative w-full">
            <button type="button" onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-left flex justify-between items-center text-sm disabled:bg-gray-800 disabled:opacity-70">
                <span>{getDisplayValue()}</span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-20 p-2">
                    <input 
                        type="text"
                        placeholder="Buscar por nombre o ciudad..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 text-white rounded-md px-3 py-2 mb-2 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                        autoFocus
                    />
                    <ul className="max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredCities.length > 0 && (
                            <>
                                <li className="px-2 py-1 text-xs font-bold text-blue-300 uppercase">Ciudades</li>
                                {filteredCities.map(opt => (
                                    <li key={opt.id} onClick={() => { onSelect(opt); setIsOpen(false); setSearchTerm(''); }}
                                        className="p-2 rounded-md hover:bg-gray-700 cursor-pointer text-sm">
                                        <div className="font-semibold">{opt.name}</div>
                                    </li>
                                ))}
                            </>
                        )}
                        {filteredCuerdas.length > 0 && (
                             <>
                                <li className="px-2 py-1 text-xs font-bold text-amber-300 uppercase mt-1">Cuerdas</li>
                                {filteredCuerdas.map(opt => (
                                    <li key={opt.id} onClick={() => { onSelect(opt); setIsOpen(false); setSearchTerm(''); }}
                                        className="p-2 rounded-md hover:bg-gray-700 cursor-pointer text-sm">
                                        <div className="font-semibold">{opt.name}</div>
                                        <div className="text-xs text-gray-400">{opt.city}</div>
                                    </li>
                                ))}
                            </>
                        )}
                        {filteredCities.length === 0 && filteredCuerdas.length === 0 && (
                            <li className="p-2 text-gray-500 text-sm">No se encontraron resultados.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

interface ConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
    torneo: Torneo;
    cuerdas: Cuerda[];
    onUpdateTorneo: (updatedTorneo: Torneo) => void;
    isReadOnly: boolean;
}

const ConflictModal: React.FC<ConflictModalProps> = ({ isOpen, onClose, torneo, cuerdas, onUpdateTorneo, isReadOnly }) => {
    const [selection1, setSelection1] = useState<ExceptionOption | null>(null);
    const [selection2, setSelection2] = useState<ExceptionOption | null>(null);

    const baseCuerdas = useMemo(() =>
        cuerdas.filter(c => !c.baseCuerdaId)
            .map(c => ({
                id: c.id,
                name: c.name.replace(/\s\(F\d+\)$/, ''),
                city: c.city || 'N/A'
            }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        [cuerdas]
    );

    const exceptionOptions = useMemo<ExceptionOption[]>(() => {
        // Fix: Explicitly type uniqueCities as string array and use Set<string> with Array.from to ensure correct type inference.
        const uniqueCities: string[] = Array.from(new Set<string>(baseCuerdas.map(c => c.city).filter(c => c !== 'N/A'))).sort();
        const cityOptions: ExceptionOption[] = uniqueCities.map(city => ({
            id: `city_${city}`,
            type: 'city',
            name: city,
            city: 'CIUDAD',
        }));
        const cuerdaOptions: ExceptionOption[] = baseCuerdas.map(c => ({
            id: c.id,
            type: 'cuerda',
            name: c.name,
            city: c.city,
        }));
        return [...cityOptions, ...cuerdaOptions];
    }, [baseCuerdas]);

    const handleAddException = () => {
        if (!selection1 || !selection2) return;
    
        const getIdsFromSelection = (selection: ExceptionOption): string[] => {
            if (selection.type === 'city') {
                return baseCuerdas.filter(c => c.city === selection.name).map(c => c.id);
            }
            return [selection.id];
        };
    
        const ids1 = getIdsFromSelection(selection1);
        const ids2 = getIdsFromSelection(selection2);
    
        const newExceptions: { cuerda1Id: string; cuerda2Id: string }[] = [];
        for (const id1 of ids1) {
            for (const id2 of ids2) {
                if (id1 !== id2) {
                    newExceptions.push({ cuerda1Id: id1, cuerda2Id: id2 });
                }
            }
        }
    
        const existingExceptionsSet = new Set(
            torneo.exceptions.map(ex => {
                const ids = [ex.cuerda1Id, ex.cuerda2Id].sort();
                return `${ids[0]}-${ids[1]}`;
            })
        );
    
        const uniqueNewExceptions = newExceptions.filter(ex => {
            const ids = [ex.cuerda1Id, ex.cuerda2Id].sort();
            const key = `${ids[0]}-${ids[1]}`;
            if (existingExceptionsSet.has(key)) {
                return false;
            }
            existingExceptionsSet.add(key);
            return true;
        });
    
        if (uniqueNewExceptions.length > 0) {
            onUpdateTorneo({ ...torneo, exceptions: [...torneo.exceptions, ...uniqueNewExceptions] });
        }
    
        setSelection1(null);
        setSelection2(null);
    };

    const handleRemoveException = (index: number) => {
        const newExceptions = torneo.exceptions.filter((_, i) => i !== index);
        onUpdateTorneo({ ...torneo, exceptions: newExceptions });
    };

    const getBaseCuerdaNameById = (id: string) => baseCuerdas.find(bc => bc.id === id)?.name || 'Desconocido';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Excepciones de Cotejo">
            <div className="space-y-4">
                {!isReadOnly && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Añadir Nueva Excepción</label>
                            <div className="flex items-center space-x-2">
                                <SearchableExceptionSelect
                                    options={exceptionOptions}
                                    selectedValue={selection1}
                                    onSelect={setSelection1}
                                    disabledValue={selection2}
                                    placeholder="Seleccionar Cuerda/Ciudad 1..."
                                />
                                <SearchableExceptionSelect
                                    options={exceptionOptions}
                                    selectedValue={selection2}
                                    onSelect={setSelection2}
                                    disabledValue={selection1}
                                    placeholder="Seleccionar Cuerda/Ciudad 2..."
                                />
                                <button onClick={handleAddException} type="button" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex-shrink-0 disabled:bg-gray-600" disabled={!selection1 || !selection2}>
                                    <PlusIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                        <hr className="border-gray-600 my-4" />
                    </>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Excepciones Actuales</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        {torneo.exceptions.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No hay excepciones configuradas.</p>
                        ) : (
                            torneo.exceptions.map((ex, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-lg text-sm">
                                    <span>{getBaseCuerdaNameById(ex.cuerda1Id)} <span className="text-red-400 font-bold">vs</span> {getBaseCuerdaNameById(ex.cuerda2Id)}</span>
                                    {!isReadOnly && (
                                        <button onClick={() => handleRemoveException(index)} className="p-1 text-gray-400 hover:text-red-500">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cerrar</button>
                </div>
            </div>
        </Modal>
    );
};

export default ConflictModal;