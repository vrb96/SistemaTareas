import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';

export const ModalAsignacion = ({ accion, idClase, asignacionActual, setModalActual, onActualizacion }) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

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
        // FA_01 (Paso 10): Verificar si alguna entrega tiene envíos antes de eliminar
        const { data: entregas } = await supabase
          .from('entrega')
          .select('id_entrega')
          .eq('id_asignacion', asignacionActual.id_asignacion);

        if (entregas && entregas.length > 0) {
          const idsEntregas = entregas.map(e => e.id_entrega);
          const { data: envios } = await supabase
            .from('envio')
            .select('id_envio')
            .in('id_entrega', idsEntregas)
            .limit(1);

          // FA_02: Rechazo por envíos existentes
          if (envios && envios.length > 0) {
            throw new Error('No se puede eliminar una asignación con envíos');
          }
        }

        // Baja lógica
        const { error: dbError } = await supabase
          .from('asignacion')
          .update({ estado: 'Inactiva' })
          .eq('id_asignacion', asignacionActual.id_asignacion);
        
        if (dbError) throw dbError;
        setExito('Asignación eliminada con éxito'); // Texto exacto FA_01

      } else {
        // FA_04: Título faltante
        if (!titulo.trim()) {
            throw new Error('El título de la asignación es obligatorio');
        }
        // FA_05: Longitudes
        if (titulo.trim().length < 3 || titulo.trim().length > 150) {
            throw new Error('El título debe tener entre 3 y 150 caracteres');
        }
        if (descripcion.trim().length > 2000) {
            throw new Error('La descripción no debe superar los 2000 caracteres');
        }

        if (accion === 'EditarAsignacion') {
          const { error: dbError } = await supabase
            .from('asignacion')
            .update({ 
              titulo: titulo.trim(), 
              descripcion: descripcion.trim() 
            })
            .eq('id_asignacion', asignacionActual.id_asignacion);
          
          if (dbError) throw dbError;
          setExito('Asignación actualizada con éxito'); // Texto exacto Flujo Básico

        } else if (accion === 'CrearAsignacion') {
          if (!idClase) throw new Error('No se detectó la clase.');

          const { error: dbError } = await supabase
            .from('asignacion')
            .insert([{ 
              id_clase: idClase, 
              titulo: titulo.trim(), 
              descripcion: descripcion.trim(), 
              estado: 'Activa' 
            }]);
          
          if (dbError) throw dbError;
          setExito('Asignación creada con éxito');
        }
      }

      setTimeout(() => {
        if (onActualizacion) onActualizacion();
        setModalActual(null);
      }, 2000);

    } catch (err) {
      setError(err.message);
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
          {esBaja ? '¿Confirma eliminar la asignación?' : (accion === 'EditarAsignacion' ? 'Editar Asignación' : 'Crear Asignación')}
        </h2>

        {/* Botón Aceptar requerido para Errores (FA_02, FA_04, FA_05) */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4 flex flex-col items-center gap-3">
            <span className="font-bold text-[13pt] text-center">{error}</span>
            <button 
              type="button" 
              onClick={() => setError('')} 
              className="bg-red-700 text-white px-8 py-1.5 rounded font-bold hover:bg-red-800 transition"
            >
              Aceptar
            </button>
          </div>
        )}
        
        {exito && <div className="bg-green-200 text-green-800 p-3 rounded mb-4 text-center font-bold">{exito}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Título:</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={esBaja || exito}
              className="w-full p-2 border border-gray-400 rounded bg-white text-[16pt]"
              placeholder="Ej. Proyecto Final"
            />
          </div>
          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Descripción:</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={esBaja || exito}
              rows="3"
              className="w-full p-2 border border-gray-400 rounded bg-white text-[16pt]"
              placeholder="Instrucciones generales..."
            />
          </div>
          
          <div className="flex gap-4 mt-2">
            <button
              type="button"
              onClick={() => setModalActual(null)}
              disabled={cargando || exito}
              className="w-1/2 bg-gray-400 text-white text-[16pt] font-bold py-2.5 rounded hover:bg-gray-600 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando || exito}
              className={`w-1/2 ${esBaja ? theme.bgError : theme.bgPrimario} ${theme.textPrimario} text-[16pt] font-bold py-2.5 rounded ${theme.font} disabled:opacity-50`}
            >
              {cargando ? 'Procesando...' : (esBaja ? 'Confirmar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};