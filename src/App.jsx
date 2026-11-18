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

// Vistas y Modales Iteración 2 (C.U.9 - C.U.14)
import PantallaLogin from './views/PantallaLogin';
import ModalCambiarContrasena from './components/ModalCambiarContrasena';
import PantallaClasesAlumno from './views/PantallaClasesAlumno';
import PantallaAsignacionesAlumno from './views/PantallaAsignacionesAlumno';
import PantallaDetalleAsignacionAlumno from './views/PantallaDetalleAsignacionAlumno';
import PantallaEntregaAlumno from './views/PantallaEntregaAlumno';
import PantallaEnviosEntrega from './views/PantallaEnviosEntrega';
import PantallaCalificarEnvio from './views/PantallaCalificarEnvio';
import PantallaEquipos from './views/PantallaEquipos';

// Datos simulados para probar todas las interfaces de la Iteración 2 al instante
const MOCK_CLASES_ALUMNO = [
  {
    id_clase: 1,
    nombre: 'Ingeniería de Software',
    clave: 'ISW-101',
    grupo: '7A',
    periodo_escolar: 'Agosto-Diciembre 2026',
    nombre_profesor: 'Jesús Pablo Damián Nava'
  },
  {
    id_clase: 2,
    nombre: 'Programación Web',
    clave: 'WEB-202',
    grupo: '7B',
    periodo_escolar: 'Agosto-Diciembre 2026',
    nombre_profesor: 'Carmen Elizabeth Guzmán Ramírez'
  }
];

const MOCK_ASIGNACIONES_ALUMNO = [
  {
    id_asignacion: 10,
    titulo: 'Proyecto Final - Iteración 2',
    descripcion: 'Desarrollo del sistema web con control de entregas y equipos.'
  },
  {
    id_asignacion: 11,
    titulo: 'Documentación IEEE 830',
    descripcion: 'Especificación formal de requisitos y casos de uso.'
  }
];

const MOCK_ENTREGAS_ALUMNO = [
  {
    id_entrega: 101,
    no_entrega: 1,
    instrucciones: 'Subir diagrama de dominio y diccionario de clases en PDF o DOCX.',
    fecha_hora_limite: '2026-11-20 23:59',
    estado_cierre: 'Abierta',
    estado_envio: 'Sin enviar',
    calificacion: null
  },
  {
    id_entrega: 102,
    no_entrega: 2,
    instrucciones: 'Subir prototipo funcional completo.',
    fecha_hora_limite: '2026-11-28 23:59',
    estado_cierre: 'Abierta',
    estado_envio: 'Enviado',
    nombre_archivo: 'Avance_Iteracion2.docx',
    fecha_hora_envio: '2026-11-18 09:15',
    calificacion: 95
  }
];

const MOCK_ENVIOS_PROFESOR = [
  {
    id_alumno: 1,
    no_control: '22520266',
    nombre_completo: 'Abelino Chana Carlos Rigoberto',
    estado_envio: 'Enviado',
    fecha_hora_envio: '2026-11-18 08:40',
    nombre_archivo: 'SRS_Iteracion2_Carlos.docx',
    calificacion: 92
  },
  {
    id_alumno: 2,
    no_control: '22520229',
    nombre_completo: 'Alarcón Monroy Samuel David',
    estado_envio: 'Sin enviar',
    fecha_hora_envio: null,
    nombre_archivo: null,
    calificacion: null
  },
  {
    id_alumno: 3,
    no_control: '22520191',
    nombre_completo: 'Armenta Ortega Jorge Armando',
    estado_envio: 'Enviado',
    fecha_hora_envio: '2026-11-18 09:10',
    nombre_archivo: 'SRS_Iteracion2_Jorge.pdf',
    calificacion: null
  }
];

const MOCK_COMPARACION = {
  titulo: 'Comparado contra Entrega 1',
  omitidas: [],
  sinCambios: false,
  parrafos: [
    {
      tokens: [
        { tipo: 'igual', texto: 'El sistema web permitirá a los docentes' },
        { tipo: 'eliminado', texto: 'registrar materias manualmente' },
        { tipo: 'agregado', texto: 'gestionar múltiples asignaturas y equipos equitativos' },
        { tipo: 'igual', texto: 'con cierre automático por fecha límite.' }
      ]
    }
  ]
};

const MOCK_EQUIPOS = [
  {
    id: 1,
    nombre: 'Equipo 1',
    integrantes: [
      { id_alumno: 1, no_control: '22520266', nombre_completo: 'Abelino Chana Carlos Rigoberto' },
      { id_alumno: 2, no_control: '22520229', nombre_completo: 'Alarcón Monroy Samuel David' }
    ]
  }
];

const MOCK_ELEGIBLES = [
  { id_alumno: 3, no_control: '22520191', nombre_completo: 'Armenta Ortega Jorge Armando' },
  { id_alumno: 4, no_control: '22520230', nombre_completo: 'Barragán Duque José Emmanuel' },
  { id_alumno: 5, no_control: '23520382', nombre_completo: 'Baños Gutiérrez Maximiliano' },
  { id_alumno: 6, no_control: '22520401', nombre_completo: 'Guzmán Ramírez Carmen Elizabeth' }
];

export default function App() {
  // Sesión (C.U.14) - Arranca en Profesor para pruebas directas, o cámbialo a null para iniciar en Login
  const [usuario, setUsuario] = useState({ correo: 'profesor@chilpancingo.tecnm.mx', rol: 'Profesor' });
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

  // Selecciones Alumno
  const [claseAlumnoSel, setClaseAlumnoSel] = useState(null);
  const [asignacionAlumnoSel, setAsignacionAlumnoSel] = useState(null);
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

  // Si no hay sesión, mostrar Login (C.U.14)
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

  return (
    <div className={`${theme.bgSuperficie} min-h-screen relative`}>
      {/* Barra Superior Institucional con Menú de Usuario (C.U.14) */}
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
              entregaActual={entregaSeleccionada || { no_entrega: 2, fecha_hora_limite: '2026-11-28 23:59' }}
              listaAlumnosEnvios={MOCK_ENVIOS_PROFESOR}
              onVolver={() => setVistaActual('PantallaEntregas')}
              onSeleccionarAlumno={(al) => {
                setAlumnoEnvioSeleccionado(al);
                setVistaActual('PantallaCalificarEnvio');
              }}
            />
          )}

          {vistaActual === 'PantallaCalificarEnvio' && (
            <PantallaCalificarEnvio
              entregaActual={entregaSeleccionada || { no_entrega: 2, fecha_hora_limite: '2026-11-28 23:59' }}
              alumnoEnvio={alumnoEnvioSeleccionado || MOCK_ENVIOS_PROFESOR[0]}
              comparacion={MOCK_COMPARACION}
              comentariosIniciales={[
                { id: 1, fecha: '18/11/2026 09:30', texto: 'Buen avance en el diagrama de dominio.' }
              ]}
              onVolver={() => setVistaActual('PantallaEnviosEntrega')}
              onDescargarArchivo={(al) => alert(`Descargando ${al.nombre_archivo}...`)}
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

      {/* ================= VISTAS ALUMNO (C.U.9 - C.U.10) ================= */}
      {usuario.rol === 'Alumno' && (
        <>
          {vistaActual === 'PantallaClasesAlumno' && (
            <PantallaClasesAlumno
              clases={MOCK_CLASES_ALUMNO}
              onSeleccionarClase={(clase) => {
                setClaseAlumnoSel(clase);
                setVistaActual('PantallaAsignacionesAlumno');
              }}
            />
          )}

          {vistaActual === 'PantallaAsignacionesAlumno' && (
            <PantallaAsignacionesAlumno
              claseActual={claseAlumnoSel}
              asignaciones={MOCK_ASIGNACIONES_ALUMNO}
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
              entregas={MOCK_ENTREGAS_ALUMNO}
              equipo={{
                nombre: 'Equipo 1',
                integrantes: ['Carlos Rigoberto Abelino Chana', 'Samuel David Alarcón Monroy']
              }}
              onVolver={() => setVistaActual('PantallaAsignacionesAlumno')}
              onSeleccionarEntrega={(ent) => {
                setEntregaAlumnoSel(ent);
                setVistaActual('PantallaEntregaAlumno');
              }}
            />
          )}

          {vistaActual === 'PantallaEntregaAlumno' && (
            <PantallaEntregaAlumno
              entregaActual={entregaAlumnoSel}
              comentarios={[
                { fecha: '18/11/2026 09:20', texto: 'Recuerden incluir las tablas de trazabilidad.' }
              ]}
              onVolver={() => setVistaActual('PantallaDetalleAsignacionAlumno')}
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

      {/* Barra Flotante de Pruebas Rápidas de UI (Quitar cuando los operativos conecten Supabase) */}
      <div className="fixed bottom-4 left-4 bg-[#2e4578] text-white p-3 rounded-xl shadow-2xl z-50 flex flex-wrap items-center gap-2 text-[12pt] border border-blue-300">
        <span className="font-bold mr-1">Probar UI:</span>
        <button
          onClick={() => setUsuario(null)}
          className="bg-white text-[#2e4578] px-2.5 py-1 rounded font-bold hover:bg-blue-100"
        >
          Login
        </button>
        <button
          onClick={() => {
            setUsuario({ correo: 'profesor@chilpancingo.tecnm.mx', rol: 'Profesor' });
            setVistaActual('PantallaPrincipal');
          }}
          className="bg-blue-500 px-2.5 py-1 rounded font-bold hover:bg-blue-600"
        >
          Prof: Inicio
        </button>
        <button
          onClick={() => {
            setUsuario({ correo: 'profesor@chilpancingo.tecnm.mx', rol: 'Profesor' });
            setVistaActual('PantallaEquipos');
          }}
          className="bg-blue-500 px-2.5 py-1 rounded font-bold hover:bg-blue-600"
        >
          Prof: Equipos
        </button>
        <button
          onClick={() => {
            setUsuario({ correo: 'profesor@chilpancingo.tecnm.mx', rol: 'Profesor' });
            setVistaActual('PantallaEnviosEntrega');
          }}
          className="bg-blue-500 px-2.5 py-1 rounded font-bold hover:bg-blue-600"
        >
          Prof: Envíos/Calif
        </button>
        <button
          onClick={() => {
            setUsuario({ correo: '22520266@chilpancingo.tecnm.mx', rol: 'Alumno' });
            setVistaActual('PantallaClasesAlumno');
          }}
          className="bg-emerald-600 px-2.5 py-1 rounded font-bold hover:bg-emerald-700"
        >
          Alumno
        </button>
      </div>
    </div>
  );
}