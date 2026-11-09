import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { theme } from './theme';

// Importación de Vistas
import PantallaPrincipal from './views/PantallaPrincipal';
import PantallaClase from './views/PantallaClase';
import PantallaAsignaciones from './views/PantallaAsignaciones';
import PantallaEntregas from './views/PantallaEntregas';

// Importación de Modales
import { ModalCrearClase } from './components/ModalCrearClase';
import { ModalRegistrarAlumno } from './components/ModalRegistrarAlumno';
import { ModalCargaMasiva, ModalDescargaCredenciales } from './components/ModalCargaMasiva';
import { ModalAsignacion } from './components/ModalAsignacion';

export default function App() {
  const [vistaActual, setVistaActual] = useState('PantallaPrincipal');
  const [modalActual, setModalActual] = useState(null);
  const [claseSeleccionada, setClaseSeleccionada] = useState(null);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  const [rolTemporal, setRolTemporal] = useState('Profesor'); // 'Profesor' | 'Alumno' | 'Administrador'

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
        />
      )}

      {vistaActual === 'PantallaClase' && (
        <PantallaClase
          setVistaActual={setVistaActual}
          setModalActual={setModalActual}
          claseActual={claseSeleccionada}
        />
      )}

      {vistaActual === 'PantallaAsignaciones' && (
        <PantallaAsignaciones
          setVistaActual={setVistaActual}
          setModalActual={setModalActual}
          claseActual={claseSeleccionada}
          setAsignacionSeleccionada={setAsignacionSeleccionada}
        />
      )}

      {vistaActual === 'PantallaEntregas' && (
        <PantallaEntregas
          setVistaActual={setVistaActual}
          setModalActual={setModalActual}
          claseActual={claseSeleccionada}
          asignacionActual={asignacionSeleccionada}
        />
      )}

      {/* Ruteador de Modales */}
      {modalActual === 'CrearClase' && (
        <ModalCrearClase setModalActual={setModalActual} />
      )}

      {modalActual === 'RegistrarAlumno' && (
        <ModalRegistrarAlumno
          idClase={claseSeleccionada?.id_clase}
          setModalActual={setModalActual}
        />
      )}

      {modalActual === 'CargaMasiva' && (
        <ModalCargaMasiva
          idClase={claseSeleccionada?.id_clase}
          setModalActual={setModalActual}
        />
      )}

      {modalActual === 'ModalDescarga' && (
        <ModalDescargaCredenciales setModalActual={setModalActual} />
      )}

      {['CrearAsignacion', 'EditarAsignacion', 'EliminarAsignacion'].includes(modalActual) && (
        <ModalAsignacion
          accion={modalActual}
          idClase={claseSeleccionada?.id_clase}
          asignacionActual={asignacionSeleccionada}
          setModalActual={setModalActual}
        />
      )}
    </div>
  );
}