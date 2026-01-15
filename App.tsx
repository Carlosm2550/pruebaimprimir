import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Screen, Cuerda, Gallo, Pelea, Torneo, MatchmakingResults, TipoGallo, TipoEdad, Notification, DailyResult } from './types';
import { TrophyIcon } from './components/Icons';

import SetupScreen from './components/SetupScreen';
import MatchmakingScreen from './components/MatchmakingScreen';
import LiveFightScreen from './components/LiveFightScreen';
import ResultsScreen from './components/ResultsScreen';
import TournamentResultsScreen from './components/TournamentResultsScreen';
import Toaster from './components/Toaster';
import { DEMO_CUERDAS, DEMO_GALLOS } from './demo-data';

// --- TYPE DEFINITIONS ---
export interface CuerdaFormData {
    name: string;
    owner: string;
    city: string;
    frontCount: number;
}

// --- UTILITY FUNCTIONS ---
const OUNCES_PER_POUND = 16;
const fromLbsOz = (lbs: number, oz: number) => (lbs * OUNCES_PER_POUND) + oz;

// --- MATCHMAKING ALGORITHM ---
const findMaximumPairs = (
    roostersToMatch: Gallo[],
    torneo: Torneo,
    cuerdas: Cuerda[]
): { fights: Pelea[], leftovers: Gallo[] } => {
    
    const getBaseCuerdaId = (cuerdaId: string): string => {
        const cuerda = cuerdas.find(c => c.id === cuerdaId);
        return cuerda?.baseCuerdaId || cuerda?.id || '';
    };

    const areExceptions = (cuerdaId1: string, cuerdaId2: string): boolean => {
        const baseId1 = getBaseCuerdaId(cuerdaId1);
        const baseId2 = getBaseCuerdaId(cuerdaId2);
        return torneo.exceptions.some(ex => 
            (ex.cuerda1Id === baseId1 && ex.cuerda2Id === baseId2) ||
            (ex.cuerda1Id === baseId2 && ex.cuerda2Id === baseId1)
        );
    };

    const potentialFights: { roosterA: Gallo; roosterB: Gallo; weightDiff: number; ageDiff: number }[] = [];

    for (let i = 0; i < roostersToMatch.length; i++) {
        for (let j = i + 1; j < roostersToMatch.length; j++) {
            const roosterA = roostersToMatch[i];
            const roosterB = roostersToMatch[j];

            if (roosterA.tipoGallo !== roosterB.tipoGallo) continue;

            const baseCuerdaA = getBaseCuerdaId(roosterA.cuerdaId);
            const baseCuerdaB = getBaseCuerdaId(roosterB.cuerdaId);
            if (baseCuerdaA === baseCuerdaB) continue;

            if (areExceptions(roosterA.cuerdaId, roosterB.cuerdaId)) continue;
            
            const weightDiff = Math.abs(roosterA.weight - roosterB.weight);
            if (weightDiff > torneo.weightTolerance) continue;

            const ageDiff = Math.abs(roosterA.ageMonths - roosterB.ageMonths);
            if (ageDiff > torneo.ageToleranceMonths) continue;
            
            potentialFights.push({ roosterA, roosterB, weightDiff, ageDiff });
        }
    }

    potentialFights.sort((a, b) => {
        if (a.weightDiff !== b.weightDiff) return a.weightDiff - b.weightDiff;
        return a.ageDiff - b.ageDiff;
    });

    const fights: Pelea[] = [];
    const pairedRoosterIds = new Set<string>();
    let fightNumberCounter = 1;

    for (const potentialFight of potentialFights) {
        const { roosterA, roosterB } = potentialFight;
        
        if (!pairedRoosterIds.has(roosterA.id) && !pairedRoosterIds.has(roosterB.id)) {
            fights.push({
                id: `pelea-${roosterA.id}-${roosterB.id}`,
                fightNumber: fightNumberCounter++,
                roosterA,
                roosterB,
                winner: null,
                duration: null,
            });
            pairedRoosterIds.add(roosterA.id);
            pairedRoosterIds.add(roosterB.id);
        }
    }

    const leftovers = roostersToMatch.filter(g => !pairedRoosterIds.has(g.id));

    return { fights, leftovers };
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
    const [screen, setScreen] = useState<Screen>(Screen.SETUP);
    const [cuerdas, setCuerdas] = useState<Cuerda[]>([]);
    const [gallosByDay, setGallosByDay] = useState<Record<number, Gallo[]>>({ 1: [] });
    const [peleasByDay, setPeleasByDay] = useState<Record<number, Pelea[]>>({ 1: [] });
    const [matchmakingResultsByDay, setMatchmakingResultsByDay] = useState<Record<number, MatchmakingResults | null>>({ 1: null });
    const [dailyResults, setDailyResults] = useState<DailyResult[]>([]);
    const [currentDay, setCurrentDay] = useState<number>(1);
    const [viewingDay, setViewingDay] = useState<number>(1); // Day user is looking at
    const [isMatchmaking, setIsMatchmaking] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
     const [torneo, setTorneo] = useState<Torneo>({
        name: 'Torneo de Exhibición',
        date: new Date().toISOString().split('T')[0],
        weightTolerance: 1, // 1 ounce
        ageToleranceMonths: 2,
        minWeight: fromLbsOz(2, 12),
        maxWeight: fromLbsOz(5, 4),
        roostersPerTeam: 10,
        pointsForWin: 3,
        pointsForDraw: 1,
        tournamentDays: 1,
        exceptions: [],
    });
    
    const addNotification = useCallback((message: string, type: Notification['type'] = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, duration);
    }, []);

    const dismissNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    useEffect(() => {
        try {
            const savedCuerdas = localStorage.getItem('galleraPro_cuerdas');
            const savedTorneo = localStorage.getItem('galleraPro_torneo');
            const savedGallosByDay = localStorage.getItem('galleraPro_gallosByDay');
            const savedPeleasByDay = localStorage.getItem('galleraPro_peleasByDay');
            const savedMatchmakingByDay = localStorage.getItem('galleraPro_matchmakingResultsByDay');
            const savedDailyResults = localStorage.getItem('galleraPro_dailyResults');
            const savedCurrentDay = localStorage.getItem('galleraPro_currentDay');
            
            if (savedCuerdas && savedTorneo && savedGallosByDay) {
                const loadedCurrentDay = savedCurrentDay ? parseInt(savedCurrentDay, 10) : 1;
                setCuerdas(JSON.parse(savedCuerdas));
                setTorneo(JSON.parse(savedTorneo));
                setGallosByDay(JSON.parse(savedGallosByDay));
                setPeleasByDay(savedPeleasByDay ? JSON.parse(savedPeleasByDay) : { 1: [] });
                setMatchmakingResultsByDay(savedMatchmakingByDay ? JSON.parse(savedMatchmakingByDay) : { 1: null });
                setDailyResults(savedDailyResults ? JSON.parse(savedDailyResults) : []);
                setCurrentDay(loadedCurrentDay);
                setViewingDay(loadedCurrentDay);
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            addNotification('Error al cargar los datos.', 'error');
        }
    }, [addNotification]);
    
    useEffect(() => {
        localStorage.setItem('galleraPro_cuerdas', JSON.stringify(cuerdas));
        localStorage.setItem('galleraPro_torneo', JSON.stringify(torneo));
        localStorage.setItem('galleraPro_gallosByDay', JSON.stringify(gallosByDay));
        localStorage.setItem('galleraPro_peleasByDay', JSON.stringify(peleasByDay));
        localStorage.setItem('galleraPro_matchmakingResultsByDay', JSON.stringify(matchmakingResultsByDay));
        localStorage.setItem('galleraPro_dailyResults', JSON.stringify(dailyResults));
        localStorage.setItem('galleraPro_currentDay', JSON.stringify(currentDay));
    }, [cuerdas, torneo, gallosByDay, peleasByDay, matchmakingResultsByDay, dailyResults, currentDay]);

    const viewingGallos = useMemo(() => gallosByDay[viewingDay] || [], [gallosByDay, viewingDay]);
    const viewingPeleas = useMemo(() => peleasByDay[viewingDay] || [], [peleasByDay, viewingDay]);
    const viewingMatchmakingResults = useMemo(() => matchmakingResultsByDay[viewingDay] || null, [matchmakingResultsByDay, viewingDay]);
    
    const isReadOnly = useMemo(() => viewingDay < currentDay, [viewingDay, currentDay]);
    const isTournamentInProgress = useMemo(() => (peleasByDay[currentDay] || []).length > 0 && (peleasByDay[currentDay] || []).some(p => p.winner === null), [peleasByDay, currentDay]);

    const handleUpdateTorneo = useCallback((updatedTorneo: Torneo) => setTorneo(updatedTorneo), []);

    const handleLoadDemoData = useCallback(() => {
        if (window.confirm('¿Deseas cargar los 100 gallos y 10 criaderos de prueba? Esto sobrescribirá tus datos actuales del Día 1.')) {
            setCuerdas(DEMO_CUERDAS);
            setGallosByDay(prev => ({ ...prev, [currentDay]: DEMO_GALLOS }));
            addNotification('Datos de prueba cargados exitosamente.', 'success');
        }
    }, [currentDay, addNotification]);

    const handleSaveCuerda = useCallback((cuerdaData: CuerdaFormData, currentCuerdaId: string | null) => {
        const { name, owner, city, frontCount } = cuerdaData;
        
        if (currentCuerdaId) { // Editing
            const baseCuerdaToEdit = cuerdas.find(c => c.id === currentCuerdaId);
            if (!baseCuerdaToEdit) return;
            const baseCuerdaId = baseCuerdaToEdit.baseCuerdaId || baseCuerdaToEdit.id;
            
            const existingFronts = cuerdas.filter(c => (c.id === baseCuerdaId && !c.baseCuerdaId) || c.baseCuerdaId === baseCuerdaId)
                                        .sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
            
            let updatedCuerdas = [...cuerdas];
            // Remove surplus fronts
            if (frontCount < existingFronts.length) {
                const frontsToRemove = existingFronts.slice(frontCount);
                const frontIdsToRemove = new Set(frontsToRemove.map(f => f.id));
                const gallosInFrontsToRemoveCount = Object.values(gallosByDay).flat().filter((g: Gallo) => frontIdsToRemove.has(g.cuerdaId)).length;


                let confirmMessage = `Va a reducir el número de frentes a ${frontCount}. ${frontsToRemove.length} frente(s) será(n) eliminado(s).`;
                if (gallosInFrontsToRemoveCount > 0) {
                    confirmMessage += ` Esto también eliminará ${gallosInFrontsToRemoveCount} gallo(s) asignado(s) a estos frentes en todos los días.`;
                }
                confirmMessage += " ¿Desea continuar?";
                
                if (window.confirm(confirmMessage)) {
                    setGallosByDay(prev => {
                        const newGallosByDay = { ...prev };
                        for (const day in newGallosByDay) {
                            newGallosByDay[day] = newGallosByDay[day].filter(g => !frontIdsToRemove.has(g.cuerdaId));
                        }
                        return newGallosByDay;
                    });
                    updatedCuerdas = updatedCuerdas.filter(c => !frontIdsToRemove.has(c.id));
                } else {
                    return; // User cancelled
                }
            }

            // Update existing and add new fronts
            let finalCuerdas = [...updatedCuerdas];
            const baseCuerdaInFinal = finalCuerdas.find(c => c.id === baseCuerdaId);
            if(!baseCuerdaInFinal) return;

            for (let i = 0; i < frontCount; i++) {
                const frontName = `${name} (F${i + 1})`;
                if (i < existingFronts.length) {
                    const existingId = existingFronts[i].id;
                    const index = finalCuerdas.findIndex(c => c.id === existingId);
                    if (index !== -1) {
                         finalCuerdas[index] = { ...finalCuerdas[index], name: frontName, owner, city };
                    }
                } else {
                     finalCuerdas.push({
                        id: `cuerda-${Date.now()}-${i}`,
                        name: frontName,
                        owner,
                        city,
                        baseCuerdaId: baseCuerdaInFinal.id
                    });
                }
            }
             setCuerdas(finalCuerdas);
             addNotification('Cuerda actualizada.', 'success');

        } else { // Adding
            const baseId = `cuerda-${Date.now()}`;
            const newCuerdas: Cuerda[] = [{ id: baseId, name: `${name} (F1)`, owner, city }];
            for (let i = 1; i < frontCount; i++) {
                newCuerdas.push({
                    id: `cuerda-${Date.now()}-${i}`,
                    name: `${name} (F${i + 1})`,
                    owner,
                    city,
                    baseCuerdaId: baseId
                });
            }
            setCuerdas(prev => [...prev, ...newCuerdas]);
            addNotification('Cuerda añadida.', 'success');
        }
    }, [cuerdas, gallosByDay, addNotification]);
    
    const handleDeleteCuerda = useCallback((cuerdaIdToDelete: string) => {
        const cuerdaToDelete = cuerdas.find(c => c.id === cuerdaIdToDelete);
        if (!cuerdaToDelete) return;
    
        const baseId = cuerdaToDelete.baseCuerdaId || cuerdaToDelete.id;
        const isDeletingBase = cuerdaToDelete.id === baseId;
        const hasOtherFronts = cuerdas.some(c => c.baseCuerdaId === baseId);
    
        if (isDeletingBase && hasOtherFronts) {
            addNotification('No se puede eliminar el frente principal (F1) si existen otros frentes asociados. Elimine los frentes secundarios primero.', 'error', 5000);
            return;
        }
    
        const associatedRoostersCount = Object.values(gallosByDay).flat().filter((g: Gallo) => g.cuerdaId === cuerdaIdToDelete).length;
        let confirmMessage = `¿Está seguro de que desea eliminar el frente "${cuerdaToDelete.name}"?`;
        if (associatedRoostersCount > 0) {
            confirmMessage += ` ${associatedRoostersCount} gallo(s) asignado(s) a él también será(n) eliminado(s) de todos los días.`;
        }
    
        if (window.confirm(confirmMessage)) {
            setGallosByDay(prev => {
                const newGallosByDay = { ...prev };
                for (const day in newGallosByDay) {
                    newGallosByDay[day] = newGallosByDay[day].filter(g => g.cuerdaId !== cuerdaIdToDelete);
                }
                return newGallosByDay;
            });
            setCuerdas(prev => prev.filter(c => c.id !== cuerdaIdToDelete));
            addNotification('Frente y sus gallos han sido eliminados.', 'success');
        }
    }, [cuerdas, gallosByDay, addNotification]);

    const handleSaveGallo = useCallback((galloData: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => {
        const tipoEdad = galloData.ageMonths < 12 ? TipoEdad.POLLO : TipoEdad.GALLO;
        const finalGalloData = { ...galloData, tipoEdad };
        const updatedGallo: Gallo = { ...finalGalloData, id: currentGalloId };

        setGallosByDay(prev => {
            const dayGallos = prev[currentDay] || [];
            const index = dayGallos.findIndex(g => g.id === currentGalloId);
            if (index > -1) {
                const updatedGallos = [...dayGallos];
                updatedGallos[index] = updatedGallo;
                return { ...prev, [currentDay]: updatedGallos };
            }
            return prev;
        });
        
        addNotification('Gallo actualizado.', 'success');
    }, [addNotification, currentDay]);

    const handleAddSingleGallo = useCallback((galloData: Omit<Gallo, 'id' | 'tipoEdad'>) => {
        const newGallo = {
            ...galloData,
            id: `gallo-${Date.now()}-${Math.random()}`,
            tipoEdad: galloData.ageMonths < 12 ? TipoEdad.POLLO : TipoEdad.GALLO,
        };
        setGallosByDay(prev => ({
            ...prev,
            [currentDay]: [...(prev[currentDay] || []), newGallo]
        }));
        const cuerdaName = cuerdas.find(c => c.id === newGallo.cuerdaId)?.name || 'la lista';
        addNotification(`Gallo "${newGallo.color}" añadido a ${cuerdaName}.`, 'success');
    }, [addNotification, cuerdas, currentDay]);
    
    const handleDeleteGallo = useCallback((galloId: string) => {
        setGallosByDay(prev => ({
            ...prev,
            [currentDay]: (prev[currentDay] || []).filter(g => g.id !== galloId)
        }));
        addNotification('Gallo eliminado.', 'success');
    }, [addNotification, currentDay]);

    const handleStartMatchmaking = useCallback(() => {
        setIsMatchmaking(true);
        setTimeout(() => {
            const roostersInRange = viewingGallos.filter(g => g.weight >= torneo.minWeight && g.weight <= torneo.maxWeight);

            const { fights: mainFights, leftovers } = findMaximumPairs(roostersInRange, torneo, cuerdas);
            
            const results: MatchmakingResults = {
                mainFights,
                individualFights: [],
                unpairedRoosters: leftovers,
                stats: {
                    contribution: 0,
                    rounds: 0,
                    mainTournamentRoostersCount: roostersInRange.length
                }
            };

            setMatchmakingResultsByDay(prev => ({ ...prev, [currentDay]: results }));
            setIsMatchmaking(false);
            setScreen(Screen.MATCHMAKING);
        }, 500);
    }, [viewingGallos, torneo, cuerdas, currentDay]);

    const handleCreateManualFight = useCallback((roosterAId: string, roosterBId: string) => {
        if (!viewingMatchmakingResults) return;
        
        const roosterA = viewingGallos.find(g => g.id === roosterAId);
        const roosterB = viewingGallos.find(g => g.id === roosterBId);

        if (!roosterA || !roosterB) {
            addNotification('No se encontraron los gallos seleccionados.', 'error');
            return;
        }

        const newFight: Pelea = {
            id: `pelea-manual-${roosterAId}-${roosterBId}`,
            fightNumber: viewingMatchmakingResults.mainFights.length + 1,
            roosterA,
            roosterB,
            winner: null,
            duration: null,
        };
        
        setMatchmakingResultsByDay(prev => {
            const dayResults = prev[currentDay];
            if (!dayResults) return prev;
            return {
                ...prev,
                [currentDay]: {
                    ...dayResults,
                    mainFights: [...dayResults.mainFights, newFight],
                    unpairedRoosters: dayResults.unpairedRoosters.filter(g => g.id !== roosterAId && g.id !== roosterBId),
                }
            };
        });
        addNotification('Pelea manual creada y añadida a la cartelera.', 'success');
    }, [viewingMatchmakingResults, viewingGallos, addNotification, currentDay]);

    const handleStartTournament = useCallback(() => {
        if (!viewingMatchmakingResults) return;
        setPeleasByDay(prev => ({ ...prev, [currentDay]: viewingMatchmakingResults.mainFights }));
        setScreen(Screen.LIVE_FIGHT);
    }, [viewingMatchmakingResults, currentDay]);
    
    const handleEndDay = useCallback((finishedPeleasOfDay: Pelea[]) => {
        addNotification(`Resultados del Día ${currentDay} guardados.`, 'success');
        setDailyResults(prev => {
            const otherDays = prev.filter(r => r.day !== currentDay);
            return [...otherDays, { day: currentDay, peleas: finishedPeleasOfDay }].sort((a, b) => a.day - b.day);
        });

        if (currentDay >= torneo.tournamentDays) {
            addNotification('¡Torneo finalizado!', 'success', 5000);
            setScreen(Screen.TOURNAMENT_RESULTS);
        } else {
            const nextDay = currentDay + 1;
            setCurrentDay(nextDay);
            setViewingDay(nextDay); // Move view to the new day
            
            setGallosByDay(prev => ({ ...prev, [nextDay]: prev[nextDay] || [] }));
            setPeleasByDay(prev => ({ ...prev, [nextDay]: prev[nextDay] || [] }));
            setMatchmakingResultsByDay(prev => ({ ...prev, [nextDay]: prev[nextDay] === undefined ? null : prev[nextDay] }));
            addNotification(`Prepara el cotejo para el Día ${nextDay}.`, 'info', 5000);
            setScreen(Screen.SETUP);
        }
    }, [currentDay, torneo.tournamentDays, addNotification]);

    const handleFinishFight = useCallback((fightId: string, winner: 'A' | 'B' | 'DRAW', duration: number) => {
        const dayPeleas = peleasByDay[currentDay] || [];
        const updatedPeleas = dayPeleas.map(p => (p.id === fightId ? { ...p, winner, duration } : p));
        setPeleasByDay(prev => ({ ...prev, [currentDay]: updatedPeleas }));

        const unfinishedFights = updatedPeleas.filter(p => p.winner === null);
        if (unfinishedFights.length === 0 && updatedPeleas.length > 0) {
            setTimeout(() => handleEndDay(updatedPeleas), 200);
        }
    }, [peleasByDay, currentDay, handleEndDay]);

    const handleFinishTournament = useCallback(() => { // For early exit
        const finishedFightsForDay = (peleasByDay[currentDay] || []).filter(p => p.winner !== null);
        setDailyResults(prev => {
            const otherDays = prev.filter(r => r.day !== currentDay);
            if (finishedFightsForDay.length > 0) {
                return [...otherDays, { day: currentDay, peleas: finishedFightsForDay }].sort((a, b) => a.day - b.day);
            }
            return prev;
        });
        addNotification('Torneo finalizado anticipadamente.', 'info');
        setScreen(Screen.TOURNAMENT_RESULTS);
    }, [peleasByDay, currentDay]);

    const handleNewTournament = useCallback(() => {
        if (window.confirm('¿Estás seguro de que quieres empezar un nuevo torneo? Se borrarán los resultados y peleas del torneo actual, pero se conservarán las cuerdas y la lista de gallos de cada día.')) {
            setPeleasByDay({ 1: [] });
            setMatchmakingResultsByDay({ 1: null });
            setDailyResults([]);
            setCurrentDay(1);
            setViewingDay(1);
            setTorneo(prev => ({ ...prev, name: 'Torneo de Exhibición', date: new Date().toISOString().split('T')[0] }));
            setScreen(Screen.SETUP);
            addNotification('Datos del torneo anterior borrados. ¡Listo para empezar uno nuevo!', 'success');
        }
    }, []);

    const handleFullReset = useCallback(() => {
        if(window.confirm('¿Estás seguro de que quieres reiniciar la aplicación? Se borrarán permanentemente todos los datos guardados (cuerdas, gallos y reglas).')) {
            localStorage.clear();
            window.location.reload();
        }
    }, []);

    const handleSelectDay = useCallback((day: number) => {
        setViewingDay(day);
        setScreen(Screen.SETUP);
        const isDayFinished = dailyResults.some(r => r.day === day);
        if (isDayFinished) {
            setScreen(Screen.RESULTS);
        } else {
            setScreen(Screen.SETUP);
        }
    }, [dailyResults]);
    
    const handleShowTournamentResults = useCallback(() => {
        setScreen(Screen.TOURNAMENT_RESULTS);
    }, []);
    
    const isTournamentFinished = useMemo(() => dailyResults.length >= torneo.tournamentDays, [dailyResults, torneo.tournamentDays]);
    
    const renderScreen = () => {
        switch (screen) {
            case Screen.MATCHMAKING:
                return viewingMatchmakingResults && <MatchmakingScreen 
                    results={viewingMatchmakingResults} 
                    torneo={torneo} 
                    cuerdas={cuerdas}
                    gallos={viewingGallos}
                    onStartTournament={handleStartTournament} 
                    onBack={() => setScreen(Screen.SETUP)}
                    onCreateManualFight={handleCreateManualFight}
                    isReadOnly={isReadOnly}
                />;
            case Screen.LIVE_FIGHT:
                return <LiveFightScreen 
                    peleas={(peleasByDay[currentDay] || []).filter(p => p.winner === null)} 
                    onFinishFight={handleFinishFight} 
                    onFinishTournament={handleFinishTournament}
                    onBack={() => setScreen(Screen.MATCHMAKING)}
                    totalFightsInPhase={(peleasByDay[currentDay] || []).length}
                    addNotification={addNotification}
                />;
            case Screen.RESULTS:
                 return <ResultsScreen 
                    dailyResults={dailyResults} 
                    torneo={torneo} 
                    cuerdas={cuerdas} 
                    onNewTournament={handleNewTournament}
                    onBack={() => setScreen(Screen.MATCHMAKING)}
                    viewingDay={viewingDay}
                />;
            case Screen.TOURNAMENT_RESULTS:
                return <TournamentResultsScreen 
                   dailyResults={dailyResults} 
                   torneo={torneo} 
                   cuerdas={cuerdas} 
                   onNewTournament={handleNewTournament}
                   onBack={() => handleSelectDay(torneo.tournamentDays)}
               />;
            case Screen.SETUP:
            default:
                return <SetupScreen
                    cuerdas={cuerdas}
                    gallos={viewingGallos}
                    torneo={torneo}
                    viewingDay={viewingDay}
                    currentDay={currentDay}
                    dailyResults={dailyResults}
                    onUpdateTorneo={handleUpdateTorneo}
                    onStartMatchmaking={handleStartMatchmaking}
                    onSaveCuerda={handleSaveCuerda}
                    onDeleteCuerda={handleDeleteCuerda}
                    onSaveGallo={handleSaveGallo}
                    onAddSingleGallo={handleAddSingleGallo}
                    onDeleteGallo={handleDeleteGallo}
                    isMatchmaking={isMatchmaking}
                    onFullReset={handleFullReset}
                    onGoToResults={() => setScreen(Screen.RESULTS)}
                    onGoToMatchmaking={() => setScreen(Screen.MATCHMAKING)}
                    isReadOnly={isReadOnly}
                    matchmakingResultsExist={!!viewingMatchmakingResults}
                    onLoadDemoData={handleLoadDemoData}
                />;
        }
    };
    
    const dayTabs = Array.from({ length: torneo.tournamentDays }, (_, i) => i + 1);

    return (
        <div className="bg-gray-900 text-gray-200 min-h-screen swirl-bg">
            <Toaster notifications={notifications} onDismiss={dismissNotification} />
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <header className="flex items-center space-x-4 mb-8">
                    <TrophyIcon className="w-10 h-10 text-amber-400" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wider">GalleraPro <span className="text-amber-500 font-light">- 100% Peleas de gallos</span></h1>
                </header>

                {torneo.tournamentDays > 1 && (
                    <div className="flex justify-center border-b border-gray-700 mb-6 flex-wrap">
                        {dayTabs.map(day => {
                            const isDayFinished = dailyResults.some(r => r.day === day);
                            const isDayActive = day === viewingDay && (screen === Screen.SETUP || screen === Screen.RESULTS || screen === Screen.MATCHMAKING || screen === Screen.LIVE_FIGHT);

                            return (
                                <button
                                    key={day}
                                    onClick={() => handleSelectDay(day)}
                                    className={`py-3 px-6 text-base md:text-lg font-semibold transition-colors ${
                                        isDayActive
                                        ? 'text-amber-400 border-b-2 border-amber-400'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Día {day} {isDayFinished && '✔'}
                                </button>
                            )
                        })}
                        {isTournamentFinished && (
                             <button
                                key="tournament-results"
                                onClick={handleShowTournamentResults}
                                className={`py-3 px-6 text-base md:text-lg font-semibold transition-colors ${
                                    screen === Screen.TOURNAMENT_RESULTS
                                    ? 'text-amber-400 border-b-2 border-amber-400'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Resultados del Torneo
                            </button>
                        )}
                    </div>
                )}
                
                {isTournamentInProgress && viewingDay !== currentDay && (
                    <div 
                        className="bg-blue-600/80 backdrop-blur-sm text-white p-3 rounded-lg mb-4 text-center cursor-pointer hover:bg-blue-700 font-semibold border border-blue-500 shadow-lg animate-pulse"
                        onClick={() => { setViewingDay(currentDay); setScreen(Screen.LIVE_FIGHT); }}>
                        Volver a la Pelea en Vivo (Día {currentDay})
                    </div>
                )}

                <main>
                    {renderScreen()}
                </main>
                 <footer className="text-center text-gray-500 text-sm mt-12 pb-4">
                    © {new Date().getFullYear()} GalleraPro. Todos los derechos reservados.
                </footer>
            </div>
        </div>
    );
};

export default App;