// src/services/authService.js — C.U.14 (RF007, RF042, RF043, RF044)
import { supabase } from '../supa/supabaseClient';

const ERROR_CREDENCIALES = 'Correo o contraseña incorrectos';

/**
 * Arma el objeto de usuario de la app a partir de la sesión de Supabase Auth
 * y de su fila en la tabla `usuario` (rol, no_control, cambio pendiente).
 */
async function construirUsuario(authUser) {
  const { data: perfil, error } = await supabase
    .from('usuario')
    .select('rol, no_control, cambio_contrasena_pendiente')
    .eq('uid', authUser.id)
    .maybeSingle();

  if (error) throw error;
  if (!perfil) {
    // Cuenta de Auth sin rol asignado en el sistema: no se permite el acceso
    await supabase.auth.signOut();
    throw new Error(ERROR_CREDENCIALES);
  }

  return {
    uid: authUser.id,
    correo: authUser.email,
    rol: perfil.rol,
    no_control: perfil.no_control || null,
    cambioContrasenaPendiente: perfil.cambio_contrasena_pendiente
  };
}

/**
 * RF042 · Iniciar sesión. No indica si falló el correo o la contraseña.
 */
export async function iniciarSesion(correo, contrasena) {
  if (!correo?.trim() || !contrasena) {
    throw new Error('El correo y la contraseña son obligatorios');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo.trim().toLowerCase(),
    password: contrasena
  });

  if (error || !data?.user) throw new Error(ERROR_CREDENCIALES);
  return construirUsuario(data.user);
}

/**
 * Recupera la sesión guardada (recarga de página). Devuelve null si no hay sesión.
 */
export async function obtenerSesionActual() {
  const { data } = await supabase.auth.getSession();
  const authUser = data?.session?.user;
  if (!authUser) return null;
  try {
    return await construirUsuario(authUser);
  } catch {
    return null;
  }
}

/**
 * RF043 · Cambiar contraseña: valida la actual reautenticando y luego actualiza.
 */
export async function cambiarContrasena({ correo, actual, nueva }) {
  const { error: errActual } = await supabase.auth.signInWithPassword({
    email: correo,
    password: actual
  });
  if (errActual) throw new Error('La contraseña actual es incorrecta');

  const { error: errUpd } = await supabase.auth.updateUser({ password: nueva });
  if (errUpd) throw new Error(errUpd.message || 'No se pudo actualizar la contraseña');

  const { error: errMarca } = await supabase.rpc('marcar_contrasena_cambiada');
  if (errMarca) throw errMarca;
}

/**
 * RF044 · Cerrar sesión.
 */
export async function cerrarSesion() {
  await supabase.auth.signOut();
}

/**
 * RF007 · Crea la cuenta de Auth del alumno recién registrado (contraseña inicial = no. de control,
 * con cambio pendiente). Si ya tenía cuenta no hace nada. Devuelve true si la creó.
 */
export async function crearCuentaAlumno(noControl) {
  const { data, error } = await supabase.rpc('crear_cuenta_alumno', { p_no_control: noControl });
  if (error) throw error;
  return data === true;
}
