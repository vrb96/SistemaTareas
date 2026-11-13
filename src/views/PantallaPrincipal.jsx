import React, { useState, useEffect } from 'react';
import { Plus, Edit } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';
import iconoEliminar from '../assets/eliminar.svg';
import iconoEditar from '../assets/editar.svg';

export default function PantallaPrincipal({ setVistaActual, setModalActual, setClaseSeleccionada, actualizador }) {
  const [clases, setClases] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarClases = async () => {
      setCargando(true);
      const { data, error } = await supabase
        .from('clase')
        .select('*')
        .eq('estado_activacion', true);

      if (!error && data) {
        setClases(data);
      }
      setCargando(false);
    };
    cargarClases();
  }, [actualizador]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center border-b-2 border-gray-300 pb-4 mb-8">
        <h1 className={`text-[28pt] font-bold ${theme.textSuperficie} ${theme.font}`}>Clases</h1>
        <button onClick={() => setModalActual('CrearClase')}
          className={`${theme.bgPrimario} ${theme.textPrimario} px-4 py-2 rounded flex items-center gap-2 text-[16pt] font-bold ${theme.font} hover:bg-blue-800 transition`}>
          Agregar Clase
        </button>
      </div>

      {cargando ? (
        <p className="text-center text-[16pt] text-gray-500">Cargando clases...</p>
      ) : clases.length === 0 ? (
        <div className="text-center py-16">
          <p className={`text-[20pt] text-gray-600 ${theme.font}`}>No tienes asignaturas registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-8">
          {clases.map((clase) => (
            <div key={clase.id_clase}
              className={`${theme.bgContenedor} border border-gray-300 p-6 rounded-lg text-center shadow flex flex-col items-center cursor-pointer relative hover:shadow-lg transition`}
              onClick={() => {
                if (setClaseSeleccionada) setClaseSeleccionada(clase);
                setVistaActual('PantallaClase');
              }}>
              <h3 className={`text-[16pt] font-bold mb-2 ${theme.textContenedor} ${theme.font}`}>{clase.nombre}</h3>
              <p className={`text-[15pt] ${theme.textContenedor} ${theme.font}`}>Clave: {clase.clave}</p>
              <p className={`text-[15pt] ${theme.textContenedor} ${theme.font}`}>Grupo: {clase.grupo}</p>
              <p className={`text-[15pt] ${theme.textContenedor} ${theme.font}`}>Periodo: {clase.periodo_escolar}</p>

              <div className="absolute bottom-2 right-2 flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setClaseSeleccionada(clase);
                    setModalActual('EditarClase');
                  }}
                  className="hover:scale-110 transition text-blue-600"
                >
                  <img src={iconoEditar} alt="Editar" className="w-[22px] h-[22px]" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setClaseSeleccionada(clase);
                    setModalActual('EliminarClase');
                  }} 
                  className="hover:scale-110 transition text-[#465d91] hover:text-red-600"
                >
                  <img src={iconoEliminar} alt="Dar de baja" className="w-[22px] h-[22px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}