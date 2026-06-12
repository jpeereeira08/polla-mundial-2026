-- ============================================================================
-- DATOS DE EJEMPLO (opcional) — para probar la app rápidamente.
-- Los códigos deben coincidir con el TLA de football-data.org para que la
-- descarga automática de resultados empareje los partidos.
-- Ejecútalo DESPUÉS del esquema (01). Borra esta data antes de ir en serio.
-- ============================================================================

insert into public.equipos (nombre, codigo, grupo) values
  ('Argentina','ARG','A'), ('México','MEX','A'),
  ('Brasil','BRA','B'),    ('Colombia','COL','B'),
  ('Francia','FRA','C'),    ('Alemania','GER','C'),
  ('España','ESP','D'),     ('Inglaterra','ENG','D'),
  ('Estados Unidos','USA','E'), ('Canadá','CAN','E'),
  ('Portugal','POR','F'),   ('Países Bajos','NED','F')
on conflict (codigo) do nothing;

-- Dos partidos de ejemplo: uno próximo (abierto) y otro dentro de poco.
-- now() + intervalos para que sirvan sin importar cuándo ejecutes el script.
insert into public.partidos (equipo_local_id, equipo_visitante_id, fase, grupo, estadio, inicio)
select l.id, v.id, 'grupos', 'B', 'Estadio Ejemplo', now() + interval '2 hours'
from public.equipos l, public.equipos v where l.codigo='COL' and v.codigo='BRA';

insert into public.partidos (equipo_local_id, equipo_visitante_id, fase, grupo, estadio, inicio)
select l.id, v.id, 'grupos', 'A', 'Estadio Ejemplo', now() + interval '1 day'
from public.equipos l, public.equipos v where l.codigo='ARG' and v.codigo='MEX';
