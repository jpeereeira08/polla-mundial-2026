// Capa de acceso a datos: centraliza todas las consultas a Supabase.
// Las vistas llaman a estas funciones y reciben datos ya normalizados.
import { supabase } from "./supabase.js";

// Selección base de un partido con sus equipos y (si existe) su resultado.
const SELECT_PARTIDO = `
  id, inicio, cierre, estado, fase, grupo, estadio,
  equipo_local_id, equipo_visitante_id,
  local:equipos!equipo_local_id(nombre, codigo, bandera_url),
  visitante:equipos!equipo_visitante_id(nombre, codigo, bandera_url),
  resultados(goles_local, goles_visitante)
`;

function normalizarPartido(p) {
  const r = Array.isArray(p.resultados) ? p.resultados[0] : p.resultados;
  return { ...p, resultado: r ?? null };
}

const ahoraIso = () => new Date().toISOString();

// ---- Lectura pública (cualquier usuario autenticado) ----

export async function proximosPartidos(limite = 5) {
  const { data, error } = await supabase
    .from("partidos").select(SELECT_PARTIDO)
    .gt("inicio", ahoraIso()).order("inicio", { ascending: true }).limit(limite);
  if (error) throw error;
  return data.map(normalizarPartido);
}

export async function ultimosResultados(limite = 5) {
  const { data, error } = await supabase
    .from("partidos").select(SELECT_PARTIDO)
    .eq("estado", "finalizado").order("inicio", { ascending: false }).limit(limite);
  if (error) throw error;
  return data.map(normalizarPartido);
}

// Partidos para la pantalla de pronósticos (próximos, abiertos o por abrir).
export async function partidosParaPronosticar() {
  const { data, error } = await supabase
    .from("partidos").select(SELECT_PARTIDO)
    .gt("inicio", ahoraIso()).order("inicio", { ascending: true });
  if (error) throw error;
  return data.map(normalizarPartido);
}

// Mapa { partido_id: {goles_local, goles_visitante} } de MIS pronósticos.
export async function misPronosticos() {
  const { data, error } = await supabase
    .from("pronosticos").select("partido_id, goles_local, goles_visitante");
  if (error) throw error;
  const mapa = {};
  for (const p of data) mapa[p.partido_id] = p;
  return mapa;
}

// Guarda (crea o actualiza) un pronóstico. El cierre lo valida la base de datos.
export async function guardarPronostico(usuarioId, partidoId, gl, gv) {
  const { error } = await supabase.from("pronosticos").upsert(
    { usuario_id: usuarioId, partido_id: partidoId, goles_local: gl, goles_visitante: gv,
      actualizado_en: new Date().toISOString() },
    { onConflict: "usuario_id,partido_id" }
  );
  return error;
}

export async function rankingCompleto() {
  const { data, error } = await supabase
    .from("v_ranking").select("*")
    .order("puntos_total", { ascending: false })
    .order("marcadores_exactos", { ascending: false })
    .order("ganadores_acertados", { ascending: false })
    .order("error_goles_total", { ascending: true });
  if (error) throw error;
  return data;
}

export async function miHistorial(usuarioId) {
  const { data, error } = await supabase
    .from("v_historial_usuario").select("*")
    .eq("usuario_id", usuarioId).order("inicio", { ascending: false });
  if (error) throw error;
  return data;
}

// ---- Administración ----

export async function listarEquipos() {
  const { data, error } = await supabase.from("equipos").select("*").order("nombre");
  if (error) throw error;
  return data;
}

export async function crearEquipo(equipo) {
  return (await supabase.from("equipos").insert(equipo)).error;
}

export async function editarEquipo(id, cambios) {
  return (await supabase.from("equipos").update(cambios).eq("id", id)).error;
}

export async function eliminarEquipo(id) {
  return (await supabase.from("equipos").delete().eq("id", id)).error;
}

export async function eliminarPartido(id) {
  return (await supabase.from("partidos").delete().eq("id", id)).error;
}

export async function listarPartidos() {
  const { data, error } = await supabase
    .from("partidos").select(SELECT_PARTIDO).order("inicio", { ascending: true });
  if (error) throw error;
  return data.map(normalizarPartido);
}

export async function crearPartido(partido) {
  return (await supabase.from("partidos").insert(partido)).error;
}

export async function editarPartido(id, cambios) {
  return (await supabase.from("partidos").update(cambios).eq("id", id)).error;
}

export async function registrarResultado(partidoId, gl, gv, usuarioId) {
  return (await supabase.from("resultados").upsert(
    { partido_id: partidoId, goles_local: gl, goles_visitante: gv,
      fuente: "manual", registrado_por: usuarioId,
      actualizado_en: new Date().toISOString() },
    { onConflict: "partido_id" }
  )).error;
}

export async function listarUsuarios() {
  const { data, error } = await supabase
    .from("perfiles").select("id, nombre, email, rol, activo").order("nombre");
  if (error) throw error;
  return data;
}

export async function actualizarUsuario(id, cambios) {
  return (await supabase.from("perfiles").update(cambios).eq("id", id)).error;
}

export async function recalcularPuntajes() {
  return (await supabase.rpc("recalcular_puntajes")).error;
}

export async function listarAuditoria(limite = 50) {
  const { data, error } = await supabase
    .from("auditoria").select("*").order("creado_en", { ascending: false }).limit(limite);
  if (error) throw error;
  return data;
}
