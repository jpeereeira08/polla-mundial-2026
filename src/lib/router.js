// Router mínimo basado en el hash de la URL (#/dashboard, #/ranking, …).
// Protege rutas: exige sesión y, para /admin, rol de administrador.
import { RUTAS } from "../config.js";
import { obtenerSesion, esAdmin } from "./auth.js";

// Mapa ruta -> { cargar: () => import(...), soloAdmin?: bool, publica?: bool }
const TABLA = {
  [RUTAS.login]:       { cargar: () => import("../views/login.js"),       publica: true },
  [RUTAS.dashboard]:   { cargar: () => import("../views/dashboard.js") },
  [RUTAS.pronosticos]: { cargar: () => import("../views/pronosticos.js") },
  [RUTAS.historial]:   { cargar: () => import("../views/historial.js") },
  [RUTAS.ranking]:     { cargar: () => import("../views/ranking.js") },
  [RUTAS.admin]:       { cargar: () => import("../views/admin.js"), soloAdmin: true },
};

function rutaActual() {
  const h = location.hash || RUTAS.dashboard;
  return TABLA[h] ? h : RUTAS.dashboard;
}

export async function navegar(contenedor) {
  const ruta = rutaActual();
  const def = TABLA[ruta];
  const sesion = await obtenerSesion();

  // Guardas de acceso.
  if (!def.publica && !sesion) { location.hash = RUTAS.login; return; }
  if (def.publica && sesion && ruta === RUTAS.login) { location.hash = RUTAS.dashboard; return; }
  if (def.soloAdmin && !(await esAdmin())) { location.hash = RUTAS.dashboard; return; }

  const modulo = await def.cargar();
  contenedor.innerHTML = "";
  await modulo.render(contenedor);
  marcarActivo(ruta);
}

function marcarActivo(ruta) {
  document.querySelectorAll("[data-ruta]").forEach((a) => {
    a.classList.toggle("activo", a.getAttribute("href") === ruta);
  });
}

export function iniciarRouter(contenedor) {
  addEventListener("hashchange", () => navegar(contenedor));
  navegar(contenedor);
}
