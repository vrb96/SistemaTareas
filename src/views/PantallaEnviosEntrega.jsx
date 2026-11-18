import React from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { theme } from '../theme';

export default function PantallaEnviosEntrega({
  entregaActual,
  listaAlumnosEnvios = [], // [{ id_alumno, no_control, nombre_completo, estado_envio, fecha_hora_envio, calificacion, nombre_archivo }]
  onVolver,
  onSeleccionarAlumno
}) {
  const totalAlumnos = listaAlumnosEnvios.length;
  const totalEnviados = listaAlumnosEnvios.filter((a) => a.estado_envio === 'Enviado').length;

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* Barra Lateral */}
      <div className="w-1/5 border-r-2 border-gray-300 p-4 flex flex-col gap-4 bg-white">
        <button onClick={onVolver} className="text-xl font-bold mb-4 text-left hover:text-red-500">
          <X size={30} />
        </button>
        <button
          className={`${theme.bgPrimario} ${theme.textPrimario} py-2 rounded text-[16pt] font-bold text-center ${theme.font}`}
        >
          Entregas
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
            Entrega {entregaActual?.no_entrega || 1}
          </h1>
          <span
            className={`absolute right-0 text-[18pt] font-bold text-[#2e4578] bg-[#d9e2ff] px-4 py-1.5 rounded-lg ${theme.font}`}
          >
            Entregas: {totalEnviados} de {totalAlumnos}
          </span>
        </div>

        {totalAlumnos === 0 ? (
          <p className="text-center text-[18pt] text-gray-500 py-12">
            No hay alumnos con inscripción activa en esta clase.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {listaAlumnosEnvios.map((alumno) => {
              const esEnviado = alumno.estado_envio === 'Enviado';
              return (
                <div
                  key={alumno.id_alumno}
                  onClick={() => onSeleccionarAlumno && onSeleccionarAlumno(alumno)}
                  className="bg-[#465d91] text-white p-5 rounded-xl shadow flex justify-between items-center cursor-pointer hover:bg-[#2e4578] transition"
                >
                  <div>
                    <p className={`text-[16pt] font-bold ${theme.font}`}>
                      {alumno.nombre_completo} ({alumno.no_control})
                    </p>
                    <p className="text-[13pt] text-blue-100">
                      {esEnviado
                        ? `Enviado el: ${alumno.fecha_hora_envio}`
                        : 'Sin entrega registrada'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`text-[15pt] font-bold text-yellow-200 ${theme.font}`}>
                      {alumno.calificacion ?? 'Sin calificar'}
                    </p>
                    <span
                      className={`inline-block mt-1 px-3 py-0.5 rounded-full text-[12pt] font-bold ${
                        esEnviado
                          ? 'bg-green-200 text-green-900'
                          : 'bg-[#ffdad6] text-[#93000a]'
                      }`}
                    >
                      {alumno.estado_envio || 'Sin enviar'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}