-- =====================================================================
-- RF009 · Editar datos del alumno (número de control, nombre y apellidos)
-- Ejecutar UNA VEZ en Supabase → SQL Editor (después de cu14_auth.sql).
--
-- Si cambia el número de control:
--   · Rechaza si el nuevo número ya pertenece a otro alumno.
--   · Mueve todo su historial (inscripciones, envíos, equipos, comentarios, extensiones, usuario).
--   · Actualiza el correo institucional y el usuario de acceso (auth) SIN cambiar su contraseña.
-- Todo ocurre en una sola transacción: si algo falla, no se modifica nada.
-- =====================================================================

create or replace function public.actualizar_alumno(
  p_no_control_actual text,
  p_no_control_nuevo text,
  p_nombre text,
  p_apellido_paterno text,
  p_apellido_materno text default null
) returns text  -- devuelve el correo institucional resultante
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actual text := trim(p_no_control_actual);
  v_nuevo text := upper(trim(p_no_control_nuevo));
  v_nombre text := trim(p_nombre);
  v_ap text := trim(p_apellido_paterno);
  v_am text := nullif(trim(coalesce(p_apellido_materno, '')), '');
  v_correo text;
  v_uid uuid;
  t record;
begin
  -- Solo el profesor que tiene al alumno inscrito en alguna de sus clases
  if not exists (
    select 1
    from public.inscripcion_clase ic
    join public.clase c on c.id_clase = ic.id_clase
    where ic.no_control = v_actual and c.uid_profesor = auth.uid()::text
  ) then
    raise exception 'No tienes permiso para editar a este alumno';
  end if;

  -- Validaciones de RF005
  if v_nuevo = '' or v_nombre = '' or v_ap = '' then
    raise exception 'El número de control, el nombre y el apellido paterno son obligatorios';
  end if;
  if v_nuevo !~ '^([A-Z][0-9]{8}|[0-9]{8})$' then
    raise exception 'El número de control no tiene un formato válido';
  end if;
  if length(v_nombre) > 50 or length(v_ap) > 50 or length(coalesce(v_am, '')) > 50 then
    raise exception 'El nombre y los apellidos deben tener como máximo 50 caracteres';
  end if;

  v_correo := 'l' || lower(v_nuevo) || '@chilpancingo.tecnm.mx';

  -- Caso 1: el número de control no cambia → solo nombre y apellidos
  if v_nuevo = upper(v_actual) then
    update public.alumno
      set nombre = v_nombre, apellido_paterno = v_ap, apellido_materno = v_am
      where no_control = v_actual;
    select correo into v_correo from public.alumno where no_control = v_actual;
    return v_correo;
  end if;

  -- Caso 2: cambia el número de control
  if exists (select 1 from public.alumno where upper(no_control) = v_nuevo) then
    raise exception 'El número de control % ya pertenece a otro alumno', v_nuevo;
  end if;
  if exists (select 1 from auth.users where email = v_correo) then
    raise exception 'El correo % ya está en uso por otra cuenta', v_correo;
  end if;

  -- a) Nuevo registro de alumno
  insert into public.alumno (no_control, nombre, apellido_paterno, apellido_materno, correo)
  values (v_nuevo, v_nombre, v_ap, v_am, v_correo);

  -- b) Mover el historial: toda tabla de public con columna no_control (excepto alumno)
  for t in
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'no_control'
      and table_name <> 'alumno'
      and table_name in (select table_name from information_schema.tables
                         where table_schema = 'public' and table_type = 'BASE TABLE')
  loop
    execute format('update public.%I set no_control = $1 where no_control = $2', t.table_name)
      using v_nuevo, v_actual;
  end loop;

  -- c) Eliminar el registro anterior
  delete from public.alumno where no_control = v_actual;

  -- d) Usuario de acceso: nuevo correo, misma contraseña
  select uid into v_uid from public.usuario where no_control = v_nuevo;
  if v_uid is not null then
    update public.usuario set correo = v_correo where uid = v_uid;
    update auth.users set email = v_correo, updated_at = now() where id = v_uid;
    update auth.identities
      set identity_data = jsonb_set(identity_data, '{email}', to_jsonb(v_correo)), updated_at = now()
      where user_id = v_uid and provider = 'email';
  end if;

  return v_correo;
end;
$$;

revoke all on function public.actualizar_alumno(text, text, text, text, text) from public, anon;
grant execute on function public.actualizar_alumno(text, text, text, text, text) to authenticated;
