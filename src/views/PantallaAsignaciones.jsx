import React, { useState, useEffect } from 'react';
import { X, Edit, Trash2, Plus } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';
import iconoEliminar from '../assets/eliminar.svg';
import iconoEditar from '../assets/editar.svg';

export default function PantallaAsignaciones({ setVistaActual, setModalActual, claseActual, setAsignacionSeleccionada, actualizador }) {
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarAsignaciones = async () => {
    if (!claseActual?.id_clase) return;
    setCargando(true);

    // Se agregaron hora_limite y estado_cierre a la consulta para el cálculo exacto
    const { data, error } = await supabase
      .from('asignacion')
      .select('*, entrega(id_entrega, fecha_limite, hora_limite, estado_cierre)')
      .eq('id_clase', claseActual.id_clase)
      .eq('estado', 'Activa')
      .order('fecha_creacion', { ascending: false });

    if (!error && data) {
      setAsignaciones(data);
    }
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

  // Función segura para calcular la hora exacta en México sin bugs de zona horaria
  const esEntregaAbierta = (entrega) => {
    if (entrega.estado_cierre) return false;
    if (!entrega.fecha_limite) return true;

    const [year, month, day] = entrega.fecha_limite.split('-');
    const [hour, minute] = (entrega.hora_limite || '23:59').split(':');
    const fechaHoraLimite = new Date(year, month - 1, day, hour, minute);
    
    return new Date() <= fechaHoraLimite;
  };

  const formatearFecha = (fechaISO, horaIso) => {
    if (!fechaISO) return '';
    const [year, month, day] = fechaISO.split('-');
    const [hour, minute] = (horaIso || '23:59').split(':');
    const fecha = new Date(year, month - 1, day, hour, minute);
    
    return fecha.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
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
          <p className="text-center text-[18pt] text-gray-600 py-12">Sin asignaciones</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {asignaciones.map((tarea) => {
              
              const totalEntregas = tarea.entrega ? tarea.entrega.length : 0;
              
              // Usamos la nueva función segura
              const entregasAbiertas = (tarea.entrega || []).filter(esEntregaAbierta);

              // Ordenamos para mostrar la más próxima a vencer
              entregasAbiertas.sort((a, b) => {
                  const dateA = new Date(`${a.fecha_limite}T${a.hora_limite || '23:59'}`);
                  const dateB = new Date(`${b.fecha_limite}T${b.hora_limite || '23:59'}`);
                  return dateA - dateB;
              });

              let textoEntrega = 'Sin entregas abiertas';
              if (entregasAbiertas.length > 0) {
                 textoEntrega = `Próxima: ${formatearFecha(entregasAbiertas[0].fecha_limite, entregasAbiertas[0].hora_limite)}`;
              }

              return (
                <div
                  key={tarea.id_asignacion}
                  onClick={() => seleccionarAsignacion(tarea)}
                  className={`${theme.bgPrimario} text-white p-6 rounded-lg text-center flex flex-col justify-center items-center h-56 cursor-pointer relative shadow-lg hover:bg-blue-800 transition`}
                >
                  <h3 className={`font-bold text-[18pt] mb-1 ${theme.font}`}>{tarea.titulo}</h3>
                  <p className={`text-[13pt] text-blue-100 mb-2 line-clamp-2 ${theme.font}`}>{tarea.descripcion || 'Sin descripción'}</p>
                  
                  <div className="mt-2 bg-blue-900 bg-opacity-40 p-2 rounded w-full">
                    <p className={`text-[12pt] font-bold text-white ${theme.font}`}>Entregas totales: {totalEntregas}</p>
                    <p className={`text-[12pt] font-bold mt-1 ${entregasAbiertas.length > 0 ? 'text-green-300' : 'text-yellow-300'} ${theme.font}`}>
                      {textoEntrega}
                    </p>
                  </div>

                  <div className="absolute bottom-2 right-2 flex gap-3">
                    <button onClick={(e) => { e.stopPropagation(); abrirModal('EditarAsignacion', tarea); }} className="hover:text-blue-300 transition" title="Editar">
                      <img src={iconoEditar} alt="Editar" className="w-[22px] h-[22px]" style={{ filter: 'invert(100%)' }} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); abrirModal('EliminarAsignacion', tarea); }} className="hover:text-red-300 transition" title="Eliminar">
                      <img src={iconoEliminar} alt="Dar de baja" className="w-[22px] h-[22px]" style={{ filter: 'invert(100%)' }} />
                    </button>
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