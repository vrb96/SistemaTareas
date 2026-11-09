import React, { useState } from 'react';
import { X } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';

export const ModalCrearClase = ({ setModalActual }) => {
  const [nombre, setNombre] = useState('');
  const [clave, setClave] = useState('');
  const [grupo, setGrupo] = useState('');
  const [periodo, setPeriodo] = useState('Enero-Junio');
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    if (!nombre.trim() || !clave.trim() || !grupo.trim() || !anio.trim()) {
      setError('Faltan datos obligatorios');
      setCargando(false);
      return;
    }

    const periodoEscolar = `${periodo} ${anio}`;

    try {
      // Inserción directa sin validaciones complejas de sesión para garantizar velocidad
      const { error: insertError } = await supabase
        .from('clase')
        .insert([{
          uid_profesor: 'profesor-de-prueba-id',
          nombre: nombre.trim(),
          clave: clave.trim(),
          grupo: grupo.trim(),
          periodo_escolar: periodoEscolar,
          estado_activacion: true
        }]);

      if (insertError) throw insertError;

      // Cierra el modal y recarga la página para ver la clase reflejada de inmediato
      setModalActual(null);
      window.location.reload();

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
        <h2 className={`text-[22pt] font-bold mb-6 text-center ${theme.textContenedor} ${theme.font}`}>Crear Clase</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Nombre de la clase:</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Gestión de Proyectos" 
                   className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" />
          </div>
          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Clave:</label>
            <input type="text" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Ej. GP-1" 
                   className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" />
          </div>
          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Grupo:</label>
            <input type="text" value={grupo} onChange={(e) => setGrupo(e.target.value)} placeholder="Ej. 7A" 
                   className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" />
          </div>
          <div className="flex gap-4">
            <div className="w-2/3">
              <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Periodo:</label>
              <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} 
                      className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]">
                <option value="Enero-Junio">Enero-Junio</option>
                <option value="Verano">Verano</option>
                <option value="Agosto-Diciembre">Agosto-Diciembre</option>
              </select>
            </div>
            <div className="w-1/3">
              <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Año:</label>
              <input type="text" value={anio} onChange={(e) => setAnio(e.target.value)} maxLength="4"
                     className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" />
            </div>
          </div>
          <button type="submit" disabled={cargando}
                  className={`${theme.bgPrimario} ${theme.textPrimario} text-[16pt] font-bold py-3 mt-4 rounded ${theme.font} disabled:opacity-50`}>
            {cargando ? 'Guardando...' : 'Crear Clase'}
          </button>
        </form>
      </div>
    </div>
  );
};