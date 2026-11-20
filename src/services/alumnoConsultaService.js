// src/services/alumnoConsultaService.js
import { supabase } from '../supa/supabaseClient';

// 1. Obtener clases con inscripción Activa del alumno (C.U.9 Paso 1)
export async function obtenerClasesAlumno(noControl) {
  const { data, error } = await supabase
    .from('inscripcion_clase')
    .select(`
      id_inscripcion,
      clase (
        id_clase,
        nombre,
        clave,
        grupo,
        periodo_escolar,
        estado_activacion,
        uid_profesor
      )
    `)
    .eq('no_control', noControl)
    .eq('estado_inscripcion', 'Activa');

  if (error) throw error;

  // Filtrar solo clases activas y ordenar del periodo más reciente al más antiguo
  const clasesActivas = (data || [])
    .map((item) => item.clase)
    .filter((c) => c && c.estado_activacion)
    .sort((a, b) => (b.periodo_escolar || '').localeCompare(a.periodo_escolar || ''));

  // Traer datos de los profesores correspondientes
  const uids = [...new Set(clasesActivas.map((c) => c.uid_profesor).filter(Boolean))];
  let mapaProfesores = new Map();

  if (uids.length > 0) {
    const { data: profes } = await supabase
      .from('profesor')
      .select('uid, nombre, apellido_paterno, apellido_materno')
      .in('uid', uids);

    mapaProfesores = new Map(
      (profes || []).map((p) => [
        p.uid,
        `${p.nombre} ${p.apellido_paterno} ${p.apellido_materno || ''}`.trim()
      ])
    );
  }

  return clasesActivas.map((c) => ({
    ...c,
    nombre_profesor: mapaProfesores.get(c.uid_profesor) || 'Docente asignado'
  }));
}

// 2. Obtener asignaciones activas de la clase seleccionada (C.U.9 Paso 3)
export async function obtenerAsignacionesClase(idClase) {
  const { data, error } = await supabase
    .from('asignacion')
    .select('*')
    .eq('id_clase', idClase)
    .order('fecha_creacion', { ascending: true });

  if (error) throw error;

  // Filtrar solo las activas (soporta tanto boolean estado_activacion como texto estado = 'Activa')
  return (data || [])
    .filter((a) => {
      if (a.estado_activacion !== undefined && a.estado_activacion !== null) {
        return Boolean(a.estado_activacion);
      }
      if (a.estado !== undefined && a.estado !== null) {
        return a.estado === 'Activa' || a.estado === true;
      }
      return true;
    })
    .map((a) => ({
      ...a,
      titulo: a.titulo || a.nombre || 'Asignación sin título',
      estado_equipo: a.estado_equipo ?? a.es_equipo ?? false
    }));
}

// 3. Obtener entregas, estado de envío, calificación y comentarios del alumno (C.U.9 Pasos 3-4)
// 3. Obtener entregas, estado de envío, prórrogas, calificación y comentarios del alumno
export async function obtenerEntregasAlumno(idAsignacion, noControl) {
  const { data: entregas, error: errEnt } = await supabase
    .from('entrega')
    .select('*')
    .eq('id_asignacion', idAsignacion)
    .order('fecha_limite', { ascending: true })
    .order('hora_limite', { ascending: true });

  if (errEnt) throw errEnt;
  if (!entregas || entregas.length === 0) return [];

  const idsEntregas = entregas.map((e) => e.id_entrega);

  // Consultar envíos del alumno (incluyendo estado_envio y ruta_storage)
  const { data: envios } = await supabase
    .from('envio')
    .select('id_entrega, nombre_archivo, ruta_storage, estado_envio, fecha_hora_envio, calificacion')
    .eq('no_control', noControl)
    .in('id_entrega', idsEntregas);

  // Consultar prórrogas individuales del alumno
  const { data: extensiones } = await supabase
    .from('permiso_extension')
    .select('id_entrega, fecha_hora_limite_ext, fecha_hora_cierre_ext')
    .eq('no_control', noControl)
    .in('id_entrega', idsEntregas);

  // Consultar comentarios del profesor en esas entregas
  const { data: comentarios } = await supabase
    .from('comentario_entrega')
    .select('id_entrega, texto, fecha_creacion')
    .eq('no_control', noControl)
    .in('id_entrega', idsEntregas)
    .order('fecha_creacion', { ascending: true });

  const mapaEnvios = new Map((envios || []).map((e) => [e.id_entrega, e]));
  const mapaExt = new Map((extensiones || []).map((ex) => [ex.id_entrega, ex]));
  const ahora = new Date();

  return entregas.map((ent, idx) => {
    const envio = mapaEnvios.get(ent.id_entrega);
    const ext = mapaExt.get(ent.id_entrega);

    // Evaluar cierre considerando prórroga individual
    let cerrada = false;
    let fechaLimiteTexto = `${ent.fecha_limite} ${ent.hora_limite?.slice(0, 5) || ''}`.trim();

    if (ext) {
      const limiteExt = new Date(ext.fecha_hora_cierre_ext || ext.fecha_hora_limite_ext);
      cerrada = !isNaN(limiteExt.getTime()) && ahora > limiteExt;
      fechaLimiteTexto = `${new Date(ext.fecha_hora_limite_ext).toLocaleString('es-MX')} (Prórroga)`;
    } else {
      const fechaCorte = new Date(`${ent.fecha_limite}T${ent.hora_limite || '23:59:00'}`);
      cerrada = Boolean(ent.estado_cierre) || ahora > fechaCorte;
    }

    const comentariosEntrega = (comentarios || [])
      .filter((c) => c.id_entrega === ent.id_entrega)
      .map((c) => ({
        fecha: new Date(c.fecha_creacion).toLocaleString('es-MX'),
        texto: c.texto
      }));

    return {
      ...ent,
      no_entrega: idx + 1,
      fecha_hora_limite: fechaLimiteTexto,
      estado_cierre: cerrada ? 'Cerrada' : 'Abierta',
      estado_envio: envio?.estado_envio || 'Sin enviar',
      nombre_archivo: envio?.nombre_archivo || null,
      ruta_storage: envio?.ruta_storage || null,
      fecha_hora_envio: envio?.fecha_hora_envio
        ? new Date(envio.fecha_hora_envio).toLocaleString('es-MX')
        : null,
      calificacion: envio?.calificacion ?? null,
      comentarios: comentariosEntrega
    };
  });
}

// 4. Obtener el equipo del alumno en una asignación (RF041, PantallaDetalleAsignacionAlumno)
export async function obtenerEquipoAlumnoEnAsignacion(idAsignacion, noControl) {
  const { data: membresia } = await supabase
    .from('integrantes_equipo')
    .select(`
      id_equipo,
      equipo!inner ( id_equipo, id_asignacion, nombre_numero_equipo )
    `)
    .eq('no_control', noControl)
    .eq('equipo.id_asignacion', idAsignacion)
    .maybeSingle();

  if (!membresia?.equipo) return null;

  const { data: integrantes } = await supabase
    .from('integrantes_equipo')
    .select(`
      alumno ( nombre, apellido_paterno, apellido_materno )
    `)
    .eq('id_equipo', membresia.id_equipo);

  return {
    nombre: membresia.equipo.nombre_numero_equipo,
    integrantes: (integrantes || []).map((i) =>
      i.alumno
        ? `${i.alumno.nombre} ${i.alumno.apellido_paterno} ${i.alumno.apellido_materno || ''}`.trim()
        : 'Integrante'
    )
  };
}