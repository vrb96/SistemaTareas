import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';

export const ModalGestionAlumno = ({ accion, alumnoItem, setModalActual, onActualizacion }) => {
  const alumnoData = alumnoItem?.alumno || {};
  const [noControl, setNoControl] = useState('');
  const [nombre, setNombre] = useState('');
  const [apPaterno, setApPaterno] = useState('');
  const [apMaterno, setApMaterno] = useState('');
  const [correo, setCorreo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const esEditar = accion === 'EditarAlumno';
  const esEliminar = accion === 'EliminarAlumno';
  const esReactivar = accion === 'ReactivarAlumno';

  useEffect(() => {
    if (alumnoData) {
      const control = alumnoData.no_control || '';
      setNoControl(control);
      setNombre(alumnoData.nombre || '');
      setApPaterno(alumnoData.apellido_paterno || '');
      setApMaterno(alumnoData.apellido_materno || '');
      // Muestra el correo existente o genera el institucional automáticamente
      setCorreo(alumnoData.correo || (control ? `${control}@chilpancingo.itch.mx` : ''));
    }
  }, [alumnoItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      if (esEliminar) {
        // Baja lógica
        const { error: dbError } = await supabase
          .from('inscripcion_clase')
          .update({ estado_inscripcion: 'Inactiva' })
          .eq('id_inscripcion', alumnoItem.id_inscripcion);
        if (dbError) throw dbError;
      } else if (esReactivar) {
        // Reactivación
        const { error: dbError } = await supabase
          .from('inscripcion_clase')
          .update({ estado_inscripcion: 'Activa' })
          .eq('id_inscripcion', alumnoItem.id_inscripcion);
        if (dbError) throw dbError;
      } else if (esEditar) {
        if (!nombre.trim() || !apPaterno.trim()) {
          throw new Error('Nombre y Apellido Paterno son obligatorios');
        }

        const correoAGuardar = correo.trim() || `${noControl.trim()}@chilpancingo.itch.mx`;

        const { error: dbError } = await supabase
          .from('alumno')
          .update({
            nombre: nombre.trim(),
            apellido_paterno: apPaterno.trim(),
            apellido_materno: apMaterno.trim(),
            correo: correoAGuardar
          })
          .eq('no_control', noControl);
        if (dbError) throw dbError;
      }

      // Mostrar mensaje de confirmación antes de cerrar (CP-0005)[cite: 14]
      setExito(true);
      setTimeout(() => {
          if (onActualizacion) onActualizacion();
          setModalActual(null);
      }, 2000);

    } catch (err) {
      setError(err.message);
      setCargando(false);
    }
  };

  const getTitulo = () => {
    // Texto exacto requerido por el documento[cite: 14]
    if (esEliminar) return '¿Desea dar de Baja la inscripción del alumno en esta clase?';
    if (esReactivar) return '¿Desea Reactivar al siguiente Alumno?';
    return 'Editar Alumno';
  };

  const getMensajeExito = () => {
      if (esEliminar) return 'Inscripción dada de baja con éxito';
      if (esReactivar) return 'Alumno reactivado con éxito';
      return 'Alumno actualizado con éxito';
  };

  const getColorBoton = () => {
    if (esEliminar) return theme.bgError;
    if (esReactivar) return 'bg-green-600 hover:bg-green-700';
    return `${theme.bgPrimario} hover:bg-blue-800`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className={`${theme.bgContenedor} p-8 rounded-lg shadow-xl w-[500px] border border-gray-300 relative`}>
        <button
          onClick={() => setModalActual(null)}
          className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold"
        >
          <X size={24} />
        </button>

        <h2 className={`text-[16pt] font-bold mb-6 text-center ${esEliminar ? 'text-red-600' : theme.textContenedor} ${theme.font}`}>
          {getTitulo()}
        </h2>

        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">{error}</div>}
        {/* Mensaje de confirmación visual */}
        {exito && <div className="bg-green-200 text-green-800 font-bold p-3 rounded mb-4 text-center">{getMensajeExito()}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className={`text-[13pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Número de Control:</label>
            <input
              type="text"
              value={noControl}
              disabled
              className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-center text-[14pt] font-bold text-gray-600"
            />
          </div>

          <div>
            <label className={`text-[13pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Nombre:</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={!esEditar}
              className={`w-full p-2 border border-gray-400 rounded text-center text-[14pt] ${!esEditar ? 'bg-gray-100' : 'bg-white'}`}
            />
          </div>

          <div className="flex gap-2">
              <div className="w-1/2">
                <label className={`text-[13pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Apellido Paterno:</label>
                <input
                type="text"
                value={apPaterno}
                onChange={(e) => setApPaterno(e.target.value)}
                disabled={!esEditar}
                className={`w-full p-2 border border-gray-400 rounded text-center text-[14pt] ${!esEditar ? 'bg-gray-100' : 'bg-white'}`}
                />
              </div>
              <div className="w-1/2">
                <label className={`text-[13pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Apellido Materno:</label>
                <input
                type="text"
                value={apMaterno}
                onChange={(e) => setApMaterno(e.target.value)}
                disabled={!esEditar}
                className={`w-full p-2 border border-gray-400 rounded text-center text-[14pt] ${!esEditar ? 'bg-gray-100' : 'bg-white'}`}
                />
              </div>
          </div>

          <div>
            <label className={`text-[13pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Correo Institucional:</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={!esEditar}
              className={`w-full p-2 border border-gray-400 rounded text-center text-[14pt] ${!esEditar ? 'bg-gray-100' : 'bg-white'}`}
            />
          </div>

          <div className="flex justify-center gap-4 mt-4">
             {/* Botón Cancelar requerido por C.U.3 FA_02[cite: 14] */}
             <button 
                type="button"
                onClick={() => setModalActual(null)}
                disabled={cargando || exito}
                className="bg-gray-400 text-white text-[15pt] font-bold py-2 px-6 rounded hover:bg-gray-600 transition disabled:opacity-50"
             >
                Cancelar
             </button>
             <button
                type="submit"
                disabled={cargando || exito}
                className={`${getColorBoton()} ${theme.textPrimario} text-[15pt] font-bold py-2 px-6 rounded ${theme.font} transition disabled:opacity-50`}
             >
                {cargando ? 'Procesando...' : (esEliminar ? 'Dar de Baja' : esReactivar ? 'Reactivar Alumno' : 'Guardar Cambios')}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};