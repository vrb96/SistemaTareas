import React, { useState, useRef } from 'react';
import { X, ChevronLeft, Upload, FileText, MoreVertical } from 'lucide-react';
import { theme } from '../theme';

export default function PantallaEntregaAlumno({
  entregaActual,
  comentarios = [],
  onVolver,
  onEnviarArchivo,
  onDeshacerEnvio
}) {
  const [estadoEntrega, setEstadoEntrega] = useState(entregaActual?.estado_cierre || 'Abierta');
  const [estadoEnvio, setEstadoEnvio] = useState(entregaActual?.estado_envio || 'Sin enviar');
  const [archivoActual, setArchivoActual] = useState(
    entregaActual?.nombre_archivo ? { name: entregaActual.nombre_archivo } : null
  );
  const [fechaEnvio, setFechaEnvio] = useState(entregaActual?.fecha_hora_envio || '');
  const [menuArchivoAbierto, setMenuArchivoAbierto] = useState(false);

  // Modales internos de confirmación/error según C.U.10
  const [modalConfirmarDeshacer, setModalConfirmarDeshacer] = useState(false);
  const [alertaModal, setAlertaModal] = useState(null); // { tipo: 'error' | 'exito', mensaje: string }

  const inputFileRef = useRef(null);
  const esCerrada = estadoEntrega === 'Cerrada';
  const esEnviado = estadoEnvio === 'Enviado';

  // Validación C.U.10 Paso 5 y FA_04 (.docx o .pdf, máx 10 MB)
  const handleSeleccionarArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const nombreLower = file.name.toLowerCase();
    const extensionValida = nombreLower.endsWith('.docx') || nombreLower.endsWith('.pdf');
    const maxBytes = 10 * 1024 * 1024; // 10 MB

    if (!extensionValida) {
      setAlertaModal({
        tipo: 'error',
        mensaje: 'Extensión no permitida. Solo se aceptan archivos .docx y .pdf.'
      });
      e.target.value = '';
      return;
    }

    if (file.size > maxBytes) {
      setAlertaModal({
        tipo: 'error',
        mensaje: 'El archivo supera el tamaño máximo permitido de 10 MB.'
      });
      e.target.value = '';
      return;
    }

    setArchivoActual(file);
    setMenuArchivoAbierto(false);
    e.target.value = '';
  };

  // C.U.10 Paso 6-8: Enviar archivo
  const handleEnviar = async () => {
    if (!archivoActual) return;

    if (esCerrada) {
      setAlertaModal({
        tipo: 'error',
        mensaje: 'La entrega ya está cerrada y no admite cambios en el envío'
      });
      return;
    }

    if (onEnviarArchivo) {
      await onEnviarArchivo(archivoActual);
    }

    const ahora = new Date().toLocaleString('es-MX');
    setFechaEnvio(ahora);
    setEstadoEnvio('Enviado');
    setAlertaModal({
      tipo: 'exito',
      mensaje: 'Archivo enviado con éxito'
    });
  };

  // C.U.10 FA_01: Confirmar deshacer envío
  const confirmarDeshacer = async () => {
    setModalConfirmarDeshacer(false);

    if (esCerrada) {
      setAlertaModal({
        tipo: 'error',
        mensaje: 'La entrega ya está cerrada y no admite cambios en el envío'
      });
      return;
    }

    if (onDeshacerEnvio) {
      await onDeshacerEnvio();
    }

    setEstadoEnvio('Sin enviar');
    setAlertaModal({
      tipo: 'exito',
      mensaje: 'Envío deshecho con éxito'
    });
  };

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* Barra Lateral */}
      <div className="w-1/5 border-r-2 border-gray-300 p-4 flex flex-col gap-4 bg-white">
        <button onClick={onVolver} className="text-xl font-bold mb-4 text-left hover:text-red-500">
          <X size={30} />
        </button>
        <button
          className={`${theme.bgPrimario} ${theme.textPrimario} py-2 rounded text-[16pt] font-bold text-center ${theme.font}`}
        >
          Asignaciones
        </button>
      </div>

      {/* Área Principal */}
      <div className="w-4/5 p-8 overflow-y-auto">
        <button
          onClick={onVolver}
          className="flex items-center gap-1 text-[#465d91] font-bold text-[16pt] hover:text-[#2e4578] mb-4"
        >
          <ChevronLeft size={24} /> Volver
        </button>

        <div className="flex gap-8 items-start">
          {/* Columna Izquierda: Detalle y subida */}
          <div className="w-2/3">
            <h1 className={`text-[28pt] font-bold text-[#2e4578] ${theme.font}`}>
              Entrega {entregaActual?.no_entrega || 1}
            </h1>
            <p className={`text-[15pt] text-gray-600 mb-6 ${theme.font}`}>
              Fecha y hora límite: {entregaActual?.fecha_hora_limite || 'Sin fecha'}
            </p>

            <label className={`block text-[15pt] font-bold text-[#2e4578] mb-2 ${theme.font}`}>
              Instrucciones
            </label>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white min-h-[100px] text-[15pt] mb-8">
              {entregaActual?.instrucciones || 'Sin instrucciones adicionales'}
            </div>

            <h2 className={`text-[20pt] font-bold text-[#2e4578] mb-4 ${theme.font}`}>Mi trabajo</h2>

            {/* Input oculto */}
            <input
              type="file"
              accept=".docx,.pdf"
              ref={inputFileRef}
              onChange={handleSeleccionarArchivo}
              className="hidden"
            />

            {/* Botón Agregar / Reemplazar archivo si la entrega está Abierta y Sin enviar */}
            {!esCerrada && !esEnviado && (
              <button
                type="button"
                onClick={() => inputFileRef.current.click()}
                className="flex items-center gap-3 text-[#465d91] font-bold text-[16pt] hover:text-[#2e4578] mb-4"
              >
                <Upload size={26} />
                {archivoActual ? 'Reemplazar archivo' : 'Agregar archivo'}
                <span className="text-[12pt] font-normal text-gray-500">
                  (.docx o .pdf, máx. 10 MB)
                </span>
              </button>
            )}

            {/* Tarjeta del archivo adjunto/enviado */}
            {archivoActual && (
              <div className="bg-[#d9e2ff] border border-[#465d91] rounded-lg p-4 flex justify-between items-center max-w-lg relative">
                <div className="flex items-center gap-3">
                  <FileText size={28} className="text-[#2e4578]" />
                  <div>
                    <p className={`text-[15pt] font-bold text-[#2e4578] ${theme.font}`}>
                      {archivoActual.name}
                    </p>
                    {esEnviado && fechaEnvio && (
                      <p className="text-[12pt] text-gray-700">Enviado el: {fechaEnvio}</p>
                    )}
                  </div>
                </div>

                {!esCerrada && !esEnviado && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuArchivoAbierto(!menuArchivoAbierto)}
                      className="p-1 text-[#2e4578] hover:bg-blue-200 rounded"
                    >
                      <MoreVertical size={22} />
                    </button>
                    {menuArchivoAbierto && (
                      <div className="absolute right-0 mt-1 w-48 bg-[#575e71] text-white rounded-lg shadow-lg py-2 z-20 text-[14pt]">
                        <button
                          onClick={() => inputFileRef.current.click()}
                          className="w-full text-left px-4 py-2 hover:bg-gray-600"
                        >
                          Reemplazar archivo
                        </button>
                        <button
                          onClick={() => {
                            setArchivoActual(null);
                            setMenuArchivoAbierto(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-600"
                        >
                          Quitar archivo
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Columna Derecha: Acciones de Envío, Estado, Calificación y Comentarios */}
          <div className="w-1/3 flex flex-col items-center">
            {/* Botones dinámicos según C.U.10 */}
            {!esCerrada && (
              <div className="w-full flex flex-col gap-3 mb-6">
                {esEnviado ? (
                  <button
                    onClick={() => setModalConfirmarDeshacer(true)}
                    className="w-full bg-[#dce2f9] text-[#2e4578] border border-[#465d91] py-3 rounded-lg text-[16pt] font-bold hover:bg-blue-200 transition"
                  >
                    Deshacer envío
                  </button>
                ) : (
                  <button
                    onClick={handleEnviar}
                    disabled={!archivoActual}
                    className={`w-full py-3 rounded-lg text-[16pt] font-bold transition ${
                      archivoActual
                        ? 'bg-[#465d91] text-white hover:bg-[#2e4578]'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Enviar
                  </button>
                )}
              </div>
            )}

            <div className="text-center space-y-2 mb-6">
              <p className={`text-[16pt] font-bold text-[#2e4578] ${theme.font}`}>
                Estado de la entrega: <span className="underline">{estadoEntrega}</span>
              </p>
              <p className={`text-[15pt] font-semibold text-gray-700 ${theme.font}`}>
                Envío: {estadoEnvio}
              </p>
              <p className={`text-[16pt] font-bold text-[#465d91] ${theme.font}`}>
                Calificación: {entregaActual?.calificacion ?? 'Sin calificar'}
              </p>
            </div>

            <div className="w-full">
              <h3 className={`text-[16pt] font-bold text-center text-[#2e4578] mb-2 ${theme.font}`}>
                Comentarios
              </h3>
              <div className="border-2 border-gray-300 rounded-lg bg-white p-4 h-[260px] overflow-y-auto space-y-3">
                {comentarios.length === 0 ? (
                  <p className="text-gray-400 text-center text-[14pt] mt-16">
                    Sin comentarios del profesor
                  </p>
                ) : (
                  comentarios.map((c, i) => (
                    <div key={i} className="bg-[#faf8ff] border border-gray-200 p-3 rounded">
                      <p className="text-[12pt] text-gray-500 mb-1">{c.fecha}</p>
                      <p className="text-[14pt] text-gray-800">{c.texto}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Confirmación Deshacer Envío (C.U.10 FA_01) */}
      {modalConfirmarDeshacer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className={`${theme.bgContenedor} p-8 rounded-xl shadow-xl w-[460px] text-center`}>
            <h3 className={`text-[20pt] font-bold text-[#2e4578] mb-6 ${theme.font}`}>
              ¿Está seguro que desea deshacer su envío?
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmarDeshacer}
                className="bg-[#465d91] text-white px-8 py-2 rounded-lg text-[16pt] font-bold hover:bg-[#2e4578]"
              >
                Confirmar
              </button>
              <button
                onClick={() => setModalConfirmarDeshacer(false)}
                className="bg-gray-500 text-white px-8 py-2 rounded-lg text-[16pt] font-bold hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alerta / Error (C.U.10 Paso 8, FA_04, FA_05) */}
      {alertaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div
            className={`p-8 rounded-xl shadow-xl w-[460px] text-center border-2 ${
              alertaModal.tipo === 'error'
                ? 'bg-[#ffdad6] border-[#93000a] text-[#93000a]'
                : 'bg-[#d9e2ff] border-[#465d91] text-[#2e4578]'
            }`}
          >
            <p className={`text-[16pt] font-bold mb-6 ${theme.font}`}>{alertaModal.mensaje}</p>
            <button
              onClick={() => setAlertaModal(null)}
              className={`px-8 py-2 rounded-lg text-[16pt] font-bold text-white ${
                alertaModal.tipo === 'error' ? 'bg-[#93000a]' : 'bg-[#465d91]'
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