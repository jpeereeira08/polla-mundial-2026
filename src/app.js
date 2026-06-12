// Arranque de la aplicación.
import { RUTAS } from "./config.js";
import { obtenerPerfil, cerrarSesion, alCambiarSesion } from "./lib/auth.js";
import { iniciarRouter, navegar } from "./lib/router.js";

const app = document.getElementById("app");
const nav = document.getElementById("nav");

async function pintarNav() {
  const perfil = await obtenerPerfil();
  if (!perfil) { nav.innerHTML = ""; return; }

  const enlaces = [
    ["Dashboard", RUTAS.dashboard],
    ["Pronósticos", RUTAS.pronosticos],
    ["Historial", RUTAS.historial],
    ["Ranking", RUTAS.ranking],
  ];
  if (perfil.rol === "admin") enlaces.push(["Administración", RUTAS.admin]);

  nav.innerHTML = `
    <a class="marca" href="${RUTAS.dashboard}">⚽ Polla Mundial 2026</a>
    <nav class="enlaces">
      ${enlaces.map(([t, r]) => `<a data-ruta href="${r}">${t}</a>`).join("")}
    </nav>
    <div class="usuario">
      <span class="nombre">${perfil.nombre}</span>
      <button id="salir" class="btn-fantasma">Salir</button>
    </div>`;

  document.getElementById("salir").onclick = async () => {
    await cerrarSesion();
    location.hash = RUTAS.login;
  };
}

// Repinta la navegación cuando cambia la sesión y recarga la vista.
alCambiarSesion(async () => {
  await pintarNav();
  await navegar(app);
});

await pintarNav();
iniciarRouter(app);
