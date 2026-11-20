-- =====================================================================
-- C.U.14 · Inicio de sesión con Supabase Auth (RF007, RF042, RF043, RF044)
-- Ejecutar UNA VEZ en Supabase → SQL Editor (como postgres).
-- Antes de ejecutar, edita los datos del profesor en la sección 5.
-- =====================================================================

-- 1. Tabla USUARIO (Diccionario de dominio, Tabla 012): rol + uid + correo
create table if not exists public.usuario (
  uid uuid primary key references auth.users (id) on delete cascade,
  correo text not null unique,
  rol text not null check (rol in ('Profesor', 'Alumno')),
  no_control text references public.alumno (no_control) on update cascade on delete cascade,
  cambio_contrasena_pendiente boolean not null default false
);

alter table public.usuario enable row level security;

drop policy if exists "usuario_lee_su_fila" on public.usuario;
create policy "usuario_lee_su_fila" on public.usuario
  for select using (uid = auth.uid());

-- 2. Función interna: crea la cuenta en Auth (no expuesta a la API)
create or replace function public._crear_cuenta_auth(
  p_correo text,
  p_contrasena text,
  p_rol text,
  p_no_control text default null,
  p_cambio_pendiente boolean default true
) returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid;
  v_correo text := lower(trim(p_correo));
begin
  -- Si ya existe una cuenta con ese correo, no se crea otra ni se cambia su contraseña
  select id into v_uid from auth.users where email = v_correo;

  if v_uid is null then
    v_uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      v_correo, extensions.crypt(p_contrasena, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
      '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_uid, v_uid::text,
      jsonb_build_object('sub', v_uid::text, 'email', v_correo, 'email_verified', true),
      'email', now(), now(), now()
    );
  end if;

  insert into public.usuario (uid, correo, rol, no_control, cambio_contrasena_pendiente)
  values (v_uid, v_correo, p_rol, p_no_control, p_cambio_pendiente)
  on conflict (uid) do nothing;

  return v_uid;
end;
$$;

revoke all on function public._crear_cuenta_auth(text, text, text, text, boolean) from public, anon, authenticated;

-- 3. RF007: el profesor crea la cuenta del alumno al registrarlo por primera vez
--    Correo: el registrado en ALUMNO · Contraseña inicial: número de control · Cambio pendiente
create or replace function public.crear_cuenta_alumno(p_no_control text)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_correo text;
begin
  if not exists (select 1 from public.usuario where uid = auth.uid() and rol = 'Profesor') then
    raise exception 'Solo un profesor puede crear cuentas de alumnos';
  end if;

  select correo into v_correo from public.alumno where no_control = trim(p_no_control);
  if v_correo is null then
    raise exception 'El alumno % no está registrado', p_no_control;
  end if;

  if exists (select 1 from auth.users where email = lower(trim(v_correo))) then
    return false; -- ya tenía cuenta: no se generan credenciales nuevas
  end if;

  perform public._crear_cuenta_auth(v_correo, trim(p_no_control), 'Alumno', trim(p_no_control), true);
  return true;
end;
$$;

revoke all on function public.crear_cuenta_alumno(text) from public, anon;
grant execute on function public.crear_cuenta_alumno(text) to authenticated;

-- 4. RF043: quita la marca de cambio de contraseña pendiente del usuario en sesión
create or replace function public.marcar_contrasena_cambiada()
returns void
language sql
security definer
set search_path = public
as $$
  update public.usuario set cambio_contrasena_pendiente = false where uid = auth.uid();
$$;

revoke all on function public.marcar_contrasena_cambiada() from public, anon;
grant execute on function public.marcar_contrasena_cambiada() to authenticated;

-- 5. Cuenta del profesor (la crea el Administrador). EDITA estos datos antes de ejecutar.
--    Migra las clases que estaban asignadas a 'profesor-de-prueba-id' al nuevo profesor.
do $$
declare
  v_correo text := 'profesor@chilpancingo.tecnm.mx';  -- ← correo del profesor
  v_contrasena text := 'CambiaEsto123';               -- ← contraseña inicial
  v_uid uuid;
begin
  v_uid := public._crear_cuenta_auth(v_correo, v_contrasena, 'Profesor', null, true);

  insert into public.profesor (uid, nombre, apellido_paterno, apellido_materno)
  select v_uid::text, nombre, apellido_paterno, apellido_materno
  from public.profesor where uid = 'profesor-de-prueba-id'
  on conflict (uid) do nothing;

  update public.clase set uid_profesor = v_uid::text where uid_profesor = 'profesor-de-prueba-id';
  delete from public.profesor where uid = 'profesor-de-prueba-id';
end;
$$;

-- 6. Crea las cuentas de los alumnos que ya estaban registrados (contraseña = número de control)
do $$
declare
  a record;
begin
  for a in
    select al.no_control, al.correo
    from public.alumno al
    where al.correo is not null
      and not exists (select 1 from public.usuario u where u.no_control = al.no_control)
  loop
    perform public._crear_cuenta_auth(a.correo, a.no_control, 'Alumno', a.no_control, true);
  end loop;
end;
$$;
