// src/services/equiposService.js
import { supabase } from '../supa/supabaseClient';

/**
 * Helper: Formatea el nombre completo del alumno
 */
function formatearAlumno(al) {
  return {
    id_alumno: al.no_control, // Compatible con key={al.id_alumno} en PantallaEquipos
    no_control: al.no_control,
    nombre_completo: `${al.apellido_paterno || ''} ${al.apellido_materno || ''} ${al.nombre || ''}`
      .replace(/\s+/g, ' ')
      .trim()
  };
}

/**
 * 1. Obtiene los equipos de una ASIGNACIÓN, los alumnos elegibles sin equipo en ella
 *    y el total de alumnos activos de la clase (C.U.13 Paso 1)
 */
export async function obtenerDatosEquiposAsignacion(idClase, idAsignacion) {
  // Traer todos los alumnos con inscripción Activa en la clase
  const { data: inscritos, error: errIns } = await supabase
    .from('inscripcion_clase')
    .select(`
      no_control,
      participacion,
      alumno (
        no_control,
        nombre,
        apellido_paterno,
        apellido_materno
      )
    `)
    .eq('id_clase', idClase)
    .eq('estado_inscripcion', 'Activa');

  if (errIns) throw errIns;

  // Traer los equipos de la clase junto con sus integrantes
  const { data: equiposRaw, error: errEq } = await supabase
    .from('equipo')
    .select(`
      id_equipo,
      nombre_numero_equipo,
      numero_integrantes,
      integrantes_equipo (
        no_control,
        rol_equipo,
        alumno (
          no_control,
          nombre,
          apellido_paterno,
          apellido_materno
        )
      )
    `)
    .eq('id_asignacion', idAsignacion)
    .order('nombre_numero_equipo', { ascending: true });

  if (errEq) throw errEq;

  const ocupados = new Set();

  const equipos = (equiposRaw || []).map((eq) => {
    const integrantes = (eq.integrantes_equipo || [])
      .filter((i) => i.alumno)
      .map((i) => {
        ocupados.add(i.no_control);
        return {
          ...formatearAlumno(i.alumno),
          rol_equipo: i.rol_equipo || 'Integrante'
        };
      });

    return {
      id: eq.id_equipo,
      nombre: eq.nombre_numero_equipo,
      integrantes
    };
  });

  // Elegibles: inscripción Activa, participación "Si" o "Participa", y sin equipo en esta asignación
  const elegibles = (inscritos || [])
    .filter((item) => {
      const participa =
        !item.participacion ||
        item.participacion === 'Si' ||
        item.participacion === 'Participa';
      return item.alumno && participa && !ocupados.has(item.no_control);
    })
    .map((item) => formatearAlumno(item.alumno))
    .sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo, 'es'));

  return {
    equipos,
    elegibles,
    totalAlumnosClase: (inscritos || []).length
  };
}

/**
 * 2. Genera una distribución aleatoria y equitativa de alumnos elegibles (C.U.13 Pasos 3-6 y FA_01)
 */
export function generarPropuestaEquiposAleatorios({
  elegibles,
  equiposExistentes = [],
  totalAlumnosClase,
  tamanoEquipo
}) {
  if (totalAlumnosClase < 4 || elegibles.length < 2) {
    throw new Error(
      'La clase debe contar con al menos 4 alumnos y mínimo 2 alumnos elegibles para formar equipos'
    );
  }

  const n = Number(tamanoEquipo);
  if (!Number.isInteger(n) || n < 2 || n > 10) {
    throw new Error('El tamaño de equipo debe ser un número entero entre 2 y 10');
  }

  // Mezcla aleatoria Fisher-Yates
  const mezclados = [...elegibles];
  for (let i = mezclados.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mezclados[i], mezclados[j]] = [mezclados[j], mezclados[i]];
  }

  // Cálculo equitativo para evitar equipos de 1 solo integrante
  let cantidadEquipos = Math.max(1, Math.floor(mezclados.length / n));
  if (mezclados.length % n >= 2) {
    cantidadEquipos += 1;
  }

  const grupos = Array.from({ length: cantidadEquipos }, () => []);
  mezclados.forEach((alumno, idx) => {
    grupos[idx % cantidadEquipos].push(alumno);
  });

  // Buscar el siguiente número libre ("Equipo 1", "Equipo 2", ...)
  const nombresUsados = new Set(
    equiposExistentes.map((eq) => (eq.nombre || '').trim().toLowerCase())
  );
  let consecutivo = 1;

  return grupos.map((integrantes, idx) => {
    while (nombresUsados.has(`equipo ${consecutivo}`)) {
      consecutivo++;
    }
    const nombre = `Equipo ${consecutivo}`;
    nombresUsados.add(nombre.toLowerCase());
    consecutivo++;

    return {
      id: `temp-${Date.now()}-${idx}`,
      nombre,
      integrantes
    };
  });
}

/**
 * 3. Guarda en Supabase los equipos confirmados desde la vista previa (C.U.13 Paso 8)
 */
export async function guardarEquiposGenerados(idClase, idAsignacion, equiposPropuestos) {
  const guardados = [];

  for (const prop of equiposPropuestos) {
    const { data: equipoCreado, error: errEq } = await supabase
      .from('equipo')
      .insert([{
        id_clase: idClase,
        id_asignacion: idAsignacion,
        nombre_numero_equipo: prop.nombre.trim(),
        numero_integrantes: prop.integrantes.length
      }])
      .select()
      .single();

    if (errEq) throw errEq;

    if (prop.integrantes.length > 0) {
      const filasIntegrantes = prop.integrantes.map((al, idx) => ({
        id_equipo: equipoCreado.id_equipo,
        no_control: al.no_control,
        rol_equipo: idx === 0 ? 'Jefe' : 'Integrante'
      }));

      const { error: errInt } = await supabase
        .from('integrantes_equipo')
        .insert(filasIntegrantes);

      if (errInt) throw errInt;
    }

    guardados.push({
      id: equipoCreado.id_equipo,
      nombre: equipoCreado.nombre_numero_equipo,
      integrantes: prop.integrantes
    });
  }

  return guardados;
}

/**
 * 4. Actualiza nombre e integrantes de un equipo (agregar, quitar o mover) (C.U.13 FA_03 y FA_04)
 */
export async function actualizarEquipo(idAsignacion, equipoEditado) {
  const nombreLimpio = (equipoEditado.nombre || '').trim();
  if (!nombreLimpio || nombreLimpio.length > 80) {
    throw new Error('El nombre del equipo no es válido o ya existe.');
  }

  // Validar que no exista otro equipo con el mismo nombre en la misma asignación
  const { data: duplicado } = await supabase
    .from('equipo')
    .select('id_equipo')
    .eq('id_asignacion', idAsignacion)
    .ilike('nombre_numero_equipo', nombreLimpio)
    .neq('id_equipo', equipoEditado.id)
    .maybeSingle();

  if (duplicado) {
    throw new Error('El nombre del equipo no es válido o ya existe.');
  }

  // Actualizar datos del equipo
  const { error: errUpd } = await supabase
    .from('equipo')
    .update({
      nombre_numero_equipo: nombreLimpio,
      numero_integrantes: equipoEditado.integrantes.length
    })
    .eq('id_equipo', equipoEditado.id);

  if (errUpd) throw errUpd;

  // Reemplazar la lista de integrantes del equipo
  const { error: errDel } = await supabase
    .from('integrantes_equipo')
    .delete()
    .eq('id_equipo', equipoEditado.id);

  if (errDel) throw errDel;

  if (equipoEditado.integrantes.length > 0) {
    const nuevasFilas = equipoEditado.integrantes.map((al, idx) => ({
      id_equipo: equipoEditado.id,
      no_control: al.no_control,
      rol_equipo: al.rol_equipo || (idx === 0 ? 'Jefe' : 'Integrante')
    }));

    const { error: errIns } = await supabase
      .from('integrantes_equipo')
      .insert(nuevasFilas);

    if (errIns) throw errIns;
  }

  return {
    ...equipoEditado,
    nombre: nombreLimpio
  };
}

/**
 * 5. Mueve a un integrante hacia otro equipo de la misma clase (C.U.13 FA_03)
 */
export async function moverIntegranteDeEquipo({ noControl, idEquipoOrigen, idEquipoDestino }) {
  const { error } = await supabase
    .from('integrantes_equipo')
    .update({ id_equipo: idEquipoDestino, rol_equipo: 'Integrante' })
    .eq('id_equipo', idEquipoOrigen)
    .eq('no_control', noControl);

  if (error) throw error;

  // Actualizar el conteo de integrantes en ambos equipos
  for (const idEq of [idEquipoOrigen, idEquipoDestino]) {
    const { count } = await supabase
      .from('integrantes_equipo')
      .select('*', { count: 'exact', head: true })
      .eq('id_equipo', idEq);

    await supabase
      .from('equipo')
      .update({ numero_integrantes: count || 0 })
      .eq('id_equipo', idEq);
  }

  return true;
}

/**
 * 6. Elimina un equipo y libera automáticamente a sus integrantes (C.U.13 FA_05)
 * (ON DELETE CASCADE en integrantes_equipo libera a los alumnos como elegibles)
 */
export async function eliminarEquipo(idEquipo) {
  const { error } = await supabase
    .from('equipo')
    .delete()
    .eq('id_equipo', idEquipo);

  if (error) throw error;
  return true;
}

/**
 * 7. Saca al alumno del equipo al que pertenezca en la clase de una inscripción (RF010, RF011, RF012)
 *    Se usa al dar de baja, reactivar o marcar "No participa".
 */
export async function sacarAlumnoDeEquipoPorInscripcion(idInscripcion) {
  const { data: ins, error: errIns } = await supabase
    .from('inscripcion_clase')
    .select('id_clase, no_control')
    .eq('id_inscripcion', idInscripcion)
    .single();
  if (errIns) throw errIns;

  const { data: equiposClase, error: errEq } = await supabase
    .from('equipo')
    .select('id_equipo')
    .eq('id_clase', ins.id_clase);
  if (errEq) throw errEq;

  const ids = (equiposClase || []).map((e) => e.id_equipo);
  if (ids.length === 0) return false;

  const { data: borrados, error: errDel } = await supabase
    .from('integrantes_equipo')
    .delete()
    .in('id_equipo', ids)
    .eq('no_control', ins.no_control)
    .select('id_equipo');
  if (errDel) throw errDel;

  // Actualizar el conteo del equipo del que salió
  for (const { id_equipo } of borrados || []) {
    const { count } = await supabase
      .from('integrantes_equipo')
      .select('*', { count: 'exact', head: true })
      .eq('id_equipo', id_equipo);
    await supabase.from('equipo').update({ numero_integrantes: count || 0 }).eq('id_equipo', id_equipo);
  }
  return (borrados || []).length > 0;
}
