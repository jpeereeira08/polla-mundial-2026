// Historial: mis pronósticos vs resultados oficiales y puntos obtenidos.
import { obtenerPerfil } from "../lib/auth.js";
import { miHistorial } from "../lib/datos.js";
import { esc, fmtFechaHora, etiquetaAcierto } from "../lib/util.js";

const COLOR = { exacto: "var(--ok-fg)", diferencia: "var(--ambar-osc)", sentido: "var(--info-fg)", fallo: "var(--texto-2)" };

export async function render(contenedor) {
  contenedor.innerHTML = `<div class="cargando">Cargando tu historial…</div>`;
  try {
    const perfil = await obtenerPerfil();
    const filas = await miHistorial(perfil.id);

    if (!filas.length) {
      contenedor.innerHTML = `<h1>Historial</h1><div class="tarjeta"><p class="silencio" style="margin:0;">Todavía no tienes pronósticos registrados.</p></div>`;
      return;
    }

    contenedor.innerHTML = `<h1>Historial</h1>
      <div class="tarjeta" style="padding:0;overflow-x:auto;">
        <table>
          <thead><tr><th>Partido</th><th>Tu pronóstico</th><th>Resultado</th><th>Acierto</th><th class="num">Puntos</th></tr></thead>
          <tbody>${filas.map(fila).join("")}</tbody>
        </table>
      </div>`;
  } catch (e) {
    contenedor.innerHTML = `<div class="tarjeta"><p style="color:var(--err)">No se pudo cargar el historial.</p></div>`;
    console.error(e);
  }
}

function fila(f) {
  const real = f.real_local != null ? `${f.real_local} - ${f.real_visitante}` : "Pendiente";
  const acierto = f.tipo_acierto
    ? `<span style="color:${COLOR[f.tipo_acierto]};font-weight:600;">${etiquetaAcierto(f.tipo_acierto)}</span>`
    : `<span class="silencio">—</span>`;
  return `<tr>
    <td>${esc(f.equipo_local)} <span class="silencio">vs</span> ${esc(f.equipo_visitante)}
      <div class="silencio">${fmtFechaHora(f.inicio)}</div></td>
    <td>${f.pred_local} - ${f.pred_visitante}</td>
    <td>${real}</td>
    <td>${acierto}</td>
    <td class="num" style="font-weight:700;">${f.puntos ?? "—"}</td>
  </tr>`;
}
