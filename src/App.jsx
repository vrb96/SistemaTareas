import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { theme } from './theme';
import PantallaPrincipal from './views/PantallaPrincipal';
import PantallaClase from './views/PantallaClase';
import PantallaAsignaciones from './views/PantallaAsignaciones';
import PantallaEntregas from './views/PantallaEntregas';
import { ModalCrearClase } from './components/ModalCrearClase';
import { ModalRegistrarAlumno } from './components/ModalRegistrarAlumno';
import { ModalCargaMasiva, ModalDescargaCredenciales } from './components/ModalCargaMasiva';
import { ModalAsignacion } from './components/ModalAsignacion';
import { ModalEntrega } from './components/ModalEntrega';
import { ModalEditarClase } from './components/ModalEditarClase';
import { ModalEliminarClase } from './components/ModalEliminarClase';
import { ModalGestionAlumno } from './components/ModalGestionAlumno';

export default function App() {
  const [vistaActual, setVistaActual] = useState('PantallaPrincipal');
  const [modalActual, setModalActual] = useState(null);
  const [claseSeleccionada, setClaseSeleccionada] = useState(null);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  const [entregaSeleccionada, setEntregaSeleccionada] = useState(null);
  const [entregasDeAsignacion, setEntregasDeAsignacion] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [actualizador, setActualizador] = useState(0);

  // Disparador de recarga de datos sin recargar el navegador
  const forzarActualizacion = () => setActualizador((prev) => prev + 1);

  return (
    <div className={`${theme.bgSuperficie} min-h-screen relative`}>
      {/* Barra Superior */}
      <div className="flex justify-between items-center p-4 border-b border-gray-300 bg-white">
        <div className="font-bold text-[20pt] text-[#465d91] flex items-center gap-3">
          <div className="w-10 h-10 bg-[#465d91] text-white rounded-full flex items-center justify-center font-bold">
            DL
          </div>
          SISTEMA GESTOR DE TAREAS
        </div>
        <div className="w-12 h-12 bg-blue-400 rounded-full flex justify-center items-center text-white shadow">
          <Users size={28} />
        </div>
      </div>

      {/* Ruteador de Vistas */}
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

      {/* Ruteador de Modales */}
      {modalActual === 'CrearClase' && (
        <ModalCrearClase
          setModalActual={setModalActual}
          onActualizacion={forzarActualizacion}
        />
      )}

      {modalActual === 'EditarClase' && (
        <ModalEditarClase
          claseAEditar={claseSeleccionada}
          setModalActual={setModalActual}
          onClaseActualizada={forzarActualizacion}
        />
      )}

      {modalActual === 'EliminarClase' && (
        <ModalEliminarClase
          claseSeleccionada={claseSeleccionada}
          setModalActual={setModalActual}
          onActualizacion={forzarActualizacion}
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
          onActualizacion={forzarActualizacion}
        />
      )}

      {modalActual === 'ModalDescarga' && (
        <ModalDescargaCredenciales setModalActual={setModalActual} />
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
    </div>
  );
}