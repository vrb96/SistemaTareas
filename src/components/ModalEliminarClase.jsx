import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';

export const ModalEliminarClase = ({ claseSeleccionada, setModalActual, onActualizacion }) => {
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  const handleBaja = async () => {
    setCargando(true);
    setError('');
    
    try {
      // Se realiza la actualización a estado_activacion = false para cumplir la baja lógica
      const { error: updateError } = await supabase
        .from('clase')
        .update({ estado_activacion: false })
        .eq('id_clase', claseSeleccionada.id_clase);

      if (updateError) throw updateError;

      // Mensaje de confirmación exigido por las pruebas
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className={`${theme.bgContenedor} p-8 rounded-lg shadow-xl w-[500px] border border-gray-300 relative text-center`}>
        <button onClick={() => setModalActual(null)} className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold">
          <X size={24}/>
        </button>
        
        <div className="flex justify-center mb-4 text-[#93000a]">
            <AlertTriangle size={60} />
        </div>

        {/* Pregunta exacta del documento CP-0003 */}
        <h2 className={`text-[18pt] font-bold mb-6 ${theme.textContenedor} ${theme.font}`}>
          ¿Está seguro de dar de baja la clase?
        </h2>
        
        {error && <div className={`mb-4 p-3 rounded font-bold ${theme.bgError} ${theme.textError}`}>{error}</div>}
        {exito && <div className="mb-4 p-3 rounded font-bold bg-green-200 text-green-800">Clase dada de baja con éxito</div>}

        {!exito && (
            <div className="flex justify-center gap-6 mt-6">
              {/* Botones exactos solicitados "Sí" y "No" */}
              <button 
                onClick={handleBaja}
                disabled={cargando}
                className="bg-[#93000a] text-white text-[16pt] font-bold py-2 px-10 rounded hover:bg-red-800 transition disabled:opacity-50"
              >
                {cargando ? '...' : 'Sí'}
              </button>
              <button 
                onClick={() => setModalActual(null)}
                disabled={cargando}
                className={`${theme.bgPrimario} text-white text-[16pt] font-bold py-2 px-10 rounded hover:bg-blue-800 transition disabled:opacity-50`}
              >
                No
              </button>
            </div>
        )}
      </div>
    </div>
  );
};