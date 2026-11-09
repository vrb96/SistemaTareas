import React, { useState, useEffect } from 'react';
import { X, Edit, Trash2, UserCheck } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';

export default function PantallaClase({ setVistaActual, setModalActual, claseActual }) {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarAlumnos = async () => {
    if (!claseActual?.id_clase) return;
    setCargando(true);
    
    // Consulta limpia y directa
    const { data, error } = await supabase
      .from('inscripcion_clase')
      .select(`
        id_inscripcion,
        estado_inscripcion,
        participacion,
        alumno (
          no_control,
          nombre,
          apellido_paterno,
          apellido_materno,
          correo
        )
      `)
      .eq('id_clase', claseActual.id_clase)
      .eq('estado_inscripcion', 'Activa'); // Solo alumnos activos

    if (!error && data) {
      setAlumnos(data);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarAlumnos();
  }, [claseActual]);

  return (
    <div className="flex h-[calc(100vh-73px)]">
      <div className="w-1/5 border-r-2 border-gray-300 p-4 flex flex-col gap-4 bg-white">
        <button onClick={() => setVistaActual('PantallaPrincipal')} className="text-xl font-bold mb-4 text-left hover:text-red-500"><X size={30}/></button>
        <button className={`${theme.bgPrimario} ${theme.textPrimario} py-2 rounded text-[16pt] font-bold text-center ${theme.font}`}>Alumno</button>
        <button onClick={() => setVistaActual('PantallaAsignaciones')} className={`bg-gray-400 text-white py-2 rounded text-[16pt] font-bold text-center hover:bg-[#465d91] transition ${theme.font}`}>Asignaciones</button>
      </div>
      <div className="w-4/5 p-8 overflow-y-auto">
        <h1 className={`text-[28pt] font-bold mb-8 text-center ${theme.textSuperficie} ${theme.font}`}>
          {claseActual?.nombre || 'Nombre de la Clase'}
        </h1>
        
        <div className="flex justify-between mb-6 gap-4">
          <input type="text" placeholder="Ingrese Numero Control o Nombre" className="border border-gray-400 p-2 rounded w-1/3 text-[15pt] px-4" />
          <button onClick={() => setModalActual('RegistrarAlumno')} className={`${theme.bgPrimario} ${theme.textPrimario} px-4 py-2 rounded font-bold text-[16pt] hover:bg-blue-800 transition ${theme.font}`}>Registrar Alumno</button>
          <button onClick={() => setModalActual('CargaMasiva')} className={`${theme.bgPrimario} ${theme.textPrimario} px-4 py-2 rounded font-bold text-[16pt] hover:bg-blue-800 transition ${theme.font}`}>Carga Masiva Alumno</button>
        </div>

        {cargando ? (
          <p className="text-center text-[16pt] text-gray-500">Cargando alumnos...</p>
        ) : alumnos.length === 0 ? (
          <p className="text-center text-[18pt] text-gray-600 py-12">No hay alumnos inscritos en esta clase</p>
        ) : (
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr className={`${theme.bgContenedor} ${theme.textContenedor} text-[15pt] ${theme.font}`}>
                <th className="border border-gray-400 p-2">Número Control</th>
                <th className="border border-gray-400 p-2">Nombre</th>
                <th className="border border-gray-400 p-2">Apellido Paterno</th>
                <th className="border border-gray-400 p-2">Apellido Materno</th>
                <th className="border border-gray-400 p-2">Correo Institucional</th>
                <th className="border border-gray-400 p-2">Estado Inscripción</th>
                <th className="border border-gray-400 p-2">Participación</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((item) => (
                <tr key={item.id_inscripcion} className="text-center text-[15pt] text-gray-700 bg-white">
                  <td className="border border-gray-400 p-2">{item.alumno?.no_control}</td>
                  <td className="border border-gray-400 p-2">{item.alumno?.nombre}</td>
                  <td className="border border-gray-400 p-2">{item.alumno?.apellido_paterno}</td>
                  <td className="border border-gray-400 p-2">{item.alumno?.apellido_materno || '-'}</td>
                  <td className="border border-gray-400 p-2">{item.alumno?.correo}</td>
                  <td className="border border-gray-400 p-2">{item.estado_inscripcion}</td>
                  <td className="border border-gray-400 p-2">{item.participacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}