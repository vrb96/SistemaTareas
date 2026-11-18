import React from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { theme } from '../theme';

export default function PantallaDetalleAsignacionAlumno({
  asignacionActual,
  entregas = [],
  equipo = null, // { nombre: 'Equipo 1', integrantes: ['Ana Pérez', 'Luis Gómez'] } o null
  onVolver,
  onSeleccionarEntrega
}) {
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
          Asignaciones
        </button>
      </div>

      {/* Área Principal */}
      <div className="w-4/5 p-8 overflow-y-auto">
        <div className="relative flex items-center justify-center border-b-2 border-gray-300 pb-4 mb-4">
          <button
            onClick={onVolver}
            className="absolute left-0 flex items-center gap-1 text-[#465d91] font-bold text-[16pt] hover:text-[#2e4578]"
          >
            <ChevronLeft size={24} /> Volver
          </button>
          <h1 className={`text-[28pt] font-bold ${theme.textSuperficie} ${theme.font}`}>
            {asignacionActual?.titulo || 'Nombre de la asignación'}
          </h1>
        </div>

        {asignacionActual?.descripcion && (
          <p className={`text-[15pt] text-gray-700 mb-6 ${theme.font}`}>
            {asignacionActual.descripcion}
          </p>
        )}

        <div className="flex gap-8 items-start">
          {/* Columna Izquierda: Lista de Entregas */}
          <div className="w-3/4">
            <h2 className={`text-[22pt] font-bold text-[#2e4578] mb-4 ${theme.font}`}>Entregas</h2>

            {entregas.length === 0 ? (
              <p className="text-[16pt] text-gray-500">No hay entregas programadas aún.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {entregas.map((entrega) => {
                  const esEnviado = entrega.estado_envio === 'Enviado';
                  const esCerrada = entrega.estado_cierre === 'Cerrada';

                  return (
                    <div
                      key={entrega.id_entrega}
                      onClick={() => onSeleccionarEntrega && onSeleccionarEntrega(entrega)}
                      className="bg-[#465d91] text-white p-5 rounded-xl shadow flex justify-between items-center cursor-pointer hover:bg-[#2e4578] transition"
                    >
                      {/* Número de entrega */}
                      <div className="bg-[#d9e2ff] text-[#2e4578] font-bold text-[18pt] w-16 h-16 rounded-lg flex items-center justify-center shrink-0">
                        {entrega.no_entrega}
                      </div>

                      {/* Instrucciones */}
                      <div className="flex-1 mx-5 border border-blue-300 rounded-lg p-3 min-h-[70px]">
                        <p className={`text-[14pt] text-white ${theme.font}`}>
                          {entrega.instrucciones || 'Sin instrucciones adicionales'}
                        </p>
                      </div>

                      {/* Estado, fechas y calificación */}
                      <div className="text-right min-w-[230px]">
                        <div className="flex justify-end gap-2 mb-1">
                          <span
                            className={`px-3 py-0.5 rounded-full text-[12pt] font-bold ${
                              esCerrada ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-[#d9e2ff] text-[#2e4578]'
                            }`}
                          >
                            {entrega.estado_cierre || 'Abierta'}
                          </span>
                          <span
                            className={`px-3 py-0.5 rounded-full text-[12pt] font-bold ${
                              esEnviado ? 'bg-green-200 text-green-900' : 'bg-yellow-100 text-yellow-900'
                            }`}
                          >
                            {entrega.estado_envio || 'Sin enviar'}
                          </span>
                        </div>

                        <p className={`text-[13pt] font-semibold ${theme.font}`}>
                          Límite: {entrega.fecha_hora_limite}
                        </p>

                        {esEnviado && (
                          <p className="text-[12pt] text-blue-100">
                            Enviado: {entrega.fecha_hora_envio} ({entrega.nombre_archivo})
                          </p>
                        )}

                        <p className="text-[13pt] font-bold text-yellow-200 mt-1">
                          Calificación: {entrega.calificacion ?? 'Sin calificar'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columna Derecha: Equipo de la asignación (C.U.10 Paso 1) */}
          <div className="w-1/4">
            <h2 className={`text-[22pt] font-bold text-[#2e4578] mb-4 ${theme.font}`}>
              Equipo de la asignación
            </h2>
            <div className="bg-[#465d91] text-white p-6 rounded-xl shadow min-h-[160px] flex flex-col justify-center">
              {equipo ? (
                <>
                  <h3 className={`text-[16pt] font-bold mb-3 text-center border-b border-blue-300 pb-2 ${theme.font}`}>
                    {equipo.nombre}
                  </h3>
                  <ul className="space-y-2 text-[14pt]">
                    {equipo.integrantes.map((integrante, idx) => (
                      <li key={idx} className="text-center">
                        {integrante}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className={`text-[16pt] text-center font-semibold ${theme.font}`}>Sin equipo</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}