import React, { useState, useEffect } from 'react';
import { X, Edit, Trash2, Plus } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';

export default function PantallaAsignaciones({ setVistaActual, setModalActual, claseActual, setAsignacionSeleccionada, actualizador }) {
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarAsignaciones = async () => {
    if (!claseActual?.id_clase) return;
    setCargando(true);

    // Consulta con conteo de entregas hijas
    const { data, error } = await supabase
      .from('asignacion')
      .select('*, entrega(id_entrega, fecha_limite)')
      .eq('id_clase', claseActual.id_clase)
      .eq('estado', 'Activa')
      .order('fecha_creacion', { ascending: false });

    if (!error && data) setAsignaciones(data);
    setCargando(false);
  };

  useEffect(() => {
    cargarAsignaciones();
  }, [claseActual, actualizador]);

  const abrirModal = (accion, asignacion = null) => {
    setAsignacionSeleccionada(asignacion);
    setModalActual(accion);
  };

  const seleccionarAsignacion = (tarea) => {
    setAsignacionSeleccionada(tarea);
    setVistaActual('PantallaEntregas');
  };

  return (
    <div className="flex h-[calc(100vh-73px)]">
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
                onClick={() => seleccionarAsignacion(tarea)}
                className={`${theme.bgPrimario} text-white p-6 rounded-lg text-center flex flex-col justify-center items-center h-52 cursor-pointer relative shadow-lg hover:bg-blue-800 transition`}
              >
                <h3 className={`font-bold text-[18pt] mb-1 ${theme.font}`}>{tarea.titulo}</h3>
                <p className={`text-[14pt] text-blue-100 mb-2 line-clamp-2 ${theme.font}`}>{tarea.descripcion || 'Sin descripción'}</p>
                <p className={`text-[13pt] text-blue-200 ${theme.font}`}>
                  Total de Entregas: {tarea.entrega ? tarea.entrega.length : 0}
                </p>

                <div className="absolute bottom-2 right-2 flex gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); abrirModal('EditarAsignacion', tarea); }}
                    className="hover:text-blue-300 transition"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); abrirModal('EliminarAsignacion', tarea); }}
                    className="hover:text-red-300 transition"
                  >
                    <Trash2 size={20} />
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