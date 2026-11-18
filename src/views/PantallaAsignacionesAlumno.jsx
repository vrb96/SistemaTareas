import React from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { theme } from '../theme';

export default function PantallaAsignacionesAlumno({
  claseActual,
  asignaciones = [],
  onVolver,
  onSeleccionarAsignacion,
  cargando = false
}) {
  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* Barra Lateral */}
      <div className="w-1/5 border-r-2 border-gray-300 p-4 flex flex-col gap-4 bg-white">
        <button
          onClick={onVolver}
          className="text-xl font-bold mb-4 text-left hover:text-red-500"
          title="Cerrar vista"
        >
          <X size={30} />
        </button>
        <button
          className={`${theme.bgPrimario} ${theme.textPrimario} py-2 rounded text-[16pt] font-bold text-center ${theme.font}`}
        >
          Asignaciones
        </button>
      </div>

      {/* Área Principal */}
      <div className="w-4/5 p-8 overflow-y-auto">
        <div className="relative flex items-center justify-center border-b-2 border-gray-300 pb-4 mb-6">
          <button
            onClick={onVolver}
            className="absolute left-0 flex items-center gap-1 text-[#465d91] font-bold text-[16pt] hover:text-[#2e4578]"
          >
            <ChevronLeft size={24} /> Volver
          </button>
          <h1 className={`text-[28pt] font-bold ${theme.textSuperficie} ${theme.font}`}>
            {claseActual?.nombre || 'Nombre de la Clase'}
          </h1>
        </div>

        {cargando ? (
          <p className="text-center text-[16pt] text-gray-500">Cargando asignaciones...</p>
        ) : asignaciones.length === 0 ? (
          // C.U.9 FA_01: Mensaje cuando la clase no tiene asignaciones
          <div className="text-center py-16">
            <p className={`text-[20pt] text-gray-600 ${theme.font}`}>Sin asignaciones</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {asignaciones.map((asig) => (
              <div
                key={asig.id_asignacion}
                onClick={() => onSeleccionarAsignacion && onSeleccionarAsignacion(asig)}
                className="bg-[#465d91] text-white p-8 rounded-xl text-center shadow-md cursor-pointer hover:bg-[#2e4578] transition flex flex-col justify-center items-center min-h-[210px]"
              >
                <h3 className={`text-[18pt] font-bold mb-3 ${theme.font}`}>{asig.titulo}</h3>
                <p className={`text-[15pt] text-blue-100 line-clamp-3 ${theme.font}`}>
                  {asig.descripcion || 'Sin descripción'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}