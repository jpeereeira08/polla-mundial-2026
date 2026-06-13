// Panel de administración: equipos, partidos, resultados, usuarios, recálculo y auditoría.
import { obtenerPerfil } from "../lib/auth.js";
import * as D from "../lib/datos.js";
import { esc, fmtFechaHora, flag } from "../lib/util.js";
import { ZONA_HORARIA } from "../config.js";

const FASES = ["grupos","dieciseisavos","octavos","cuartos","semifinal","tercer_puesto","final"];
let perfil, equipos = [];

export async function render(contenedor) {
  perfil = await obtenerPerfil();
  if (perfil?.rol !== "admin") {
    contenedor.innerHTML = `<div class="tarjeta"><p style="margin:0;">No tienes acceso a esta sección.</p></div>`;
    return;
  }
  contenedor.innerHTML = `
    <h1>Administración</h1>
    <div class="fila" style="justify-content:flex-start;gap:.4rem;flex-wrap:wrap;margin-bottom:1rem;" id="tabs">
      ${["Partidos","Resultados","Equipos","Usuarios","Auditoría"].map((t,i)=>
        `<button class="btn-secundario" data-tab="${t}" ${i===0?'style="background:var(--surface-2)"':''}>${t}</button>`).join("")}
      <button class="btn-primario" id="recalc" style="margin-left:auto;">Recalcular puntajes</button>
    </div>
    <div id="panel"><div class="cargando">Cargando…</div></div>`;

  const panel = contenedor.querySelector("#panel");
  contenedor.querySelectorAll("[data-tab]").forEach((b)=> b.onclick = ()=>{
    contenedor.querySelectorAll("[data-tab]").forEach(x=>x.style.background="");
    b.style.background="var(--surface-2)";
    abrir(b.dataset.tab, panel);
  });
  contenedor.querySelector("#recalc").onclick = async (e)=>{
    e.target.disabled=true; e.target.textContent="Recalculando…";
    const err = await D.recalcularPuntajes();
    e.target.disabled=false; e.target.textContent="Recalcular puntajes";
    alert(err ? "Error al recalcular." : "Puntajes recalculados.");
  };

  equipos = await D.listarEquipos();
  abrir("Partidos", panel);
}

async function abrir(tab, panel) {
  panel.innerHTML = `<div class="cargando">Cargando…</div>`;
  try {
    if (tab === "Equipos")   return panelEquipos(panel);
    if (tab === "Partidos")  return panelPartidos(panel);
    if (tab === "Resultados")return panelResultados(panel);
    if (tab === "Usuarios")  return panelUsuarios(panel);
    if (tab === "Auditoría") return panelAuditoria(panel);
  } catch (e) {
    panel.innerHTML = `<div class="tarjeta"><p style="color:var(--err)">No se pudo cargar.</p></div>`;
    console.error(e);
  }
}

// ---------- Equipos ----------
async function panelEquipos(panel) {
  equipos = await D.listarEquipos();
  let editId = null;
  pintar();
  function pintar() {
    const ed = editId ? equipos.find(e => e.id === editId) : null;
    panel.innerHTML = `
      <div class="tarjeta pila" style="margin-bottom:1rem;">
        <h3>${ed ? "Editar equipo" : "Nuevo equipo"}</h3>
        <div class="metricas">
          <div><label>Nombre</label><input id="e-nombre" value="${esc(ed?.nombre || "")}"></div>
          <div><label>Código (3 letras)</label><input id="e-codigo" maxlength="3" value="${esc(ed?.codigo || "")}"></div>
          <div><label>Grupo (A–L)</label><input id="e-grupo" maxlength="1" value="${esc(ed?.grupo || "")}"></div>
          <div><label>Bandera (URL)</label><input id="e-bandera" value="${esc(ed?.bandera_url || "")}"></div>
        </div>
        <div class="fila" style="justify-content:flex-start;gap:.5rem;">
          <button class="btn-primario" id="e-guardar">${ed ? "Guardar cambios" : "Agregar equipo"}</button>
          ${ed ? `<button class="btn-secundario" id="e-cancelar">Cancelar</button>` : ""}
        </div>
        <p class="silencio" id="e-msg"></p>
      </div>
      <div class="tarjeta" style="padding:0;overflow-x:auto;">
        <table><thead><tr><th></th><th>Equipo</th><th>Código</th><th>Grupo</th><th></th></tr></thead>
        <tbody>${equipos.map(filaEq).join("") || vacioFila(5)}</tbody></table>
      </div>`;
    panel.querySelector("#e-guardar").onclick = guardar;
    if (ed) panel.querySelector("#e-cancelar").onclick = () => { editId = null; pintar(); };
    panel.querySelectorAll("[data-edit-eq]").forEach((b) =>
      b.onclick = () => { editId = parseInt(b.dataset.editEq, 10); pintar(); window.scrollTo(0, 0); });
    panel.querySelectorAll("[data-del-eq]").forEach((b) => b.onclick = borrar);
  }
  function filaEq(e) {
    return `<tr>
      <td style="width:30px;">${flag(e.bandera_url, e.nombre)}</td>
      <td>${esc(e.nombre)}</td><td>${esc(e.codigo)}</td><td>${esc(e.grupo || "—")}</td>
      <td style="white-space:nowrap;">
        <button class="btn-secundario" data-edit-eq="${e.id}" style="padding:.25rem .6rem;">Editar</button>
        <button class="btn-secundario" data-del-eq="${e.id}" style="padding:.25rem .6rem;">Borrar</button>
      </td></tr>`;
  }
  async function guardar() {
    const nombre = panel.querySelector("#e-nombre").value.trim();
    const codigo = panel.querySelector("#e-codigo").value.trim().toUpperCase();
    const grupo = panel.querySelector("#e-grupo").value.trim().toUpperCase() || null;
    const bandera_url = panel.querySelector("#e-bandera").value.trim() || null;
    const msg = panel.querySelector("#e-msg");
    if (!nombre || codigo.length !== 3) { msg.style.color = "var(--err)"; msg.textContent = "Nombre y código de 3 letras."; return; }
    const datos = { nombre, codigo, grupo, bandera_url };
    const err = editId ? await D.editarEquipo(editId, datos) : await D.crearEquipo(datos);
    if (err) { msg.style.color = "var(--err)"; msg.textContent = "No se pudo (¿código repetido?)."; return; }
    editId = null; panelEquipos(panel);
  }
  async function borrar(e) {
    const id = parseInt(e.target.dataset.delEq, 10);
    const eq = equipos.find((x) => x.id === id);
    if (!confirm(`¿Borrar a ${eq?.nombre}? No se puede si está en algún partido.`)) return;
    const err = await D.eliminarEquipo(id);
    if (err) { alert("No se pudo borrar: probablemente está en algún partido."); return; }
    panelEquipos(panel);
  }
}

// ---------- Partidos ----------
function selectEquipos(id, sel) {
  return `<select id="${id}"><option value="">—</option>${
    equipos.map(e=>`<option value="${e.id}" ${e.id==sel?"selected":""}>${esc(e.nombre)}</option>`).join("")}</select>`;
}
// Convierte "YYYY-MM-DDTHH:MM" (hora Colombia, UTC-5) a ISO UTC.
function aUTC(local) { return new Date(local + ":00-05:00").toISOString(); }
// Convierte ISO UTC a valor para <input datetime-local> en hora Colombia.
function aLocalInput(iso) {
  const d = new Date(new Date(iso).toLocaleString("en-US", { timeZone: ZONA_HORARIA }));
  const p = (n)=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function panelPartidos(panel) {
  const partidos = await D.listarPartidos();
  let editId = null;
  pintar();
  function pintar() {
    const enEdicion = editId ? partidos.find(p=>p.id===editId) : null;
    panel.innerHTML = `
      <div class="tarjeta pila" style="margin-bottom:1rem;">
        <h3>${enEdicion ? "Editar partido" : "Nuevo partido"}</h3>
        <div class="metricas">
          <div><label>Local</label>${selectEquipos("p-local", enEdicion?.equipo_local_id)}</div>
          <div><label>Visitante</label>${selectEquipos("p-visit", enEdicion?.equipo_visitante_id)}</div>
          <div><label>Fase</label><select id="p-fase">${FASES.map(f=>`<option ${enEdicion?.fase===f?"selected":""}>${f}</option>`).join("")}</select></div>
          <div><label>Grupo</label><input id="p-grupo" maxlength="1" value="${esc(enEdicion?.grupo||"")}"></div>
          <div><label>Estadio</label><input id="p-estadio" value="${esc(enEdicion?.estadio||"")}"></div>
          <div><label>Fecha y hora (Colombia)</label><input id="p-inicio" type="datetime-local" value="${enEdicion?aLocalInput(enEdicion.inicio):""}"></div>
        </div>
        <div class="fila" style="justify-content:flex-start;gap:.5rem;">
          <button class="btn-primario" id="p-guardar">${enEdicion?"Guardar cambios":"Crear partido"}</button>
          ${enEdicion?`<button class="btn-secundario" id="p-cancelar">Cancelar</button>`:""}
        </div>
        <p class="silencio" id="p-msg"></p>
      </div>
      <div class="tarjeta" style="padding:0;overflow-x:auto;">
        <table><thead><tr><th>Partido</th><th>Fecha (Col)</th><th>Estado</th><th></th></tr></thead>
        <tbody>${partidos.map(filaPartido).join("")||vacioFila(4)}</tbody></table>
      </div>`;

    panel.querySelector("#p-guardar").onclick = guardar;
    if (enEdicion) panel.querySelector("#p-cancelar").onclick = ()=>{ editId=null; pintar(); };
    panel.querySelectorAll("[data-editar]").forEach(b=> b.onclick = ()=>{ editId=parseInt(b.dataset.editar,10); pintar(); window.scrollTo(0,0); });
    panel.querySelectorAll("[data-borrar]").forEach(b=> b.onclick = async ()=>{
      if (!confirm("¿Borrar este partido? Se borran también sus pronósticos y su resultado.")) return;
      const err = await D.eliminarPartido(parseInt(b.dataset.borrar,10));
      if (err) alert("No se pudo borrar."); else abrir("Partidos", panel);
    });
  }
  function filaPartido(p) {
    return `<tr>
      <td>${flag(p.local?.bandera_url, p.local?.nombre)}${esc(p.local?.nombre || "?")} vs ${flag(p.visitante?.bandera_url, p.visitante?.nombre)}${esc(p.visitante?.nombre || "?")}</td>
      <td>${fmtFechaHora(p.inicio)}</td>
      <td><span class="silencio">${esc(p.estado)}</span></td>
      <td style="white-space:nowrap;">
        <button class="btn-secundario" data-editar="${p.id}" style="padding:.3rem .7rem;">Editar</button>
        <button class="btn-secundario" data-borrar="${p.id}" style="padding:.3rem .7rem;">Borrar</button>
      </td>
    </tr>`;
  }
  async function guardar() {
    const local = parseInt(panel.querySelector("#p-local").value,10);
    const visit = parseInt(panel.querySelector("#p-visit").value,10);
    const inicio = panel.querySelector("#p-inicio").value;
    const msg = panel.querySelector("#p-msg");
    if (!local || !visit || local===visit || !inicio) { msg.style.color="var(--err)"; msg.textContent="Elige dos equipos distintos y la fecha."; return; }
    const cuerpo = {
      equipo_local_id: local, equipo_visitante_id: visit,
      fase: panel.querySelector("#p-fase").value,
      grupo: panel.querySelector("#p-grupo").value.trim().toUpperCase() || null,
      estadio: panel.querySelector("#p-estadio").value.trim() || null,
      inicio: aUTC(inicio),
    };
    const err = editId ? await D.editarPartido(editId, cuerpo) : await D.crearPartido(cuerpo);
    if (err) { msg.style.color="var(--err)"; msg.textContent="No se pudo guardar."; return; }
    abrir("Partidos", panel);
  }
}

// ---------- Resultados ----------
async function panelResultados(panel) {
  const partidos = await D.listarPartidos();
  panel.innerHTML = `
    <p class="silencio">Registra o corrige el marcador final. Al guardar, los puntajes se recalculan solos.</p>
    <div class="pila">${partidos.map(filaRes).join("")||vacio("No hay partidos.")}</div>`;
  partidos.forEach(conectarRes);

  function filaRes(p) {
    const r = p.resultado;
    return `<div class="tarjeta fila" data-res="${p.id}">
      <div style="flex:1;">${esc(p.local?.nombre)} vs ${esc(p.visitante?.nombre)}
        <div class="silencio">${fmtFechaHora(p.inicio)}</div></div>
      <input class="marcador-input" data-rl type="number" min="0" value="${r?.goles_local ?? ""}">
      <span class="silencio">–</span>
      <input class="marcador-input" data-rv type="number" min="0" value="${r?.goles_visitante ?? ""}">
      <button class="btn-primario" data-rg style="padding:.45rem .8rem;">${r?"Corregir":"Registrar"}</button>
    </div>`;
  }
  function conectarRes(p) {
    const card = panel.querySelector(`[data-res="${p.id}"]`);
    card.querySelector("[data-rg]").onclick = async (e)=>{
      const gl = parseInt(card.querySelector("[data-rl]").value,10);
      const gv = parseInt(card.querySelector("[data-rv]").value,10);
      if (Number.isNaN(gl)||Number.isNaN(gv)) { alert("Escribe ambos marcadores."); return; }
      e.target.disabled=true; e.target.textContent="Guardando…";
      const err = await D.registrarResultado(p.id, gl, gv, perfil.id);
      alert(err ? "No se pudo guardar." : "Resultado guardado y puntajes actualizados.");
      abrir("Resultados", panel);
    };
  }
}

// ---------- Usuarios ----------
async function panelUsuarios(panel) {
  const usuarios = await D.listarUsuarios();
  panel.innerHTML = `<div class="tarjeta" style="padding:0;overflow-x:auto;">
    <table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead>
    <tbody>${usuarios.map(filaU).join("")||vacioFila(4)}</tbody></table></div>`;
  usuarios.forEach(conectarU);

  function filaU(u) {
    return `<tr data-user="${u.id}">
      <td>${esc(u.nombre)}</td><td class="silencio">${esc(u.email||"")}</td>
      <td><select data-rol><option value="usuario" ${u.rol==="usuario"?"selected":""}>usuario</option>
        <option value="admin" ${u.rol==="admin"?"selected":""}>admin</option></select></td>
      <td><button class="btn-secundario" data-activo style="padding:.3rem .7rem;">${u.activo?"Activo":"Inactivo"}</button></td>
    </tr>`;
  }
  function conectarU(u) {
    const tr = panel.querySelector(`[data-user="${u.id}"]`);
    tr.querySelector("[data-rol]").onchange = async (e)=>{
      const err = await D.actualizarUsuario(u.id, { rol: e.target.value });
      if (err) { alert("No se pudo cambiar el rol."); }
    };
    tr.querySelector("[data-activo]").onclick = async (e)=>{
      const nuevo = !u.activo; u.activo = nuevo;
      const err = await D.actualizarUsuario(u.id, { activo: nuevo });
      if (err) { alert("No se pudo cambiar el estado."); u.activo=!nuevo; }
      else e.target.textContent = nuevo ? "Activo" : "Inactivo";
    };
  }
}

// ---------- Auditoría ----------
async function panelAuditoria(panel) {
  const filas = await D.listarAuditoria(50);
  panel.innerHTML = `<div class="tarjeta" style="padding:0;overflow-x:auto;">
    <table><thead><tr><th>Fecha</th><th>Acción</th><th>Entidad</th></tr></thead>
    <tbody>${filas.map(a=>`<tr><td class="silencio">${fmtFechaHora(a.creado_en)}</td><td>${esc(a.accion)}</td><td>${esc(a.entidad)} #${esc(a.entidad_id)}</td></tr>`).join("")||vacioFila(3)}</tbody></table></div>`;
}

const vacio = (t)=>`<div class="tarjeta"><p class="silencio" style="margin:0;">${t}</p></div>`;
const vacioFila = (n)=>`<tr><td colspan="${n}" class="silencio" style="padding:1rem;">Sin datos.</td></tr>`;
