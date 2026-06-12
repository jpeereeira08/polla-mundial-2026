-- ============================================================================
-- PARTIDOS — Fase de grupos del Mundial 2026 (72 partidos).
-- Horas en UTC (las dio el calendario oficial en GMT). La columna 'cierre'
-- la calcula sola el trigger (inicio - 5 min). Ejecútalo DESPUÉS del 03.
-- Es seguro re-ejecutarlo: no duplica partidos ya cargados.
-- ============================================================================

-- (Opcional) Borra los partidos de ejemplo del script 02, si los cargaste:
delete from public.partidos where estadio = 'Estadio Ejemplo';

insert into public.partidos (equipo_local_id, equipo_visitante_id, fase, grupo, inicio)
select el.id, ev.id, 'grupos', m.grupo, m.inicio
from (values
  ('MEX','RSA','A', timestamptz '2026-06-11 19:00+00'),
  ('KOR','CZE','A', timestamptz '2026-06-12 02:00+00'),
  ('CAN','BIH','B', timestamptz '2026-06-12 19:00+00'),
  ('USA','PAR','D', timestamptz '2026-06-13 01:00+00'),
  ('QAT','SUI','B', timestamptz '2026-06-13 19:00+00'),
  ('BRA','MAR','C', timestamptz '2026-06-13 22:00+00'),
  ('HAI','SCO','C', timestamptz '2026-06-14 01:00+00'),
  ('AUS','TUR','D', timestamptz '2026-06-14 04:00+00'),
  ('GER','CUW','E', timestamptz '2026-06-14 17:00+00'),
  ('NED','JPN','F', timestamptz '2026-06-14 20:00+00'),
  ('CIV','ECU','E', timestamptz '2026-06-14 23:00+00'),
  ('SWE','TUN','F', timestamptz '2026-06-15 02:00+00'),
  ('ESP','CPV','H', timestamptz '2026-06-15 16:00+00'),
  ('BEL','EGY','G', timestamptz '2026-06-15 19:00+00'),
  ('KSA','URU','H', timestamptz '2026-06-15 22:00+00'),
  ('IRN','NZL','G', timestamptz '2026-06-16 01:00+00'),
  ('FRA','SEN','I', timestamptz '2026-06-16 19:00+00'),
  ('IRQ','NOR','I', timestamptz '2026-06-16 22:00+00'),
  ('ARG','ALG','J', timestamptz '2026-06-17 01:00+00'),
  ('AUT','JOR','J', timestamptz '2026-06-17 04:00+00'),
  ('POR','COD','K', timestamptz '2026-06-17 17:00+00'),
  ('ENG','CRO','L', timestamptz '2026-06-17 20:00+00'),
  ('GHA','PAN','L', timestamptz '2026-06-17 23:00+00'),
  ('UZB','COL','K', timestamptz '2026-06-18 02:00+00'),
  ('CZE','RSA','A', timestamptz '2026-06-18 16:00+00'),
  ('SUI','BIH','B', timestamptz '2026-06-18 19:00+00'),
  ('CAN','QAT','B', timestamptz '2026-06-18 22:00+00'),
  ('MEX','KOR','A', timestamptz '2026-06-19 01:00+00'),
  ('USA','AUS','D', timestamptz '2026-06-19 19:00+00'),
  ('SCO','MAR','C', timestamptz '2026-06-19 22:00+00'),
  ('BRA','HAI','C', timestamptz '2026-06-20 00:30+00'),
  ('TUR','PAR','D', timestamptz '2026-06-20 03:00+00'),
  ('NED','SWE','F', timestamptz '2026-06-20 17:00+00'),
  ('GER','CIV','E', timestamptz '2026-06-20 20:00+00'),
  ('ECU','CUW','E', timestamptz '2026-06-21 03:00+00'),
  ('TUN','JPN','F', timestamptz '2026-06-21 04:00+00'),
  ('ESP','KSA','H', timestamptz '2026-06-21 16:00+00'),
  ('BEL','IRN','G', timestamptz '2026-06-21 19:00+00'),
  ('URU','CPV','H', timestamptz '2026-06-21 22:00+00'),
  ('NZL','EGY','G', timestamptz '2026-06-22 01:00+00'),
  ('ARG','AUT','J', timestamptz '2026-06-22 17:00+00'),
  ('FRA','IRQ','I', timestamptz '2026-06-22 21:00+00'),
  ('NOR','SEN','I', timestamptz '2026-06-23 00:00+00'),
  ('JOR','ALG','J', timestamptz '2026-06-23 03:00+00'),
  ('POR','UZB','K', timestamptz '2026-06-23 17:00+00'),
  ('ENG','GHA','L', timestamptz '2026-06-23 20:00+00'),
  ('PAN','CRO','L', timestamptz '2026-06-23 23:00+00'),
  ('COL','COD','K', timestamptz '2026-06-24 02:00+00'),
  ('SUI','CAN','B', timestamptz '2026-06-24 19:00+00'),
  ('BIH','QAT','B', timestamptz '2026-06-24 19:00+00'),
  ('SCO','BRA','C', timestamptz '2026-06-24 22:00+00'),
  ('MAR','HAI','C', timestamptz '2026-06-24 22:00+00'),
  ('CZE','MEX','A', timestamptz '2026-06-25 01:00+00'),
  ('RSA','KOR','A', timestamptz '2026-06-25 01:00+00'),
  ('ECU','GER','E', timestamptz '2026-06-25 20:00+00'),
  ('CUW','CIV','E', timestamptz '2026-06-25 20:00+00'),
  ('JPN','SWE','F', timestamptz '2026-06-25 23:00+00'),
  ('TUN','NED','F', timestamptz '2026-06-25 23:00+00'),
  ('TUR','USA','D', timestamptz '2026-06-26 02:00+00'),
  ('PAR','AUS','D', timestamptz '2026-06-26 02:00+00'),
  ('NOR','FRA','I', timestamptz '2026-06-26 19:00+00'),
  ('SEN','IRQ','I', timestamptz '2026-06-26 19:00+00'),
  ('CPV','KSA','H', timestamptz '2026-06-27 00:00+00'),
  ('URU','ESP','H', timestamptz '2026-06-27 00:00+00'),
  ('EGY','IRN','G', timestamptz '2026-06-27 03:00+00'),
  ('NZL','BEL','G', timestamptz '2026-06-27 03:00+00'),
  ('PAN','ENG','L', timestamptz '2026-06-27 21:00+00'),
  ('CRO','GHA','L', timestamptz '2026-06-27 21:00+00'),
  ('COL','POR','K', timestamptz '2026-06-27 23:30+00'),
  ('COD','UZB','K', timestamptz '2026-06-27 23:30+00'),
  ('ALG','AUT','J', timestamptz '2026-06-28 02:00+00'),
  ('JOR','ARG','J', timestamptz '2026-06-28 02:00+00')
) as m(local, visit, grupo, inicio)
join public.equipos el on el.codigo = m.local
join public.equipos ev on ev.codigo = m.visit
where not exists (
  select 1 from public.partidos p
  where p.equipo_local_id = el.id and p.equipo_visitante_id = ev.id and p.inicio = m.inicio
);
