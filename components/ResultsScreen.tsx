import React, { useMemo, useState } from 'react';
import { Pelea, Torneo, Cuerda, CuerdaStats, Gallo, DailyResult } from '../types';


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
interface ResultsScreenProps { 
    dailyResults: DailyResult[]; 
    torneo: Torneo;
    cuerdas: Cuerda[];
    onNewTournament: () => void;
    onBack: () => void;
    viewingDay: number;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ dailyResults, torneo, cuerdas, onNewTournament, onBack, viewingDay }) => {
    
    const [expandedCuerdas, setExpandedCuerdas] = useState<string[]>([]);

    const toggleCuerdaExpansion = (cuerdaId: string) => {
        setExpandedCuerdas(prev => 
            prev.includes(cuerdaId) 
                ? prev.filter(id => id !== cuerdaId)
                : [...prev, cuerdaId]
        );
    };

    const peleas = useMemo(() => {
        const result = dailyResults.find(r => r.day === viewingDay);
        return result ? result.peleas : [];
    }, [dailyResults, viewingDay]);

    const stats: CuerdaStats[] = useMemo(() => {
        const statsMap: { [key: string]: Omit<CuerdaStats, 'cuerdaName' | 'cuerdaId' | 'fronts' | 'points'> } = {};

        cuerdas.forEach(c => {
             statsMap[c.id] = {
                wins: 0,
                draws: 0,
                losses: 0,
                totalDurationSeconds: 0,
            };
        });

        peleas.forEach(pelea => {
            if (!pelea.winner) return;

            const idA = pelea.roosterA.cuerdaId;
            const idB = pelea.roosterB.cuerdaId;
            const duration = pelea.duration || 0;

            if (pelea.winner === 'A') {
                statsMap[idA].wins++;
                statsMap[idA].totalDurationSeconds += duration;
                statsMap[idB].losses++;

            } else if (pelea.winner === 'B') {
                statsMap[idB].wins++;
                statsMap[idB].totalDurationSeconds += duration;
                statsMap[idA].losses++;

            } else if (pelea.winner === 'DRAW') {
                statsMap[idA].draws++;
                statsMap[idB].draws++;
                statsMap[idA].totalDurationSeconds += duration;
                statsMap[idB].totalDurationSeconds += duration;
            }
        });
        
        return cuerdas.map(c => {
            const frontMatch = c.name.match(/\(F(\d+)\)$/);
            const frontNumber = frontMatch ? parseInt(frontMatch[1], 10) : 1;
            const cuerdaStats = statsMap[c.id];
            const points = (cuerdaStats.wins * torneo.pointsForWin) + (cuerdaStats.draws * torneo.pointsForDraw);

            return {
                cuerdaId: c.id,
                cuerdaName: c.name,
                fronts: frontNumber,
                ...cuerdaStats,
                points,
            };
        }).filter(s => (s.wins + s.draws + s.losses) > 0);

    }, [peleas, cuerdas, torneo]);

    const sortedStats = useMemo(() => {
        const sortableItems = [...stats];
        sortableItems.sort((a, b) => {
            if (a.points !== b.points) {
                return b.points - a.points;
            }
            if (a.totalDurationSeconds !== b.totalDurationSeconds) {
                return a.totalDurationSeconds - b.totalDurationSeconds;
            }
            return 0;
        });
        return sortableItems;
    }, [stats]);

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return { minutes, seconds };
    };

    const fastestWinners = useMemo(() => {
        const winners: { rooster: Gallo, duration: number }[] = [];
        peleas.forEach(p => {
            if (p.winner && p.winner !== 'DRAW' && p.duration !== null && p.duration > 0) {
                const winnerRooster = p.winner === 'A' ? p.roosterA : p.roosterB;
                winners.push({ rooster: winnerRooster, duration: p.duration });
            }
        });
        return winners.sort((a, b) => a.duration - b.duration).slice(0, 10);
    }, [peleas]);

    const handlePrint = () => {
        document.body.classList.add('printing-results');
        setExpandedCuerdas(stats.map(s => s.cuerdaId)); // Expand all for printing
        
        setTimeout(() => {
            window.print();
            document.body.classList.remove('printing-results');
            setExpandedCuerdas([]); // Collapse back after printing
        }, 100);
    };

    const getCuerdaName = (id: string) => cuerdas.find(p => p.id === id)?.name || 'Desconocido';

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Clasificación General</h2>
                <p className="text-gray-400 mt-2">{torneo.name} - {torneo.date}</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-4 sm:p-6 print-target">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                    <h3 className="text-xl font-bold text-amber-400">Tabla de Posiciones - Día {viewingDay}</h3>
                     <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mt-3 sm:mt-0 print-hide">
                        Imprimir PDF del Día
                    </button>
                </div>
                <p className="text-xs text-gray-400 mb-4 print-hide">
                    Haz clic en una fila para ver los detalles de los gallos. Todos los detalles se incluirán al imprimir.
                </p>

                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-amber-400 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-center">#</th>
                                <th scope="col" className="px-6 py-3">
                                    CUERDA
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    PUNTOS
                                </th>
                                <th scope="col" className="px-3 py-3 text-center">
                                    PG
                                </th>
                                <th scope="col" className="px-3 py-3 text-center">PE</th>
                                <th scope="col" className="px-3 py-3 text-center">PP</th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    TIEMPO
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                           {sortedStats.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">No hay datos de peleas para el día seleccionado.</td>
                                </tr>
                            )}
                           {sortedStats.map((stat, index) => {
                               const { minutes, seconds } = formatTime(stat.totalDurationSeconds);
                               const isExpanded = expandedCuerdas.includes(stat.cuerdaId);
                               const teamFights = peleas.filter(p => p.roosterA.cuerdaId === stat.cuerdaId || p.roosterB.cuerdaId === stat.cuerdaId);
                               
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
                                   <tr className={`results-details-row ${isExpanded ? '' : 'hidden print:table-row'}`}>
                                      <td colSpan={7} className="p-4 results-details-cell bg-gray-700/10">
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-amber-300">Detalles de Peleas para {stat.cuerdaName}:</h4>
                                            {teamFights.length > 0 ? teamFights.map(fight => {
                                                const thisTeamRooster = fight.roosterA.cuerdaId === stat.cuerdaId ? fight.roosterA : fight.roosterB;
                                                const opponentRooster = thisTeamRooster === fight.roosterA ? fight.roosterB : fight.roosterA;
                                                const fightTime = formatTime(fight.duration || 0);
                                                
                                                let result = 'Empate';
                                                if ((fight.winner === 'A' && thisTeamRooster === fight.roosterA) || (fight.winner === 'B' && thisTeamRooster === fight.roosterB)) {
                                                    result = 'Victoria';
                                                } else if (fight.winner !== 'DRAW') {
                                                    result = 'Derrota';
                                                }

                                                return (
                                                     <div key={fight.id} className="text-xs grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 p-2 border-b border-gray-600 last:border-b-0">
                                                        <div><span className="font-semibold text-gray-400">Gallo:</span> <span className="font-normal">{thisTeamRooster.color}</span></div>
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
                           )})}
                        </tbody>
                    </table>
                </div>
            </div>

             <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-4 sm:p-6 mt-8">
                <h3 className="text-xl font-bold text-amber-400 mb-4">Top 10 Gallos Más Rápidos - Día {viewingDay}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-amber-400 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-center">#</th>
                                <th scope="col" className="px-6 py-3">Gallo</th>
                                <th scope="col" className="px-6 py-3">Cuerda</th>
                                <th scope="col" className="px-4 py-3 text-center">Tiempo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fastestWinners.map((winner, index) => {
                                const { minutes, seconds } = formatTime(winner.duration);
                                return (
                                    <tr key={winner.rooster.id + '-' + index} className="border-b border-gray-700">
                                        <td className="px-4 py-3 font-bold text-center">{index + 1}</td>
                                        <td className="px-6 py-3 font-semibold text-white">{winner.rooster.color}</td>
                                        <td className="px-6 py-3">{getCuerdaName(winner.rooster.cuerdaId)}</td>
                                        <td className="px-4 py-3 text-center text-white font-semibold tracking-wider">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</td>
                                    </tr>
                                )
                            })}
                            {fastestWinners.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-4 text-gray-500">No hay peleas ganadas para mostrar.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8 print-hide">
                 <button onClick={onBack} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg text-lg">Volver a la Cartelera</button>
                <button onClick={onNewTournament} className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-3 px-8 rounded-lg text-lg">
                    Nuevo Torneo (Borrar Resultados)
                </button>
            </div>
        </div>
    );
};

export default ResultsScreen;