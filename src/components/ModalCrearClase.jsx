import React, { useState } from 'react';
import { X } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';

export const ModalCrearClase = ({ setModalActual, onActualizacion }) => {
  const [nombre, setNombre] = useState('');
  const [clave, setClave] = useState('');
  const [grupo, setGrupo] = useState('');
  const [periodo, setPeriodo] = useState('Enero-Junio');
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    // 1. Validaciones obligatorias (CP-0001)[cite: 101]
    if (!nombre.trim() || !clave.trim() || !grupo.trim() || !anio.trim()) {
      setError('Faltan datos obligatorios por registrar');
      setCargando(false);
      return;
    }
    if (nombre.trim().length < 3 || nombre.trim().length > 100) {
      setError('El nombre debe tener entre 3 y 100 caracteres');
      setCargando(false);
      return;
    }
    if (!/^\d{4}$/.test(anio.trim()) || parseInt(anio.trim()) < 0) {
      setError('El año escolar debe ser un número positivo de exactamente 4 dígitos');
      setCargando(false);
      return;
    }

    const periodoEscolar = `${periodo} ${anio.trim()}`;

    try {
      // 2. Validación de duplicados en Supabase (CP-0002)[cite: 102]
      const { data: clasesDuplicadas, error: searchError } = await supabase
        .from('clase')
        .select('id_clase')
        .eq('uid_profesor', 'profesor-de-prueba-id')
        .eq('clave', clave.trim())
        .eq('grupo', grupo.trim())
        .eq('periodo_escolar', periodoEscolar)
        .eq('estado_activacion', true);

      if (searchError) throw searchError;

      if (clasesDuplicadas && clasesDuplicadas.length > 0) {
        throw new Error('Ya tienes una clase registrada con la misma clave, grupo y periodo escolar');
      }

      // 3. Inserción de la nueva clase
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

      // 4. Mostrar mensaje de éxito y cerrar (CP-0001)[cite: 101]
      setExito(true);
      setTimeout(() => {
        if (onActualizacion) onActualizacion();
        setModalActual(null);
      }, 2000);

    } catch (err) {
      setError(err.message); // Mostrará el mensaje de error de duplicidad[cite: 103]
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
        
        {/* Renderizado de mensajes de error con botón Aceptar según FA */}
        {error && (
          <div className={`mb-4 p-4 rounded text-center flex flex-col items-center gap-3 ${theme.bgError} ${theme.textError}`}>
            <span className="font-bold text-[14pt]">{error}</span>
            <button 
              type="button"
              onClick={() => setError('')} 
              className="bg-[#93000a] text-white px-6 py-2 rounded font-bold hover:bg-red-800 transition"
            >
              Aceptar
            </button>
          </div>
        )}
        {exito && <div className="mb-4 p-3 rounded text-center font-bold bg-green-200 text-green-800">Clase registrada con éxito</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Nombre de la clase:</label>
            <input 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              placeholder="Ej. Gestión de Proyectos" 
              className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" 
            />
          </div>
          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Clave:</label>
            <input 
              type="text" 
              value={clave} 
              onChange={(e) => setClave(e.target.value)} 
              placeholder="Ej. GP-1" 
              className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" 
            />
          </div>
          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Grupo:</label>
            <input 
              type="text" 
              value={grupo} 
              onChange={(e) => setGrupo(e.target.value)} 
              placeholder="Ej. 7A" 
              className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" 
            />
          </div>
          <div className="flex gap-4">
            <div className="w-2/3">
              <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Periodo:</label>
              <select 
                value={periodo} 
                onChange={(e) => setPeriodo(e.target.value)} 
                className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]"
              >
                <option value="Enero-Junio">Enero-Junio</option>
                <option value="Verano">Verano</option>
                <option value="Agosto-Diciembre">Agosto-Diciembre</option>
              </select>
            </div>
            <div className="w-1/3">
              <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Año:</label>
              <input 
                type="text" 
                value={anio} 
                onChange={(e) => setAnio(e.target.value)} 
                maxLength="4"
                className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" 
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={cargando || exito}
            className={`${theme.bgPrimario} ${theme.textPrimario} text-[16pt] font-bold py-3 mt-4 rounded ${theme.font} disabled:opacity-50`}
          >
            {cargando ? 'Guardando...' : 'Crear Clase'}
          </button>
        </form>
      </div>
    </div>
  );
};