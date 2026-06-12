// Descarga resultados finalizados del Mundial desde football-data.org y los
// guarda en Supabase. Corre en GitHub Actions; también mantiene la base activa.
//
// Variables de entorno necesarias (se configuran como Secrets en GitHub):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE, FOOTBALL_DATA_TOKEN
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE, FOOTBALL_DATA_TOKEN } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE.");
  process.exit(1);
}

// Cliente con service_role: omite RLS (solo se usa aquí, en el servidor).
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

const mismoDia = (a, b) => new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10);

async function main() {
  // 1) Nuestros partidos aún sin resultado (esto también "despierta" la base).
  const { data: partidos, error } = await supabase
    .from("partidos")
    .select("id, inicio, estado, local:equipos!equipo_local_id(codigo), visitante:equipos!equipo_visitante_id(codigo)")
    .neq("estado", "finalizado");
  if (error) { console.error("Error leyendo partidos:", error.message); process.exit(1); }

  if (!FOOTBALL_DATA_TOKEN) {
    console.log("Sin FOOTBALL_DATA_TOKEN: solo keep-alive. Partidos pendientes:", partidos.length);
    return;
  }
  if (!partidos.length) { console.log("No hay partidos pendientes."); return; }

  // 2) Partidos FINALIZADOS del Mundial según football-data.org (competición 'WC').
  const resp = await fetch("https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED", {
    headers: { "X-Auth-Token": FOOTBALL_DATA_TOKEN },
  });
  if (!resp.ok) { console.error("football-data respondió", resp.status); process.exit(1); }
  const { matches = [] } = await resp.json();

  // 3) Empareja por códigos de equipo (TLA) y misma fecha; guarda el marcador.
  let guardados = 0;
  for (const p of partidos) {
    const local = p.local?.codigo, visit = p.visitante?.codigo;
    const m = matches.find((x) =>
      x.homeTeam?.tla === local && x.awayTeam?.tla === visit && mismoDia(x.utcDate, p.inicio)
      && x.score?.fullTime?.home != null);
    if (!m) continue;

    const { error: e } = await supabase.from("resultados").upsert({
      partido_id: p.id,
      goles_local: m.score.fullTime.home,
      goles_visitante: m.score.fullTime.away,
      fuente: "api",
      actualizado_en: new Date().toISOString(),
    }, { onConflict: "partido_id" });
    if (e) console.error(`Partido ${p.id}: ${e.message}`);
    else { guardados++; console.log(`OK ${local} ${m.score.fullTime.home}-${m.score.fullTime.away} ${visit}`); }
  }
  console.log(`Listo. Resultados guardados/actualizados: ${guardados}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
