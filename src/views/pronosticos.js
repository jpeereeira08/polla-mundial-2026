// Pronósticos: registra/edita marcadores. Cierre en vivo 5 min antes del inicio.
import { obtenerPerfil } from "../lib/auth.js";
import { partidosParaPronosticar, misPronosticos, guardarPronostico } from "../lib/datos.js";
import { esc, fmtFechaHora, estadoPartido, cuentaRegresiva, flag } from "../lib/util.js";

let temporizador = null;

export async function render(contenedor) {
  if (temporizador) clearInterval(temporizador);
  contenedor.innerHTML = `<div class="cargando">Cargando partidos…</div>`;

  try {
    const perfil = await obtenerPerfil();
    const [partidos, mis] = await Promise.all([partidosParaPronosticar(), misPronosticos(perfil.id)]);

    if (!partidos.length) {
      contenedor.innerHTML = `<h1>Pronósticos</h1>${vacio("No hay partidos abiertos por ahora.")}`;
      return;
    }

    contenedor.innerHTML = `<h1>Pronósticos</h1>
      <p class="silencio">Los pronósticos se cierran 5 minutos antes de cada partido.</p>
      <div class="pila">${partidos.map((p) => tarjeta(p, mis[p.id])).join("")}</div>`;

    partidos.forEach((p) => conectar(p, perfil.id));
    actualizarEstados();                       // estado inicial
    temporizador = setInterval(actualizarEstados, 20000); // refresca cada 20 s
  } catch (e) {
    contenedor.innerHTML = `<div class="tarjeta"><p style="color:var(--err)">No se pudieron cargar los partidos.</p></div>`;
    console.error(e);
  }

  function tarjeta(p, mio) {
    const est = estadoPartido(p, false);
    const cerrado = est.clave === "cerrado";
    return `
    <div class="tarjeta" data-partido="${p.id}" data-cierre="${p.cierre}">
      <div class="fila" style="margin-bottom:.75rem;">
        <span class="silencio">${p.fase === "grupos" && p.grupo ? "Grupo " + esc(p.grupo) : esc(p.fase)} · ${fmtFechaHora(p.inicio)}</span>
        <span class="badge ${est.clase}" data-estado>${est.etiqueta}${est.clave !== "cerrado" ? " · cierra en " + cuentaRegresiva(p.cierre) : ""}</span>
      </div>
      <div class="fila" style="justify-content:center;gap:.75rem;">
        <span style="min-width:90px;text-align:right;">${esc(p.local?.nombre)} ${flag(p.local?.bandera_url, p.local?.nombre)}</span>
        <input class="marcador-input" data-gl type="number" min="0" max="99" value="${mio?.goles_local ?? ""}" ${cerrado ? "disabled" : ""} aria-label="Goles ${esc(p.local?.nombre)}" />
        <span class="silencio">–</span>
        <input class="marcador-input" data-gv type="number" min="0" max="99" value="${mio?.goles_visitante ?? ""}" ${cerrado ? "disabled" : ""} aria-label="Goles ${esc(p.visitante?.nombre)}" />
        <span style="min-width:90px;">${flag(p.visitante?.bandera_url, p.visitante?.nombre)}${esc(p.visitante?.nombre)}</span>
      </div>
      <button class="btn-primario" data-guardar style="width:100%;margin-top:.75rem;" ${cerrado ? "disabled" : ""}>
        ${cerrado ? "Cerrado" : (mio ? "Actualizar pronóstico" : "Guardar pronóstico")}</button>
      <p class="silencio" data-msg style="text-align:center;margin:.5rem 0 0;min-height:1em;"></p>
    </div>`;
  }

  function conectar(p, usuarioId) {
    const card = contenedor.querySelector(`[data-partido="${p.id}"]`);
    const btn = card.querySelector("[data-guardar]");
    const msg = card.querySelector("[data-msg]");
    btn.onclick = async () => {
      const gl = parseInt(card.querySelector("[data-gl]").value, 10);
      const gv = parseInt(card.querySelector("[data-gv]").value, 10);
      if (Number.isNaN(gl) || Number.isNaN(gv) || gl < 0 || gv < 0) {
        msg.style.color = "var(--err)"; msg.textContent = "Escribe ambos marcadores (0 o más)."; return;
      }
      btn.disabled = true; const texto = btn.textContent; btn.textContent = "Guardando…";
      const error = await guardarPronostico(usuarioId, p.id, gl, gv);
      if (error) {
        msg.style.color = "var(--err)";
        msg.textContent = /cerrado/i.test(error.message) ? "El partido ya cerró." : "No se pudo guardar.";
        btn.disabled = false; btn.textContent = texto;
        if (/cerrado/i.test(error.message)) bloquear(card);
      } else {
        msg.style.color = "var(--verde)"; msg.textContent = "¡Pronóstico guardado!";
        btn.disabled = false; btn.textContent = "Actualizar pronóstico";
      }
    };
  }

  function bloquear(card) {
    card.querySelectorAll("input").forEach((i) => (i.disabled = true));
    const btn = card.querySelector("[data-guardar]");
    btn.disabled = true; btn.textContent = "Cerrado";
    const badge = card.querySelector("[data-estado]");
    badge.className = "badge badge-cerrado"; badge.textContent = "Cerrado";
  }

  function actualizarEstados() {
    contenedor.querySelectorAll("[data-partido]").forEach((card) => {
      const cierre = card.getAttribute("data-cierre");
      const restante = new Date(cierre).getTime() - Date.now();
      const badge = card.querySelector("[data-estado]");
      if (restante <= 0) { bloquear(card); return; }
      const pronto = restante <= 30 * 60 * 1000;
      badge.className = "badge " + (pronto ? "badge-pronto" : "badge-abierto");
      badge.textContent = (pronto ? "Cierra pronto" : "Abierto") + " · cierra en " + cuentaRegresiva(cierre);
    });
  }
}

const vacio = (t) => `<div class="tarjeta"><p class="silencio" style="margin:0;">${t}</p></div>`;
