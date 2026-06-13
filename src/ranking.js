// Ranking general interactivo: al tocar un participante se despliega su historial
// de partidos ya jugados (con su pronóstico, el resultado y los puntos).
import { obtenerPerfil } from "../lib/auth.js";
import { rankingCompleto, miHistorial } from "../lib/datos.js";
import { esc, fmtFechaHora } from "../lib/util.js";

const COLOR = { exacto: "var(--ok-fg)", diferencia: "var(--ambar-osc)", sentido: "var(--info-fg)", fallo: "var(--texto-2)" };

export async function render(contenedor) {
  contenedor.innerHTML = `<div class="cargando">Cargando ranking…</div>`;
  try {
    const [perfil, ranking] = await Promise.all([obtenerPerfil(), rankingCompleto()]);

    if (!ranking.length) {
      contenedor.innerHTML = `<h1>Ranking</h1><div class="tarjeta"><p class="silencio" style="margin:0;">Aún no hay puntajes.</p></div>`;
      return;
    }

    contenedor.innerHTML = `<h1>Ranking general</h1>
      <p class="silencio">Toca un participante para ver sus pronósticos de partidos ya jugados.
      Desempates: puntaje → exactos → resultados acertados → menor error de goles.</p>
      <div class="tarjeta" style="padding:0;overflow-x:auto;">
        <table>
          <thead><tr><th>#</th><th>Participante</th><th class="num">Puntos</th><th class="num">Exactos</th><th class="num">Aciertos</th></tr></thead>
          <tbody>${ranking.map((r, i) => fila(r, i, perfil.id)).join("")}</tbody>
        </table>
      </div>`;

    contenedor.querySelectorAll("[data-uid]").forEach((tr) => tr.onclick = () => alternar(tr, contenedor));
  } catch (e) {
    contenedor.innerHTML = `<div class="tarjeta"><p style="color:var(--err)">No se pudo cargar el ranking.</p></div>`;
    console.error(e);
  }
}

function fila(r, i, miId) {
  const yo = r.usuario_id === miId;
  return `<tr data-uid="${r.usuario_id}" style="cursor:pointer;" class="${yo ? "yo" : ""}">
    <td style="width:2.5rem;">${i + 1}</td>
    <td>${esc(r.nombre)}${yo ? " <span class='silencio'>(tú)</span>" : ""}
        <span class="silencio" style="font-size:11px;">▾ ver</span></td>
    <td class="num" style="font-weight:700;">${r.puntos_total}</td>
    <td class="num">${r.marcadores_exactos}</td>
    <td class="num">${r.ganadores_acertados}</td>
  </tr>`;
}

async function alternar(tr, contenedor) {
  const sig = tr.nextElementSibling;
  if (sig && sig.classList.contains("detalle")) { sig.remove(); return; }
  contenedor.querySelectorAll("tr.detalle").forEach((d) => d.remove());

  const det = document.createElement("tr");
  det.className = "detalle";
  det.innerHTML = `<td colspan="5" style="background:var(--surface-2);padding:0;"><div class="cargando" style="padding:1rem;">Cargando…</div></td>`;
  tr.after(det);

  try {
    const filas = await miHistorial(tr.getAttribute("data-uid"));
    det.querySelector("td").innerHTML = filas.length
      ? tablaDetalle(filas)
      : `<p class="silencio" style="padding:1rem;margin:0;">Sin partidos jugados todavía.</p>`;
  } catch (e) {
    det.querySelector("td").innerHTML = `<p style="padding:1rem;margin:0;color:var(--err)">No se pudo cargar el historial.</p>`;
    console.error(e);
  }
}

function tablaDetalle(filas) {
  return `<div style="padding:.4rem 1rem 1rem;">
    <table>
      <thead><tr><th>Partido</th><th>Pronóstico</th><th>Resultado</th><th class="num">Pts</th></tr></thead>
      <tbody>${filas.map((f) => {
        const real = f.real_local != null ? `${f.real_local} - ${f.real_visitante}` : "—";
        return `<tr>
          <td>${esc(f.equipo_local)} <span class="silencio">vs</span> ${esc(f.equipo_visitante)}
            <div class="silencio">${fmtFechaHora(f.inicio)}</div></td>
          <td>${f.pred_local} - ${f.pred_visitante}</td>
          <td>${real}</td>
          <td class="num" style="font-weight:700;color:${COLOR[f.tipo_acierto] || "inherit"};">${f.puntos ?? "—"}</td>
        </tr>`;
      }).join("")}</tbody>
    </table></div>`;
}
