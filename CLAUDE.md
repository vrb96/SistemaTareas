# Sistema Web de Gestión de Clases y Entregas (DeveloperLab · TecNM Chilpancingo)

## Stack
- React 19 + Vite 8 + Tailwind 4, iconos `lucide-react`. Sin router: la navegación es `vistaActual` / `modalActual` en `src/App.jsx`.
- Supabase (Postgres + Auth + Storage + RLS). Cliente en `src/supa/supabaseClient.js`.
- `mammoth` + `diff` para comparar .docx (RF029–RF031), `xlsx` para importar desde MindBox.
- Scripts: `npm run dev`, `npm run build`, `npm run lint` (oxlint).
- Estilos compartidos en `src/theme.js`. Textos de la UI y mensajes en español, tal como vienen en los requisitos.

## Estructura
- `src/views/Pantalla*.jsx`: pantallas "tontas" que reciben datos y callbacks `on*` por props.
- `src/components/Modal*.jsx`: modales del profesor (clase, alumno, carga masiva, asignación, entrega, contraseña).
- `src/services/*.js`: acceso a Supabase. **App.jsx conecta los servicios con las vistas.**
  - `alumnoConsultaService` (C.U.9), `enviosService` (C.U.10), `comparadorService` (C.U.11),
    `evaluacionesService` (C.U.12), `equiposService` (C.U.13).
- Tablas usadas: clase, alumno, profesor, inscripcion_clase, asignacion, entrega, envio,
  comentario_entrega, permiso_extension, equipo, integrantes_equipo.

## Requisitos (fuente: requisitosFinales.docx.md / IntegracionIteracion2.pdf)
| Iteración | Módulo | RF | Caso de uso |
|---|---|---|---|
| it1 | 1 Clases | RF001–004 | C.U.1–8 |
| it1 | 2 Alumnos por clase | RF005–012 | |
| it1 | 3 Asignaciones y entregas | RF013–020 | |
| it2 | 4 Consulta y envío del alumno | RF021–026 | C.U.9 (consultar), C.U.10 (envíos) |
| it2 | 5 Seguimiento/comparación | RF027–031 | C.U.11 |
| it2 | 5 Calificación, extensión, comentarios | RF032–036 | C.U.12 |
| it3 | 6 Equipos | RF037–041 | C.U.13 (RF041 = equipo del alumno, va con C.U.10) |
| it3 | 7 Sesión | RF042–044 | C.U.14 |

Reglas clave:
- C.U.12: calificación entera 0–100 ("La calificación debe ser un número entero entre 0 y 100"); comentarios de 1–2000 caracteres
  ("El comentario debe contener entre 1 y 2000 caracteres"), con fecha y hora, orden cronológico, editar/eliminar con confirmación;
  permiso de extensión individual (fecha límite y fecha de cierre extendidas) en `permiso_extension`.
- C.U.13: alumno elegible = inscripción Activa + participación "Participa" + sin equipo en la clase. Mínimo 4 alumnos en la clase y
  2 elegibles ("La clase debe contar con al menos 4 alumnos..."). Tamaño 2–10, reparto aleatorio, nombres "Equipo N" desde el
  siguiente número libre, vista previa (Confirmar / Volver a generar / Cancelar). Modificar: renombrar (único en la clase), agregar,
  quitar, mover integrante. Eliminar con confirmación (los integrantes vuelven a ser elegibles).
- C.U.14: login con Supabase Auth (correo + contraseña); error genérico "Correo o contraseña incorrectos"; campos vacíos →
  "El correo y la contraseña son obligatorios"; rol Profesor → PantallaPrincipal (RF002), Alumno → PantallaClasesAlumno (RF021).
  Si el alumno tiene cambio de contraseña pendiente (RF007), se le obliga a cambiarla. Cambiar contraseña valida la actual.
  Cerrar sesión desde cualquier pantalla. Cierre automático tras 30 min de inactividad: "Tu sesión ha expirado por inactividad".

## Estado actual (rama `feature/logica-it2`, 2026-11-19)
- ✅ C.U.1–8 (it1), C.U.9, C.U.10, C.U.11: servicios conectados en App.jsx.
- ✅ C.U.12: calificación, extensión y comentarios conectados en App.jsx → `evaluacionesService`. La vista muestra los
  errores del servicio. El envío del alumno respeta la extensión (`verificarEntregaAbiertaParaAlumno`).
  `uidProfesor` se pasa como `usuario?.uid`, que será `null` hasta que exista el login real (C.U.14).
- ✅ C.U.13: App.jsx carga los equipos con `obtenerDatosEquiposClase`. Cada callback de `PantallaEquipos` hace la operación y
  devuelve los datos frescos `{ equipos, elegibles }`. La vista previa usa `generarPropuestaEquiposAleatorios` (evita equipos
  de 1 integrante). Los "Mover a..." se acumulan y se guardan al presionar Guardar; Cancelar los descarta.
  RF010/RF011/RF012: la baja, la reactivación y "No participa" sacan al alumno de su equipo
  (`sacarAlumnoDeEquipoPorInscripcion`).
- ✅ C.U.14 (código): `src/services/authService.js` con signInWithPassword, getSession, updateUser + rpc y signOut.
  Rol y marca de cambio pendiente en la tabla `usuario` (uid, correo, rol, no_control, cambio_contrasena_pendiente).
  RF007: el profesor crea la cuenta del alumno nuevo con `rpc('crear_cuenta_alumno')` desde ModalRegistrarAlumno y
  ModalCargaMasiva (contraseña inicial = no. de control). Con cambio pendiente se abre ModalCambiarContrasena obligatorio.
  Las clases se filtran y crean con `usuario.uid`. Se quitaron el usuario fijo y la barra de pruebas.
- ⚠️ **Requiere ejecutar `supabase/cu14_auth.sql`** en el SQL Editor: crea la tabla `usuario` y las funciones,
  crea la cuenta del profesor (editar correo/contraseña en la sección 5), migra las clases de 'profesor-de-prueba-id'
  y crea las cuentas de los alumnos existentes.
- ✅ `cu14_auth.sql` ya se ejecutó (2026-11-19) y el login real funciona.
- ✅ RF009: ModalGestionAlumno llama a `rpc('actualizar_alumno')` (`supabase/rf009_editar_alumno.sql`). Si cambia el
  no. de control, en una transacción: valida que no exista, mueve el historial de toda tabla con columna `no_control`,
  y actualiza `alumno.correo`, `usuario.correo` y auth.users/identities sin tocar la contraseña. El correo ya no
  se edita a mano: se deriva del no. de control. Antes de guardar se muestra el aviso "El correo de acceso del alumno cambiará a…".
