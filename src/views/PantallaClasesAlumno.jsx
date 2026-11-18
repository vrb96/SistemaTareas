import React from 'react';
import { theme } from '../theme';

export default function PantallaClasesAlumno({
  clases = [],
  onSeleccionarClase,
  cargando = false
}) {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center border-b-2 border-gray-300 pb-4 mb-8">
        <h1 className={`text-[28pt] font-bold ${theme.textSuperficie} ${theme.font}`}>
          Mis Clases
        </h1>
      </div>

      {cargando ? (
        <p className="text-center text-[16pt] text-gray-500">Cargando clases...</p>
      ) : clases.length === 0 ? (
        // C.U.9 Paso 1: Mensaje oficial cuando no hay inscripciones activas
        <div className="text-center py-16">
          <p className={`text-[20pt] text-gray-600 ${theme.font}`}>
            No estás inscrito en ninguna clase
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {clases.map((clase) => (
            <div
              key={clase.id_clase}
              onClick={() => onSeleccionarClase && onSeleccionarClase(clase)}
              className="bg-[#465d91] text-white p-8 rounded-xl text-center shadow-md cursor-pointer hover:bg-[#2e4578] transition flex flex-col justify-center items-center min-h-[210px]"
            >
              <h3 className={`text-[18pt] font-bold mb-2 ${theme.font}`}>{clase.nombre}</h3>
              <p className={`text-[15pt] ${theme.font}`}>
                {clase.clave} — Grupo {clase.grupo}
              </p>
              <p className={`text-[15pt] mt-1 ${theme.font}`}>{clase.periodo_escolar}</p>
              <p className={`text-[14pt] text-blue-100 mt-3 font-medium ${theme.font}`}>
                Prof. {clase.nombre_profesor}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}