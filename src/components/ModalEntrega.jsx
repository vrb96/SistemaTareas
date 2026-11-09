import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';

export const ModalEntrega = ({ 
  accion, 
  idAsignacion, 
  entregaActual, 
  todasLasEntregas = [], 
  setModalActual, 
  onActualizacion 
}) => {
  const [fechaLimite, setFechaLimite] = useState('');
  const [horaLimite, setHoraLimite] = useState('23:59');
  const [instrucciones, setInstrucciones] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const esCrear = accion === 'CrearEntrega';
  const esEditar = accion === 'EditarEntrega';
  const esEliminar = accion === 'EliminarEntrega';

  // RF017: Número consecutivo automático (Entrega 1, Entrega 2, etc.)
  const siguienteConsecutivo = `Entrega ${todasLasEntregas.length + 1}`;

  useEffect(() => {
    if (entregaActual && !esCrear) {
      setFechaLimite(entregaActual.fecha_limite || '');
      setHoraLimite(entregaActual.hora_limite?.slice(0, 5) || '23:59');
      setInstrucciones(entregaActual.instrucciones || '');
    }
  }, [entregaActual, accion]);

  // Validaciones de fecha y hora según RF017 y RF018
  const validarFechas = () => {
    const ahora = new Date();
    const fechaHoraIngresada = new Date(`${fechaLimite}T${horaLimite}:00`);

    if (isNaN(fechaHoraIngresada.getTime())) {
      throw new Error('Ingrese una fecha y hora límite válidas.');
    }

    // Regla: Posterior al momento actual
    if (fechaHoraIngresada <= ahora) {
      throw new Error('La fecha y hora límite deben ser posteriores al momento actual.');
    }

    if (esCrear) {
      // Regla RF017: Posterior a la última entrega existente
      if (todasLasEntregas.length > 0) {
        const ultima = todasLasEntregas[todasLasEntregas.length - 1];
        const fechaHoraUltima = new Date(`${ultima.fecha_limite}T${ultima.hora_limite}`);
        if (fechaHoraIngresada <= fechaHoraUltima) {
          throw new Error(`La fecha y hora deben ser posteriores a la de la entrega anterior (${ultima.numero_entrega}).`);
        }
      }
    }

    if (esEditar) {
      // Regla RF018: Posterior a la anterior y anterior a la siguiente
      const indice = todasLasEntregas.findIndex(e => e.id_entrega === entregaActual.id_entrega);
      
      if (indice > 0) {
        const anterior = todasLasEntregas[indice - 1];
        const fechaHoraAnt = new Date(`${anterior.fecha_limite}T${anterior.hora_limite}`);
        if (fechaHoraIngresada <= fechaHoraAnt) {
          throw new Error(`Debe ser posterior a la entrega anterior (${anterior.numero_entrega}).`);
        }
      }

      if (indice >= 0 && indice < todasLasEntregas.length - 1) {
        const siguiente = todasLasEntregas[indice + 1];
        const fechaHoraSig = new Date(`${siguiente.fecha_limite}T${siguiente.hora_limite}`);
        if (fechaHoraIngresada >= fechaHoraSig) {
          throw new Error(`Debe ser anterior a la entrega siguiente (${siguiente.numero_entrega}).`);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      if (esEliminar) {
        // Regla RF019: Solo se puede eliminar la ÚLTIMA entrega
        const ultimaEntrega = todasLasEntregas[todasLasEntregas.length - 1];
        if (ultimaEntrega && ultimaEntrega.id_entrega !== entregaActual.id_entrega) {
          throw new Error('Solo se puede eliminar la última entrega registrada de la asignación.');
        }

        // Regla RF019: Verificar si tiene envíos
        const { count, error: countError } = await supabase
          .from('envio')
          .select('*', { count: 'exact', head: true })
          .eq('id_entrega', entregaActual.id_entrega);

        if (!countError && count && count > 0) {
          throw new Error('No se puede eliminar la entrega porque ya cuenta con envíos de alumnos.');
        }

        const { error: dbError } = await supabase
          .from('entrega')
          .delete()
          .eq('id_entrega', entregaActual.id_entrega);

        if (dbError) throw dbError;

      } else if (esEditar) {
        validarFechas();

        // RF018: Si la nueva fecha es futura y estaba cerrada, vuelve a estar abierta
        const { error: dbError } = await supabase
          .from('entrega')
          .update({
            fecha_limite: fechaLimite,
            hora_limite: horaLimite,
            instrucciones: instrucciones.trim(),
            estado_cierre: false // reabierta
          })
          .eq('id_entrega', entregaActual.id_entrega);

        if (dbError) throw dbError;

      } else if (esCrear) {
        validarFechas();

        // RF017: Guardado con consecutivo automático y estado_cierre false
        const { error: dbError } = await supabase
          .from('entrega')
          .insert([{
            id_asignacion: idAsignacion,
            numero_entrega: siguienteConsecutivo,
            fecha_limite: fechaLimite,
            hora_limite: horaLimite,
            instrucciones: instrucciones.trim(),
            estado_cierre: false
          }]);

        if (dbError) throw dbError;
      }

      setModalActual(null);
      if (onActualizacion) onActualizacion();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className={`${theme.bgContenedor} p-8 rounded-lg shadow-xl w-[520px] border border-gray-300 relative`}>
        <button
          onClick={() => setModalActual(null)}
          className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold"
        >
          <X size={24}/>
        </button>

        <h2 className={`text-[22pt] font-bold mb-6 text-center ${esEliminar ? 'text-red-600' : theme.textContenedor} ${theme.font}`}>
          {esEliminar 
            ? `¿Desea eliminar ${entregaActual?.numero_entrega}?` 
            : esEditar 
            ? `Editar ${entregaActual?.numero_entrega}` 
            : `Crear ${siguienteConsecutivo}`}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-[13pt] text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {esEliminar ? (
            <p className="text-[14pt] text-gray-700 text-center">
              Esta acción solo se completará si es la última fase y no existen documentos cargados por los alumnos.
            </p>
          ) : (
            <>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className={`text-[14pt] ${theme.textContenedor} ${theme.font} block mb-1`}>
                    Fecha Límite:
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    className="w-full p-2 border border-gray-400 rounded bg-white text-[14pt]"
                  />
                </div>
                <div className="w-1/2">
                  <label className={`text-[14pt] ${theme.textContenedor} ${theme.font} block mb-1`}>
                    Hora Límite:
                  </label>
                  <input
                    type="time"
                    required
                    value={horaLimite}
                    onChange={(e) => setHoraLimite(e.target.value)}
                    className="w-full p-2 border border-gray-400 rounded bg-white text-[14pt]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className={`text-[14pt] ${theme.textContenedor} ${theme.font}`}>
                    Instrucciones (opcional):
                  </label>
                  <span className="text-[11pt] text-gray-500">
                    {instrucciones.length}/1000
                  </span>
                </div>
                <textarea
                  value={instrucciones}
                  maxLength={1000}
                  onChange={(e) => setInstrucciones(e.target.value)}
                  rows="4"
                  className="w-full p-2 border border-gray-400 rounded bg-white text-[14pt]"
                  placeholder="Instrucciones específicas para esta entrega..."
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={cargando}
            className={`${esEliminar ? theme.bgError : theme.bgPrimario} ${theme.textPrimario} text-[16pt] font-bold py-3 mt-4 rounded ${theme.font} transition disabled:opacity-50`}
          >
            {cargando ? 'Procesando...' : (esEliminar ? 'Confirmar Eliminación' : 'Guardar Entrega')}
          </button>
        </form>
      </div>
    </div>
  );
};