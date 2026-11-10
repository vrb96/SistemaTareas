import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';

export const ModalAsignacion = ({ accion, idClase, asignacionActual, setModalActual, onActualizacion }) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const esBaja = accion === 'EliminarAsignacion';

  useEffect(() => {
    if (asignacionActual && accion !== 'CrearAsignacion') {
      setTitulo(asignacionActual.titulo || '');
      setDescripcion(asignacionActual.descripcion || '');
    }
  }, [asignacionActual, accion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      if (esBaja) {
        const { error: dbError } = await supabase
          .from('asignacion')
          .update({ estado: 'Inactiva' })
          .eq('id_asignacion', asignacionActual.id_asignacion);
        if (dbError) throw dbError;

      } else if (accion === 'EditarAsignacion') {
        const { error: dbError } = await supabase
          .from('asignacion')
          .update({ 
            titulo: titulo.trim(), 
            descripcion: descripcion.trim() 
          })
          .eq('id_asignacion', asignacionActual.id_asignacion);
        if (dbError) throw dbError;

      } else {
        if (!titulo.trim()) throw new Error('El título es obligatorio');
        if (!idClase) throw new Error('No se detectó la clase seleccionada para asociar esta asignación');

        const { error: dbError } = await supabase
          .from('asignacion')
          .insert([{ 
            id_clase: idClase, 
            titulo: titulo.trim(), 
            descripcion: descripcion.trim(), 
            estado: 'Activa' 
          }]);
        if (dbError) throw dbError;
      }

      // Notifica a App.jsx para cambiar el contador actualizador
      if (onActualizacion) onActualizacion();
      setModalActual(null);

    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className={`${theme.bgContenedor} p-8 rounded-lg shadow-xl w-[500px] border border-gray-300 relative`}>
        <button onClick={() => setModalActual(null)} className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold">
          <X size={24}/>
        </button>
        <h2 className={`text-[22pt] font-bold mb-6 text-center ${esBaja ? 'text-red-600' : theme.textContenedor} ${theme.font}`}>
          {esBaja ? '¿Desea dar de baja la asignación?' : (accion === 'EditarAsignacion' ? 'Editar Asignación' : 'Crear Asignación')}
        </h2>

        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Título:</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={esBaja}
              className="w-full p-2 border border-gray-400 rounded bg-white text-[16pt]"
              placeholder="Ej. Proyecto Final"
            />
          </div>
          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Descripción:</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={esBaja}
              rows="3"
              className="w-full p-2 border border-gray-400 rounded bg-white text-[16pt]"
              placeholder="Instrucciones generales..."
            />
          </div>
          <button
            type="submit"
            disabled={cargando}
            className={`${esBaja ? theme.bgError : theme.bgPrimario} ${theme.textPrimario} text-[16pt] font-bold py-3 mt-4 rounded ${theme.font} disabled:opacity-50`}
          >
            {cargando ? 'Procesando...' : (esBaja ? 'Dar de baja' : 'Guardar Asignación')}
          </button>
        </form>
      </div>
    </div>
  );
};