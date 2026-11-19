import React, { useState, useEffect } from 'react';
import { Users, KeyRound, LogOut } from 'lucide-react';
import { theme } from './theme';

// Vistas Iteración 1 (Profesor)
import PantallaPrincipal from './views/PantallaPrincipal';
import PantallaClase from './views/PantallaClase';
import PantallaAsignaciones from './views/PantallaAsignaciones';
import PantallaEntregas from './views/PantallaEntregas';

// Modales Iteración 1
import { ModalCrearClase } from './components/ModalCrearClase';
import { ModalEditarClase } from './components/ModalEditarClase';
import { ModalRegistrarAlumno } from './components/ModalRegistrarAlumno';
import { ModalCargaMasiva, ModalDescargaCredenciales } from './components/ModalCargaMasiva';
import { ModalGestionAlumno } from './components/ModalGestionAlumno';
import { ModalAsignacion } from './components/ModalAsignacion';
import { ModalEntrega } from './components/ModalEntrega';

// Vistas y Modales Iteración 2
import PantallaLogin from './views/PantallaLogin';
import ModalCambiarContrasena from './components/ModalCambiarContrasena';
import PantallaClasesAlumno from './views/PantallaClasesAlumno';
import PantallaAsignacionesAlumno from './views/PantallaAsignacionesAlumno';
import PantallaDetalleAsignacionAlumno from './views/PantallaDetalleAsignacionAlumno';
import PantallaEntregaAlumno from './views/PantallaEntregaAlumno';
import PantallaEnviosEntrega from './views/PantallaEnviosEntrega';
import PantallaCalificarEnvio from './views/PantallaCalificarEnvio';
import PantallaEquipos from './views/PantallaEquipos';

// Servicios reales (Iteración 2)
import {
  obtenerClasesAlumno,
  obtenerAsignacionesClase,
  obtenerEntregasAlumno,
  obtenerEquipoAlumnoEnClase
} from './services/alumnoConsultaService';
import {
  enviarArchivoEntrega,
  deshacerEnvioEntrega,
  descargarArchivoEnvio
} from './services/enviosService';
import {
  obtenerEnviosDeEntrega,
  compararEntregaConAnterior
} from './services/comparadorService';
import { obtenerComentariosEntrega } from './services/evaluacionesService';

const MOCK_EQUIPOS = [
  {
    id: 1,
    nombre: 'Equipo 1',
    integrantes: [
      { id_alumno: 1, no_control: '22520266', nombre_completo: 'Abelino Chana Carlos Rigoberto' }
    ]
  }
];

const MOCK_ELEGIBLES = [
  { id_alumno: 3, no_control: '22520191', nombre_completo: 'Armenta Ortega Jorge Armando' }
];

// Helper para extraer el número de entrega (1, 2, 3...) desde "Entrega 2" o la lista
function obtenerNumeroEntrega(entrega, listaEntregas = []) {
  if (!entrega) return 1;
  if (entrega.no_entrega) return Number(entrega.no_entrega);
  const match = String(entrega.numero_entrega || '').match(/\d+/);
  if (match) return Number(match[0]);
  const idx = listaEntregas.findIndex((e) => e.id_entrega === entrega.id_entrega);
  return idx >= 0 ? idx + 1 : 1;
}

// Helper para obtener no_control desde usuario.no_control o correo institucional
function obtenerNoControl(usuario) {
  if (usuario?.no_control) return usuario.no_control;
  if (!usuario?.correo) return '';
  return usuario.correo.split('@')[0].replace(/^l/i, '');
}

export default function App() {
  const [usuario, setUsuario] = useState({ correo: 'profesor@chilpancingo.tecnm.mx', rol: 'Profesor' });
  const [noControlPrueba, setNoControlPrueba] = useState('22520191');
  const [mensajeInactividad, setMensajeInactividad] = useState('');
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);

  // Navegación
  const [vistaActual, setVistaActual] = useState('PantallaPrincipal');
  const [modalActual, setModalActual] = useState(null);
  const [actualizador, setActualizador] = useState(0);

  // Selecciones Profesor
  const [claseSeleccionada, setClaseSeleccionada] = useState(null);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  const [entregaSeleccionada, setEntregaSeleccionada] = useState(null);
  const [entregasDeAsignacion, setEntregasDeAsignacion] = useState([]);
  const [alumnoEnvioSeleccionado, setAlumnoEnvioSeleccionado] = useState(null);

  // Estados reales C.U.11 (Profesor)
  const [listaEnviosProfesor, setListaEnviosProfesor] = useState([]);
  const [comparacionActual, setComparacionActual] = useState(null);
  const [cargandoComparacion, setCargandoComparacion] = useState(false);
  const [comentariosProfesor, setComentariosProfesor] = useState([]);

  // Selecciones y estados reales C.U.9 y C.U.10 (Alumno)
  const [clasesAlumno, setClasesAlumno] = useState([]);
  const [claseAlumnoSel, setClaseAlumnoSel] = useState(null);
  const [asignacionesAlumno, setAsignacionesAlumno] = useState([]);
  const [asignacionAlumnoSel, setAsignacionAlumnoSel] = useState(null);
  const [entregasAlumno, setEntregasAlumno] = useState([]);
  const [equipoAlumno, setEquipoAlumno] = useState(null);
  const [entregaAlumnoSel, setEntregaAlumnoSel] = useState(null);

  const forzarActualizacion = () => setActualizador((prev) => prev + 1);

  // C.U.14 FA_03: Cierre automático tras 30 minutos de inactividad
  useEffect(() => {
    if (!usuario) return;
    let timer;
    const reiniciarTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setUsuario(null);
        setMenuUsuarioAbierto(false);
        setMensajeInactividad('Tu sesión ha expirado por inactividad');
      }, 30 * 60 * 1000);
    };
    const eventos = ['mousemove', 'keydown', 'click', 'scroll'];
    eventos.forEach((ev) => window.addEventListener(ev, reiniciarTimer));
    reiniciarTimer();
    return () => {
      clearTimeout(timer);
      eventos.forEach((ev) => window.removeEventListener(ev, reiniciarTimer));
    };
  }, [usuario]);

  // --- CARGA REAL ALUMNO (C.U.9 y C.U.10) ---
  useEffect(() => {
    if (usuario?.rol !== 'Alumno' || vistaActual !== 'PantallaClasesAlumno') return;
    const noControl = obtenerNoControl(usuario);
    if (!noControl) return;
    obtenerClasesAlumno(noControl)
      .then(setClasesAlumno)
      .catch((err) => console.error('Error cargando clases del alumno:', err));
  }, [usuario, vistaActual, actualizador]);

  useEffect(() => {
    if (usuario?.rol !== 'Alumno' || vistaActual !== 'PantallaAsignacionesAlumno' || !claseAlumnoSel?.id_clase) return;
    obtenerAsignacionesClase(claseAlumnoSel.id_clase)
      .then(setAsignacionesAlumno)
      .catch((err) => console.error('Error cargando asignaciones:', err));
  }, [usuario, vistaActual, claseAlumnoSel, actualizador]);

  useEffect(() => {
    if (
      usuario?.rol !== 'Alumno' ||
      vistaActual !== 'PantallaDetalleAsignacionAlumno' ||
      !asignacionAlumnoSel?.id_asignacion
    ) return;
    const noControl = obtenerNoControl(usuario);
    Promise.all([
      obtenerEntregasAlumno(asignacionAlumnoSel.id_asignacion, noControl),
      claseAlumnoSel?.id_clase
        ? obtenerEquipoAlumnoEnClase(claseAlumnoSel.id_clase, noControl)
        : Promise.resolve(null)
    ])
      .then(([ents, eq]) => {
        setEntregasAlumno(ents);
        setEquipoAlumno(eq);
      })
      .catch((err) => console.error('Error cargando detalle de asignación:', err));
  }, [usuario, vistaActual, asignacionAlumnoSel, claseAlumnoSel, actualizador]);

  // --- CARGA REAL PROFESOR: C.U.11 (Lista de envíos) ---
  useEffect(() => {
    if (
      usuario?.rol !== 'Profesor' ||
      vistaActual !== 'PantallaEnviosEntrega' ||
      !claseSeleccionada?.id_clase ||
      !entregaSeleccionada?.id_entrega
    ) return;

    obtenerEnviosDeEntrega(claseSeleccionada.id_clase, entregaSeleccionada.id_entrega)
      .then(setListaEnviosProfesor)
      .catch((err) => console.error('Error cargando envíos de entrega:', err));
  }, [usuario, vistaActual, claseSeleccionada, entregaSeleccionada, actualizador]);

  // --- CARGA REAL PROFESOR: C.U.11 (Comparador .docx + Comentarios) ---
  useEffect(() => {
    if (
      usuario?.rol !== 'Profesor' ||
      vistaActual !== 'PantallaCalificarEnvio' ||
      !asignacionSeleccionada?.id_asignacion ||
      !entregaSeleccionada?.id_entrega ||
      !alumnoEnvioSeleccionado?.no_control
    ) return;

    setCargandoComparacion(true);
    setComparacionActual(null);

    Promise.all([
      compararEntregaConAnterior({
        idAsignacion: asignacionSeleccionada.id_asignacion,
        idEntregaActual: entregaSeleccionada.id_entrega,
        noControl: alumnoEnvioSeleccionado.no_control
      }),
      obtenerComentariosEntrega(entregaSeleccionada.id_entrega, alumnoEnvioSeleccionado.no_control)
    ])
      .then(([comp, coms]) => {
        setComparacionActual(comp);
        setComentariosProfesor(coms);
      })
      .catch((err) => console.error('Error ejecutando comparador:', err))
      .finally(() => setCargandoComparacion(false));
  }, [usuario, vistaActual, asignacionSeleccionada, entregaSeleccionada, alumnoEnvioSeleccionado]);

  if (!usuario) {
    return (
      <PantallaLogin
        mensajeInactividad={mensajeInactividad}
        onLoginExitoso={(user) => {
          setMensajeInactividad('');
          setUsuario(user);
          setVistaActual(user.rol === 'Alumno' ? 'PantallaClasesAlumno' : 'PantallaPrincipal');
        }}
      />
    );
  }

  // Objeto entrega normalizado para PantallaEnviosEntrega y PantallaCalificarEnvio
  const entregaNormalizada = entregaSeleccionada
    ? {
        ...entregaSeleccionada,
        no_entrega: obtenerNumeroEntrega(entregaSeleccionada, entregasDeAsignacion),
        fecha_hora_limite:
          entregaSeleccionada.fecha_hora_limite ||
          `${entregaSeleccionada.fecha_limite || ''} ${entregaSeleccionada.hora_limite?.slice(0, 5) || ''}`.trim(),
        estado_cierre: entregaSeleccionada.estado_cierre ? 'Cerrada' : 'Abierta'
      }
    : null;

  return (
    <div className={`${theme.bgSuperficie} min-h-screen relative`}>
      {/* Barra Superior */}
      <div className="flex justify-between items-center p-4 border-b border-gray-300 bg-white">
        <div
          onClick={() =>
            setVistaActual(usuario.rol === 'Alumno' ? 'PantallaClasesAlumno' : 'PantallaPrincipal')
          }
          className="font-bold text-[20pt] text-[#465d91] flex items-center gap-3 cursor-pointer"
        >
          <div className="w-10 h-10 bg-[#465d91] text-white rounded-full flex items-center justify-center font-bold">
            DL
          </div>
          SISTEMA GESTOR DE TAREAS
        </div>

        <div className="flex items-center gap-4 relative">
          <span className="text-[13pt] font-semibold text-gray-600 hidden md:inline">
            {usuario.correo} ({usuario.rol})
          </span>
          <button
            onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
            className="w-12 h-12 bg-[#465d91] hover:bg-[#2e4578] rounded-full flex justify-center items-center text-white shadow transition"
          >
            <Users size={26} />
          </button>

          {menuUsuarioAbierto && (
            <div className="absolute right-0 top-14 w-56 bg-[#575e71] text-white rounded-lg shadow-xl py-2 z-50 text-[14pt]">
              <button
                onClick={() => {
                  setMenuUsuarioAbierto(false);
                  setModalActual('CambiarContrasena');
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-600 flex items-center gap-2"
              >
                <KeyRound size={18} /> Cambiar contraseña
              </button>
              <button
                onClick={() => {
                  setMenuUsuarioAbierto(false);
                  setUsuario(null);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-600 flex items-center gap-2 border-t border-gray-500"
              >
                <LogOut size={18} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= VISTAS PROFESOR ================= */}
      {usuario.rol === 'Profesor' && (
        <>
          {vistaActual === 'PantallaPrincipal' && (
            <PantallaPrincipal
              setVistaActual={setVistaActual}
              setModalActual={setModalActual}
              setClaseSeleccionada={setClaseSeleccionada}
              actualizador={actualizador}
            />
          )}

          {vistaActual === 'PantallaClase' && (
            <PantallaClase
              setVistaActual={setVistaActual}
              setModalActual={setModalActual}
              claseActual={claseSeleccionada}
              setAlumnoSeleccionado={setAlumnoSeleccionado}
              actualizador={actualizador}
            />
          )}

          {vistaActual === 'PantallaAsignaciones' && (
            <PantallaAsignaciones
              setVistaActual={setVistaActual}
              setModalActual={setModalActual}
              claseActual={claseSeleccionada}
              setAsignacionSeleccionada={setAsignacionSeleccionada}
              actualizador={actualizador}
            />
          )}

          {vistaActual === 'PantallaEntregas' && (
            <PantallaEntregas
              setVistaActual={setVistaActual}
              setModalActual={setModalActual}
              asignacionActual={asignacionSeleccionada}
              setEntregaSeleccionada={setEntregaSeleccionada}
              setEntregasPadre={setEntregasDeAsignacion}
              actualizador={actualizador}
            />
          )}

          {vistaActual === 'PantallaEnviosEntrega' && (
            <PantallaEnviosEntrega
              entregaActual={entregaNormalizada}
              listaAlumnosEnvios={listaEnviosProfesor}
              onVolver={() => setVistaActual('PantallaEntregas')}
              onSeleccionarAlumno={(al) => {
                setAlumnoEnvioSeleccionado(al);
                setVistaActual('PantallaCalificarEnvio');
              }}
            />
          )}

          {vistaActual === 'PantallaCalificarEnvio' && (
            <PantallaCalificarEnvio
              key={`${entregaNormalizada?.id_entrega}-${alumnoEnvioSeleccionado?.no_control}`}
              entregaActual={entregaNormalizada}
              alumnoEnvio={alumnoEnvioSeleccionado}
              comparacion={
                cargandoComparacion
                  ? { titulo: 'Analizando documentos .docx...', omitidas: [], parrafos: [] }
                  : comparacionActual
              }
              comentariosIniciales={comentariosProfesor}
              onVolver={() => setVistaActual('PantallaEnviosEntrega')}
              onDescargarArchivo={async (al) => {
                try {
                  await descargarArchivoEnvio(al.ruta_storage, al.nombre_archivo);
                } catch (err) {
                  alert(err.message);
                }
              }}
            />
          )}

          {vistaActual === 'PantallaEquipos' && (
            <PantallaEquipos
              equiposIniciales={MOCK_EQUIPOS}
              alumnosElegiblesIniciales={MOCK_ELEGIBLES}
              totalAlumnosClase={6}
              onVolver={() => setVistaActual('PantallaClase')}
            />
          )}
        </>
      )}

      {/* ================= VISTAS ALUMNO (C.U.9 y C.U.10) ================= */}
      {usuario.rol === 'Alumno' && (
        <>
          {vistaActual === 'PantallaClasesAlumno' && (
            <PantallaClasesAlumno
              clases={clasesAlumno}
              onSeleccionarClase={(clase) => {
                setClaseAlumnoSel(clase);
                setVistaActual('PantallaAsignacionesAlumno');
              }}
            />
          )}

          {vistaActual === 'PantallaAsignacionesAlumno' && (
            <PantallaAsignacionesAlumno
              claseActual={claseAlumnoSel}
              asignaciones={asignacionesAlumno}
              onVolver={() => setVistaActual('PantallaClasesAlumno')}
              onSeleccionarAsignacion={(asig) => {
                setAsignacionAlumnoSel(asig);
                setVistaActual('PantallaDetalleAsignacionAlumno');
              }}
            />
          )}

          {vistaActual === 'PantallaDetalleAsignacionAlumno' && (
            <PantallaDetalleAsignacionAlumno
              asignacionActual={asignacionAlumnoSel}
              entregas={entregasAlumno}
              equipo={equipoAlumno}
              onVolver={() => setVistaActual('PantallaAsignacionesAlumno')}
              onSeleccionarEntrega={(ent) => {
                setEntregaAlumnoSel(ent);
                setVistaActual('PantallaEntregaAlumno');
              }}
            />
          )}

          {vistaActual === 'PantallaEntregaAlumno' && (
            <PantallaEntregaAlumno
              key={entregaAlumnoSel?.id_entrega}
              entregaActual={entregaAlumnoSel}
              comentarios={entregaAlumnoSel?.comentarios || []}
              onVolver={() => {
                forzarActualizacion();
                setVistaActual('PantallaDetalleAsignacionAlumno');
              }}
              onEnviarArchivo={async (archivo) => {
                await enviarArchivoEntrega({
                  idEntrega: entregaAlumnoSel.id_entrega,
                  noControl: obtenerNoControl(usuario),
                  archivo
                });
                forzarActualizacion();
              }}
              onDeshacerEnvio={async () => {
                await deshacerEnvioEntrega(
                  entregaAlumnoSel.id_entrega,
                  obtenerNoControl(usuario)
                );
                forzarActualizacion();
              }}
            />
          )}
        </>
      )}

      {/* ================= MODALES ================= */}
      {modalActual === 'CambiarContrasena' && (
        <ModalCambiarContrasena setModalActual={setModalActual} />
      )}

      {modalActual === 'CrearClase' && (
        <ModalCrearClase setModalActual={setModalActual} onActualizacion={forzarActualizacion} />
      )}

      {modalActual === 'EditarClase' && (
        <ModalEditarClase
          claseAEditar={claseSeleccionada}
          setModalActual={setModalActual}
          onClaseActualizada={forzarActualizacion}
        />
      )}

      {modalActual === 'RegistrarAlumno' && (
        <ModalRegistrarAlumno
          idClase={claseSeleccionada?.id_clase}
          setModalActual={setModalActual}
          onActualizacion={forzarActualizacion}
        />
      )}

      {modalActual === 'CargaMasiva' && (
        <ModalCargaMasiva
          idClase={claseSeleccionada?.id_clase}
          setModalActual={setModalActual}
        />
      )}

      {modalActual === 'ModalDescarga' && (
        <ModalDescargaCredenciales
          setModalActual={setModalActual}
          onActualizacion={forzarActualizacion}
        />
      )}

      {['EditarAlumno', 'EliminarAlumno', 'ReactivarAlumno'].includes(modalActual) && (
        <ModalGestionAlumno
          accion={modalActual}
          alumnoItem={alumnoSeleccionado}
          idClase={claseSeleccionada?.id_clase}
          setModalActual={setModalActual}
          onActualizacion={forzarActualizacion}
        />
      )}

      {['CrearAsignacion', 'EditarAsignacion', 'EliminarAsignacion'].includes(modalActual) && (
        <ModalAsignacion
          accion={modalActual}
          idClase={claseSeleccionada?.id_clase}
          asignacionActual={asignacionSeleccionada}
          setModalActual={setModalActual}
          onActualizacion={forzarActualizacion}
        />
      )}

      {['CrearEntrega', 'EditarEntrega', 'EliminarEntrega'].includes(modalActual) && (
        <ModalEntrega
          accion={modalActual}
          idAsignacion={asignacionSeleccionada?.id_asignacion}
          entregaActual={entregaSeleccionada}
          todasLasEntregas={entregasDeAsignacion}
          setModalActual={setModalActual}
          onActualizacion={forzarActualizacion}
        />
      )}

      {/* Barra Flotante de Pruebas Rápidas (Profesor / Alumno por No. Control) */}
      <div className="fixed bottom-4 left-4 bg-[#2e4578] text-white p-3 rounded-xl shadow-2xl z-50 flex flex-wrap items-center gap-2 text-[12pt] border border-blue-300">
        <span className="font-bold mr-1">Pruebas:</span>
        <button
          onClick={() => {
            setUsuario({ correo: 'profesor@chilpancingo.tecnm.mx', rol: 'Profesor' });
            setVistaActual('PantallaPrincipal');
          }}
          className="bg-blue-500 px-2.5 py-1 rounded font-bold hover:bg-blue-600"
        >
          Prof: Inicio
        </button>
        <input
          type="text"
          value={noControlPrueba}
          onChange={(e) => setNoControlPrueba(e.target.value)}
          placeholder="No. Control"
          className="w-28 px-2 py-1 rounded text-black font-semibold text-[11pt]"
          title="Número de control del alumno inscrito en la clase"
        />
        <button
          onClick={() => {
            setUsuario({
              no_control: noControlPrueba.trim(),
              correo: `l${noControlPrueba.trim()}@chilpancingo.tecnm.mx`,
              rol: 'Alumno'
            });
            setVistaActual('PantallaClasesAlumno');
          }}
          className="bg-emerald-600 px-2.5 py-1 rounded font-bold hover:bg-emerald-700"
        >
          Entrar Alumno
        </button>
      </div>
    </div>
  );
}