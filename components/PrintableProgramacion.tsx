import React from 'react';
import { Pelea, Cuerda } from '../types';

const OUNCES_PER_POUND = 16;
const formatWeightRaw = (totalOunces: number): string => {
    const total = Math.round(totalOunces);
    const lbs = Math.floor(total / OUNCES_PER_POUND);
    const oz = total % OUNCES_PER_POUND;
    return `${lbs}.${String(oz).padStart(2, '0')}`;
};

interface PrintableProgramacionProps {
    peleas: Pelea[];
    cuerdas: Cuerda[];
    torneoName: string;
    date: string;
    day?: number;
}

const PrintableProgramacion: React.FC<PrintableProgramacionProps> = ({ peleas, cuerdas, torneoName, date, day }) => {
    const getCuerdaNameOnly = (id: string) => {
        const full = cuerdas.find(p => p.id === id)?.name || 'Desconocido';
        return full.replace(/\s\(F\d+\)$/, '').trim();
    };

    return (
        <div className="printable-programacion-container">
            <div className="header-print">
                <h1>{torneoName}</h1>
                <p>PROGRAMACIÓN DE PELEAS {day ? `- DÍA ${day}` : ''} | FECHA: {date}</p>
            </div>
            <table className="programacion-table">
                <thead>
                    <tr>
                        <th style={{ width: '25px' }} rowSpan={2}>N°</th>
                        <th colSpan={8}>LADO ROJO (GALLO A)</th>
                        <th style={{ width: '25px' }} rowSpan={2}>VS</th>
                        <th colSpan={8}>LADO AZUL (GALLO B)</th>
                    </tr>
                    <tr>
                        {/* Red Side */}
                        <th style={{ width: '90px' }}>Cuerda</th>
                        <th style={{ width: '45px' }}>Anillo(A)</th>
                        <th style={{ width: '45px' }}>Placa(Pm)</th>
                        <th style={{ width: '45px' }}>Placa(Pc)</th>
                        <th style={{ width: '55px' }}>Color</th>
                        <th style={{ width: '55px' }}>Fenotipo</th>
                        <th style={{ width: '45px' }}>Tipo</th>
                        <th style={{ width: '45px' }}>Peso</th>
                        
                        {/* Blue Side */}
                        <th style={{ width: '90px' }}>Cuerda</th>
                        <th style={{ width: '45px' }}>Anillo(A)</th>
                        <th style={{ width: '45px' }}>Placa(Pm)</th>
                        <th style={{ width: '45px' }}>Placa(Pc)</th>
                        <th style={{ width: '55px' }}>Color</th>
                        <th style={{ width: '55px' }}>Fenotipo</th>
                        <th style={{ width: '45px' }}>Tipo</th>
                        <th style={{ width: '45px' }}>Peso</th>
                    </tr>
                </thead>
                <tbody>
                    {peleas.map((pelea) => (
                        <tr key={pelea.id}>
                            <td style={{ fontWeight: 'bold' }}>{pelea.fightNumber}</td>
                            
                            {/* ROJO */}
                            <td style={{ textAlign: 'left', paddingLeft: '4px' }}>{getCuerdaNameOnly(pelea.roosterA.cuerdaId)}</td>
                            <td>{pelea.roosterA.ringId}</td>
                            <td>{pelea.roosterA.markingId}</td>
                            <td>{pelea.roosterA.breederPlateId}</td>
                            <td>{pelea.roosterA.color}</td>
                            <td>{pelea.roosterA.tipoGallo}</td>
                            <td>{pelea.roosterA.tipoEdad}</td>
                            <td style={{ fontFamily: 'monospace' }}>{formatWeightRaw(pelea.roosterA.weight)}</td>
                            
                            <td style={{ fontWeight: 'bold' }}>VS</td>
                            
                            {/* AZUL */}
                            <td style={{ textAlign: 'left', paddingLeft: '4px' }}>{getCuerdaNameOnly(pelea.roosterB.cuerdaId)}</td>
                            <td>{pelea.roosterB.ringId}</td>
                            <td>{pelea.roosterB.markingId}</td>
                            <td>{pelea.roosterB.breederPlateId}</td>
                            <td>{pelea.roosterB.color}</td>
                            <td>{pelea.roosterB.tipoGallo}</td>
                            <td>{pelea.roosterB.tipoEdad}</td>
                            <td style={{ fontFamily: 'monospace' }}>{formatWeightRaw(pelea.roosterB.weight)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PrintableProgramacion;