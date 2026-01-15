import React, { useState, useEffect, useRef } from 'react';
import { Pelea, Torneo, Cuerda, Gallo } from '../types';

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
    return `${lbs}.${String(oz).padStart(2, '0')}`;
};

// --- SCREEN ---
interface LiveFightScreenProps {
  peleas: Pelea[]; // This will be the list of UNFINISHED fights
  onFinishFight: (fightId: string, winner: 'A' | 'B' | 'DRAW', duration: number) => void;
  onFinishTournament: () => void;
  onBack: () => void;
  totalFightsInPhase: number;
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const LiveFightScreen: React.FC<LiveFightScreenProps> = ({ peleas, onFinishFight, onFinishTournament, onBack, totalFightsInPhase, addNotification }) => {
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const minutesRef = useRef<HTMLInputElement>(null);
  const secondsRef = useRef<HTMLInputElement>(null);
  
  const currentFight = peleas[0];
  
  const [cuerdas, setCuerdas] = useState<Cuerda[]>([]);
  const [torneo, setTorneo] = useState<Torneo|null>(null);

  useEffect(() => {
    const savedCuerdas = localStorage.getItem('galleraPro_cuerdas');
    const savedTorneo = localStorage.getItem('galleraPro_torneo');
    if (savedCuerdas) setCuerdas(JSON.parse(savedCuerdas));
    if (savedTorneo) setTorneo(JSON.parse(savedTorneo));
  }, []);

  useEffect(() => {
    // Reset timer for new fight and focus
    if (currentFight) {
      setMinutes('');
      setSeconds('');
      minutesRef.current?.focus();
    }
  }, [currentFight]);

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setMinutes(value);
    if (value.length === 2) {
      secondsRef.current?.focus();
      secondsRef.current?.select();
    }
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setSeconds(value);
  };

  const handleTimeBlur = (
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    maxValue?: number
  ) => {
    if (value === '') {
      return; // Keep it empty if the user leaves it empty
    }
    let numValue = parseInt(value, 10) || 0;
    if (maxValue !== undefined && numValue > maxValue) {
      numValue = maxValue;
    }
    setValue(String(numValue).padStart(2, '0'));
  };

  const getCuerdaName = (id: string) => cuerdas.find(p => p.id === id)?.name || 'Desconocido';

  const handleFinishFight = (winner: 'A' | 'B' | 'DRAW') => {
    if (!currentFight) return;
    
    if (winner === 'DRAW') {
        const duration = 8 * 60; // 8 minutes in seconds
        onFinishFight(currentFight.id, winner, duration);
    } else {
        const minNum = parseInt(minutes, 10) || 0;
        const secNum = parseInt(seconds, 10) || 0;
        const duration = (minNum * 60) + Math.min(secNum, 59);
        
        if (duration === 0) {
            addNotification('Debes introducir un tiempo de pelea para declarar un ganador.', 'error');
            return;
        }
        onFinishFight(currentFight.id, winner, duration);
    }
  };
  
  if (!currentFight || !torneo) {
    return (
        <div className="text-center p-8">
             <h2 className="text-3xl font-bold text-white">Cargando siguiente pelea...</h2>
             <p className="text-gray-400 mt-2">Si la carga se congela, no hay más peleas en esta fase.</p>
        </div>
    )
  }
  
  const finishedFightsCount = totalFightsInPhase - peleas.length;

  const formatRoosterDetails = (rooster: Gallo) => {
      return `${formatWeightLbsOz(rooster.weight)} Lb.Oz / ${rooster.ageMonths}m / ${rooster.tipoGallo}`
  }
  
  const formatRoosterExtraDetails = (rooster: Gallo) => {
    return `A:${rooster.ringId} Pm:${rooster.markingId} Pc:${rooster.breederPlateId} Marca:${rooster.marca}`;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-white p-4">
      {/* Top Title Section */}
      <div className="text-center mb-8">
        <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-amber-400">Pelea #{currentFight.fightNumber}</h2>
        <p className="text-lg md:text-xl text-gray-400 mt-2">Pelea {finishedFightsCount + 1} de {totalFightsInPhase}</p>
      </div>

      {/* Main Fight Display */}
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-4 md:gap-8 mb-8">
        
        {/* Rooster A Panel (Left) */}
        <div className="bg-blue-900/30 border-2 border-blue-600 rounded-2xl p-6 text-center md:text-right flex flex-col items-center md:items-end justify-center shadow-lg transform hover:scale-[1.02] transition-transform duration-300 space-y-2">
            <p className="text-4xl md:text-5xl lg:text-6xl text-amber-400 font-bold break-words">{getCuerdaName(currentFight.roosterA.cuerdaId)}</p>
            <h3 className="text-2xl lg:text-3xl font-semibold text-white">{currentFight.roosterA.color}</h3>
            <p className="text-xl lg:text-2xl text-gray-300 font-mono">{formatRoosterDetails(currentFight.roosterA)}</p>
            <p className="text-xs text-gray-400 font-mono">{formatRoosterExtraDetails(currentFight.roosterA)}</p>
        </div>
        
        {/* VS Separator */}
        <div className="flex items-center justify-center">
            <span className="text-6xl md:text-8xl font-black text-red-500 transform -rotate-6">VS</span>
        </div>

        {/* Rooster B Panel (Right) */}
         <div className="bg-red-900/30 border-2 border-red-600 rounded-2xl p-6 text-center md:text-left flex flex-col items-center md:items-start justify-center shadow-lg transform hover:scale-[1.02] transition-transform duration-300 space-y-2">
            <p className="text-4xl md:text-5xl lg:text-6xl text-amber-400 font-bold break-words">{getCuerdaName(currentFight.roosterB.cuerdaId)}</p>
            <h3 className="text-2xl lg:text-3xl font-semibold text-white">{currentFight.roosterB.color}</h3>
            <p className="text-xl lg:text-2xl text-gray-300 font-mono">{formatRoosterDetails(currentFight.roosterB)}</p>
            <p className="text-xs text-gray-400 font-mono">{formatRoosterExtraDetails(currentFight.roosterB)}</p>
        </div>
      </div>

       {/* Timer & Action Section */}
      <div className="w-full max-w-4xl flex flex-col items-center gap-6">
        {/* Timer */}
        <div className="text-center space-y-2">
            <p className="text-xl font-semibold text-gray-300">Duración de la Pelea</p>
             <div className="flex justify-center items-center space-x-2">
                <input 
                    ref={minutesRef}
                    type="text" 
                    inputMode="numeric"
                    value={minutes}
                    onChange={handleMinutesChange}
                    onBlur={() => handleTimeBlur(minutes, setMinutes)}
                    className="w-24 md:w-28 bg-gray-900/50 border-2 border-gray-600 text-white text-6xl md:text-7xl font-mono text-center rounded-lg p-2 focus:ring-2 focus:ring-amber-500 outline-none"
                    aria-label="Minutos"
                    placeholder="00"
                />
                 <span className="text-6xl md:text-7xl font-mono text-gray-600 pb-2">:</span>
                 <input 
                    ref={secondsRef}
                    type="text" 
                    inputMode="numeric"
                    value={seconds}
                    onChange={handleSecondsChange}
                    onBlur={() => handleTimeBlur(seconds, setSeconds, 59)}
                    className="w-24 md:w-28 bg-gray-900/50 border-2 border-gray-600 text-white text-6xl md:text-7xl font-mono text-center rounded-lg p-2 focus:ring-2 focus:ring-amber-500 outline-none"
                    aria-label="Segundos"
                    placeholder="00"
                />
            </div>
             <div className="flex justify-center items-center space-x-2 w-full pt-1">
                <span className="text-xs text-gray-500 uppercase tracking-widest w-24 md:w-28 text-center">MIN</span>
                <span className="w-4"></span>
                <span className="text-xs text-gray-500 uppercase tracking-widest w-24 md:w-28 text-center">SEG</span>
            </div>
        </div>

        {/* Win/Draw Buttons */}
        <div className="w-full flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
           <button onClick={() => handleFinishFight('A')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 text-xl rounded-lg w-full sm:w-auto transform hover:scale-105 transition-transform duration-200">Gana {getCuerdaName(currentFight.roosterA.cuerdaId)}</button>
           <button onClick={() => handleFinishFight('DRAW')} className="bg-gray-500 hover:bg-gray-400 text-white font-bold py-3 px-6 text-lg rounded-lg w-full sm:w-auto">Empate</button>
           <button onClick={() => handleFinishFight('B')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 text-xl rounded-lg w-full sm:w-auto transform hover:scale-105 transition-transform duration-200">Gana {getCuerdaName(currentFight.roosterB.cuerdaId)}</button>
        </div>
      </div>

       <div className="text-center mt-12 print-hide flex justify-center items-center space-x-4">
            <button onClick={onBack} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg">Atrás</button>
            <button onClick={onFinishTournament} className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-6 rounded-lg">Terminar Torneo Anticipadamente</button>
        </div>
    </div>
  );
};

export default LiveFightScreen;