-- ============================================================================
-- EQUIPOS DEL MUNDIAL 2026 — 48 selecciones con grupo y bandera (flagcdn.com).
-- Códigos = estándar FIFA de 3 letras (los que usa football-data.org).
-- Ejecútalo en Supabase > SQL Editor DESPUÉS del esquema (01).
-- Vuelve a ejecutarlo sin problema: actualiza nombre, grupo y bandera si ya existen.
-- ============================================================================

insert into public.equipos (nombre, codigo, grupo, bandera_url) values
  ('México','MEX','A','https://flagcdn.com/mx.svg'),
  ('Sudáfrica','RSA','A','https://flagcdn.com/za.svg'),
  ('Corea del Sur','KOR','A','https://flagcdn.com/kr.svg'),
  ('Chequia','CZE','A','https://flagcdn.com/cz.svg'),
  ('Canadá','CAN','B','https://flagcdn.com/ca.svg'),
  ('Bosnia y Herzegovina','BIH','B','https://flagcdn.com/ba.svg'),
  ('Catar','QAT','B','https://flagcdn.com/qa.svg'),
  ('Suiza','SUI','B','https://flagcdn.com/ch.svg'),
  ('Brasil','BRA','C','https://flagcdn.com/br.svg'),
  ('Marruecos','MAR','C','https://flagcdn.com/ma.svg'),
  ('Haití','HAI','C','https://flagcdn.com/ht.svg'),
  ('Escocia','SCO','C','https://flagcdn.com/gb-sct.svg'),
  ('Estados Unidos','USA','D','https://flagcdn.com/us.svg'),
  ('Paraguay','PAR','D','https://flagcdn.com/py.svg'),
  ('Australia','AUS','D','https://flagcdn.com/au.svg'),
  ('Türkiye','TUR','D','https://flagcdn.com/tr.svg'),
  ('Alemania','GER','E','https://flagcdn.com/de.svg'),
  ('Curazao','CUW','E','https://flagcdn.com/cw.svg'),
  ('Costa de Marfil','CIV','E','https://flagcdn.com/ci.svg'),
  ('Ecuador','ECU','E','https://flagcdn.com/ec.svg'),
  ('Países Bajos','NED','F','https://flagcdn.com/nl.svg'),
  ('Japón','JPN','F','https://flagcdn.com/jp.svg'),
  ('Suecia','SWE','F','https://flagcdn.com/se.svg'),
  ('Túnez','TUN','F','https://flagcdn.com/tn.svg'),
  ('Bélgica','BEL','G','https://flagcdn.com/be.svg'),
  ('Egipto','EGY','G','https://flagcdn.com/eg.svg'),
  ('Irán','IRN','G','https://flagcdn.com/ir.svg'),
  ('Nueva Zelanda','NZL','G','https://flagcdn.com/nz.svg'),
  ('España','ESP','H','https://flagcdn.com/es.svg'),
  ('Cabo Verde','CPV','H','https://flagcdn.com/cv.svg'),
  ('Arabia Saudita','KSA','H','https://flagcdn.com/sa.svg'),
  ('Uruguay','URU','H','https://flagcdn.com/uy.svg'),
  ('Francia','FRA','I','https://flagcdn.com/fr.svg'),
  ('Senegal','SEN','I','https://flagcdn.com/sn.svg'),
  ('Irak','IRQ','I','https://flagcdn.com/iq.svg'),
  ('Noruega','NOR','I','https://flagcdn.com/no.svg'),
  ('Argentina','ARG','J','https://flagcdn.com/ar.svg'),
  ('Argelia','ALG','J','https://flagcdn.com/dz.svg'),
  ('Austria','AUT','J','https://flagcdn.com/at.svg'),
  ('Jordania','JOR','J','https://flagcdn.com/jo.svg'),
  ('Portugal','POR','K','https://flagcdn.com/pt.svg'),
  ('RD Congo','COD','K','https://flagcdn.com/cd.svg'),
  ('Uzbekistán','UZB','K','https://flagcdn.com/uz.svg'),
  ('Colombia','COL','K','https://flagcdn.com/co.svg'),
  ('Inglaterra','ENG','L','https://flagcdn.com/gb-eng.svg'),
  ('Croacia','CRO','L','https://flagcdn.com/hr.svg'),
  ('Ghana','GHA','L','https://flagcdn.com/gh.svg'),
  ('Panamá','PAN','L','https://flagcdn.com/pa.svg')
on conflict (codigo) do update
  set nombre = excluded.nombre, grupo = excluded.grupo, bandera_url = excluded.bandera_url;
