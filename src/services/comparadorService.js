// src/services/comparadorService.js
import mammoth from 'mammoth';
import { diffWords } from 'diff';
import { supabase } from '../supa/supabaseClient';

const BUCKET_ENVIOS = 'entregas';

/**
 * 1. Lista los alumnos con inscripción Activa de una clase y su estado de envío en una entrega (C.U.11 Paso 3)
 */
export async function obtenerEnviosDeEntrega(idClase, idEntrega) {
  // Traer alumnos con inscripción Activa en la clase
  const { data: inscritos, error: errIns } = await supabase
    .from('inscripcion_clase')
    .select(`
      no_control,
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

  // Traer los envíos registrados para esa entrega
  const { data: envios, error: errEnv } = await supabase
    .from('envio')
    .select('id_envio, no_control, nombre_archivo, ruta_storage, estado_envio, fecha_hora_envio, calificacion')
    .eq('id_entrega', idEntrega);

  if (errEnv) throw errEnv;

  const mapaEnvios = new Map((envios || []).map((e) => [e.no_control, e]));

  // Armar la lista y ordenar por apellido paterno, materno y nombre
  const lista = (inscritos || [])
    .filter((item) => item.alumno)
    .sort((a, b) => {
      const alA = a.alumno;
      const alB = b.alumno;
      const cmpPat = (alA.apellido_paterno || '').localeCompare(alB.apellido_paterno || '', 'es');
      if (cmpPat !== 0) return cmpPat;
      const cmpMat = (alA.apellido_materno || '').localeCompare(alB.apellido_materno || '', 'es');
      if (cmpMat !== 0) return cmpMat;
      return (alA.nombre || '').localeCompare(alB.nombre || '', 'es');
    })
    .map((item) => {
      const al = item.alumno;
      const envio = mapaEnvios.get(al.no_control);
      const esEnviado = envio && envio.estado_envio === 'Enviado';

      return {
        id_alumno: al.no_control, // Compatible con key={alumno.id_alumno} en PantallaEnviosEntrega
        no_control: al.no_control,
        nombre_completo: `${al.apellido_paterno} ${al.apellido_materno || ''} ${al.nombre}`.replace(/\s+/g, ' ').trim(),
        id_envio: envio?.id_envio || null,
        estado_envio: esEnviado ? 'Enviado' : 'Sin enviar',
        fecha_hora_envio: esEnviado && envio.fecha_hora_envio
          ? new Date(envio.fecha_hora_envio).toLocaleString('es-MX')
          : null,
        nombre_archivo: esEnviado ? envio.nombre_archivo : null,
        ruta_storage: esEnviado ? envio.ruta_storage : null,
        calificacion: envio?.calificacion ?? null
      };
    });

  return lista;
}

/**
 * 2. Extrae únicamente los párrafos de texto de un .docx (ignora tablas, imágenes, formato y vacíos)
 */
async function extraerParrafosDocx(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Eliminar tablas e imágenes explícitamente (C.U.11 Paso 7)
  doc.querySelectorAll('table, img').forEach((el) => el.remove());

  const parrafos = Array.from(doc.querySelectorAll('p'))
    .map((p) => p.textContent.replace(/\s+/g, ' ').trim())
    .filter((texto) => texto.length > 0);

  return parrafos;
}

/**
 * 3. Compara dos arreglos de párrafos palabra por palabra
 */
function generarComparacionParrafos(parrafosAnt, parrafosAct) {
  const maxLen = Math.max(parrafosAnt.length, parrafosAct.length);
  const parrafosResultado = [];
  let hayDiferencias = false;

  for (let i = 0; i < maxLen; i++) {
    const textoAnt = parrafosAnt[i] || '';
    const textoAct = parrafosAct[i] || '';

    if (textoAnt === textoAct) {
      parrafosResultado.push({
        tokens: [{ tipo: 'igual', texto: textoAct }]
      });
      continue;
    }

    hayDiferencias = true;
    const diferencias = diffWords(textoAnt, textoAct);
    const tokens = diferencias.map((parte) => ({
      tipo: parte.added ? 'agregado' : parte.removed ? 'eliminado' : 'igual',
      texto: parte.value
    }));

    parrafosResultado.push({ tokens });
  }

  return {
    sinCambios: !hayDiferencias,
    parrafos: parrafosResultado
  };
}

/**
 * 4. Motor principal de comparación contra la entrega anterior más cercana con archivo (C.U.11 Pasos 5-7 y FA_02)
 */
export async function compararEntregaConAnterior({ idAsignacion, idEntregaActual, noControl }) {
  // Obtener todas las entregas de la asignación en orden cronológico
  const { data: entregas, error: errEnt } = await supabase
    .from('entrega')
    .select('id_entrega, numero_entrega, fecha_limite, hora_limite')
    .eq('id_asignacion', idAsignacion)
    .order('fecha_limite', { ascending: true })
    .order('hora_limite', { ascending: true });

  if (errEnt) throw errEnt;
  if (!entregas || entregas.length === 0) return null;

  const indiceActual = entregas.findIndex((e) => e.id_entrega === idEntregaActual);

  // Paso 5: Si es la Entrega 1, no se muestra área de comparación
  if (indiceActual <= 0) return null;

  // Traer los envíos del alumno en todas las entregas hasta la actual
  const idsHastaActual = entregas.slice(0, indiceActual + 1).map((e) => e.id_entrega);
  const { data: enviosAlumno, error: errEnv } = await supabase
    .from('envio')
    .select('id_entrega, ruta_storage, nombre_archivo, estado_envio')
    .eq('no_control', noControl)
    .eq('estado_envio', 'Enviado')
    .in('id_entrega', idsHastaActual);

  if (errEnv) throw errEnv;

  const mapaEnvios = new Map((enviosAlumno || []).map((e) => [e.id_entrega, e]));
  const envioActual = mapaEnvios.get(idEntregaActual);

  // Paso 5: Si el alumno no tiene archivo vigente en la entrega actual, no mostrar comparación
  if (!envioActual?.ruta_storage) return null;

  // Paso 6: Buscar la entrega anterior más cercana con archivo y registrar las omitidas
  let entregaPrevia = null;
  let envioPrevio = null;
  const omitidas = [];

  for (let i = indiceActual - 1; i >= 0; i--) {
    const ent = entregas[i];
    const env = mapaEnvios.get(ent.id_entrega);
    const etiqueta = ent.numero_entrega || `Entrega ${i + 1}`;

    if (env?.ruta_storage) {
      entregaPrevia = { ...ent, etiqueta };
      envioPrevio = env;
      break;
    } else {
      omitidas.unshift(`${etiqueta}: sin entregar`);
    }
  }

  // FA_02: Ninguna entrega anterior tiene archivo
  if (!entregaPrevia || !envioPrevio) {
    return {
      titulo: 'Sin entrega previa para comparar',
      sinEntregaPrevia: true,
      omitidas,
      sinCambios: false,
      parrafos: []
    };
  }

  // Verificar que ambos archivos sean .docx para la extracción de texto
  const actualEsDocx = envioActual.nombre_archivo?.toLowerCase().endsWith('.docx');
  const previoEsDocx = envioPrevio.nombre_archivo?.toLowerCase().endsWith('.docx');

  if (!actualEsDocx || !previoEsDocx) {
    return {
      titulo: `Comparado contra ${entregaPrevia.etiqueta}`,
      omitidas,
      sinCambios: false,
      aviso: 'La comparación de texto solo está disponible entre archivos .docx.',
      parrafos: []
    };
  }

  // Descargar ambos archivos desde Supabase Storage
  const [{ data: blobActual, error: errDownAct }, { data: blobPrevio, error: errDownPrev }] =
    await Promise.all([
      supabase.storage.from(BUCKET_ENVIOS).download(envioActual.ruta_storage),
      supabase.storage.from(BUCKET_ENVIOS).download(envioPrevio.ruta_storage)
    ]);

  if (errDownAct) throw new Error(`Error al leer archivo actual: ${errDownAct.message}`);
  if (errDownPrev) throw new Error(`Error al leer archivo anterior: ${errDownPrev.message}`);

  const [parrafosPrevios, parrafosActuales] = await Promise.all([
    extraerParrafosDocx(blobPrevio),
    extraerParrafosDocx(blobActual)
  ]);

  const { sinCambios, parrafos } = generarComparacionParrafos(parrafosPrevios, parrafosActuales);

  return {
    titulo: `Comparado contra ${entregaPrevia.etiqueta}`,
    omitidas,
    sinCambios,
    sinEntregaPrevia: false,
    parrafos
  };
}