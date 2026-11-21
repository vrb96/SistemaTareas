// Validaciones compartidas según los requisitos (requisitosFinales.docx.md).
// Cada función devuelve el mensaje de error (string) o '' si el dato es válido.

const largo = (v) => String(v ?? '').trim().length;

export const PERIODOS_VALIDOS = ['Enero-Junio', 'Agosto-Diciembre'];

// RF001 / RF003: nombre 3–50, clave 1–20, grupo 1–10, periodo de la lista y año de 4 dígitos
export function validarClase({ nombre, clave, grupo, periodo, anio }) {
  if (!largo(nombre) || !largo(clave) || !largo(grupo) || !periodo || !largo(anio)) {
    return 'Faltan datos obligatorios por registrar';
  }
  if (largo(nombre) < 3 || largo(nombre) > 50) return 'El nombre debe tener entre 3 y 50 caracteres';
  if (largo(clave) > 20) return 'La clave debe tener entre 1 y 20 caracteres';
  if (largo(grupo) > 10) return 'El grupo debe tener entre 1 y 10 caracteres';
  if (!PERIODOS_VALIDOS.includes(periodo)) return 'El periodo debe ser Enero-Junio o Agosto-Diciembre';
  if (!/^\d{4}$/.test(String(anio).trim())) return 'El año debe ser un número de 4 dígitos';
  return '';
}

// RF005: 8 dígitos (AA + dígitos, consecutivo 001–999) o 9 caracteres para traslado (letra + 8 dígitos)
export function validarNoControl(noControl) {
  const v = String(noControl ?? '').trim();
  if (!v) return 'El número de control es obligatorio';
  if (!/^([A-Za-z]\d{8}|\d{8})$/.test(v)) {
    return 'El número de control no cumple el formato (8 dígitos, o 9 caracteres con letra inicial para traslado)';
  }
  if (v.slice(-3) === '000') return 'El número de control no cumple el formato (consecutivo de 001 a 999)';
  return '';
}

// RF005 / RF009: nombre 1–50, apellido paterno 1–50, apellido materno opcional hasta 50
export function validarDatosAlumno({ noControl, nombre, apellidoPaterno, apellidoMaterno }) {
  if (!largo(noControl) || !largo(nombre) || !largo(apellidoPaterno)) {
    return 'Faltan datos obligatorios (No. Control, Nombre, Apellido Paterno)';
  }
  const errNoControl = validarNoControl(noControl);
  if (errNoControl) return errNoControl;
  if (largo(nombre) > 50) return 'El nombre debe tener entre 1 y 50 caracteres';
  if (largo(apellidoPaterno) > 50) return 'El apellido paterno debe tener entre 1 y 50 caracteres';
  if (largo(apellidoMaterno) > 50) return 'El apellido materno no debe superar los 50 caracteres';
  return '';
}

// RF013 / RF015
export function validarAsignacion({ titulo, descripcion }) {
  if (!largo(titulo)) return 'El título de la asignación es obligatorio';
  if (largo(titulo) < 3 || largo(titulo) > 150) return 'El título debe tener entre 3 y 150 caracteres';
  if (largo(descripcion) > 2000) return 'La descripción no debe superar los 2000 caracteres';
  return '';
}

// RF017 / RF018
export function validarInstruccionesEntrega(instrucciones) {
  if (largo(instrucciones) > 1000) return 'Las instrucciones no deben superar los 1000 caracteres';
  return '';
}

// RF034: extensión individual
export function validarExtension(limite, cierre) {
  const fLimite = limite ? new Date(limite) : null;
  if (!fLimite || isNaN(fLimite)) return 'Debe especificar una fecha y hora límite válida';
  if (fLimite <= new Date()) return 'La fecha y hora límite extendida debe ser posterior al momento actual';
  if (cierre) {
    const fCierre = new Date(cierre);
    if (isNaN(fCierre)) return 'La fecha y hora de cierre extendida no es válida';
    if (fCierre < fLimite) return 'La fecha de cierre extendida no puede ser anterior a la fecha límite extendida';
  }
  return '';
}

// RF042 / RF043
export function validarCredenciales(correo, contrasena) {
  if (!largo(correo) || !String(contrasena ?? '')) return 'El correo y la contraseña son obligatorios';
  return '';
}
