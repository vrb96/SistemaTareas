import React, { useState, useRef } from 'react';
import { X, Upload, Download } from 'lucide-react';
import { theme } from '../theme';
import { supabase } from '../supa/supabaseClient';
import * as XLSX from 'xlsx';

// Variable global para compartir las credenciales generadas entre los dos modales
let credencialesGeneradas = [];

export const ModalCargaMasiva = ({ setModalActual, idClase }) => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [archivoNombre, setArchivoNombre] = useState('');
  const inputRef = useRef(null);

  const procesarArchivo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Por favor suba un archivo Excel (.xlsx)');
      return;
    }

    setArchivoNombre(file.name);
    setCargando(true);
    setError('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
      
      // Leemos el Excel
      const filas = XLSX.utils.sheet_to_json(primeraHoja, { header: 1 });
      credencialesGeneradas = []; 

      // Empezamos desde i=1 para saltar el encabezado ("matricula", "nombre")
      for (let i = 1; i < filas.length; i++) {
        const fila = filas[i];
        
        const datoControl = String(fila[0] || '').trim();
        const datoNombreCompleto = String(fila[1] || '').trim();

        // Validar que tenga matrícula válida
        if (!datoControl || datoControl.length < 5 || !datoNombreCompleto) {
           continue; 
        }

        // Separar el nombre (Ej: "ABELINO CHANA CARLOS RIGOBERTO")
        const partesNombre = datoNombreCompleto.split(' ').filter(n => n !== '');
        
        // Lógica para extraer (Asumiendo Apellido1 Apellido2 Nombres)
        const apPaterno = partesNombre.length > 0 ? partesNombre[0] : '-';
        const apMaterno = partesNombre.length > 1 ? partesNombre[1] : '-';
        const nombreReal = partesNombre.length > 2 ? partesNombre.slice(2).join(' ') : 'Sin Nombre';

        const correo = `${datoControl}@ittixtla.edu.mx`;
        const passwordTemporal = `${datoControl}2026`;

        // Agregar a la lista para el CSV de descarga
        credencialesGeneradas.push({
          No_Control: datoControl,
          Nombre: nombreReal,
          Apellidos: `${apPaterno} ${apMaterno}`.trim(),
          Correo: correo,
          Contrasena: passwordTemporal
        });

        // Subir a Supabase
        try {
          await supabase.from('alumno').upsert([{
            no_control: datoControl,
            nombre: nombreReal,
            apellido_paterno: apPaterno,
            apellido_materno: apMaterno,
            correo: correo
          }]);

          if (idClase) {
            await supabase.from('inscripcion_clase').upsert([{
              id_clase: idClase,
              no_control: datoControl,
              estado_inscripcion: 'Activa',
              participacion: 'Si'
            }], { onConflict: 'id_clase,no_control' });
          }
        } catch (dbError) {
           console.error("Error al registrar alumno:", datoControl, dbError);
        }
      }

      setModalActual('ModalDescarga');

    } catch (err) {
      setError('Error al procesar el archivo: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className={`${theme.bgContenedor} p-10 rounded-lg shadow-xl w-[500px] flex flex-col items-center relative`}>
        <button onClick={() => setModalActual(null)} className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold"><X size={24}/></button>
        <h2 className={`text-[22pt] font-bold mb-4 text-center ${theme.textContenedor} ${theme.font}`}>Agregue el archivo xlsx</h2>
        
        {error && <p className="text-red-600 mb-4 font-bold text-center">{error}</p>}
        {archivoNombre && <p className="text-green-600 mb-4 font-bold text-center">Archivo: {archivoNombre}</p>}

        <input type="file" accept=".xlsx, .xls" className="hidden" ref={inputRef} onChange={procesarArchivo} />
        
        <Upload size={80} className={`mb-4 cursor-pointer hover:scale-110 transition ${theme.textContenedor}`} onClick={() => inputRef.current.click()} />
        <p className={`text-[15pt] mb-6 text-gray-600 text-center ${theme.font}`}>
          {cargando ? 'Procesando archivo, por favor espere...' : 'Click en el ícono para seleccionar su archivo (Límite 2 mb)'}
        </p>
      </div>
    </div>
  );
};

export const ModalDescargaCredenciales = ({ setModalActual }) => {
  
  const handleDescargar = () => {
    if (credencialesGeneradas.length === 0) return;

    // Crear encabezados CSV
    let csvContent = "Numero Control,Nombre,Apellidos,Correo Institucional,Contrasena Temporal\n";
    
    // Agregar filas
    credencialesGeneradas.forEach(row => {
      csvContent += `${row.No_Control},${row.Nombre},${row.Apellidos},${row.Correo},${row.Contrasena}\n`;
    });

    // Descargar el Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Credenciales_Alumnos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className={`${theme.bgContenedor} p-10 rounded-lg shadow-xl w-[500px] flex flex-col items-center relative`}>
        <button onClick={() => { setModalActual(null); window.location.reload(); }} className="absolute top-2 right-2 text-gray-700 hover:text-red-500 font-bold"><X size={24}/></button>
        <h2 className={`text-[22pt] font-bold mb-4 text-center ${theme.textContenedor} ${theme.font}`}>Carga Masiva Exitosa</h2>
        <p className={`text-[15pt] mb-8 text-center text-gray-600 ${theme.font}`}>Descargar lista con las credenciales de {credencialesGeneradas.length} alumnos registrados</p>
        <Download size={80} className={`mb-8 ${theme.textContenedor} cursor-pointer hover:scale-110 transition`} onClick={handleDescargar} />
        <button onClick={() => { setModalActual(null); window.location.reload(); }} className={`${theme.bgPrimario} ${theme.textPrimario} px-10 py-2 rounded text-[16pt] font-bold ${theme.font} hover:bg-blue-800 transition`}>
          Salir y Recargar
        </button>
      </div>
    </div>
  );
};