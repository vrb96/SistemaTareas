import React, { useState } from 'react';
import { theme } from '../theme';

export default function PantallaLogin({ onLoginExitoso, mensajeInactividad = '' }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errorModal, setErrorModal] = useState(mensajeInactividad);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!correo.trim() || !contrasena.trim()) {
      setErrorModal('El correo y la contraseña son obligatorios');
      return;
    }
    // Simulación temporal para navegar mientras los operativos conectan Supabase Auth
    if (onLoginExitoso) {
      const rolDetectado = correo.toLowerCase().includes('alumno') ? 'Alumno' : 'Profesor';
      onLoginExitoso({ correo, rol: rolDetectado });
    }
  };

  return (
    <div className="min-h-screen flex bg-[#d9e2ff]">
      {/* Panel Izquierdo Institucional */}
      <div className="w-1/2 flex flex-col justify-center items-center p-12 border-r border-blue-200">
        <div className="w-36 h-36 rounded-full bg-[#465d91] text-white flex items-center justify-center text-4xl font-bold shadow-lg mb-6">
          TecNM
        </div>
        <h1 className={`text-[28pt] font-bold text-[#2e4578] text-center leading-tight ${theme.font}`}>
          TECNOLÓGICO NACIONAL DE MÉXICO
        </h1>
        <p className={`text-[16pt] text-[#465d91] mt-4 font-semibold ${theme.font}`}>
          Sistema Web de Gestión de Clases y Entregas
        </p>
      </div>

      {/* Panel Derecho: Formulario */}
      <div className="w-1/2 bg-white flex flex-col justify-center items-center p-12">
        <div className="w-full max-w-md">
          <h2 className={`text-[28pt] font-bold text-[#465d91] text-center mb-10 ${theme.font}`}>
            Control de Asignaturas
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className={`block text-[15pt] text-[#2e4578] mb-2 ${theme.font}`}>
                Correo institucional
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="usuario@chilpancingo.tecnm.mx"
                className="w-full p-3 border-2 border-gray-300 rounded-lg text-[16pt] focus:outline-none focus:border-[#465d91]"
              />
            </div>

            <div>
              <label className={`block text-[15pt] text-[#2e4578] mb-2 ${theme.font}`}>
                Contraseña
              </label>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 border-2 border-gray-300 rounded-lg text-[16pt] focus:outline-none focus:border-[#465d91]"
              />
            </div>

            <button
              type="submit"
              className={`${theme.bgPrimario} ${theme.textPrimario} py-3 rounded-lg text-[16pt] font-bold hover:bg-[#2e4578] transition mt-4 ${theme.font}`}
            >
              Iniciar sesión
            </button>
          </form>
        </div>
      </div>

      {/* Modal de Error / Inactividad (C.U.14 FA_01, FA_02, FA_03) */}
      {errorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-[#ffdad6] border-2 border-[#93000a] p-8 rounded-xl shadow-2xl w-[440px] text-center">
            <h3 className={`text-[22pt] font-bold text-[#93000a] mb-4 ${theme.font}`}>ERROR</h3>
            <p className={`text-[16pt] text-[#93000a] font-semibold mb-8 ${theme.font}`}>
              {errorModal}
            </p>
            <button
              onClick={() => setErrorModal('')}
              className="bg-[#93000a] text-white px-10 py-2 rounded-lg text-[16pt] font-bold hover:bg-red-900 transition"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}