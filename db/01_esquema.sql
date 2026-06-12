-- ============================================================================
-- POLLA MUNDIALISTA FIFA 2026 — Esquema de base de datos (PostgreSQL / Supabase)
-- Sistema de puntuación: Modelo 2 (5/3/1/0)
-- Convenciones: nombres en español, horas en UTC (timestamptz), RLS activado.
-- Ejecutar este script completo en: Supabase > SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Limpieza opcional (descomentar SOLO si quieres recrear desde cero).
--    OJO: esto BORRA datos. No lo ejecutes en un entorno con información real.
-- ----------------------------------------------------------------------------
-- drop view  if exists public.v_historial_usuario;
-- drop view  if exists public.v_ranking;
-- drop table if exists public.auditoria   cascade;
-- drop table if exists public.puntajes    cascade;
-- drop table if exists public.pronosticos cascade;
-- drop table if exists public.resultados  cascade;
-- drop table if exists public.partidos    cascade;
-- drop table if exists public.equipos     cascade;
-- drop table if exists public.perfiles    cascade;

-- ----------------------------------------------------------------------------
-- 1. EQUIPOS (selecciones del Mundial). Normaliza nombres y banderas.
-- ----------------------------------------------------------------------------
create table if not exists public.equipos (
  id          smallint generated always as identity primary key,
  nombre      text        not null,
  codigo      char(3)     not null unique,          -- código FIFA, ej. 'COL'
  grupo       char(1),                              -- A..L (12 grupos en 2026)
  bandera_url text
);

-- ----------------------------------------------------------------------------
-- 2. PERFILES (extiende auth.users de Supabase con datos de la app)
-- ----------------------------------------------------------------------------
create table if not exists public.perfiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  nombre    text        not null,
  email     text,
  rol       text        not null default 'usuario'
                         check (rol in ('usuario','admin')),
  activo    boolean     not null default true,
  creado_en timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. PARTIDOS. 'cierre' (= inicio - 5 min) lo fija el trigger de 3.1.
-- ----------------------------------------------------------------------------
create table if not exists public.partidos (
  id                  bigint generated always as identity primary key,
  equipo_local_id     smallint not null references public.equipos(id),
  equipo_visitante_id smallint not null references public.equipos(id),
  fase                text not null default 'grupos'
                        check (fase in ('grupos','dieciseisavos','octavos',
                                        'cuartos','semifinal','tercer_puesto','final')),
  grupo               char(1),
  estadio             text,
  inicio              timestamptz not null,                 -- UTC
  cierre              timestamptz not null,                 -- = inicio - 5 min (lo fija un trigger)
  estado              text not null default 'programado'
                        check (estado in ('programado','cerrado','en_juego','finalizado')),
  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),
  constraint equipos_distintos check (equipo_local_id <> equipo_visitante_id)
);
create index if not exists idx_partidos_inicio on public.partidos(inicio);

-- 3.1 Fijar 'cierre' = inicio - 5 minutos en cada alta/edición de partido.
--     (Se hace con trigger porque una columna generada con fechas con zona
--      horaria no es admitida: PostgreSQL la considera no inmutable.)
create or replace function public.fn_set_cierre()
returns trigger language plpgsql as $$
begin
  new.cierre := new.inicio - interval '5 minutes';
  return new;
end;$$;

drop trigger if exists trg_set_cierre on public.partidos;
create trigger trg_set_cierre
before insert or update on public.partidos
for each row execute function public.fn_set_cierre();

-- ----------------------------------------------------------------------------
-- 4. RESULTADOS oficiales (relación 1:1 con partido vía UNIQUE).
--    fuente = 'api' (descarga automática) o 'manual' (corrección del admin).
-- ----------------------------------------------------------------------------
create table if not exists public.resultados (
  id              bigint generated always as identity primary key,
  partido_id      bigint not null unique references public.partidos(id) on delete cascade,
  goles_local     smallint not null check (goles_local     >= 0),
  goles_visitante smallint not null check (goles_visitante >= 0),
  fuente          text not null default 'manual' check (fuente in ('api','manual')),
  registrado_por  uuid references public.perfiles(id),     -- null si vino de la API
  registrado_en   timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. PRONOSTICOS (un pronóstico por usuario y partido).
-- ----------------------------------------------------------------------------
create table if not exists public.pronosticos (
  id              bigint generated always as identity primary key,
  usuario_id      uuid   not null references public.perfiles(id) on delete cascade,
  partido_id      bigint not null references public.partidos(id) on delete cascade,
  goles_local     smallint not null check (goles_local     >= 0),
  goles_visitante smallint not null check (goles_visitante >= 0),
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),
  unique (usuario_id, partido_id)
);
create index if not exists idx_pronosticos_partido on public.pronosticos(partido_id);
create index if not exists idx_pronosticos_usuario on public.pronosticos(usuario_id);

-- ----------------------------------------------------------------------------
-- 6. PUNTAJES (resultado del cálculo, granular por pronóstico).
--    error_goles = |error local| + |error visitante| (para desempates).
-- ----------------------------------------------------------------------------
create table if not exists public.puntajes (
  id            bigint generated always as identity primary key,
  pronostico_id bigint not null unique references public.pronosticos(id) on delete cascade,
  usuario_id    uuid   not null references public.perfiles(id) on delete cascade,
  partido_id    bigint not null references public.partidos(id) on delete cascade,
  puntos        smallint not null check (puntos in (0,1,3,5)),
  tipo_acierto  text not null check (tipo_acierto in ('exacto','diferencia','sentido','fallo')),
  error_goles   smallint not null default 0,
  calculado_en  timestamptz not null default now()
);
create index if not exists idx_puntajes_usuario on public.puntajes(usuario_id);

-- ----------------------------------------------------------------------------
-- 7. AUDITORIA (registro de cambios administrativos).
-- ----------------------------------------------------------------------------
create table if not exists public.auditoria (
  id         bigint generated always as identity primary key,
  actor_id   uuid references public.perfiles(id),
  accion     text not null,                 -- INSERT / UPDATE / DELETE
  entidad    text not null,                 -- tabla afectada
  entidad_id text,
  detalle    jsonb,                         -- { antes:{...}, despues:{...} }
  creado_en  timestamptz not null default now()
);

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- 8. Cálculo de puntos — Modelo 2 (5/3/1/0).
--    El orden del CASE importa: exacto -> diferencia -> sentido -> fallo.
create or replace function public.calcular_puntos(
  p_local int, p_visit int, r_local int, r_visit int
) returns table (puntos smallint, tipo text)
language sql immutable as $$
  select
    case
      when p_local = r_local and p_visit = r_visit                  then 5::smallint
      when (p_local - p_visit) = (r_local - r_visit)                then 3::smallint
      when sign(p_local - p_visit) = sign(r_local - r_visit)        then 1::smallint
      else 0::smallint
    end,
    case
      when p_local = r_local and p_visit = r_visit                  then 'exacto'
      when (p_local - p_visit) = (r_local - r_visit)                then 'diferencia'
      when sign(p_local - p_visit) = sign(r_local - r_visit)        then 'sentido'
      else 'fallo'
    end;
$$;

-- 9. Al registrar/corregir un resultado, (re)calcula los puntajes del partido
--    y marca el partido como finalizado.
create or replace function public.fn_aplicar_resultado()
returns trigger language plpgsql security definer as $$
begin
  insert into public.puntajes (pronostico_id, usuario_id, partido_id, puntos, tipo_acierto, error_goles)
  select pr.id, pr.usuario_id, pr.partido_id, cp.puntos, cp.tipo,
         abs(pr.goles_local - new.goles_local) + abs(pr.goles_visitante - new.goles_visitante)
  from public.pronosticos pr
  cross join lateral public.calcular_puntos(
       pr.goles_local, pr.goles_visitante, new.goles_local, new.goles_visitante) cp
  where pr.partido_id = new.partido_id
  on conflict (pronostico_id) do update
    set puntos       = excluded.puntos,
        tipo_acierto = excluded.tipo_acierto,
        error_goles  = excluded.error_goles,
        calculado_en = now();

  update public.partidos
     set estado = 'finalizado', actualizado_en = now()
   where id = new.partido_id;
  return new;
end;$$;

drop trigger if exists trg_resultado_puntajes on public.resultados;
create trigger trg_resultado_puntajes
after insert or update on public.resultados
for each row execute function public.fn_aplicar_resultado();

-- 10. Recálculo global (botón de administración).
create or replace function public.recalcular_puntajes()
returns void language plpgsql security definer as $$
begin
  insert into public.puntajes (pronostico_id, usuario_id, partido_id, puntos, tipo_acierto, error_goles)
  select pr.id, pr.usuario_id, pr.partido_id, cp.puntos, cp.tipo,
         abs(pr.goles_local - re.goles_local) + abs(pr.goles_visitante - re.goles_visitante)
  from public.pronosticos pr
  join public.resultados re on re.partido_id = pr.partido_id
  cross join lateral public.calcular_puntos(
       pr.goles_local, pr.goles_visitante, re.goles_local, re.goles_visitante) cp
  on conflict (pronostico_id) do update
    set puntos       = excluded.puntos,
        tipo_acierto = excluded.tipo_acierto,
        error_goles  = excluded.error_goles,
        calculado_en = now();
end;$$;

-- 11. Bloqueo de cierre a nivel de base de datos (garantía dura del backend).
--     Rechaza crear/editar pronósticos si faltan <5 min (usa partidos.cierre).
create or replace function public.fn_bloqueo_cierre()
returns trigger language plpgsql as $$
declare v_cierre timestamptz;
begin
  select cierre into v_cierre from public.partidos where id = new.partido_id;
  if now() >= v_cierre then
    raise exception 'Pronóstico cerrado: faltan menos de 5 minutos para el inicio del partido.';
  end if;
  return new;
end;$$;

drop trigger if exists trg_bloqueo_cierre on public.pronosticos;
create trigger trg_bloqueo_cierre
before insert or update on public.pronosticos
for each row execute function public.fn_bloqueo_cierre();

-- 12. Crear perfil automáticamente cuando se registra un usuario en Supabase Auth.
create or replace function public.fn_nuevo_usuario()
returns trigger language plpgsql security definer as $$
begin
  insert into public.perfiles (id, nombre, email)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)),
          new.email);
  return new;
end;$$;

drop trigger if exists trg_auth_nuevo_usuario on auth.users;
create trigger trg_auth_nuevo_usuario
after insert on auth.users
for each row execute function public.fn_nuevo_usuario();

-- 13. Proteger rol/estado: solo un admin puede cambiarlos.
create or replace function public.es_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin');
$$;

create or replace function public.fn_proteger_rol()
returns trigger language plpgsql security definer as $$
begin
  if not public.es_admin() and (new.rol <> old.rol or new.activo <> old.activo) then
    raise exception 'No autorizado para cambiar rol o estado del usuario.';
  end if;
  return new;
end;$$;

drop trigger if exists trg_proteger_rol on public.perfiles;
create trigger trg_proteger_rol before update on public.perfiles
for each row execute function public.fn_proteger_rol();

-- 14. Auditoría genérica para cambios administrativos.
create or replace function public.fn_auditoria()
returns trigger language plpgsql security definer as $$
begin
  insert into public.auditoria (actor_id, accion, entidad, entidad_id, detalle)
  values (auth.uid(), tg_op, tg_table_name,
          coalesce(new.id::text, old.id::text),
          jsonb_build_object('antes', to_jsonb(old), 'despues', to_jsonb(new)));
  return coalesce(new, old);
end;$$;

drop trigger if exists trg_aud_partidos on public.partidos;
create trigger trg_aud_partidos after insert or update or delete on public.partidos
for each row execute function public.fn_auditoria();

drop trigger if exists trg_aud_resultados on public.resultados;
create trigger trg_aud_resultados after insert or update or delete on public.resultados
for each row execute function public.fn_auditoria();

-- ============================================================================
-- VISTAS
-- ============================================================================

-- 15. Ranking general con criterios de desempate.
create or replace view public.v_ranking as
select
  pf.id                                                              as usuario_id,
  pf.nombre,
  coalesce(sum(pu.puntos), 0)                                        as puntos_total,
  count(*) filter (where pu.tipo_acierto = 'exacto')                 as marcadores_exactos,
  count(*) filter (where pu.tipo_acierto in ('exacto','diferencia','sentido')) as ganadores_acertados,
  coalesce(sum(pu.error_goles), 0)                                   as error_goles_total,
  count(pu.id)                                                       as pronosticos_calificados
from public.perfiles pf
left join public.puntajes pu on pu.usuario_id = pf.id
where pf.activo
group by pf.id, pf.nombre
order by puntos_total desc,            -- 1) puntaje total
         marcadores_exactos desc,      -- 2) aciertos exactos
         ganadores_acertados desc,     -- 3) ganadores acertados
         error_goles_total asc;        -- 4) menor error de goles

-- 16. Historial por usuario (respeta RLS: cada quien ve lo suyo).
create or replace view public.v_historial_usuario
with (security_invoker = on) as
select
  pr.usuario_id,
  pa.id              as partido_id,
  el.nombre          as equipo_local,
  ev.nombre          as equipo_visitante,
  pa.inicio,
  pa.fase,
  pr.goles_local     as pred_local,
  pr.goles_visitante as pred_visitante,
  re.goles_local     as real_local,
  re.goles_visitante as real_visitante,
  pu.puntos,
  pu.tipo_acierto
from public.pronosticos pr
join public.partidos  pa on pa.id = pr.partido_id
join public.equipos   el on el.id = pa.equipo_local_id
join public.equipos   ev on ev.id = pa.equipo_visitante_id
left join public.resultados re on re.partido_id = pa.id
left join public.puntajes  pu on pu.pronostico_id = pr.id;

-- ============================================================================
-- SEGURIDAD A NIVEL DE FILA (RLS)
-- ============================================================================
alter table public.equipos     enable row level security;
alter table public.perfiles    enable row level security;
alter table public.partidos    enable row level security;
alter table public.resultados  enable row level security;
alter table public.pronosticos enable row level security;
alter table public.puntajes    enable row level security;
alter table public.auditoria   enable row level security;

-- EQUIPOS: lectura para todos; modificación solo admin.
create policy "equipos_select" on public.equipos for select to authenticated using (true);
create policy "equipos_admin"  on public.equipos for all    to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- PERFILES: todos ven (para mostrar nombres en el ranking); cada quien edita el suyo;
--           el admin puede todo. El cambio de rol/estado lo controla un trigger.
create policy "perfiles_select"        on public.perfiles for select to authenticated using (true);
create policy "perfiles_update_propio" on public.perfiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "perfiles_admin"         on public.perfiles for all    to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- PARTIDOS: lectura para todos; crear/editar/borrar solo admin.
create policy "partidos_select" on public.partidos for select to authenticated using (true);
create policy "partidos_admin"  on public.partidos for all    to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- RESULTADOS: lectura para todos; registrar/corregir solo admin (la API usa service_role).
create policy "resultados_select" on public.resultados for select to authenticated using (true);
create policy "resultados_admin"  on public.resultados for all    to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- PRONOSTICOS:
--  - INSERT/UPDATE: solo el propio dueño y solo antes del cierre.
--  - SELECT: el propio siempre; los ajenos solo cuando el partido ya cerró
--            (evita copiar pronósticos). El admin ve todo.
create policy "pron_insert_propio" on public.pronosticos for insert to authenticated
  with check (
    usuario_id = auth.uid()
    and now() < (select cierre from public.partidos p where p.id = partido_id)
  );
create policy "pron_update_propio" on public.pronosticos for update to authenticated
  using (usuario_id = auth.uid())
  with check (
    usuario_id = auth.uid()
    and now() < (select cierre from public.partidos p where p.id = partido_id)
  );
create policy "pron_select" on public.pronosticos for select to authenticated
  using (
    usuario_id = auth.uid()
    or public.es_admin()
    or now() >= (select cierre from public.partidos p where p.id = partido_id)
  );

-- PUNTAJES: lectura para todos (alimenta el ranking); escritura solo vía funciones.
create policy "puntajes_select" on public.puntajes for select to authenticated using (true);

-- AUDITORIA: solo el admin la consulta.
create policy "auditoria_admin" on public.auditoria for select to authenticated
  using (public.es_admin());

-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================
