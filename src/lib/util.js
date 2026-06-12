// Utilidades compartidas por las vistas.
import { ZONA_HORARIA, MINUTOS_CIERRE } from "../config.js";

// Escapa texto para insertarlo sin riesgo en HTML.
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// Formatea una fecha ISO a hora local de Colombia: "dom 14 jun, 18:00".
export function fmtFechaHora(iso) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", timeZone: ZONA_HORARIA,
  }).format(new Date(iso));
}

// Estado de un partido a partir de su hora de cierre/inicio y si tiene resultado.
export function estadoPartido(partido, hayResultado) {
  const ahora = Date.now();
  const cierre = new Date(partido.cierre).getTime();
  const inicio = new Date(partido.inicio).getTime();
  if (hayResultado || partido.estado === "finalizado")
    return { clave: "final", etiqueta: "Finalizado", clase: "badge-final" };
  if (ahora >= cierre) return { clave: "cerrado", etiqueta: "Cerrado", clase: "badge-cerrado" };
  if (ahora >= cierre - 30 * 60 * 1000)
    return { clave: "pronto", etiqueta: "Cierra pronto", clase: "badge-pronto" };
  return { clave: "abierto", etiqueta: "Abierto", clase: "badge-abierto" };
}

// Tiempo restante hasta el cierre, en texto corto: "2h 14m", "12m" o "—".
export function cuentaRegresiva(cierreIso) {
  const ms = new Date(cierreIso).getTime() - Date.now();
  if (ms <= 0) return "cerrado";
  const min = Math.floor(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// Etiqueta legible del tipo de acierto.
export function etiquetaAcierto(tipo) {
  return {
    exacto: "Marcador exacto",
    diferencia: "Diferencia correcta",
    sentido: "Resultado correcto",
    fallo: "Sin aciertos",
  }[tipo] ?? "—";
}

export const MIN_CIERRE = MINUTOS_CIERRE;
