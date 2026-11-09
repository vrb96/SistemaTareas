import React, { useState, useEffect } from 'react';
import { X, Edit, Trash2, Plus } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';

export default function PantallaEntregas({ setVistaActual, setModalActual, asignacionActual, setEntregaSeleccionada }) {
  const [entregas, setEntregas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarEntregas = async () => {
    if (!asignacionActual?.id_asignacion) return;
    setCargando(true);

    const { data, error } = await supabase
      .from('entrega')
      .select('*')
      .eq('id_asignacion', asignacionActual.id_asignacion)
      .order('fecha_limite', { ascending: true });

    if (!error && data) setEntregas(data);
    setCargando(false);
  };

  useEffect(() => {
    cargarEntregas();
  }, [asignacionActual]);

  const abrirModal = (accion, entrega = null) => {setEntregaSeleccionada(entrega);
  setModalActual(accion);
};

  return (
    <div className="flex h-[calc(100vh-73px)]">
      <div className="w-1/5 border-r-2 border-gray-300 p-4 flex flex-col gap-4 bg-white">
        <button onClick={() => setVistaActual('PantallaAsignaciones')} className="text-xl font-bold mb-4 text-left hover:text-red-500">
          <X size={30} />
        </button>
        <button className={`${theme.bgPrimario} ${theme.textPrimario} py-2 rounded text-[16pt] font-bold text-center ${theme.font}`}>
          Entregas
        </button>
      </div>

      <div className="w-4/5 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 border-b-2 border-gray-300 pb-4">
          <h1 className={`text-[28pt] font-bold text-center w-full ${theme.textSuperficie} ${theme.font}`}>
            {asignacionActual?.titulo || 'Asignación'}
          </h1>
          <button
            onClick={() => abrirModal('CrearEntrega')}
            className={`${theme.bgPrimario} ${theme.textPrimario} px-4 py-2 rounded font-bold text-[16pt] absolute right-8 hover:bg-blue-800 transition flex items-center gap-2 ${theme.font}`}
          >
            <Plus size={22} /> Crear Entrega
          </button>
        </div>

        {cargando ? (
          <p className="text-center text-[16pt] text-gray-500">Cargando entregas...</p>
        ) : entregas.length === 0 ? (
          <p className="text-center text-[18pt] text-gray-600 py-12">No hay fases de entrega registradas para esta tarea.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {entregas.map((entrega) => (
              <div
                key={entrega.id_entrega}
                className={`${theme.bgPrimario} text-white p-5 rounded-lg flex justify-between items-center shadow`}
              >
                <div className="w-1/3">
                  <span className={`text-[16pt] font-bold block ${theme.font}`}>{entrega.numero_entrega}</span>
                  <span className="text-[12pt] text-blue-200">{entrega.instrucciones || 'Sin instrucciones adicionales'}</span>
                </div>
                <div className="text-center w-1/3">
                  <span className="text-[13pt] text-blue-200 block">Límite:</span>
                  <span className={`text-[15pt] font-semibold ${theme.font}`}>
                    {entrega.fecha_limite} — {entrega.hora_limite?.slice(0, 5)} hrs
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex gap-4">
                    <button onClick={() => abrirModal('EditarEntrega', entrega)} className="hover:text-blue-300 transition">
                      <Edit size={24} />
                    </button>
                    <button onClick={() => abrirModal('EliminarEntrega', entrega)} className="hover:text-red-300 transition">
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}