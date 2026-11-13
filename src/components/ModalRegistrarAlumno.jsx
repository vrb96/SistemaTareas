import React, { useState } from 'react';
import { X, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';

export const ModalRegistrarAlumno = ({ idClase, setModalActual, onActualizacion }) => {
  const [noControl, setNoControl] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [correo, setCorreo] = useState(''); // <-- Nuevo estado para el correo
  
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  
  const [credencialesGeneradas, setCredencialesGeneradas] = useState(null);
  
  // NUEVO ESTADO: Para pausar y ofrecer la reactivación (FA_06)
  const [alumnoInactivoEncontrado, setAlumnoInactivoEncontrado] = useState(null);
  const [datosPendientesReactivacion, setDatosPendientesReactivacion] = useState(null);

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
      const { data: alumnoExistente, error: searchError } = await supabase
        .from('alumno')
        .select('*')
        .eq('no_control', noControl.trim())
        .maybeSingle();

      if (searchError) throw searchError;

      let correoFinal = '';
      let contrasenaFinal = '';
      let mensajeAviso = null;

      if (alumnoExistente) {
        correoFinal = alumnoExistente.correo;
        contrasenaFinal = '(El alumno ya configuró su contraseña)';

        const { data: inscripcionPrevia } = await supabase
          .from('inscripcion_clase')
          .select('*')
          .eq('id_clase', idClase)
          .eq('no_control', noControl.trim())
          .maybeSingle();

        if (inscripcionPrevia) {
          if (inscripcionPrevia.estado_inscripcion === 'Activa') {
            throw new Error('El alumno ya se encuentra inscrito y activo en esta clase.');
          } else {
            // FA_06 (Paso 1): Ofrece la reactivación (pausamos el proceso)[cite: 27]
            setAlumnoInactivoEncontrado(inscripcionPrevia);
            setDatosPendientesReactivacion({
              correo: correoFinal,
              contrasena: contrasenaFinal,
              aviso: 'El alumno estaba dado de baja en esta clase y ha sido reactivado.'
            });
            setCargando(false);
            return; // Salimos de la función para esperar la decisión del usuario
          }
        } else {
          // FA_02: Existe en el sistema global, pero es nuevo en esta clase
          mensajeAviso = 'El alumno ya existía en el sistema general y ha sido vinculado a tu clase exitosamente.';
          const { error: inscribirError } = await supabase
            .from('inscripcion_clase')
            .insert([{
              id_clase: idClase,
              no_control: noControl.trim(),
              estado_inscripcion: 'Activa',
              participacion: 'Si'
            }]);
          if (inscribirError) throw inscribirError;
        }

      } else {
        // FLUJO NORMAL: Alumno 100% nuevo
        correoFinal = correo.trim() || `l${noControl.trim()}@chilpancingo.tecnm.mx`;
        contrasenaFinal = noControl.trim();

        const { error: insertAlumnoError } = await supabase
          .from('alumno')
          .insert([{
            no_control: noControl.trim(),
            nombre: nombre.trim(),
            apellido_paterno: apellidoPaterno.trim(),
            apellido_materno: apellidoMaterno.trim(),
            correo: correoFinal
          }]);
        if (insertAlumnoError) throw insertAlumnoError;

        const { error: insertInscripcionError } = await supabase
          .from('inscripcion_clase')
          .insert([{
            id_clase: idClase,
            no_control: noControl.trim(),
            estado_inscripcion: 'Activa',
            participacion: 'Si'
          }]);
        if (insertInscripcionError) throw insertInscripcionError;
      }

      setCredencialesGeneradas({
        correo: correoFinal,
        contrasena: contrasenaFinal,
        aviso: mensajeAviso
      });

    } catch (err) {
      setError(err.message);
    } finally {
      if (!alumnoInactivoEncontrado) setCargando(false);
    }
  };

  // FA_06 (Paso 2a y 3): Acepta y Reactiva[cite: 27]
  const confirmarReactivacion = async () => {
    setCargando(true);
    try {
      const { error: reactivarError } = await supabase
        .from('inscripcion_clase')
        .update({ estado_inscripcion: 'Activa' })
        .eq('id_inscripcion', alumnoInactivoEncontrado.id_inscripcion);
      
      if (reactivarError) throw reactivarError;

      // Pasamos los datos pendientes a la pantalla de éxito final
      setCredencialesGeneradas(datosPendientesReactivacion);
      setAlumnoInactivoEncontrado(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // FA_06 (Paso 2b): Rechaza y regresa al formulario[cite: 27]
  const rechazarReactivacion = () => {
    setAlumnoInactivoEncontrado(null);
    setDatosPendientesReactivacion(null);
  };

  const handleCerrarExito = () => {
    if (onActualizacion) onActualizacion();
    setModalActual(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className={`${theme.bgContenedor} p-8 rounded-lg shadow-xl w-[500px] border border-gray-300 relative`}>
        <button onClick={() => setModalActual(null)} className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold">
          <X size={24}/>
        </button>
        
        {/* RENDER 1: PANTALLA DE OFERTA DE REACTIVACIÓN (FA_06) */}
        {alumnoInactivoEncontrado ? (
          <div className="flex flex-col items-center text-center">
            <AlertTriangle size={60} className="text-yellow-500 mb-4" />
            <h2 className={`text-[20pt] font-bold text-gray-800 mb-2 ${theme.font}`}>
              Alumno Inactivo Detectado
            </h2>
            <p className="text-[14pt] text-gray-700 mb-6">
              El alumno con número de control <span className="font-bold">{noControl}</span> ya pertenece a esta clase pero se encuentra dado de baja.
              <br/><br/>
              ¿Desea reactivar su inscripción?
            </p>
            <div className="flex gap-4 w-full justify-center">
              <button 
                onClick={rechazarReactivacion}
                disabled={cargando}
                className="bg-gray-400 text-white font-bold py-2 px-6 rounded text-[15pt] hover:bg-gray-600 transition"
              >
                Rechazar
              </button>
              <button 
                onClick={confirmarReactivacion}
                disabled={cargando}
                className={`${theme.bgPrimario} text-white font-bold py-2 px-6 rounded text-[15pt] hover:bg-blue-800 transition`}
              >
                {cargando ? 'Procesando...' : 'Aceptar reactivación'}
              </button>
            </div>
          </div>
        ) : !credencialesGeneradas ? (
          
          // RENDER 2: FORMULARIO NORMAL
          <>
            <h2 className={`text-[22pt] font-bold mb-6 text-center ${theme.textContenedor} ${theme.font}`}>Registrar Alumno</h2>
            
            {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center font-bold">{error}</div>}

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
                <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="Ej. l20050012@chilpancingo.tecnm.mx" 
                       className="w-full p-2 border border-gray-400 rounded bg-white text-center text-[16pt]" />
              </div>
              <button type="submit" disabled={cargando}
                      className={`${theme.bgPrimario} ${theme.textPrimario} text-[16pt] font-bold py-3 mt-4 rounded ${theme.font} disabled:opacity-50`}>
                {cargando ? 'Registrando...' : 'Registrar'}
              </button>
            </form>
          </>
        ) : (
          
          // RENDER 3: PANTALLA DE ÉXITO Y CREDENCIALES
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle size={60} className="text-green-600 mb-2" />
            <h2 className={`text-[20pt] font-bold text-green-700 ${theme.font}`}>¡Alumno registrado con éxito!</h2>
            
            {credencialesGeneradas.aviso && (
              <div className="flex items-center gap-2 bg-blue-100 text-blue-800 p-3 rounded-lg text-[13pt] font-bold mb-2">
                <Info size={24} className="shrink-0" />
                <p>{credencialesGeneradas.aviso}</p>
              </div>
            )}
            
            <p className="text-[14pt] text-gray-700 mb-2">Credenciales del alumno:</p>
            
            <div className="bg-gray-100 p-6 rounded-lg border border-gray-300 w-full mb-4 text-left">
              <p className="text-[15pt] mb-2"><span className="font-bold text-[#465d91]">Correo:</span> {credencialesGeneradas.correo}</p>
              <p className="text-[15pt] mb-2"><span className="font-bold text-[#465d91]">Contraseña:</span> {credencialesGeneradas.contrasena}</p>
              {!credencialesGeneradas.aviso && (
                <p className="text-[12pt] text-red-600 mt-4 italic">* Cambio de contraseña pendiente</p>
              )}
            </div>
            
            <button onClick={handleCerrarExito}
                    className={`${theme.bgPrimario} ${theme.textPrimario} w-full text-[16pt] font-bold py-3 rounded ${theme.font} hover:bg-blue-800 transition`}>
              Aceptar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};