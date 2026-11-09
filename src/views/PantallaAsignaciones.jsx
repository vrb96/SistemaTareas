import React, { useState, useEffect } from 'react';
import { X, Edit, Trash2, Plus, Calendar, Clock } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';

export default function PantallaAsignaciones({ setVistaActual, setModalActual, claseActual, setAsignacionSeleccionada }) {
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarAsignaciones = async () => {
    if (!claseActual?.id_clase) return;
    setCargando(true);

    const { data, error } = await supabase
      .from('asignacion')
      .select('*')
      .eq('id_clase', claseActual.id_clase)
      .eq('estado', 'Activa')
      .order('fecha_creacion', { ascending: false });

    if (!error && data) setAsignaciones(data);
    setCargando(false);
  };

  useEffect(() => {
    cargarAsignaciones();
  }, [claseActual]);

  const abrirModal = (accion, asignacion = null) => {
    setAsignacionSeleccionada(asignacion);
    setModalActual(accion);
  };

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* Barra lateral */}
      <div className="w-1/5 border-r-2 border-gray-300 p-4 flex flex-col gap-4 bg-white">
        <button onClick={() => setVistaActual('PantallaPrincipal')} className="text-xl font-bold mb-4 text-left hover:text-red-500">
          <X size={30} />
        </button>
        <button onClick={() => setVistaActual('PantallaClase')} className={`bg-gray-400 text-white py-2 rounded text-[16pt] font-bold text-center hover:bg-[#465d91] transition ${theme.font}`}>
          Alumno
        </button>
        <button className={`${theme.bgPrimario} ${theme.textPrimario} py-2 rounded text-[16pt] font-bold text-center ${theme.font}`}>
          Asignaciones
        </button>
      </div>

      {/* Contenido principal */}
      <div className="w-4/5 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 border-b-2 border-gray-200 pb-4">
          <h1 className={`text-[28pt] font-bold ${theme.textSuperficie} ${theme.font}`}>
            {claseActual?.nombre || 'Clase'} - Asignaciones
          </h1>
          <button
            onClick={() => abrirModal('CrearAsignacion')}
            className={`${theme.bgPrimario} ${theme.textPrimario} px-5 py-2.5 rounded font-bold text-[16pt] hover:bg-blue-800 transition flex items-center gap-2 ${theme.font}`}
          >
            <Plus size={24} /> Crear Asignación
          </button>
        </div>

        {cargando ? (
          <p className="text-center text-[16pt] text-gray-500">Cargando tareas...</p>
        ) : asignaciones.length === 0 ? (
          <p className="text-center text-[18pt] text-gray-600 py-12">No hay asignaciones creadas en esta materia.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {asignaciones.map((tarea) => (
              <div
                key={tarea.id_asignacion}
                className={`${theme.bgContenedor} p-6 rounded-lg shadow-md border border-gray-300 relative flex flex-col justify-between min-h-[220px]`}
              >
                <div>
                  <h3 className={`text-[20pt] font-bold mb-2 pr-16 ${theme.textContenedor} ${theme.font}`}>
                    {tarea.titulo}
                  </h3>
                  <p className={`text-[14pt] text-gray-700 mb-4 whitespace-pre-line ${theme.font}`}>
                    {tarea.descripcion || 'Sin descripción'}
                  </p>
                </div>

                <div className="border-t border-gray-300 pt-3 flex flex-col gap-1 text-[13pt] text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-[#465d91]" />
                    <span>Límite: {tarea.fecha_limite || 'Sin fecha asignada'}</span>
                  </div>
                  {tarea.hora_limite && (
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-[#465d91]" />
                      <span>Hora: {tarea.hora_limite.slice(0, 5)} hrs</span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="absolute top-4 right-4 flex gap-3">
                  <button onClick={() => abrirModal('EditarAsignacion', tarea)} className="text-blue-600 hover:scale-110 transition">
                    <Edit size={22} />
                  </button>
                  <button onClick={() => abrirModal('EliminarAsignacion', tarea)} className="text-red-600 hover:scale-110 transition">
                    <Trash2 size={22} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}