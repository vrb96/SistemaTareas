// src/services/evaluacionesService.js
import { supabase } from '../supa/supabaseClient';
import { validarExtension } from '../validaciones';

/**
 * 1. Registrar o editar calificación entera (0 - 100) (C.U.12 Pasos 3-5, FA_01 y FA_02)
 */
export async function guardarCalificacion({ idEntrega, noControl, calificacion }) {
  const num = Number(calificacion);
  if (
    calificacion === '' ||
    calificacion === null ||
    calificacion === undefined ||
    !Number.isInteger(num) ||
    num < 0 ||
    num > 100
  ) {
    throw new Error('La calificación debe ser un número entero entre 0 y 100');
  }

  // Verificar si ya existe un registro de envío para este alumno en esta entrega
  const { data: envioExistente, error: errBusca } = await supabase
    .from('envio')
    .select('id_envio')
    .eq('id_entrega', idEntrega)
    .eq('no_control', noControl)
    .maybeSingle();

  if (errBusca) throw errBusca;

  if (envioExistente) {
    const { data, error } = await supabase
      .from('envio')
      .update({ calificacion: num })
      .eq('id_envio', envioExistente.id_envio)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Si el profesor califica a un alumno que aún no ha subido archivo (ej. 0)
    const { data, error } = await supabase
      .from('envio')
      .insert([{
        id_entrega: idEntrega,
        no_control: noControl,
        no_envio: 1,
        ruta_storage: '',
        nombre_archivo: '',
        estado_envio: 'Sin enviar',
        calificacion: num
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * 2. Otorgar o actualizar permiso de extensión individual (C.U.12 FA_03)
 */
export async function otorgarExtensionIndividual({
  idEntrega,
  noControl,
  uidProfesor = null,
  fecha_hora_limite_ext,
  fecha_hora_cierre_ext = null
}) {
  // RF034: la extensión debe tener una fecha límite futura y un cierre no anterior a ella
  const errorExtension = validarExtension(fecha_hora_limite_ext, fecha_hora_cierre_ext);
  if (errorExtension) {
    throw new Error(errorExtension);
  }

  const limiteISO = new Date(fecha_hora_limite_ext).toISOString();
  const cierreISO = fecha_hora_cierre_ext
    ? new Date(fecha_hora_cierre_ext).toISOString()
    : null;

  // Upsert: si el alumno ya tenía una extensión en esta entrega, la actualiza sin error de duplicado
  const { data, error } = await supabase
    .from('permiso_extension')
    .upsert(
      [{
        id_entrega: idEntrega,
        no_control: noControl,
        uid_profesor: uidProfesor,
        fecha_hora_limite_ext: limiteISO,
        fecha_hora_cierre_ext: cierreISO,
        fecha_otorgamiento: new Date().toISOString()
      }],
      { onConflict: 'id_entrega,no_control' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 3. Obtener comentarios de retroalimentación ordenados cronológicamente (C.U.12 Paso 1)
 */
export async function obtenerComentariosEntrega(idEntrega, noControl) {
  const { data, error } = await supabase
    .from('comentario_entrega')
    .select('id_comentario, texto, fecha_creacion')
    .eq('id_entrega', idEntrega)
    .eq('no_control', noControl)
    .order('fecha_creacion', { ascending: true });

  if (error) throw error;

  // Mapeado exactamente al formato que usa PantallaCalificarEnvio ({ id, fecha, texto })
  return (data || []).map((c) => ({
    id: c.id_comentario,
    fecha: new Date(c.fecha_creacion).toLocaleString('es-MX'),
    texto: c.texto
  }));
}

/**
 * 4. Registrar comentario de retroalimentación (1 - 2000 caracteres) (C.U.12 FA_04 y FA_05)
 */
export async function agregarComentario({ idEntrega, noControl, uidProfesor = null, texto }) {
  const limpio = (texto || '').trim();
  if (limpio.length < 1 || limpio.length > 2000) {
    throw new Error('El comentario debe contener entre 1 y 2000 caracteres');
  }

  const { data, error } = await supabase
    .from('comentario_entrega')
    .insert([{
      id_entrega: idEntrega,
      no_control: noControl,
      uid_profesor: uidProfesor,
      texto: limpio
    }])
    .select('id_comentario, texto, fecha_creacion')
    .single();

  if (error) throw error;

  return {
    id: data.id_comentario,
    fecha: new Date(data.fecha_creacion).toLocaleString('es-MX'),
    texto: data.texto
  };
}

/**
 * 5. Editar comentario existente (1 - 2000 caracteres) (C.U.12 FA_05 y FA_06)
 */
export async function editarComentario(idComentario, nuevoTexto) {
  const limpio = (nuevoTexto || '').trim();
  if (limpio.length < 1 || limpio.length > 2000) {
    throw new Error('El comentario debe contener entre 1 y 2000 caracteres');
  }

  const { data, error } = await supabase
    .from('comentario_entrega')
    .update({ texto: limpio })
    .eq('id_comentario', idComentario)
    .select('id_comentario, texto, fecha_creacion')
    .single();

  if (error) throw error;

  return {
    id: data.id_comentario,
    fecha: new Date(data.fecha_creacion).toLocaleString('es-MX'),
    texto: data.texto
  };
}

/**
 * 6. Eliminar comentario (C.U.12 FA_06)
 */
export async function eliminarComentario(idComentario) {
  const { error } = await supabase
    .from('comentario_entrega')
    .delete()
    .eq('id_comentario', idComentario);

  if (error) throw error;
  return true;
}