import React from 'react';
import { X, Upload, Download } from 'lucide-react';
import { theme } from '../theme';

export const ModalFormulario = ({ titulo, campos, botonTexto, colorBoton = theme.bgPrimario, setModalActual }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className={`${theme.bgContenedor} p-8 rounded-lg shadow-xl w-[500px] border border-gray-300 relative`}>
       <button onClick={() => setModalActual(null)} className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold"><X size={24}/></button>
      <h2 className={`text-[22pt] font-bold mb-6 text-center ${theme.textContenedor} ${theme.font}`}>{titulo}</h2>
      <div className="flex flex-col gap-4">
        {campos.map((campo, i) => (
          <div key={i}>
            <label className={`text-[15pt] ${theme.textContenedor} ${theme.font} block mb-1`}>{campo}</label>
            <input type="text" placeholder="XXXXXXXXX" className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" />
          </div>
        ))}
        <button className={`${colorBoton} ${theme.textPrimario} text-[16pt] font-bold py-3 mt-4 rounded ${theme.font}`} onClick={() => setModalActual(null)}>
          {botonTexto}
        </button>
      </div>
    </div>
  </div>
);

export const ModalArchivo = ({ setModalActual }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className={`${theme.bgContenedor} p-10 rounded-lg shadow-xl w-[500px] flex flex-col items-center relative`}>
      <button onClick={() => setModalActual(null)} className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold"><X size={24}/></button>
      <h2 className={`text-[22pt] font-bold mb-8 text-center ${theme.textContenedor} ${theme.font}`}>Agregue el archivo xlsx</h2>
      <Upload size={80} className={`mb-4 ${theme.textContenedor}`} />
      <p className={`text-[15pt] mb-6 ${theme.textContenedor} ${theme.font}`}>Límite de tamaño de archivo de 2 mb</p>
      <button onClick={() => setModalActual('ModalDescarga')} className={`${theme.bgPrimario} ${theme.textPrimario} px-6 py-2 rounded text-[16pt] font-bold ${theme.font}`}>Registrar alumnos</button>
    </div>
  </div>
);

export const ModalDescarga = ({ setModalActual }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className={`${theme.bgContenedor} p-10 rounded-lg shadow-xl w-[500px] flex flex-col items-center relative`}>
       <button onClick={() => setModalActual(null)} className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold"><X size={24}/></button>
      <h2 className={`text-[22pt] font-bold mb-4 text-center ${theme.textContenedor} ${theme.font}`}>Carga Masiva Exitosa</h2>
      <p className={`text-[15pt] mb-8 text-center ${theme.textContenedor} ${theme.font}`}>Descargar lista con las credenciales de los alumnos</p>
      <Download size={80} className={`mb-8 ${theme.textContenedor}`} />
      <button onClick={() => setModalActual(null)} className={`${theme.bgPrimario} ${theme.textPrimario} px-10 py-2 rounded text-[16pt] font-bold ${theme.font}`}>Salir</button>
    </div>
  </div>
);