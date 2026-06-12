// Dashboard: resumen personal, próximos partidos, últimos resultados y top del ranking.
import { obtenerPerfil } from "../lib/auth.js";
import { proximosPartidos, ultimosResultados, rankingCompleto } from "../lib/datos.js";
import { esc, fmtFechaHora, estadoPartido, cuentaRegresiva } from "../lib/util.js";
import { RUTAS } from "../config.js";

export async function render(contenedor) {
  contenedor.innerHTML = `<div class="cargando">Cargando tu tablero…</div>`;
  try {
    const perfil = await obtenerPerfil();
    const [proximos, ultimos, ranking] = await Promise.all([
      proximosPartidos(5), ultimosResultados(5), rankingCompleto(),
    ]);

    const posicion = ranking.findIndex((r) => r.usuario_id === perfil.id);
    const yo = posicion >= 0 ? ranking[posicion] : null;
    const top3 = ranking.slice(0, 3);

    contenedor.innerHTML = `
      <h1>Hola, ${esc(perfil.nombre)}</h1>

      <div class="metricas" style="margin-bottom:1.25rem;">
        <div class="metrica"><div class="etq">Tu puntaje</div><div class="val">${yo?.puntos_total ?? 0}</div></div>
        <div class="metrica"><div class="etq">Tu posición</div><div class="val">${yo ? "#" + (posicion + 1) : "—"}</div></div>
        <div class="metrica"><div class="etq">Marcadores exactos</div><div class="val">${yo?.marcadores_exactos ?? 0}</div></div>
      </div>

      <div class="fila" style="align-items:flex-end;"><h2>Próximos partidos</h2>
        <a class="silencio" href="${RUTAS.pronosticos}" style="color:var(--verde);">Pronosticar →</a></div>
      <div class="pila" style="margin-bottom:1.5rem;">${proximos.length ? proximos.map(filaProximo).join("") : vacio("No hay partidos próximos.")}</div>

      <h2>Últimos resultados</h2>
      <div class="pila" style="margin-bottom:1.5rem;">${ultimos.length ? ultimos.map(filaResultado).join("") : vacio("Aún no hay resultados.")}</div>

      <h2>Ranking — top 3</h2>
      <div class="tarjeta" style="padding:0;overflow:hidden;">
        <table><tbody>${top3.map((r, i) => filaRanking(r, i, perfil.id)).join("") || vacio("Sin datos.")}</tbody></table>
      </div>`;
  } catch (e) {
    contenedor.innerHTML = `<div class="tarjeta"><p style="color:var(--err)">No se pudo cargar el tablero. Revisa tu conexión y la configuración de Supabase.</p></div>`;
    console.error(e);
  }
}

function filaProximo(p) {
  const est = estadoPartido(p, false);
  return `<div class="tarjeta fila">
    <div><div>${esc(p.local?.nombre)} <span class="silencio">vs</span> ${esc(p.visitante?.nombre)}</div>
      <div class="silencio">${fmtFechaHora(p.inicio)} · cierra en ${cuentaRegresiva(p.cierre)}</div></div>
    <span class="badge ${est.clase}">${est.etiqueta}</span>
  </div>`;
}

function filaResultado(p) {
  const r = p.resultado;
  return `<div class="tarjeta fila">
    <div>${esc(p.local?.nombre)} <span class="silencio">vs</span> ${esc(p.visitante?.nombre)}
      <div class="silencio">${fmtFechaHora(p.inicio)}</div></div>
    <div style="font-family:var(--font-display);font-weight:700;font-size:20px;">${r ? `${r.goles_local} - ${r.goles_visitante}` : "—"}</div>
  </div>`;
}

function filaRanking(r, i, miId) {
  const yo = r.usuario_id === miId;
  return `<tr class="${yo ? "yo" : ""}">
    <td style="width:2rem;">${i + 1}</td><td>${esc(r.nombre)}${yo ? " (tú)" : ""}</td>
    <td class="num" style="font-weight:600;">${r.puntos_total}</td></tr>`;
}

const vacio = (t) => `<div class="tarjeta"><p class="silencio" style="margin:0;">${t}</p></div>`;
