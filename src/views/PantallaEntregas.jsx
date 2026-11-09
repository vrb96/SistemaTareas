//Pantalla Entregas
import React from 'react';
import { X, Edit, Trash2 } from 'lucide-react';
import { theme } from '../theme';

export default function PantallaEntregas({ setVistaActual, setModalActual }) {
  return (
    <div className="flex h-[calc(100vh-73px)]">
      <div className="w-1/5 border-r-2 border-gray-300 p-4 flex flex-col gap-4 bg-white">
        <button onClick={() => setVistaActual('PantallaAsignaciones')} className="text-xl font-bold mb-4 text-left hover:text-red-500"><X size={30}/></button>
        <button className={`${theme.bgPrimario} ${theme.textPrimario} py-2 rounded text-[16pt] font-bold text-center ${theme.font}`}>Entregas</button>
      </div>
      <div className="w-4/5 p-8">
        <div className="flex justify-between items-center mb-8 border-b-2 border-gray-300 pb-4">
            <h1 className={`text-[28pt] font-bold text-center w-full ${theme.textSuperficie} ${theme.font}`}>Titulo de la Asignacion</h1>
            <button onClick={() => setModalActual('CrearEntrega')} className={`${theme.bgPrimario} ${theme.textPrimario} px-4 py-2 rounded font-bold text-[16pt] absolute right-8 hover:bg-blue-800 ${theme.font}`}>Crear Entrega</button>
        </div>
        
        <div className={`${theme.bgPrimario} text-white p-4 rounded-lg flex justify-between items-center mb-4 shadow`}>
            <span className={`text-[16pt] font-bold ${theme.font}`}>Numero de Entrega</span>
            <span className={`text-[15pt] ${theme.font}`}>Fecha y Hora Limite</span>
            <span className={`text-[15pt] ${theme.font}`}>Numero de envios</span>
            <div className="flex gap-4">
                 <button onClick={() => setModalActual('EditarEntrega')} className="hover:text-blue-300"><Edit size={24}/></button>
                 <button onClick={() => setModalActual('EliminarEntrega')} className="hover:text-red-300"><Trash2 size={24}/></button>
            </div>
        </div>
      </div>
    </div>
  );
}