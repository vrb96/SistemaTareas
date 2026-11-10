import React, { useState, useEffect } from 'react';
import { X, Edit, Trash2, Plus } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';

export default function PantallaEntregas({ 
  setVistaActual, 
  setModalActual, 
  asignacionActual, 
  setEntregaSeleccionada,
  setEntregasPadre,
  actualizador 
}) {
  const [entregas, setEntregas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Consulta cronológica de las fases de entrega asociadas a la tarea
  const cargarEntregas = async () => {
    if (!asignacionActual?.id_asignacion) return;
    setCargando(true);

    const { data, error } = await supabase
      .from('entrega')
      .select('*')
      .eq('id_asignacion', asignacionActual.id_asignacion)
      .order('fecha_limite', { ascending: true });

    if (!error && data) {
      setEntregas(data);
      if (setEntregasPadre) setEntregasPadre(data);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarEntregas();
  }, [asignacionActual, actualizador]);

  const abrirModal = (accion, entrega = null) => {
    if (setEntregaSeleccionada) setEntregaSeleccionada(entrega);
    setModalActual(accion);
  };

  // RF020: Verifica si la entrega rebasó la fecha y hora de corte
  const estaCerrada = (entrega) => {
    if (entrega.estado_cierre) return true;
    const fechaCorte = entrega.fecha_cierre || entrega.fecha_limite;
    const horaCorte = entrega.hora_cierre || entrega.hora_limite || '23:59:00';
    const fechaHoraLimite = new Date(`${fechaCorte}T${horaCorte}`);
    return new Date() > fechaHoraLimite;
  };

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* Menú lateral */}
      <div className="w-1/5 border-r-2 border-gray-300 p-4 flex flex-col gap-4 bg-white">
        <button 
          onClick={() => setVistaActual('PantallaAsignaciones')} 
          className="text-xl font-bold mb-4 text-left hover:text-red-500"
        >
          <X size={30} />
        </button>
        <button className={`${theme.bgPrimario} ${theme.textPrimario} py-2 rounded text-[16pt] font-bold text-center ${theme.font}`}>
          Entregas
        </button>
      </div>

      {/* Contenido principal */}
      <div className="w-4/5 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 border-b-2 border-gray-300 pb-4 relative">
          <h1 className={`text-[28pt] font-bold text-center w-full ${theme.textSuperficie} ${theme.font}`}>
            {asignacionActual?.titulo || 'Asignación'}
          </h1>
          <button
            onClick={() => abrirModal('CrearEntrega')}
            className={`${theme.bgPrimario} ${theme.textPrimario} px-4 py-2 rounded font-bold text-[16pt] absolute right-0 hover:bg-blue-800 transition flex items-center gap-2 ${theme.font}`}
          >
            <Plus size={22} /> Crear Entrega
          </button>
        </div>

        {cargando ? (
          <p className="text-center text-[16pt] text-gray-500">Cargando entregas...</p>
        ) : entregas.length === 0 ? (
          <p className="text-center text-[18pt] text-gray-600 py-12">
            No hay fases de entrega registradas para esta tarea.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {entregas.map((entrega, index) => {
              const esUltima = index === entregas.length - 1;
              const cerrada = estaCerrada(entrega);

              return (
                <div
                  key={entrega.id_entrega}
                  className={`${theme.bgPrimario} text-white p-5 rounded-lg flex justify-between items-center shadow`}
                >
                  {/* Columna Izquierda: Nombre, Estado e Instrucciones */}
                  <div className="w-1/3">
                    <div className="flex items-center gap-3">
                      <span className={`text-[17pt] font-bold block ${theme.font}`}>
                        {entrega.numero_entrega}
                      </span>
                      <span className={`text-[10pt] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        cerrada ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                      }`}>
                        {cerrada ? 'Cerrada' : 'Abierta'}
                      </span>
                    </div>
                    <span className="text-[12pt] text-blue-200 block mt-1 line-clamp-2">
                      {entrega.instrucciones || 'Sin instrucciones adicionales'}
                    </span>
                  </div>

                  {/* Columna Central: Fecha Límite Alumno y Fecha de Cierre Docente */}
                  <div className="text-center w-1/3">
                    <div className="mb-1">
                      <span className="text-[10pt] text-blue-200 block uppercase tracking-wider">
                        Límite Alumno
                      </span>
                      <span className={`text-[15pt] font-semibold ${theme.font}`}>
                        {entrega.fecha_limite} — {entrega.hora_limite?.slice(0, 5)} hrs
                      </span>
                    </div>

                    {entrega.fecha_cierre && (
                      <div>
                        <span className="text-[10pt] text-yellow-300 block uppercase tracking-wider font-bold">
                          Cierre Definitivo (Docente)
                        </span>
                        <span className={`text-[13pt] text-yellow-100 font-medium ${theme.font}`}>
                          {entrega.fecha_cierre} — {entrega.hora_cierre?.slice(0, 5)} hrs
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Columna Derecha: Acciones (RF019 Bloqueo de eliminación intermedia) */}
                  <div className="flex items-center gap-6">
                    <div className="flex gap-4">
                      <button 
                        onClick={() => abrirModal('EditarEntrega', entrega)} 
                        className="hover:text-blue-300 transition"
                        title="Editar entrega"
                      >
                        <Edit size={24} />
                      </button>

                      {esUltima ? (
                        <button 
                          onClick={() => abrirModal('EliminarEntrega', entrega)} 
                          className="hover:text-red-300 transition"
                          title="Eliminar entrega (última fase registrada)"
                        >
                          <Trash2 size={24} />
                        </button>
                      ) : (
                        <button 
                          disabled
                          className="opacity-30 cursor-not-allowed text-gray-300"
                          title="Solo se puede eliminar la última entrega registrada"
                        >
                          <Trash2 size={24} />
                        </button>
                      )}
                    </div>
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