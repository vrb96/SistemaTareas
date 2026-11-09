import React, { useState } from 'react';
import { X } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';

export const ModalRegistrarAlumno = ({ idClase, setModalActual, onAlumnoRegistrado }) => {
  const [noControl, setNoControl] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [correo, setCorreo] = useState(''); // <-- Nuevo estado para el correo
  
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    if (!noControl.trim() || !nombre.trim() || !apellidoPaterno.trim()) {
      setError('Faltan datos obligatorios (No. Control, Nombre, Apellido Paterno)');
      setCargando(false);
      return;
    }

    try {
      // 1. Insertar el alumno incluyendo el correo capturado
      const { error: alumnoError } = await supabase
        .from('alumno')
        .upsert([{
          no_control: noControl.trim(),
          nombre: nombre.trim(),
          apellido_paterno: apellidoPaterno.trim(),
          apellido_materno: apellidoMaterno.trim(),
          correo: correo.trim() || `${noControl.trim()}@ittixtla.edu.mx`
        }]);

      if (alumnoError) throw alumnoError;

      // 2. Inscribir al alumno a la clase actual
      const { error: inscripcionError } = await supabase
        .from('inscripcion_clase')
        .insert([{
          id_clase: idClase,
          no_control: noControl.no_control || noControl.trim(),
          estado_inscripcion: 'Activa',
          participacion: 'Si'
        }]);

      if (inscripcionError) throw inscripcionError;

      if (onAlumnoRegistrado) onAlumnoRegistrado();
      setModalActual(null);

    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className={`${theme.bgContenedor} p-8 rounded-lg shadow-xl w-[500px] border border-gray-300 relative`}>
        <button onClick={() => setModalActual(null)} className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold">
          <X size={24}/>
        </button>
        <h2 className={`text-[22pt] font-bold mb-6 text-center ${theme.textContenedor} ${theme.font}`}>Registrar Alumno</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Número de Control:</label>
            <input type="text" value={noControl} onChange={(e) => setNoControl(e.target.value)} placeholder="Ej. 20050012" 
                   className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" />
          </div>
          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Nombre:</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Carlos" 
                   className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" />
          </div>
          <div className="flex gap-2">
            <div className="w-1/2">
              <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Apellido Paterno:</label>
              <input type="text" value={apellidoPaterno} onChange={(e) => setApellidoPaterno(e.target.value)} placeholder="Paterno" 
                     className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" />
            </div>
            <div className="w-1/2">
              <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Apellido Materno:</label>
              <input type="text" value={apellidoMaterno} onChange={(e) => setApellidoMaterno(e.target.value)} placeholder="Materno" 
                     className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" />
            </div>
          </div>
          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Correo Institucional:</label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="Ej. alumno@ittixtla.edu.mx" 
                   className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" />
          </div>
          <button type="submit" disabled={cargando}
                  className={`${theme.bgPrimario} ${theme.textPrimario} text-[16pt] font-bold py-3 mt-4 rounded ${theme.font} disabled:opacity-50`}>
            {cargando ? 'Registrando...' : 'Registrar Alumno'}
          </button>
        </form>
      </div>
    </div>
  );
};