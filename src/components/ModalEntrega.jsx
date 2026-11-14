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
  const [fechaCierre, setFechaCierre] = useState('');
  const [horaCierre, setHoraCierre] = useState('23:59');
  const [instrucciones, setInstrucciones] = useState('');
  const [cargando, setCargando] = useState(false);
  
  const [error, setError] = useState('');
  const [exito, setExito] = useState(''); // Estado para mensajes de confirmación

  const esCrear = accion === 'CrearEntrega';
  const esEditar = accion === 'EditarEntrega';
  const esEliminar = accion === 'EliminarEntrega';

  // RF017: Número consecutivo automático
  const siguienteConsecutivo = `Entrega ${todasLasEntregas.length + 1}`;

  useEffect(() => {
    if (entregaActual && !esCrear) {
      setFechaLimite(entregaActual.fecha_limite || '');
      setHoraLimite(entregaActual.hora_limite?.slice(0, 5) || '23:59');
      setFechaCierre(entregaActual.fecha_cierre || entregaActual.fecha_limite || '');
      setHoraCierre(entregaActual.hora_cierre?.slice(0, 5) || '23:59');
      setInstrucciones(entregaActual.instrucciones || '');
    }
  }, [entregaActual, accion]);

  // Validaciones cronológicas
  const validarFechas = () => {
    const ahora = new Date();
    const fechaHoraIngresada = new Date(`${fechaLimite}T${horaLimite}:00`);

    if (isNaN(fechaHoraIngresada.getTime())) {
      throw new Error('Ingrese una fecha y hora límite válidas.');
    }

    if (fechaHoraIngresada <= ahora) {
      throw new Error('La fecha y hora límite deben ser posteriores al momento actual.');
    }

    const cierreFinalFecha = fechaCierre || fechaLimite;
    const cierreFinalHora = horaCierre || horaLimite;
    const fechaHoraCierreObj = new Date(`${cierreFinalFecha}T${cierreFinalHora}:00`);

    if (fechaHoraCierreObj < fechaHoraIngresada) {
      throw new Error('La fecha y hora de cierre definitivo no pueden ser anteriores a la fecha límite del alumno.');
    }

    if (esCrear) {
      if (todasLasEntregas.length > 0) {
        const ultima = todasLasEntregas[todasLasEntregas.length - 1];
        const fechaHoraUltima = new Date(`${ultima.fecha_limite}T${ultima.hora_limite}`);
        if (fechaHoraIngresada <= fechaHoraUltima) {
          throw new Error(`La fecha y hora límite debe ser posterior a la de la entrega anterior (${ultima.numero_entrega}).`);
        }
      }
    }

    if (esEditar) {
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
        const ultimaEntrega = todasLasEntregas[todasLasEntregas.length - 1];
        if (ultimaEntrega && ultimaEntrega.id_entrega !== entregaActual.id_entrega) {
          throw new Error('Solo se puede eliminar la última entrega registrada de la asignación.');
        }

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
        setExito('Entrega eliminada con éxito');

      } else if (esEditar) {
        validarFechas();

        const fechaCierreFinal = fechaCierre || fechaLimite;
        const horaCierreFinal = horaCierre || horaLimite;

        const { error: dbError } = await supabase
          .from('entrega')
          .update({
            fecha_limite: fechaLimite,
            hora_limite: horaLimite,
            fecha_cierre: fechaCierreFinal,
            hora_cierre: horaCierreFinal,
            instrucciones: instrucciones.trim(),
            estado_cierre: false // reabierta
          })
          .eq('id_entrega', entregaActual.id_entrega);

        if (dbError) throw dbError;
        setExito('Entrega actualizada con éxito. La entrega se encuentra Abierta');

      } else if (esCrear) {
        validarFechas();

        const fechaCierreFinal = fechaCierre || fechaLimite;
        const horaCierreFinal = horaCierre || horaLimite;

        const { error: dbError } = await supabase
          .from('entrega')
          .insert([{
            id_asignacion: idAsignacion,
            numero_entrega: siguienteConsecutivo,
            fecha_limite: fechaLimite,
            hora_limite: horaLimite,
            fecha_cierre: fechaCierreFinal,
            hora_cierre: horaCierreFinal,
            instrucciones: instrucciones.trim(),
            estado_cierre: false
          }]);

        if (dbError) throw dbError;
        setExito('Entrega creada con éxito'); // CP-0009[cite: 23]
      }

      // Demora para permitir que el usuario lea el mensaje de éxito
      setTimeout(() => {
        setModalActual(null);
        if (onActualizacion) onActualizacion();
      }, 2000);

    } catch (err) {
      setError(err.message);
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className={`${theme.bgContenedor} p-8 rounded-lg shadow-xl w-[560px] border border-gray-300 relative`}>
        <button
          onClick={() => setModalActual(null)}
          className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold"
        >
          <X size={24} />
        </button>

        <h2 className={`text-[22pt] font-bold mb-6 text-center ${esEliminar ? 'text-red-600' : theme.textContenedor} ${theme.font}`}>
          {esEliminar
            ? `¿Desea eliminar ${entregaActual?.numero_entrega}?`
            : esEditar
              ? `Editar ${entregaActual?.numero_entrega}`
              : `Crear ${siguienteConsecutivo}`}
        </h2>

        {/* Botón Aceptar requerido para Errores CP-0009[cite: 23] */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4 flex flex-col items-center gap-3 text-center">
            <span className="font-bold text-[13pt]">{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="bg-red-700 text-white px-8 py-1.5 rounded font-bold hover:bg-red-800 transition"
            >
              Aceptar
            </button>
          </div>
        )}

        {/* Mensaje de confirmación visual CP-0009[cite: 23] */}
        {exito && <div className="bg-green-200 text-green-800 p-3 rounded mb-4 text-center font-bold">{exito}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {esEliminar ? (
            <p className="text-[14pt] text-gray-700 text-center">
              Esta acción solo se completará si es la última fase y no existen documentos cargados por los alumnos.
            </p>
          ) : (
            <>
              {/* Sección 1: Fecha Límite para Alumnos */}
              <div className="bg-white p-3 rounded border border-gray-300">
                <span className="block text-[12pt] font-bold text-blue-700 mb-2 uppercase tracking-wide">
                  Fecha y Hora Límite (Visible para Alumnos)
                </span>
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className={`text-[13pt] ${theme.textContenedor} ${theme.font} block mb-1`}>
                      Fecha Límite:
                    </label>
                    <input
                      type="date"
                      required
                      value={fechaLimite}
                      disabled={exito}
                      onChange={(e) => {
                        setFechaLimite(e.target.value);
                        if (!fechaCierre) setFechaCierre(e.target.value);
                      }}
                      className="w-full p-2 border border-gray-400 rounded bg-white text-[14pt]"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className={`text-[13pt] ${theme.textContenedor} ${theme.font} block mb-1`}>
                      Hora Límite:
                    </label>
                    <input
                      type="time"
                      required
                      value={horaLimite}
                      disabled={exito}
                      onChange={(e) => setHoraLimite(e.target.value)}
                      className="w-full p-2 border border-gray-400 rounded bg-white text-[14pt]"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Fecha de Cierre Definitivo (Exclusivo Docente) */}
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <span className="block text-[12pt] font-bold text-[#465d91] mb-2 uppercase tracking-wide">
                  Cierre Definitivo (Solo Profesor)
                </span>
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className={`text-[13pt] ${theme.textContenedor} ${theme.font} block mb-1`}>
                      Fecha de Cierre:
                    </label>
                    <input
                      type="date"
                      value={fechaCierre}
                      disabled={exito}
                      onChange={(e) => setFechaCierre(e.target.value)}
                      placeholder={fechaLimite}
                      className="w-full p-2 border border-blue-300 rounded bg-white text-[14pt]"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className={`text-[13pt] ${theme.textContenedor} ${theme.font} block mb-1`}>
                      Hora de Cierre:
                    </label>
                    <input
                      type="time"
                      value={horaCierre}
                      disabled={exito}
                      onChange={(e) => setHoraCierre(e.target.value)}
                      className="w-full p-2 border border-blue-300 rounded bg-white text-[14pt]"
                    />
                  </div>
                </div>
              </div>

              {/* Instrucciones */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className={`text-[13pt] ${theme.textContenedor} ${theme.font}`}>
                    Instrucciones (opcional):
                  </label>
                  <span className="text-[11pt] text-gray-500">
                    {instrucciones.length}/1000
                  </span>
                </div>
                <textarea
                  value={instrucciones}
                  maxLength={1000}
                  disabled={exito}
                  onChange={(e) => setInstrucciones(e.target.value)}
                  rows="3"
                  className="w-full p-2 border border-gray-400 rounded bg-white text-[13pt]"
                  placeholder="Instrucciones específicas para esta entrega..."
                />
              </div>
            </>
          )}

          <div className="flex gap-4 mt-2">
            {/* Botón Cancelar requerido por CP-0009[cite: 23] */}
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
              className={`w-1/2 ${esEliminar ? theme.bgError : theme.bgPrimario} ${theme.textPrimario} text-[16pt] font-bold py-2.5 rounded ${theme.font} transition disabled:opacity-50`}
            >
              {cargando ? 'Procesando...' : (esEliminar ? 'Confirmar Eliminación' : 'Guardar Entrega')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};