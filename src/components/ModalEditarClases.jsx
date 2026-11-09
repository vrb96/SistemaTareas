import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supabaseClient'; // Ajusta la ruta

export const ModalEditarClase = ({ claseAEditar, setModalActual, onClaseActualizada }) => {
  // Inicializamos los estados con los datos de la clase seleccionada (si existen)
  const [nombre, setNombre] = useState(claseAEditar?.nombre || '');
  const [clave, setClave] = useState(claseAEditar?.clave || '');
  const [grupo, setGrupo] = useState(claseAEditar?.grupo || '');
  
  // Extraer periodo y año del campo 'periodo_escolar' (ej: "Enero-Junio 2026")
  const [periodo, setPeriodo] = useState('Enero-Junio');
  const [anio, setAnio] = useState(new Date().getFullYear().toString());

  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (claseAEditar?.periodo_escolar) {
      const partes = claseAEditar.periodo_escolar.split(' ');
      if (partes.length === 2) {
        setPeriodo(partes[0]);
        setAnio(partes[1]);
      }
    }
  }, [claseAEditar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);

    // FA_01: Validación de datos obligatorios faltantes
    if (!nombre.trim() || !clave.trim() || !grupo.trim() || !anio.trim()) {
      setError('Faltan datos obligatorios por registrar');
      setCargando(false);
      return;
    }

    // FA_03: Validación de longitudes permitidas
    if (
      nombre.length < 3 || nombre.length > 100 ||
      clave.length < 1 || clave.length > 20 ||
      grupo.length < 1 || grupo.length > 10 ||
      anio.length !== 4
    ) {
      setError('Longitud excedida, corrige los datos ingresados');
      setCargando(false);
      return;
    }

    const periodoEscolar = `${periodo} ${anio}`;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('No hay una sesión activa de profesor.');

      // FA_02: Validar duplicidad (excluyendo la clase actual que estamos editando)
      const { data: duplicada, error: dupError } = await supabase
        .from('clase')
        .select('id_clase')
        .eq('uid_profesor', user.id)
        .eq('clave', clave.trim())
        .eq('grupo', grupo.trim())
        .eq('periodo_escolar', periodoEscolar)
        .eq('estado_activacion', true)
        .neq('id_clase', claseAEditar.id_clase); // Ignorar la clase actual

      if (dupError) throw dupError;
      
      if (duplicada && duplicada.length > 0) {
        setError('Ya tienes registrada una clase activa con la misma clave, grupo y periodo');
        setCargando(false);
        return;
      }

      // Flujo Básico: Actualizar la clase en la base de datos
      const { error: updateError } = await supabase
        .from('clase')
        .update({
          nombre: nombre.trim(),
          clave: clave.trim(),
          grupo: grupo.trim(),
          periodo_escolar: periodoEscolar,
        })
        .eq('id_clase', claseAEditar.id_clase);

      if (updateError) throw updateError;

      setMensaje('Clase actualizada con éxito');
      
      if (onClaseActualizada) onClaseActualizada();

      setTimeout(() => {
        setModalActual(null);
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className={`${theme.bgContenedor} p-8 rounded-lg shadow-xl w-[500px] border border-gray-300 relative`}>
        <button 
          onClick={() => setModalActual(null)} 
          className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold"
        >
          <X size={24}/>
        </button>
        
        <h2 className={`text-[22pt] font-bold mb-6 text-center ${theme.textContenedor} ${theme.font}`}>
          Editar Clase
        </h2>
        
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">{error}</div>}
        {mensaje && <div className="bg-green-100 text-green-700 p-2 rounded mb-4 text-center">{mensaje}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Nombre de la clase:</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} 
                   className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" />
          </div>
          
          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Clave:</label>
            <input type="text" value={clave} onChange={(e) => setClave(e.target.value)} 
                   className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" />
          </div>

          <div>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Grupo:</label>
            <input type="text" value={grupo} onChange={(e) => setGrupo(e.target.value)} 
                   className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" />
          </div>

          <div className="flex gap-4">
            <div className="w-2/3">
              <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Periodo:</label>
              <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} 
                      className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]">
                <option value="Enero-Junio">Enero-Junio</option>
                <option value="Agosto-Diciembre">Agosto-Diciembre</option>
              </select>
            </div>
            <div className="w-1/3">
              <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>Año:</label>
              <input type="text" value={anio} onChange={(e) => setAnio(e.target.value)} maxLength="4"
                     className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className={`${theme.bgPrimario} ${theme.textPrimario} text-[16pt] font-bold py-3 mt-4 rounded ${theme.font} disabled:opacity-50`}
          >
            {cargando ? 'Procesando...' : 'Editar Clase'}
          </button>
        </form>
      </div>
    </div>
  );
};