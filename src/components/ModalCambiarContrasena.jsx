import React, { useState } from 'react';
import { X } from 'lucide-react';
import { theme } from '../theme';

export default function ModalCambiarContrasena({
  setModalActual,
  onActualizarContrasena,
  obligatorio = false, // RF007: primer inicio de sesión con cambio pendiente (no se puede cerrar)
  onCompletado
}) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cerrar = () => {
    if (exito && onCompletado) onCompletado();
    setModalActual(null);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError('');

    if (!actual || !nueva || !confirmar) {
      setError('Todos los campos son obligatorios');
      return;
    }
    if (nueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (nueva === actual) {
      setError('La nueva contraseña debe ser distinta de la actual');
      return;
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setGuardando(true);
    try {
      if (onActualizarContrasena) {
        await onActualizarContrasena({ actual, nueva });
      }
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la contraseña');
      return;
    } finally {
      setGuardando(false);
    }
    setExito(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className={`${theme.bgContenedor} p-8 rounded-xl shadow-xl w-[480px] relative border border-gray-300`}>
        {(!obligatorio || exito) && (
          <button
            onClick={cerrar}
            className="absolute top-3 right-3 text-gray-700 hover:text-red-600"
          >
            <X size={24} />
          </button>
        )}

        {exito ? (
          <div className="text-center py-6">
            <h2 className={`text-[22pt] font-bold text-[#2e4578] mb-6 ${theme.font}`}>
              Contraseña actualizada con éxito
            </h2>
            <button
              onClick={cerrar}
              className={`${theme.bgPrimario} ${theme.textPrimario} px-8 py-2 rounded-lg text-[16pt] font-bold hover:bg-[#2e4578]`}
            >
              Aceptar
            </button>
          </div>
        ) : (
          <>
            <h2 className={`text-[22pt] font-bold text-center mb-6 ${theme.textContenedor} ${theme.font}`}>
              Cambiar contraseña
            </h2>
            {obligatorio && (
              <p className="text-[14pt] text-center text-[#2e4578] mb-4">
                Por seguridad debes cambiar tu contraseña inicial antes de continuar.
              </p>
            )}

            {error && (
              <div className="bg-[#ffdad6] text-[#93000a] p-3 rounded-lg mb-4 text-center font-semibold text-[14pt]">
                {error}
              </div>
            )}

            <form onSubmit={handleGuardar} className="flex flex-col gap-4">
              <div>
                <label className={`block text-[15pt] ${theme.textContenedor} mb-1 ${theme.font}`}>
                  Contraseña actual
                </label>
                <input
                  type="password"
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  className="w-full p-2.5 border border-gray-400 rounded bg-white text-[16pt]"
                />
              </div>

              <div>
                <label className={`block text-[15pt] ${theme.textContenedor} mb-1 ${theme.font}`}>
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={nueva}
                  onChange={(e) => setNueva(e.target.value)}
                  className="w-full p-2.5 border border-gray-400 rounded bg-white text-[16pt]"
                />
              </div>

              <div>
                <label className={`block text-[15pt] ${theme.textContenedor} mb-1 ${theme.font}`}>
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className="w-full p-2.5 border border-gray-400 rounded bg-white text-[16pt]"
                />
              </div>

              <div className="flex justify-center gap-4 mt-4">
                <button
                  type="submit"
                  disabled={guardando}
                  className={`${theme.bgPrimario} ${theme.textPrimario} px-6 py-2 rounded-lg text-[16pt] font-bold hover:bg-[#2e4578] disabled:opacity-60`}
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
                {!obligatorio && (
                  <button
                    type="button"
                    onClick={() => setModalActual(null)}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg text-[16pt] font-bold hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}