import React, { useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { theme } from '../theme';

export default function PantallaEquipos({
  equiposIniciales = [],
  alumnosElegiblesIniciales = [],
  totalAlumnosClase = 0,
  onVolver,
  onGuardarEquiposGenerados,
  onActualizarEquipo,
  onEliminarEquipo
}) {
  const [equipos, setEquipos] = useState(equiposIniciales);
  const [elegibles, setElegibles] = useState(alumnosElegiblesIniciales);
  const [equipoSeleccionadoId, setEquipoSeleccionadoId] = useState(null);

  // Modales C.U.13
  const [modalFormar, setModalFormar] = useState(false);
  const [tamanoEquipo, setTamanoEquipo] = useState(3);
  const [vistaPrevia, setVistaPrevia] = useState(null);

  const [equipoEditando, setEquipoEditando] = useState(null); // { id, nombre, integrantes }
  const [modalEliminar, setModalEliminar] = useState(false);
  const [confirmarSalir, setConfirmarSalir] = useState(false);
  const [alerta, setAlerta] = useState(null);

  // C.U.13 Paso 3 y FA_01: Validar alumnos suficientes antes de abrir modal aleatorio
  const iniciarFormacionAleatoria = () => {
    if (totalAlumnosClase < 4 || elegibles.length < 2) {
      setAlerta({
        tipo: 'error',
        mensaje:
          'La clase debe contar con al menos 4 alumnos y mínimo 2 alumnos elegibles para formar equipos'
      });
      return;
    }
    setVistaPrevia(null);
    setModalFormar(true);
  };

  // C.U.13 Paso 5-6: Generar vista previa aleatoria
  const generarVistaPrevia = () => {
    const n = Number(tamanoEquipo);
    if (!Number.isInteger(n) || n < 2 || n > 10) {
      setAlerta({
        tipo: 'error',
        mensaje: 'El tamaño de equipo debe ser un número entero entre 2 y 10'
      });
      return;
    }

    const mezclados = [...elegibles].sort(() => Math.random() - 0.5);
    const propuestos = [];
    let numeroInicial = equipos.length + 1;

    for (let i = 0; i < mezclados.length; i += n) {
      const grupo = mezclados.slice(i, i + n);
      propuestos.push({
        id: `temp-${Date.now()}-${i}`,
        nombre: `Equipo ${numeroInicial++}`,
        integrantes: grupo
      });
    }
    setVistaPrevia(propuestos);
  };

  const confirmarVistaPrevia = async () => {
    if (!vistaPrevia) return;
    if (onGuardarEquiposGenerados) {
      await onGuardarEquiposGenerados(vistaPrevia);
    }
    setEquipos([...equipos, ...vistaPrevia]);
    setElegibles([]);
    setVistaPrevia(null);
    setModalFormar(false);
    setAlerta({ tipo: 'exito', mensaje: 'Equipos formados y guardados con éxito' });
  };

  // C.U.13 FA_03 y FA_04: Guardar edición de equipo
  const handleGuardarEdicion = async () => {
    const nombreLimpio = equipoEditando.nombre.trim();
    const duplicado = equipos.some(
      (eq) =>
        eq.id !== equipoEditando.id &&
        eq.nombre.toLowerCase() === nombreLimpio.toLowerCase()
    );

    if (!nombreLimpio || nombreLimpio.length > 80 || duplicado) {
      setAlerta({
        tipo: 'error',
        mensaje: 'El nombre del equipo no es válido o ya existe.'
      });
      return;
    }

    if (onActualizarEquipo) {
      await onActualizarEquipo(equipoEditando);
    }

    setEquipos(equipos.map((eq) => (eq.id === equipoEditando.id ? equipoEditando : eq)));
    setEquipoEditando(null);
    setAlerta({ tipo: 'exito', mensaje: 'Equipo actualizado con éxito' });
  };

  // C.U.13 FA_05: Eliminar equipo y liberar integrantes
  const confirmarEliminarEquipo = async () => {
    const objetivo = equipos.find((eq) => eq.id === equipoSeleccionadoId);
    if (!objetivo) return;

    if (onEliminarEquipo) {
      await onEliminarEquipo(objetivo.id);
    }

    setElegibles([...elegibles, ...objetivo.integrantes]);
    setEquipos(equipos.filter((eq) => eq.id !== objetivo.id));
    setEquipoSeleccionadoId(null);
    setModalEliminar(false);
    setAlerta({ tipo: 'exito', mensaje: 'Equipo eliminado y alumnos liberados como elegibles' });
  };

  // Vista interna: Modificar Equipo (Prototipo pág. 60)
  if (equipoEditando) {
    const otrosEquipos = equipos.filter((eq) => eq.id !== equipoEditando.id);

    return (
      <div className="flex h-[calc(100vh-73px)]">
        <div className="w-1/5 border-r-2 border-gray-300 p-4 flex flex-col gap-4 bg-white">
          <button
            onClick={() => setEquipoEditando(null)}
            className="text-xl font-bold mb-4 text-left hover:text-red-500"
          >
            <X size={30} />
          </button>
          <button
            className={`${theme.bgPrimario} ${theme.textPrimario} py-2 rounded text-[16pt] font-bold text-center ${theme.font}`}
          >
            Equipos
          </button>
        </div>

        <div className="w-4/5 p-8 overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div className="w-1/2">
              <h1 className={`text-[28pt] font-bold text-[#2e4578] mb-4 ${theme.font}`}>
                Editar Equipo
              </h1>
              <label className="block text-[15pt] font-semibold text-[#2e4578] mb-1">
                Nombre del equipo:
              </label>
              <input
                type="text"
                value={equipoEditando.nombre}
                onChange={(e) =>
                  setEquipoEditando({ ...equipoEditando, nombre: e.target.value })
                }
                className="w-full p-2.5 border-2 border-gray-400 rounded-lg bg-white text-[16pt]"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleGuardarEdicion}
                className="bg-[#465d91] text-white px-8 py-2.5 rounded-lg font-bold text-[16pt] hover:bg-[#2e4578]"
              >
                Guardar
              </button>
              <button
                onClick={() => setEquipoEditando(null)}
                className="bg-gray-500 text-white px-8 py-2.5 rounded-lg font-bold text-[16pt] hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>

          <h2 className={`text-[20pt] font-bold text-[#2e4578] mb-3 ${theme.font}`}>
            Integrantes ({equipoEditando.integrantes.length})
          </h2>
          <div className="space-y-3 mb-8">
            {equipoEditando.integrantes.map((alumno) => (
              <div
                key={alumno.id_alumno}
                className="bg-[#465d91] text-white p-4 rounded-lg flex justify-between items-center"
              >
                <span className="text-[15pt] font-semibold">
                  {alumno.nombre_completo} — {alumno.no_control}
                </span>
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => {
                      setEquipoEditando({
                        ...equipoEditando,
                        integrantes: equipoEditando.integrantes.filter(
                          (i) => i.id_alumno !== alumno.id_alumno
                        )
                      });
                      setElegibles([...elegibles, alumno]);
                    }}
                    className="bg-[#dce2f9] text-[#2e4578] px-4 py-1 rounded font-bold text-[13pt]"
                  >
                    Quitar
                  </button>

                  {otrosEquipos.length > 0 && (
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const destinoId = e.target.value;
                        if (!destinoId) return;
                        setEquipoEditando({
                          ...equipoEditando,
                          integrantes: equipoEditando.integrantes.filter(
                            (i) => i.id_alumno !== alumno.id_alumno
                          )
                        });
                        setEquipos(
                          equipos.map((eq) =>
                            String(eq.id) === destinoId
                              ? { ...eq, integrantes: [...eq.integrantes, alumno] }
                              : eq
                          )
                        );
                      }}
                      className="bg-[#dce2f9] text-[#2e4578] px-3 py-1 rounded font-bold text-[13pt]"
                    >
                      <option value="">Mover a...</option>
                      {otrosEquipos.map((otro) => (
                        <option key={otro.id} value={otro.id}>
                          {otro.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>

          {elegibles.length > 0 && (
            <div>
              <h3 className={`text-[18pt] font-bold text-[#2e4578] mb-3 ${theme.font}`}>
                Agregar alumnos elegibles sin equipo
              </h3>
              <div className="space-y-2">
                {elegibles.map((al) => (
                  <div
                    key={al.id_alumno}
                    className="bg-[#d9e2ff] text-[#2e4578] p-3 rounded-lg flex justify-between items-center"
                  >
                    <span className="text-[14pt] font-semibold">
                      {al.nombre_completo} ({al.no_control})
                    </span>
                    <button
                      onClick={() => {
                        setEquipoEditando({
                          ...equipoEditando,
                          integrantes: [...equipoEditando.integrantes, al]
                        });
                        setElegibles(elegibles.filter((e) => e.id_alumno !== al.id_alumno));
                      }}
                      className="bg-[#465d91] text-white px-4 py-1 rounded font-bold text-[13pt]"
                    >
                      + Agregar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          Equipos
        </button>
      </div>

      {/* Área Principal */}
      <div className="w-4/5 p-8 overflow-y-auto">
        <div className="relative flex items-center justify-center border-b-2 border-gray-300 pb-4 mb-6">
          <button
            onClick={() => setConfirmarSalir(true)}
            className="absolute left-0 flex items-center gap-1 text-[#465d91] font-bold text-[16pt] hover:text-[#2e4578]"
          >
            <ChevronLeft size={24} /> Volver
          </button>
          <h1 className={`text-[28pt] font-bold ${theme.textSuperficie} ${theme.font}`}>
            Equipos
          </h1>
        </div>

        <div className="flex gap-8 items-start">
          {/* Izquierda: Tarjetas de equipos + Alumnos elegibles */}
          <div className="w-3/4">
            {equipos.length === 0 ? (
              <p className="text-[16pt] text-gray-500 mb-8">No hay equipos formados aún.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {equipos.map((eq) => {
                  const seleccionado = equipoSeleccionadoId === eq.id;
                  return (
                    <div
                      key={eq.id}
                      onClick={() => setEquipoSeleccionadoId(eq.id)}
                      className={`p-6 rounded-xl text-white cursor-pointer transition shadow ${
                        seleccionado
                          ? 'bg-[#2e4578] ring-4 ring-blue-300'
                          : 'bg-[#465d91] hover:bg-[#2e4578]'
                      }`}
                    >
                      <h3 className={`text-[18pt] font-bold text-center mb-3 ${theme.font}`}>
                        {eq.nombre}
                      </h3>
                      <ul className="space-y-1 text-[14pt] text-center mb-3">
                        {eq.integrantes.map((m) => (
                          <li key={m.id_alumno}>{m.nombre_completo}</li>
                        ))}
                      </ul>
                      <p className="text-[13pt] text-blue-200 text-center font-bold">
                        Total de integrantes: {eq.integrantes.length}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <h2 className={`text-[20pt] font-bold text-[#2e4578] mb-3 ${theme.font}`}>
              Alumnos elegibles sin equipo ({elegibles.length})
            </h2>
            <div className="space-y-2">
              {elegibles.map((al) => (
                <div
                  key={al.id_alumno}
                  className="bg-[#465d91] text-white px-5 py-3 rounded-lg flex justify-between text-[14pt]"
                >
                  <span className="font-semibold">
                    {al.nombre_completo} ({al.no_control})
                  </span>
                  <span className="text-blue-200">Inscripción activa · Participa · Sin equipo</span>
                </div>
              ))}
            </div>
          </div>

          {/* Derecha: Botonera C.U.13 */}
          <div className="w-1/4 flex flex-col gap-3">
            <button
              onClick={iniciarFormacionAleatoria}
              className="bg-[#dce2f9] text-[#2e4578] border border-[#465d91] py-3 px-4 rounded-lg font-bold text-[15pt] hover:bg-blue-200"
            >
              Formar Equipos Aleatoriamente
            </button>
            <button
              disabled={!equipoSeleccionadoId}
              onClick={() => {
                const eq = equipos.find((e) => e.id === equipoSeleccionadoId);
                if (eq) setEquipoEditando({ ...eq });
              }}
              className="bg-[#dce2f9] text-[#2e4578] border border-[#465d91] py-3 px-4 rounded-lg font-bold text-[15pt] hover:bg-blue-200 disabled:opacity-40"
            >
              Modificar Equipo
            </button>
            <button
              disabled={!equipoSeleccionadoId}
              onClick={() => setModalEliminar(true)}
              className="bg-[#ffdad6] text-[#93000a] border border-[#93000a] py-3 px-4 rounded-lg font-bold text-[15pt] hover:bg-red-200 disabled:opacity-40"
            >
              Eliminar Equipo
            </button>
            <button
              onClick={() => setConfirmarSalir(true)}
              className="bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-bold text-[15pt] hover:bg-gray-300 mt-4"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* Modal Formar Equipos Aleatoriamente + Vista Previa (C.U.13 Pasos 4-7) */}
      {modalFormar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className={`${theme.bgContenedor} p-8 rounded-xl shadow-xl w-[560px] max-h-[85vh] overflow-y-auto`}>
            {!vistaPrevia ? (
              <div className="text-center">
                <h3 className={`text-[22pt] font-bold text-[#2e4578] mb-4 ${theme.font}`}>
                  Crear equipo
                </h3>
                <label className="block text-[15pt] text-[#2e4578] mb-2">
                  Número de integrantes por equipo (2 a 10):
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={tamanoEquipo}
                  onChange={(e) => setTamanoEquipo(e.target.value)}
                  className="w-40 p-2.5 border-2 border-gray-400 rounded-lg bg-white text-[18pt] text-center font-bold mb-6"
                />
                <div className="flex justify-center gap-4">
                  <button
                    onClick={generarVistaPrevia}
                    className="bg-[#465d91] text-white px-6 py-2.5 rounded-lg font-bold text-[15pt] hover:bg-[#2e4578]"
                  >
                    Generar Vista Previa
                  </button>
                  <button
                    onClick={() => setModalFormar(false)}
                    className="bg-gray-500 text-white px-6 py-2.5 rounded-lg font-bold text-[15pt]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className={`text-[22pt] font-bold text-center text-[#2e4578] mb-4 ${theme.font}`}>
                  Vista previa
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {vistaPrevia.map((vp) => (
                    <div key={vp.id} className="bg-[#465d91] text-white p-4 rounded-lg text-center">
                      <p className="font-bold text-[16pt] mb-2">{vp.nombre}</p>
                      <ul className="text-[13pt] space-y-1 mb-2">
                        {vp.integrantes.map((al) => (
                          <li key={al.id_alumno}>{al.nombre_completo}</li>
                        ))}
                      </ul>
                      <p className="text-[12pt] text-blue-200">
                        Total: {vp.integrantes.length}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={confirmarVistaPrevia}
                    className="bg-[#465d91] text-white px-5 py-2 rounded-lg font-bold text-[15pt]"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={generarVistaPrevia}
                    className="bg-[#575e71] text-white px-5 py-2 rounded-lg font-bold text-[15pt]"
                  >
                    Volver a Generar
                  </button>
                  <button
                    onClick={() => {
                      setVistaPrevia(null);
                      setModalFormar(false);
                    }}
                    className="bg-gray-500 text-white px-5 py-2 rounded-lg font-bold text-[15pt]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar Equipo (C.U.13 FA_05) */}
      {modalEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className={`${theme.bgContenedor} p-8 rounded-xl shadow-xl w-[440px] text-center`}>
            <h3 className={`text-[20pt] font-bold text-[#2e4578] mb-6 ${theme.font}`}>
              ¿Está seguro de eliminar este equipo?
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmarEliminarEquipo}
                className="bg-[#93000a] text-white px-8 py-2 rounded-lg font-bold text-[16pt]"
              >
                Sí
              </button>
              <button
                onClick={() => setModalEliminar(false)}
                className="bg-gray-500 text-white px-8 py-2 rounded-lg font-bold text-[16pt]"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Salir (C.U.13 FA_06) */}
      {confirmarSalir && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className={`${theme.bgContenedor} p-8 rounded-xl shadow-xl w-[420px] text-center`}>
            <h3 className={`text-[20pt] font-bold text-[#2e4578] mb-6 ${theme.font}`}>
              ¿Está seguro de que desea salir?
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={onVolver}
                className="bg-[#465d91] text-white px-8 py-2 rounded-lg font-bold text-[16pt]"
              >
                Sí
              </button>
              <button
                onClick={() => setConfirmarSalir(false)}
                className="bg-gray-500 text-white px-8 py-2 rounded-lg font-bold text-[16pt]"
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
            className={`p-8 rounded-xl shadow-xl w-[460px] text-center border-2 ${
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