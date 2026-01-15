



export enum Screen {
  SETUP,
  MATCHMAKING,
  LIVE_FIGHT,
  RESULTS,
  TOURNAMENT_RESULTS,
}

export enum TipoGallo {
  LISO = 'Liso',
  PAVA = 'pava',
}

export enum TipoEdad {
  POLLO = 'Pollo',
  GALLO = 'Gallo',
}


export interface Cuerda {
  id: string;
  name: string;
  owner: string;
  city?: string;
  baseCuerdaId?: string; // ID of the original Cuerda. If it's a front.
}

export interface Gallo {
  id:string;
  ringId: string;
  color: string;
  cuerdaId: string;
  weight: number; // Stored as total ounces
  ageMonths: number;
  markingId: string;
  breederPlateId: string; // Placa del Criadero (Pc)
  tipoGallo: TipoGallo;
  tipoEdad: TipoEdad;
  marca: number;
}

export interface Pelea {
  id: string;
  fightNumber: number;
  roosterA: Gallo;
  roosterB: Gallo;
  winner: 'A' | 'B' | 'DRAW' | null;
  duration: number | null; // in seconds
}

export interface Torneo {
  name: string;
  tournamentManager?: string;
  date: string;
  weightTolerance: number; // in total ounces
  ageToleranceMonths: number;
  minWeight: number; // in total ounces
  maxWeight: number; // in total ounces
  roostersPerTeam: number;
  pointsForWin: number;
  pointsForDraw: number;
  tournamentDays: number;
  exceptions: Array<{ cuerda1Id: string; cuerda2Id: string; }>;
}

export type CuerdaStats = {
  cuerdaId: string;
  cuerdaName: string;
  wins: number;
  draws: number;
  losses: number;
  fronts: number;
  totalDurationSeconds: number;
  points: number;
};

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface MatchmakingResults {
    mainFights: Pelea[];
    individualFights: Pelea[];
    unpairedRoosters: Gallo[];
    stats: {
        contribution: number;
        rounds: number;
        mainTournamentRoostersCount: number;
    };
}

export interface DailyResult {
  day: number;
  peleas: Pelea[];
}