import React, { useState } from 'react';
import { MatchmakingResults, Torneo, Cuerda, Pelea, Gallo } from '../types';
import { PencilIcon } from './Icons';

// --- Lbs.Oz Weight Conversion Utilities ---
const OUNCES_PER_POUND = 16;

const toLbsOz = (totalOunces: number) => {
    if (isNaN(totalOunces) || totalOunces < 0) return { lbs: 0, oz: 0 };
    const lbs = Math.floor(totalOunces / OUNCES_PER_POUND);
    const oz = totalOunces % OUNCES_PER_POUND;
    return { lbs, oz };
};

const formatWeightLbsOz = (totalOunces: number): string => {
    const { lbs, oz } = toLbsOz(totalOunces);
    return `${lbs}.${String(oz).padStart(2, '0')} Lb.Oz`;
};

// --- SCREEN ---
interface MatchmakingScreenProps {
    results: MatchmakingResults;
    torneo: Torneo;
    cuerdas: Cuerda[];
    gallos: Gallo[];
    onStartTournament: () => void;
    onBack: () => void;
    onCreateManualFight: (roosterAId: string, roosterBId: string) => void;
    isReadOnly: boolean;
}

const MatchmakingScreen: React.FC<MatchmakingScreenProps> = ({ results, torneo, cuerdas, onStartTournament, onBack, onCreateManualFight, isReadOnly }) => {
    
    const [selectedRoosters, setSelectedRoosters] = useState<string[]>([]);
    
    const getCuerdaName = (id: string) => cuerdas.find(p => p.id === id)?.name || 'Desconocido';

    const handleSelectRooster = (roosterId: string) => {
        if (isReadOnly) return;

        setSelectedRoosters(prev => {
            if (prev.includes(roosterId)) {
                return prev.filter(id => id !== roosterId);
            }
            if (prev.length < 2) {
                return [...prev, roosterId];
            }
            return prev;
        });
    };

    const handleCreateManualFightClick = () => {
        if (selectedRoosters.length === 2) {
            onCreateManualFight(selectedRoosters[0], selectedRoosters[1]);
            setSelectedRoosters([]);
        }
    };
    
    const renderPelea = (pelea: Pelea) => (
        <div key={pelea.id} className="bg-gray-700/50 rounded-lg p-6 flex items-center justify-between fight-card">
            <div className="w-1/12 text-center text-gray-400 font-bold text-3xl">{pelea.fightNumber}</div>
            
            {/* Rooster A */}
            <div className="w-5/12 text-right pr-4 space-y-2">
                <p className="font-bold text-4xl text-amber-400 truncate">{getCuerdaName(pelea.roosterA.cuerdaId)}</p>
                <p className="font-semibold text-white text-2xl">{pelea.roosterA.color}</p>
                <p className="text-lg font-mono text-gray-300">{formatWeightLbsOz(pelea.roosterA.weight)} / {pelea.roosterA.ageMonths || 'N/A'}m / {pelea.roosterA.tipoGallo}</p>
                <p className="text-xs text-gray-500 font-mono">
                    A:{pelea.roosterA.ringId} Pm:{pelea.roosterA.markingId} Pc:{pelea.roosterA.breederPlateId} Marca:{pelea.roosterA.marca}
                </p>
            </div>

            <div className="w-1/12 text-center text-red-500 font-extrabold text-5xl">VS</div>
            
            {/* Rooster B */}
            <div className="w-5/12 text-left pl-4 space-y-2">
                <p className="font-bold text-4xl text-amber-400 truncate">{getCuerdaName(pelea.roosterB.cuerdaId)}</p>
                <p className="font-semibold text-white text-2xl">{pelea.roosterB.color}</p>
                <p className="text-lg font-mono text-gray-300">{formatWeightLbsOz(pelea.roosterB.weight)} / {pelea.roosterB.ageMonths || 'N/A'}m / {pelea.roosterB.tipoGallo}</p>
                <p className="text-xs text-gray-500 font-mono">
                     A:{pelea.roosterB.ringId} Pm:{pelea.roosterB.markingId} Pc:{pelea.roosterB.breederPlateId} Marca:{pelea.roosterB.marca}
                </p>
            </div>
        </div>
    );
    
    const totalRoostersForIndividualRound = results.unpairedRoosters.length;
    const manualFightsCount = results.mainFights.filter(f => f.id.startsWith('pelea-manual-')).length;
    const autoFightsCount = results.mainFights.length - manualFightsCount;

    return (
        <div className="space-y-6">
            {/* BARRA DE ACCIONES SUPERIOR */}
            <div className="sticky top-0 z-30 py-4 mb-6 bg-gray-900/90 backdrop-blur-md border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg">Atrás</button>
                    <h2 className="hidden md:block text-2xl font-bold text-white">Cotejo de Peleas</h2>
                </div>
                
                <div className="flex flex-wrap justify-center gap-3 w-full sm:w-auto">
                    {!isReadOnly && (
                        <button onClick={onStartTournament} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-8 rounded-lg shadow-lg transform active:scale-95 transition-all">
                            Comenzar Torneo
                        </button>
                    )}
                </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-4">
                <h3 className="text-xl font-bold text-amber-400 mb-3 text-center sm:text-left">Estadísticas de la Contienda</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-white">{autoFightsCount}</p>
                        <p className="text-sm text-gray-400">Peleas de Cotejo</p>
                    </div>
                     <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-white">{manualFightsCount}</p>
                        <p className="text-sm text-gray-400">Peleas Manuales</p>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-white">{results.stats.mainTournamentRoostersCount}</p>
                        <p className="text-sm text-gray-400">Gallos Aptos</p>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-white">{results.unpairedRoosters.length}</p>
                        <p className="text-sm text-gray-400">Gallos sin Pelea</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold text-amber-400">Cartelera Principal</h3>
                {results.mainFights.length > 0 ? (
                    <div className="space-y-2">
                        {results.mainFights.map(renderPelea)}
                    </div>
                ) : (
                    <p className="text-center text-gray-400 py-6">No se generaron peleas.</p>
                )}
            </div>

            {!isReadOnly && totalRoostersForIndividualRound > 0 && (
                <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-4 mt-8">
                    <h3 className="text-xl font-bold text-amber-400 mb-4">Contiendas Manuales</h3>

                    {results.unpairedRoosters.length > 0 && (
                        <div>
                             <h4 className="text-amber-400 mb-2 text-base">Gallos Esperando Contienda</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {results.unpairedRoosters.map(gallo => {
                                    const isSelected = selectedRoosters.includes(gallo.id);
                                    let isDisabled = false;
                                    const selectedGallo = selectedRoosters.length === 1 ? results.unpairedRoosters.find(g => g.id === selectedRoosters[0]) : null;

                                    if (selectedRoosters.length >= 2 && !isSelected) {
                                        isDisabled = true;
                                    } else if (selectedGallo && !isSelected) {
                                        const cuerdaOfSelected = cuerdas.find(c => c.id === selectedGallo.cuerdaId);
                                        const cuerdaOfCurrent = cuerdas.find(c => c.id === gallo.cuerdaId);

                                        const baseIdOfSelected = cuerdaOfSelected?.baseCuerdaId || cuerdaOfSelected?.id;
                                        const baseIdOfCurrent = cuerdaOfCurrent?.baseCuerdaId || cuerdaOfCurrent?.id;
                                        
                                        if (baseIdOfSelected && baseIdOfSelected === baseIdOfCurrent) {
                                            isDisabled = true;
                                        }
                                    }
                                    
                                    const isUnderWeight = gallo.weight < torneo.minWeight;
                                    const isOverWeight = gallo.weight > torneo.maxWeight;


                                    return (
                                        <div 
                                            key={gallo.id} 
                                            onClick={() => !isDisabled && handleSelectRooster(gallo.id)}
                                            className={`flex items-center p-3 rounded-lg border-2 transition-all duration-200 ${isSelected ? 'bg-amber-900/50 border-amber-500 shadow-md' : 'bg-gray-700/50 border-gray-600'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-amber-600'}`}
                                        >
                                            <input 
                                                type="checkbox"
                                                checked={isSelected}
                                                disabled={isDisabled}
                                                readOnly
                                                className="w-5 h-5 rounded text-amber-600 bg-gray-900 border-gray-500 focus:ring-amber-500 focus:ring-offset-gray-800"
                                            />
                                            <div className="ml-3 flex-grow overflow-hidden">
                                                <p className="font-bold text-amber-400 truncate">{getCuerdaName(gallo.cuerdaId)}</p>
                                                <p className="text-white truncate">{gallo.color} <span className="text-xs text-gray-400 font-normal">({gallo.ringId})</span></p>
                                                {isUnderWeight && <span className="text-xs font-bold text-yellow-400 block">Peso Bajo</span>}
                                                {isOverWeight && <span className="text-xs font-bold text-red-400 block">Peso Alto</span>}
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-2 flex items-center">
                                                <div>
                                                    <p className="font-mono text-sm">{formatWeightLbsOz(gallo.weight)}</p>
                                                    <p className="font-mono text-xs text-gray-400">{gallo.ageMonths}m / {gallo.tipoGallo}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {selectedRoosters.length === 2 && (
                                <div className="mt-4 text-center">
                                    <button onClick={handleCreateManualFightClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg">
                                        Crear Pelea Seleccionada
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {results.unpairedRoosters.length === 0 && (
                        <p className="text-gray-400 text-center py-4">Todos los gallos disponibles han sido emparejados.</p>
                    )}

                </div>
            )}
        </div>
    );
};

export default MatchmakingScreen;