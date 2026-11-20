// src/services/enviosService.js
import { supabase } from '../supa/supabaseClient';

// Ajusta este nombre si el bucket en Supabase Storage se llama distinto
const BUCKET_ENVIOS = 'entregas';
const MAX_TAMANO_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * 1. Valida formato (.docx o .pdf), integridad básica y límite de 10 MB (C.U.10 Paso 5 y FA_04)
 */
export function validarArchivoEnvio(file) {
  if (!file || !(file instanceof File)) {
    throw new Error('No se seleccionó un documento válido.');
  }

  const nombreLower = file.name.toLowerCase();
  const extensionValida = nombreLower.endsWith('.docx') || nombreLower.endsWith('.pdf');

  if (!extensionValida) {
    throw new Error('Extensión no permitida. Solo se aceptan archivos .docx y .pdf.');
  }

  if (file.size === 0) {
    throw new Error('El archivo seleccionado está vacío o no es un documento válido.');
  }

  if (file.size > MAX_TAMANO_BYTES) {
    throw new Error('El archivo supera el tamaño máximo permitido de 10 MB.');
  }

  return true;
}


/**
 * RF024: el archivo debe ser un documento válido, no solo tener la extensión.
 * Un .docx es un ZIP (firma "PK\x03\x04") y un .pdf inicia con "%PDF".
 */
export async function validarContenidoArchivoEnvio(file) {
  const cabecera = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const esDocx = cabecera[0] === 0x50 && cabecera[1] === 0x4b && cabecera[2] === 0x03 && cabecera[3] === 0x04;
  const esPdf = cabecera[0] === 0x25 && cabecera[1] === 0x50 && cabecera[2] === 0x44 && cabecera[3] === 0x46;
  const nombreLower = file.name.toLowerCase();
  if ((nombreLower.endsWith('.docx') && !esDocx) || (nombreLower.endsWith('.pdf') && !esPdf)) {
    throw new Error('El archivo está dañado o no es un documento válido.');
  }
  return true;
}
/**
 * Helper interno para construir fecha local sin desfases UTC
 */
function construirFechaLocal(fechaStr, horaStr = '23:59') {
  if (!fechaStr) return null;
  const [year, month, day] = fechaStr.split('-').map(Number);
  const [hour, minute] = horaStr.slice(0, 5).split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 59);
}

/**
 * 2. Verifica si la entrega sigue Abierta para este alumno, considerando prórrogas (C.U.10 Paso 7 y FA_05)
 */
export async function verificarEntregaAbiertaParaAlumno(idEntrega, noControl) {
  const ahora = new Date();

  // Primero revisamos si el profesor otorgó una extensión individual (permiso_extension)
  const { data: extension } = await supabase
    .from('permiso_extension')
    .select('fecha_hora_limite_ext, fecha_hora_cierre_ext')
    .eq('id_entrega', idEntrega)
    .eq('no_control', noControl)
    .maybeSingle();

  if (extension) {
    const limiteExt = new Date(extension.fecha_hora_cierre_ext || extension.fecha_hora_limite_ext);
    if (!isNaN(limiteExt.getTime()) && ahora <= limiteExt) {
      return { abierta: true, conExtension: true, fechaLimiteEfectiva: limiteExt };
    }
  }

  // Si no hay extensión vigente, validamos contra la fecha general de la entrega
  const { data: entrega, error } = await supabase
    .from('entrega')
    .select('fecha_limite, hora_limite, fecha_cierre, hora_cierre, estado_cierre')
    .eq('id_entrega', idEntrega)
    .single();

  if (error || !entrega) {
    throw new Error('No se encontró la entrega seleccionada.');
  }

  if (entrega.estado_cierre === true) {
    return { abierta: false, conExtension: false };
  }

  const fechaCorte = entrega.fecha_cierre || entrega.fecha_limite;
  const horaCorte = entrega.hora_cierre || entrega.hora_limite || '23:59';
  const limiteGeneral = construirFechaLocal(fechaCorte, horaCorte);

  const estaAbierta = !limiteGeneral || ahora <= limiteGeneral;
  return { abierta: estaAbierta, conExtension: false, fechaLimiteEfectiva: limiteGeneral };
}

/**
 * 3. Sube o actualiza el archivo en Storage y registra el envío como "Enviado" (C.U.10 Pasos 5-8 y FA_02)
 */
export async function enviarArchivoEntrega({ idEntrega, noControl, archivo, idEquipo = null }) {
  // Paso 7: Verificar que la entrega siga abierta
  const estado = await verificarEntregaAbiertaParaAlumno(idEntrega, noControl);
  if (!estado.abierta) {
    throw new Error('La entrega ya está cerrada y no admite cambios en el envío');
  }

  // Buscar si ya existe un registro previo de envío para este alumno y entrega
  const { data: envioPrevio } = await supabase
    .from('envio')
    .select('id_envio, ruta_storage, nombre_archivo, no_envio')
    .eq('id_entrega', idEntrega)
    .eq('no_control', noControl)
    .maybeSingle();

  let rutaStorageFinal = envioPrevio?.ruta_storage || null;
  let nombreArchivoFinal = envioPrevio?.nombre_archivo || null;

  // Si el alumno adjuntó un archivo nuevo (File), lo validamos y subimos a Storage
  if (archivo instanceof File) {
    validarArchivoEnvio(archivo);
    await validarContenidoArchivoEnvio(archivo);

    // FA_02: Si había un archivo anterior en Storage, eliminarlo antes de sustituir
    if (envioPrevio?.ruta_storage) {
      await supabase.storage.from(BUCKET_ENVIOS).remove([envioPrevio.ruta_storage]);
    }

    const nombreSeguro = archivo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const nuevaRuta = `entrega_${idEntrega}/${noControl}/${Date.now()}_${nombreSeguro}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_ENVIOS)
      .upload(nuevaRuta, archivo, { upsert: true });

    if (uploadError) {
      throw new Error(`Error al subir el archivo: ${uploadError.message}`);
    }

    rutaStorageFinal = nuevaRuta;
    nombreArchivoFinal = archivo.name;
  } else if (!rutaStorageFinal) {
    throw new Error('Debe adjuntar un archivo antes de enviar.');
  }

  const fechaEnvioISO = new Date().toISOString();

  if (envioPrevio) {
    // Actualizar registro existente
    const { data, error } = await supabase
      .from('envio')
      .update({
        ruta_storage: rutaStorageFinal,
        nombre_archivo: nombreArchivoFinal,
        fecha_hora_envio: fechaEnvioISO,
        estado_envio: 'Enviado',
        no_envio: (envioPrevio.no_envio || 1) + (archivo instanceof File ? 1 : 0)
      })
      .eq('id_envio', envioPrevio.id_envio)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Crear nuevo registro de envío
    const { data, error } = await supabase
      .from('envio')
      .insert([{
        id_entrega: idEntrega,
        no_control: noControl,
        id_equipo: idEquipo,
        no_envio: 1,
        ruta_storage: rutaStorageFinal,
        nombre_archivo: nombreArchivoFinal,
        fecha_hora_envio: fechaEnvioISO,
        estado_envio: 'Enviado'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * 4. Deshace el envío dejando el archivo adjunto en la entrega (C.U.10 FA_01)
 */
export async function deshacerEnvioEntrega(idEntrega, noControl) {
  // FA_01 Paso 3: Verificar que la entrega siga abierta
  const estado = await verificarEntregaAbiertaParaAlumno(idEntrega, noControl);
  if (!estado.abierta) {
    throw new Error('La entrega ya está cerrada y no admite cambios en el envío');
  }

  // FA_01 Paso 4: Cambia el estado a "Sin enviar" sin borrar el archivo adjunto
  const { data, error } = await supabase
    .from('envio')
    .update({ estado_envio: 'Sin enviar' })
    .eq('id_entrega', idEntrega)
    .eq('no_control', noControl)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 5. Descarga el archivo vigente con su nombre original (útil para alumno y C.U.11 FA_01)
 */
export async function descargarArchivoEnvio(rutaStorage, nombreArchivo) {
  const { data, error } = await supabase.storage
    .from(BUCKET_ENVIOS)
    .download(rutaStorage);

  if (error) throw new Error(`No se pudo descargar el archivo: ${error.message}`);

  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo || 'archivo_entrega';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}