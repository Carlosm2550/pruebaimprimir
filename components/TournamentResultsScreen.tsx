import React, { useMemo, useState } from 'react';
import { Pelea, Torneo, Cuerda, Gallo, DailyResult } from '../types';

interface ChampionStats {
    cuerdaId: string;
    cuerdaName: string;
    wins: number;
    draws: number;
    losses: number;
    totalDurationSeconds: number;
    points: number;
}

// --- SCREEN ---
interface TournamentResultsScreenProps { 
    dailyResults: DailyResult[]; 
    torneo: Torneo;
    cuerdas: Cuerda[];
    onNewTournament: () => void;
    onBack: () => void;
}

const TournamentResultsScreen: React.FC<TournamentResultsScreenProps> = ({ dailyResults, torneo, cuerdas, onNewTournament, onBack }) => {
    
    const [expandedCuerdas, setExpandedCuerdas] = useState<string[]>([]);

    const toggleCuerdaExpansion = (cuerdaId: string) => {
        setExpandedCuerdas(prev => 
            prev.includes(cuerdaId) 
                ? prev.filter(id => id !== cuerdaId)
                : [...prev, cuerdaId]
        );
    };

    const getBaseCuerdaId = (cuerdaId: string): string => {
        const cuerda = cuerdas.find(c => c.id === cuerdaId);
        return cuerda?.baseCuerdaId || cuerda?.id || '';
    };

    const allPeleasWithDay = useMemo(() => 
        dailyResults.flatMap(dr => 
            dr.peleas.map(pelea => ({ ...pelea, day: dr.day }))
        ), 
    [dailyResults]);

    const championStats: ChampionStats[] = useMemo(() => {
        const statsMap = new Map<string, Omit<ChampionStats, 'cuerdaId' | 'cuerdaName' | 'points'>>();
        const baseCuerdas = cuerdas.filter(c => !c.baseCuerdaId);
    
        baseCuerdas.forEach(bc => {
            statsMap.set(bc.id, { wins: 0, draws: 0, losses: 0, totalDurationSeconds: 0 });
        });
    
        allPeleasWithDay.forEach(pelea => {
            if (!pelea.winner) return;
            const duration = pelea.duration || 0;
            
            const baseIdA = getBaseCuerdaId(pelea.roosterA.cuerdaId);
            const baseIdB = getBaseCuerdaId(pelea.roosterB.cuerdaId);
    
            const statsA = statsMap.get(baseIdA);
            const statsB = statsMap.get(baseIdB);

            if (pelea.winner === 'A') {
                if(statsA) {
                    statsA.wins++;
                    statsA.totalDurationSeconds += duration;
                }
                if(statsB) statsB.losses++;
            } else if (pelea.winner === 'B') {
                if(statsB) {
                    statsB.wins++;
                    statsB.totalDurationSeconds += duration;
                }
                if(statsA) statsA.losses++;
            } else if (pelea.winner === 'DRAW') {
                if(statsA) {
                    statsA.draws++;
                    statsA.totalDurationSeconds += duration;
                }
                if(statsB) {
                    statsB.draws++;
                    statsB.totalDurationSeconds += duration;
                }
            }
        });
    
        const result = Array.from(statsMap.entries()).map(([baseCuerdaId, stats]) => {
            const baseCuerda = baseCuerdas.find(bc => bc.id === baseCuerdaId);
            const points = (stats.wins * torneo.pointsForWin) + (stats.draws * torneo.pointsForDraw);
            return {
                cuerdaId: baseCuerdaId,
                cuerdaName: baseCuerda ? baseCuerda.name.replace(/\s\(F\d+\)$/, '') : 'Desconocido',
                points,
                ...stats
            };
        });
    
        return result.filter(s => (s.wins + s.draws + s.losses) > 0)
                     .sort((a, b) => {
                         if (a.points !== b.points) return b.points - a.points;
                         return a.totalDurationSeconds - b.totalDurationSeconds;
                     });
    
    }, [allPeleasWithDay, cuerdas, torneo]);

    const fastestRooster = useMemo(() => {
        let fastest: { rooster: Gallo, duration: number } | null = null;
        
        allPeleasWithDay.forEach(pelea => {
            if (pelea.winner && pelea.winner !== 'DRAW' && pelea.duration !== null && pelea.duration > 0) {
                if (!fastest || pelea.duration < fastest.duration) {
                    fastest = {
                        rooster: pelea.winner === 'A' ? pelea.roosterA : pelea.roosterB,
                        duration: pelea.duration,
                    };
                }
            }
        });
    
        return fastest;
    }, [allPeleasWithDay]);

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return { minutes, seconds };
    };
    
    const getCuerdaName = (id: string) => cuerdas.find(p => p.id === id)?.name || 'Desconocido';


    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Resultados Finales del Torneo</h2>
                <p className="text-gray-400 mt-2">{torneo.name} - {torneo.date}</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-4 sm:p-6">
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                    <h3 className="text-xl font-bold text-amber-400">Clasificación de Campeones</h3>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                         <thead className="text-xs text-amber-400 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-center">#</th>
                                <th scope="col" className="px-6 py-3">Cuerda</th>
                                <th scope="col" className="px-4 py-3 text-center">Puntos</th>
                                <th scope="col" className="px-3 py-3 text-center">PG</th>
                                <th scope="col" className="px-3 py-3 text-center">PE</th>
                                <th scope="col" className="px-3 py-3 text-center">PP</th>
                                <th scope="col" className="px-4 py-3 text-center">Tiempo Total</th>
                            </tr>
                        </thead>
                        <tbody>
                           {championStats.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">No hay datos suficientes para generar la clasificación.</td>
                                </tr>
                            )}
                            {championStats.map((stat, index) => {
                                const { minutes, seconds } = formatTime(stat.totalDurationSeconds);
                                const isExpanded = expandedCuerdas.includes(stat.cuerdaId);
                                const teamFights = allPeleasWithDay.filter(p => 
                                    getBaseCuerdaId(p.roosterA.cuerdaId) === stat.cuerdaId || 
                                    getBaseCuerdaId(p.roosterB.cuerdaId) === stat.cuerdaId
                                );
                                
                                return (
                                 <React.Fragment key={stat.cuerdaId}>
                                    <tr className="border-b border-gray-700 hover:bg-gray-700/30 cursor-pointer" onClick={() => toggleCuerdaExpansion(stat.cuerdaId)}>
                                       <td className="px-4 py-3 font-bold text-center">{index + 1}</td>
                                       <td className="px-6 py-3 font-semibold text-white">{stat.cuerdaName}</td>
                                       <td className="px-4 py-3 text-center text-white font-bold">{stat.points}</td>
                                       <td className="px-3 py-3 text-center text-green-400 font-bold">{stat.wins}</td>
                                       <td className="px-3 py-3 text-center text-yellow-400">{stat.draws}</td>
                                       <td className="px-3 py-3 text-center text-red-400">{stat.losses}</td>
                                       <td className="px-4 py-3 text-center text-white font-semibold tracking-wider">
                                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                                       </td>
                                   </tr>
                                    <tr className={`${isExpanded ? '' : 'hidden'} print:hidden`}>
                                      <td colSpan={7} className="p-4 bg-gray-700/10">
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-amber-300">Detalles de Peleas para {stat.cuerdaName}:</h4>
                                            {teamFights.length > 0 ? teamFights.map(fight => {
                                                const thisTeamRooster = getBaseCuerdaId(fight.roosterA.cuerdaId) === stat.cuerdaId ? fight.roosterA : fight.roosterB;
                                                const opponentRooster = thisTeamRooster === fight.roosterA ? fight.roosterB : fight.roosterA;
                                                const fightTime = formatTime(fight.duration || 0);
                                                
                                                let result = 'Empate';
                                                if ((fight.winner === 'A' && thisTeamRooster === fight.roosterA) || (fight.winner === 'B' && thisTeamRooster === fight.roosterB)) {
                                                    result = 'Victoria';
                                                } else if (fight.winner !== 'DRAW') {
                                                    result = 'Derrota';
                                                }

                                                return (
                                                     <div key={fight.id} className="text-xs grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-1 p-2 border-b border-gray-600 last:border-b-0">
                                                        <div><span className="font-semibold text-gray-400">Día:</span> <span className="font-normal">{fight.day}</span></div>
                                                        <div><span className="font-semibold text-gray-400">Gallo:</span> <span className="font-normal">{thisTeamRooster.color} ({getCuerdaName(thisTeamRooster.cuerdaId)})</span></div>
                                                        <div><span className="font-semibold text-gray-400">Oponente:</span> <span className="font-normal">{opponentRooster.color} ({getCuerdaName(opponentRooster.cuerdaId)})</span></div>
                                                        <div><span className="font-semibold text-gray-400">Resultado:</span> <span className={`font-bold ${result === 'Victoria' ? 'text-green-400' : result === 'Derrota' ? 'text-red-400' : 'text-yellow-400'}`}>{result}</span></div>
                                                        <div><span className="font-semibold text-gray-400">Tiempo:</span> <span className="font-normal">{fightTime.minutes}:{String(fightTime.seconds).padStart(2, '0')}</span></div>
                                                    </div>
                                                )
                                            }) : <p className="text-xs text-gray-500">No hay detalles de peleas para esta cuerda.</p>}
                                        </div>
                                      </td>
                                   </tr>
                                </React.Fragment>
                               )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-6 mt-8">
                <h3 className="text-xl font-bold text-amber-400 mb-4">Gallo más Rápido del Campeonato</h3>
                {fastestRooster ? (
                     <div className="text-center bg-gray-700/50 p-6 rounded-lg">
                        <p className="text-5xl font-bold text-green-400">
                             {formatTime(fastestRooster.duration).minutes}:{String(formatTime(fastestRooster.duration).seconds).padStart(2, '0')}
                        </p>
                        <p className="text-2xl font-semibold text-white mt-2">{fastestRooster.rooster.color}</p>
                        <p className="text-lg text-gray-300">{getCuerdaName(fastestRooster.rooster.cuerdaId)}</p>
                     </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">No se encontraron peleas ganadas para determinar el más rápido.</p>
                )}
            </div>

             <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8 print:hidden">
                 <button onClick={onBack} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg text-lg">Volver al Último Día</button>
                <button onClick={onNewTournament} className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-3 px-8 rounded-lg text-lg">
                    Nuevo Torneo (Borrar Resultados)
                </button>
            </div>
        </div>
    );
};
export default TournamentResultsScreen;