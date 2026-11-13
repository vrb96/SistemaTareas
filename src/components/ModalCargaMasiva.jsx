import React, { useState, useRef } from 'react';
import { X, Upload, Download, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';
import * as XLSX from 'xlsx';

// Variable global para compartir resultados entre ventanas
let resumenCarga = { nuevos: [], inscritosExistentes: 0, reactivados: 0, omitidos: 0, rechazados: [], total: 0 };

export const ModalCargaMasiva = ({ setModalActual, idClase, onActualizacion }) => {
  const [cargando, setCargando] = useState(false);
  
  // Estados para controlar FA_04 y FA_04a
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [errorFA04a, setErrorFA04a] = useState('');
  
  const inputRef = useRef(null);

  const handleSeleccionarArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivoSeleccionado(file);
    setErrorFA04a('');
  };

  const handleAceptarError = () => {
    setErrorFA04a('');
    setArchivoSeleccionado(null);
    if (inputRef.current) inputRef.current.value = ''; 
  };

  const procesarArchivo = async () => {
    if (!archivoSeleccionado) return;

    if (!archivoSeleccionado.name.endsWith('.xlsx')) {
      setErrorFA04a('El archivo no tiene el formato válido (.xlsx).');
      return;
    }

    if (archivoSeleccionado.size > 2097152) {
      setErrorFA04a('El archivo supera el límite de tamaño permitido (2 MB).');
      return;
    }

    setCargando(true);
    setErrorFA04a('');

    try {
      const data = await archivoSeleccionado.arrayBuffer();
      const workbook = XLSX.read(data);
      const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
      
      const filas = XLSX.utils.sheet_to_json(primeraHoja, { header: 1 });
      
      if (filas.length < 2) {
        setErrorFA04a('El archivo está vacío o no tiene datos a procesar.');
        setCargando(false);
        return;
      }
      if (!filas[0] || filas[0].length < 2) {
        setErrorFA04a('Al archivo le faltan las columnas obligatorias (No. de Control, nombre completo).');
        setCargando(false);
        return;
      }
      
      resumenCarga = { nuevos: [], inscritosExistentes: 0, reactivados: 0, omitidos: 0, rechazados: [], total: 0 };

      for (let i = 1; i < filas.length; i++) {
        const fila = filas[i];
        const numeroFilaExcel = i + 1; 
        
        const datoControl = String(fila[0] || '').trim();
        let datoNombreCompleto = String(fila[1] || '').trim();

        if (!datoControl && !datoNombreCompleto) continue; 

        resumenCarga.total++;

        if (!datoControl || datoControl.length < 5) {
          resumenCarga.rechazados.push(`Fila ${numeroFilaExcel}: No. de Control inválido o vacío.`);
          continue;
        }
        if (!datoNombreCompleto) {
          resumenCarga.rechazados.push(`Fila ${numeroFilaExcel}: Nombre completo vacío.`);
          continue;
        }

        // Lógica de separación de nombres (Paterno Materno Nombres)
        let nombreReal = '';
        let apPaterno = '';
        let apMaterno = '';

        const partes = datoNombreCompleto.split(' ').filter(n => n !== '');
        if (partes.length >= 3) {
            apPaterno = partes[0];
            apMaterno = partes[1];
            nombreReal = partes.slice(2).join(' ');
        } else if (partes.length === 2) {
            apPaterno = partes[0];
            nombreReal = partes[1];
        } else {
            nombreReal = datoNombreCompleto;
        }

        const correo = `l${datoControl}@chilpancingo.tecnm.mx`;
        const passwordTemporal = `${datoControl}2026`;

        try {
          // Validar si ya está en esta clase (Omitido o Reactivado)
          const { data: existenteClase } = await supabase
            .from('inscripcion_clase')
            .select('id_inscripcion, estado_inscripcion')
            .eq('id_clase', idClase)
            .eq('no_control', datoControl)
            .maybeSingle();

          if (existenteClase) {
             if (existenteClase.estado_inscripcion === 'Inactiva') {
                 // Reactivación automática de alumno dado de baja
                 await supabase
                   .from('inscripcion_clase')
                   .update({ estado_inscripcion: 'Activa' })
                   .eq('id_inscripcion', existenteClase.id_inscripcion);
                 resumenCarga.reactivados++;
             } else {
                 resumenCarga.omitidos++;
             }
             continue;
          }

          // Validar si ya existe en el sistema global pero NO en la clase
          const { data: alumnoGlobal } = await supabase
            .from('alumno')
            .select('no_control')
            .eq('no_control', datoControl)
            .maybeSingle();

          if (alumnoGlobal) {
            // Existe globalmente: Inscribirlo (sin generar credenciales)
            await supabase.from('inscripcion_clase').upsert([{
              id_clase: idClase,
              no_control: datoControl,
              estado_inscripcion: 'Activa',
              participacion: 'Si'
            }]);
            resumenCarga.inscritosExistentes++;
          } else {
            // Es totalmente nuevo: Registrarlo e inscribirlo
            await supabase.from('alumno').insert([{
              no_control: datoControl,
              nombre: nombreReal,
              apellido_paterno: apPaterno,
              apellido_materno: apMaterno,
              correo: correo
            }]);

            await supabase.from('inscripcion_clase').insert([{
              id_clase: idClase,
              no_control: datoControl,
              estado_inscripcion: 'Activa',
              participacion: 'Si'
            }]);

            resumenCarga.nuevos.push({
              No_Control: datoControl,
              Nombre: nombreReal,
              Apellidos: `${apPaterno} ${apMaterno}`.trim(),
              Correo: correo,
              Contrasena: passwordTemporal
            });
          }
        } catch (dbError) {
          resumenCarga.rechazados.push(`Fila ${numeroFilaExcel}: Error de base de datos.`);
        }
      }

      if (onActualizacion) onActualizacion();
      setModalActual('ModalDescarga');

    } catch (err) {
      setErrorFA04a('Error al procesar el archivo: El formato interno es ilegible.');
      setCargando(false);
    } 
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className={`${theme.bgContenedor} p-10 rounded-lg shadow-xl w-[500px] flex flex-col items-center relative`}>
        <button onClick={() => setModalActual(null)} className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold">
          <X size={24}/>
        </button>
        
        {errorFA04a ? (
          <div className="flex flex-col items-center text-center w-full">
            <AlertTriangle size={60} className="text-red-600 mb-4" />
            <h2 className={`text-[20pt] font-bold mb-2 text-red-700 ${theme.font}`}>Archivo Inválido</h2>
            <p className="text-[14pt] text-gray-700 mb-6 font-bold">{errorFA04a}</p>
            <button onClick={handleAceptarError} className={`${theme.bgPrimario} text-white px-8 py-2 rounded text-[15pt] font-bold hover:bg-blue-800 transition`}>
              Aceptar
            </button>
          </div>
        ) : (
          <>
            <h2 className={`text-[22pt] font-bold mb-4 text-center ${theme.textContenedor} ${theme.font}`}>Carga Masiva (MindBox)</h2>
            <p className={`text-[13pt] mb-6 text-gray-600 text-center ${theme.font}`}>
              Seleccione un archivo .xlsx (Máximo 2 MB)
            </p>

            <input type="file" accept=".xlsx" className="hidden" ref={inputRef} onChange={handleSeleccionarArchivo} />
            
            <div onClick={() => inputRef.current.click()} 
                 className={`border-2 border-dashed border-gray-400 rounded-lg p-6 mb-6 w-full flex flex-col items-center cursor-pointer hover:bg-gray-100 transition ${archivoSeleccionado ? 'bg-blue-50 border-blue-400' : ''}`}>
               {archivoSeleccionado ? (
                 <>
                   <FileSpreadsheet size={50} className="text-blue-600 mb-2" />
                   <p className="font-bold text-blue-800 text-center">{archivoSeleccionado.name}</p>
                 </>
               ) : (
                 <>
                   <Upload size={50} className={`mb-2 ${theme.textContenedor}`} />
                   <p className="text-gray-600 text-center">Click aquí para explorar</p>
                 </>
               )}
            </div>

            <div className="flex w-full justify-between gap-4">
              <button onClick={() => setModalActual(null)} disabled={cargando} className="w-1/2 bg-gray-400 text-white font-bold py-2 rounded hover:bg-gray-600 transition disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={procesarArchivo} disabled={!archivoSeleccionado || cargando} className={`w-1/2 ${theme.bgPrimario} text-white font-bold py-2 rounded hover:bg-blue-800 transition disabled:opacity-50`}>
                {cargando ? 'Procesando...' : 'Procesar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const ModalDescargaCredenciales = ({ setModalActual, onActualizacion }) => {
  
  const handleDescargar = () => {
    if (resumenCarga.nuevos.length === 0) return;
    let csvContent = "Numero Control,Nombre,Apellidos,Correo Institucional,Contrasena Temporal\n";
    resumenCarga.nuevos.forEach(row => {
      csvContent += `${row.No_Control},${row.Nombre},${row.Apellidos},${row.Correo},${row.Contrasena}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Credenciales_Alumnos_Nuevos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleCerrar(); 
  };

  const handleCerrar = () => {
    if (onActualizacion) onActualizacion();
    setModalActual(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className={`${theme.bgContenedor} p-10 rounded-lg shadow-xl w-[550px] max-h-[90vh] overflow-y-auto flex flex-col items-center relative text-center`}>
        <button onClick={handleCerrar} className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold">
          <X size={24}/>
        </button>
        <h2 className={`text-[22pt] font-bold mb-4 ${theme.textContenedor} ${theme.font}`}>Carga Masiva Finalizada</h2>
        
        <div className="bg-gray-100 p-4 rounded-lg w-full mb-6 border border-gray-300 text-left">
           <p className="text-[14pt] text-[#465d91] font-bold mb-3 border-b border-gray-300 pb-1">Resumen de importación:</p>
           <ul className="text-[13pt] text-gray-700 space-y-1">
             <li><span className="font-bold">Total leídos:</span> {resumenCarga.total}</li>
             <li className="text-green-700"><span className="font-bold">Nuevos registrados:</span> {resumenCarga.nuevos.length}</li>
             <li className="text-blue-700"><span className="font-bold">Existentes inscritos:</span> {resumenCarga.inscritosExistentes}</li>
             <li className="text-purple-700"><span className="font-bold">Reactivados:</span> {resumenCarga.reactivados}</li>
             <li className="text-yellow-600"><span className="font-bold">Omitidos (Ya en clase):</span> {resumenCarga.omitidos}</li>
             <li className="text-red-600"><span className="font-bold">Rechazados (Errores):</span> {resumenCarga.rechazados.length}</li>
           </ul>

           {resumenCarga.rechazados.length > 0 && (
             <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded max-h-32 overflow-y-auto">
               <p className="text-[11pt] font-bold text-red-700 mb-1">Detalle de rechazos:</p>
               {resumenCarga.rechazados.map((motivo, idx) => (
                 <p key={idx} className="text-[11pt] text-red-600">- {motivo}</p>
               ))}
             </div>
           )}
        </div>

        <div className="flex w-full justify-between gap-4">
          <button onClick={handleCerrar} className="w-1/2 bg-gray-400 text-white font-bold py-2 rounded text-[13pt] hover:bg-gray-600 transition">
            Finalizar sin descargar
          </button>
          
          <button onClick={handleDescargar} disabled={resumenCarga.nuevos.length === 0} 
                  className={`w-1/2 ${theme.bgPrimario} text-white font-bold py-2 rounded text-[13pt] hover:bg-blue-800 transition disabled:opacity-50`}>
            Descargar CSV
          </button>
        </div>
      </div>
    </div>
  );
};