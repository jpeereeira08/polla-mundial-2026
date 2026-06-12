// Ranking general con criterios de desempate (ya aplicados por la base de datos).
import { obtenerPerfil } from "../lib/auth.js";
import { rankingCompleto } from "../lib/datos.js";
import { esc } from "../lib/util.js";

export async function render(contenedor) {
  contenedor.innerHTML = `<div class="cargando">Cargando ranking…</div>`;
  try {
    const [perfil, ranking] = await Promise.all([obtenerPerfil(), rankingCompleto()]);

    if (!ranking.length) {
      contenedor.innerHTML = `<h1>Ranking</h1><div class="tarjeta"><p class="silencio" style="margin:0;">Aún no hay puntajes.</p></div>`;
      return;
    }

    contenedor.innerHTML = `<h1>Ranking general</h1>
      <p class="silencio">Desempates: puntaje → exactos → resultados acertados → menor error de goles.</p>
      <div class="tarjeta" style="padding:0;overflow-x:auto;">
        <table>
          <thead><tr><th>#</th><th>Participante</th><th class="num">Puntos</th><th class="num">Exactos</th><th class="num">Aciertos</th></tr></thead>
          <tbody>${ranking.map((r, i) => fila(r, i, perfil.id)).join("")}</tbody>
        </table>
      </div>`;
  } catch (e) {
    contenedor.innerHTML = `<div class="tarjeta"><p style="color:var(--err)">No se pudo cargar el ranking.</p></div>`;
    console.error(e);
  }
}

function fila(r, i, miId) {
  const yo = r.usuario_id === miId;
  return `<tr class="${yo ? "yo" : ""}">
    <td style="width:2.5rem;">${i + 1}</td>
    <td>${esc(r.nombre)}${yo ? " <span class='silencio'>(tú)</span>" : ""}</td>
    <td class="num" style="font-weight:700;">${r.puntos_total}</td>
    <td class="num">${r.marcadores_exactos}</td>
    <td class="num">${r.ganadores_acertados}</td>
  </tr>`;
}
