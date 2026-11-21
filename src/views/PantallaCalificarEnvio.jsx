import React, { useState } from 'react';
import { X, ChevronLeft, FileText, Download, Edit, Trash2 } from 'lucide-react';
import { theme } from '../theme';

export default function PantallaCalificarEnvio({
  entregaActual,
  alumnoEnvio,
  comparacion = null, // { texto: 'Sin entrega previa para comparar' } o { titulo: 'Comparado contra Entrega 1', omitidas: [], parrafos: [...] }
  comentariosIniciales = [],
  onVolver,
  onDescargarArchivo,
  onGuardarCalificacion,
  onGuardarExtension,
  onGuardarComentario,
  onEditarComentario,
  onEliminarComentario
}) {
  // Calificación (0 - 100 entero)
  const [calificacion, setCalificacion] = useState(
    alumnoEnvio?.calificacion !== null && alumnoEnvio?.calificacion !== undefined
      ? String(alumnoEnvio.calificacion)
      : ''
  );
  const [editandoCalif, setEditandoCalif] = useState(
    alumnoEnvio?.calificacion === null || alumnoEnvio?.calificacion === undefined
  );

  // Comentarios (1 - 2000 caracteres)
  const [comentarios, setComentarios] = useState(comentariosIniciales);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [textoEditado, setTextoEditado] = useState('');

  // Modales internos
  const [modalExtension, setModalExtension] = useState(false);
  const [fechaExt, setFechaExt] = useState('');
  const [horaExt, setHoraExt] = useState('23:59');
  const [fechaCierreExt, setFechaCierreExt] = useState('');
  const [horaCierreExt, setHoraCierreExt] = useState('23:59');

  const [confirmarSalir, setConfirmarSalir] = useState(false);
  const [comentarioAEliminar, setComentarioAEliminar] = useState(null);
  const [alerta, setAlerta] = useState(null); // { tipo: 'error'|'exito', mensaje: string }

  // Validación C.U.12 Paso 3-4 y FA_01
  const handleGuardarCalificacion = async () => {
    const num = Number(calificacion);
    if (calificacion.trim() === '' || !Number.isInteger(num) || num < 0 || num > 100) {
      setAlerta({
        tipo: 'error',
        mensaje: 'La calificación debe ser un número entero entre 0 y 100'
      });
      return;
    }

    try {
      if (onGuardarCalificacion) await onGuardarCalificacion(num);
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message || 'No se pudo guardar la calificación' });
      return;
    }
    setEditandoCalif(false);
    setAlerta({ tipo: 'exito', mensaje: 'Calificación registrada con éxito' });
  };

  // Validación C.U.12 FA_04 y FA_05
  const handleAgregarComentario = async () => {
    const limpio = nuevoComentario.trim();
    if (limpio.length < 1 || limpio.length > 2000) {
      setAlerta({
        tipo: 'error',
        mensaje: 'El comentario debe contener entre 1 y 2000 caracteres'
      });
      return;
    }

    let item = {
      id: Date.now(),
      fecha: new Date().toLocaleString('es-MX'),
      texto: limpio
    };
    try {
      if (onGuardarComentario) item = (await onGuardarComentario(item)) || item;
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message || 'No se pudo guardar el comentario' });
      return;
    }
    setComentarios([...comentarios, item]);
    setNuevoComentario('');
  };

  const handleGuardarEdicionComentario = async (id) => {
    const limpio = textoEditado.trim();
    if (limpio.length < 1 || limpio.length > 2000) {
      setAlerta({
        tipo: 'error',
        mensaje: 'El comentario debe contener entre 1 y 2000 caracteres'
      });
      return;
    }
    try {
      if (onEditarComentario) await onEditarComentario(id, limpio);
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message || 'No se pudo editar el comentario' });
      return;
    }
    setComentarios(comentarios.map((c) => (c.id === id ? { ...c, texto: limpio } : c)));
    setEditandoId(null);
  };

  const confirmarEliminarComentario = async () => {
    if (!comentarioAEliminar) return;
    try {
      if (onEliminarComentario) await onEliminarComentario(comentarioAEliminar.id);
    } catch (err) {
      setComentarioAEliminar(null);
      setAlerta({ tipo: 'error', mensaje: err.message || 'No se pudo eliminar el comentario' });
      return;
    }
    setComentarios(comentarios.filter((c) => c.id !== comentarioAEliminar.id));
    setComentarioAEliminar(null);
  };

  const handleGuardarExtension = async (e) => {
    e.preventDefault();
    if (!fechaExt || !horaExt) return;
    const limite = new Date(`${fechaExt}T${horaExt}:00`);
    const cierre = fechaCierreExt ? new Date(`${fechaCierreExt}T${horaCierreExt}:00`) : null;
    if (limite <= new Date()) {
      setAlerta({ tipo: 'error', mensaje: 'La fecha límite extendida debe ser posterior al momento actual' });
      return;
    }
    if (cierre && cierre < limite) {
      setAlerta({ tipo: 'error', mensaje: 'La fecha de cierre no puede ser anterior a la fecha límite extendida' });
      return;
    }
    try {
      if (onGuardarExtension) {
        await onGuardarExtension({
          fecha_hora_limite_ext: `${fechaExt}T${horaExt}:00`,
          fecha_hora_cierre_ext: cierre ? `${fechaCierreExt}T${horaCierreExt}:00` : null
        });
      }
    } catch (err) {
      setAlerta({ tipo: 'error', mensaje: err.message || 'No se pudo otorgar la extensión' });
      return;
    }
    setModalExtension(false);
    setAlerta({ tipo: 'exito', mensaje: 'Permiso de extensión otorgado con éxito' });
  };

  const esEnviado = alumnoEnvio?.estado_envio === 'Enviado';

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* Barra Lateral */}
      <div className="w-1/5 border-r-2 border-gray-300 p-4 flex flex-col gap-4 bg-white">
        <button
          onClick={() => setConfirmarSalir(true)}
          className="text-xl font-bold mb-4 text-left hover:text-red-500"
        >
          <X size={30} />
        </button>
        <button
          className={`${theme.bgPrimario} ${theme.textPrimario} py-2 rounded text-[16pt] font-bold text-center ${theme.font}`}
        >
          Entregas
        </button>
      </div>

      {/* Área Principal */}
      <div className="w-4/5 p-8 overflow-y-auto">
        <button
          onClick={() => setConfirmarSalir(true)}
          className="flex items-center gap-1 text-[#465d91] font-bold text-[16pt] hover:text-[#2e4578] mb-4"
        >
          <ChevronLeft size={24} /> Volver
        </button>

        <div className="flex gap-8 items-start">
          {/* Columna Izquierda: Datos del alumno, archivo y Criterio de Comparación */}
          <div className="w-2/3">
            <h1 className={`text-[28pt] font-bold text-[#2e4578] ${theme.font}`}>
              Entrega {entregaActual?.no_entrega || 1}
            </h1>
            <p className={`text-[16pt] font-semibold text-gray-800 ${theme.font}`}>
              {alumnoEnvio?.nombre_completo} — {alumnoEnvio?.no_control}
            </p>
            <p className="text-[14pt] text-gray-600 mb-4">
              Fecha y hora límite: {entregaActual?.fecha_hora_limite}
            </p>

            {/* Archivo enviado + Descarga (C.U.11 FA_01) */}
            {esEnviado ? (
              <div className="bg-[#d9e2ff] border border-[#465d91] rounded-lg p-4 flex justify-between items-center max-w-lg mb-6">
                <div className="flex items-center gap-3">
                  <FileText size={28} className="text-[#2e4578]" />
                  <div>
                    <p className={`text-[15pt] font-bold text-[#2e4578] ${theme.font}`}>
                      {alumnoEnvio.nombre_archivo}
                    </p>
                    <p className="text-[12pt] text-gray-700">
                      Enviado: {alumnoEnvio.fecha_hora_envio}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onDescargarArchivo && onDescargarArchivo(alumnoEnvio)}
                  className="bg-[#465d91] text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-[13pt] hover:bg-[#2e4578]"
                >
                  <Download size={18} /> Descargar archivo
                </button>
              </div>
            ) : (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 max-w-lg mb-6 text-gray-600 text-[15pt]">
                El alumno aún no ha enviado archivo en esta entrega.
              </div>
            )}

            {/* Área de Criterio de Comparación (C.U.11 Pasos 5-7) */}
            {(entregaActual?.no_entrega || 1) > 1 && esEnviado && (
              <div>
                <h2 className={`text-[22pt] font-bold text-[#2e4578] mb-2 ${theme.font}`}>
                  Criterio de Comparación
                </h2>
                <div className="border-2 border-gray-300 rounded-lg bg-white p-5 min-h-[220px] max-h-[340px] overflow-y-auto">
                  {!comparacion || comparacion.texto === 'Sin entrega previa para comparar' ? (
                    <p className="text-gray-500 text-[15pt]">Sin entrega previa para comparar</p>
                  ) : comparacion.sinCambios ? (
                    <p className="text-gray-700 font-semibold text-[15pt]">Sin cambios</p>
                  ) : (
                    <div className="space-y-3 text-[14pt]">
                      <p className="font-bold text-[#2e4578]">{comparacion.titulo}</p>
                      {comparacion.omitidas?.map((om, idx) => (
                        <p key={idx} className="text-amber-700 text-[13pt] font-semibold">
                          {om}
                        </p>
                      ))}
                      <div className="border-t pt-3 space-y-2 leading-relaxed">
                        {comparacion.parrafos?.map((p, i) => (
                          <p key={i}>
                            {p.tokens.map((t, j) =>
                              t.tipo === 'agregado' ? (
                                <span key={j} className="bg-green-200 text-green-900 px-1 rounded">
                                  {t.texto}{' '}
                                </span>
                              ) : t.tipo === 'eliminado' ? (
                                <span
                                  key={j}
                                  className="bg-red-200 text-red-900 line-through px-1 rounded"
                                >
                                  {t.texto}{' '}
                                </span>
                              ) : (
                                <span key={j}>{t.texto} </span>
                              )
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Calificación, Extensión y Comentarios */}
          <div className="w-1/3 flex flex-col gap-4">
            <div className="bg-[#d9e2ff] p-4 rounded-xl border border-[#465d91]">
              <p className={`text-[15pt] font-bold text-[#2e4578] mb-2 ${theme.font}`}>
                Estado: {entregaActual?.estado_cierre || 'Abierta'}
              </p>

              <div className="flex items-center gap-2 mb-3">
                <label className="text-[15pt] font-bold text-[#2e4578]">Calificación:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={!editandoCalif}
                  value={calificacion}
                  onChange={(e) => setCalificacion(e.target.value)}
                  placeholder="0-100"
                  className="w-24 p-1.5 border border-gray-400 rounded bg-white text-[15pt] font-bold text-center disabled:bg-gray-100"
                />
              </div>

              <div className="flex flex-col gap-2">
                {editandoCalif ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleGuardarCalificacion}
                      className="flex-1 bg-[#465d91] text-white py-2 rounded-lg font-bold text-[14pt] hover:bg-[#2e4578]"
                    >
                      Guardar
                    </button>
                    {alumnoEnvio?.calificacion !== null && alumnoEnvio?.calificacion !== undefined && (
                      <button
                        onClick={() => {
                          setCalificacion(String(alumnoEnvio.calificacion));
                          setEditandoCalif(false);
                        }}
                        className="bg-gray-500 text-white px-3 py-2 rounded-lg font-bold text-[14pt]"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setEditandoCalif(true)}
                    className="w-full bg-[#465d91] text-white py-2 rounded-lg font-bold text-[14pt] hover:bg-[#2e4578]"
                  >
                    Editar Calificación
                  </button>
                )}

                <button
                  onClick={() => setModalExtension(true)}
                  className="w-full bg-[#dce2f9] text-[#2e4578] border border-[#465d91] py-2 rounded-lg font-bold text-[14pt] hover:bg-blue-200"
                >
                  Otorgar Extensión
                </button>
              </div>
            </div>

            {/* Comentarios (C.U.12 FA_04, FA_05, FA_06) */}
            <div>
              <h3 className={`text-[16pt] font-bold text-[#2e4578] mb-2 ${theme.font}`}>
                Comentarios
              </h3>
              <div className="border-2 border-gray-300 rounded-lg bg-white p-3 h-[210px] overflow-y-auto space-y-2 mb-3">
                {comentarios.length === 0 ? (
                  <p className="text-gray-400 text-center text-[13pt] mt-14">Sin comentarios</p>
                ) : (
                  comentarios.map((c) => (
                    <div key={c.id} className="bg-[#faf8ff] border border-gray-200 p-2.5 rounded">
                      <div className="flex justify-between items-center text-[11pt] text-gray-500 mb-1">
                        <span>{c.fecha}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditandoId(c.id);
                              setTextoEditado(c.texto);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => setComentarioAEliminar(c)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      {editandoId === c.id ? (
                        <div className="space-y-1">
                          <textarea
                            rows="2"
                            value={textoEditado}
                            onChange={(e) => setTextoEditado(e.target.value)}
                            className="w-full p-1 border rounded text-[13pt]"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleGuardarEdicionComentario(c.id)}
                              className="bg-[#465d91] text-white px-2 py-0.5 rounded text-[12pt]"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditandoId(null)}
                              className="bg-gray-400 text-white px-2 py-0.5 rounded text-[12pt]"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[13pt] text-gray-800">{c.texto}</p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <textarea
                rows="2"
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                placeholder="Escribe una observación (1 - 2000 caracteres)..."
                className="w-full p-2 border border-gray-400 rounded bg-white text-[13pt] mb-2"
              />
              <button
                onClick={handleAgregarComentario}
                className="w-full bg-[#465d91] text-white py-2 rounded-lg font-bold text-[14pt] hover:bg-[#2e4578]"
              >
                Agregar Comentario
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Otorgar Extensión Individual (C.U.12 FA_03) */}
      {modalExtension && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className={`${theme.bgContenedor} p-8 rounded-xl shadow-xl w-[460px]`}>
            <h3 className={`text-[20pt] font-bold text-center text-[#2e4578] mb-4 ${theme.font}`}>
              Otorgar Extensión Individual
            </h3>
            <form onSubmit={handleGuardarExtension} className="space-y-4">
              <div className="flex gap-3">
                <div className="w-1/2">
                  <label className="block text-[13pt] font-semibold mb-1">Nueva Fecha Límite</label>
                  <input
                    type="date"
                    required
                    value={fechaExt}
                    onChange={(e) => setFechaExt(e.target.value)}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-[13pt] font-semibold mb-1">Hora Límite</label>
                  <input
                    type="time"
                    required
                    value={horaExt}
                    onChange={(e) => setHoraExt(e.target.value)}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1/2">
                  <label className="block text-[13pt] font-semibold mb-1">Fecha Cierre (opc.)</label>
                  <input
                    type="date"
                    value={fechaCierreExt}
                    onChange={(e) => setFechaCierreExt(e.target.value)}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-[13pt] font-semibold mb-1">Hora Cierre</label>
                  <input
                    type="time"
                    value={horaCierreExt}
                    onChange={(e) => setHoraCierreExt(e.target.value)}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-center gap-4 pt-2">
                <button
                  type="submit"
                  className="bg-[#465d91] text-white px-6 py-2 rounded-lg font-bold text-[15pt]"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setModalExtension(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg font-bold text-[15pt]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar Comentario (C.U.12 FA_06) */}
      {comentarioAEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className={`${theme.bgContenedor} p-8 rounded-xl shadow-xl w-[420px] text-center`}>
            <h3 className={`text-[18pt] font-bold text-[#2e4578] mb-6 ${theme.font}`}>
              ¿Desea eliminar este comentario?
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmarEliminarComentario}
                className="bg-[#93000a] text-white px-8 py-2 rounded-lg font-bold text-[15pt]"
              >
                Sí
              </button>
              <button
                onClick={() => setComentarioAEliminar(null)}
                className="bg-gray-500 text-white px-8 py-2 rounded-lg font-bold text-[15pt]"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Salir (C.U.12 FA_07) */}
      {confirmarSalir && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className={`${theme.bgContenedor} p-8 rounded-xl shadow-xl w-[420px] text-center`}>
            <h3 className={`text-[18pt] font-bold text-[#2e4578] mb-6 ${theme.font}`}>
              ¿Está seguro de que desea salir?
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={onVolver}
                className="bg-[#465d91] text-white px-8 py-2 rounded-lg font-bold text-[15pt]"
              >
                Sí
              </button>
              <button
                onClick={() => setConfirmarSalir(false)}
                className="bg-gray-500 text-white px-8 py-2 rounded-lg font-bold text-[15pt]"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta Error / Éxito */}
      {alerta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div
            className={`p-8 rounded-xl shadow-xl w-[440px] text-center border-2 ${
              alerta.tipo === 'error'
                ? 'bg-[#ffdad6] border-[#93000a] text-[#93000a]'
                : 'bg-[#d9e2ff] border-[#465d91] text-[#2e4578]'
            }`}
          >
            <p className={`text-[16pt] font-bold mb-6 ${theme.font}`}>{alerta.mensaje}</p>
            <button
              onClick={() => setAlerta(null)}
              className={`px-8 py-2 rounded-lg text-[16pt] font-bold text-white ${
                alerta.tipo === 'error' ? 'bg-[#93000a]' : 'bg-[#465d91]'
              }`}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}