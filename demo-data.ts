import { Gallo, Cuerda, TipoGallo, TipoEdad } from './types';

const OUNCES_PER_POUND = 16;
const fromLbsOz = (lbs: number, oz: number) => (lbs * OUNCES_PER_POUND) + oz;

export const DEMO_CUERDAS: Cuerda[] = [
    { id: 'demo-c1', name: 'Hacienda San José (F1)', owner: 'Juan Pérez', city: 'Medellín' },
    { id: 'demo-c1-f2', name: 'Hacienda San José (F2)', owner: 'Juan Pérez', city: 'Medellín', baseCuerdaId: 'demo-c1' },
    { id: 'demo-c2', name: 'Criadero El Triunfo (F1)', owner: 'Carlos Ruiz', city: 'Cali' },
    { id: 'demo-c2-f2', name: 'Criadero El Triunfo (F2)', owner: 'Carlos Ruiz', city: 'Cali', baseCuerdaId: 'demo-c2' },
    { id: 'demo-c3', name: 'Cuerda Los Compadres (F1)', owner: 'Roberto Gómez', city: 'Pereira' },
    { id: 'demo-c4', name: 'Gallera La Herradura (F1)', owner: 'Luis Martínez', city: 'Bogotá' },
    { id: 'demo-c4-f2', name: 'Gallera La Herradura (F2)', owner: 'Luis Martínez', city: 'Bogotá', baseCuerdaId: 'demo-c4' },
    { id: 'demo-c5', name: 'Criadero El Diamante (F1)', owner: 'Andrés López', city: 'Bucaramanga' },
    { id: 'demo-c6', name: 'Cuerda Los Galleros (F1)', owner: 'Miguel Ángel', city: 'Manizales' },
    { id: 'demo-c7', name: 'Hacienda La Victoria (F1)', owner: 'Jorge Iván', city: 'Ibagué' },
    { id: 'demo-c8', name: 'Criadero El Fénix (F1)', owner: 'Felipe Marín', city: 'Armenia' },
    { id: 'demo-c9', name: 'Cuerda Los Amigos (F1)', owner: 'Ricardo Soto', city: 'Montería' },
    { id: 'demo-c10', name: 'Gallera El Palacio (F1)', owner: 'Oscar Duarte', city: 'Sincelejo' }
];

const COLORS = ['Giro', 'Colorado', 'Cenizo', 'Jabao', 'Marañón', 'Canelo', 'Blanco', 'Pintado'];
const TYPES = [TipoGallo.LISO, TipoGallo.PAVA];

export const DEMO_GALLOS: Gallo[] = Array.from({ length: 100 }, (_, i) => {
    const randomCuerda = DEMO_CUERDAS[Math.floor(Math.random() * DEMO_CUERDAS.length)];
    const weightLbs = 3 + Math.floor(Math.random() * 2); // 3-4 lbs
    const weightOz = Math.floor(Math.random() * 16);
    const ageMonths = 8 + Math.floor(Math.random() * 16); // 8-24 months
    const marca = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12][Math.floor(Math.random() * 12)];

    return {
        id: `demo-gallo-${i}`,
        ringId: `R-${1000 + i}`,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        cuerdaId: randomCuerda.id,
        weight: fromLbsOz(weightLbs, weightOz),
        ageMonths: ageMonths,
        markingId: `M-${2000 + i}`,
        breederPlateId: `PC-${3000 + i}`,
        tipoGallo: TYPES[Math.floor(Math.random() * TYPES.length)],
        tipoEdad: ageMonths < 12 ? TipoEdad.POLLO : TipoEdad.GALLO,
        marca: marca
    };
});
