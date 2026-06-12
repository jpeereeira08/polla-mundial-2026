// Pantalla de Acceso: alterna entre iniciar sesión y registrarse.
import { iniciarSesion, registrar } from "../lib/auth.js";
import { RUTAS } from "../config.js";
import { esc } from "../lib/util.js";

export async function render(contenedor) {
  let modo = "login"; // "login" | "registro"

  function pintar() {
    const esRegistro = modo === "registro";
    contenedor.innerHTML = `
      <div style="max-width:380px;margin:3rem auto;">
        <h1 style="text-align:center;">Polla Mundial 2026</h1>
        <p class="silencio" style="text-align:center;margin-top:-.3rem;">
          ${esRegistro ? "Crea tu cuenta para participar" : "Ingresa para pronosticar"}
        </p>
        <div class="tarjeta pila" style="margin-top:1rem;">
          ${esRegistro ? `
            <div><label>Nombre</label><input id="nombre" autocomplete="name" /></div>` : ""}
          <div><label>Correo</label><input id="email" type="email" autocomplete="email" /></div>
          <div><label>Contraseña</label><input id="password" type="password" autocomplete="${esRegistro ? "new-password" : "current-password"}" /></div>
          <p id="error" style="color:var(--err);font-size:14px;margin:0;display:none;"></p>
          <button id="enviar" class="btn-primario">${esRegistro ? "Registrarme" : "Iniciar sesión"}</button>
          <p class="silencio" style="text-align:center;margin:.2rem 0 0;">
            ${esRegistro ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}
            <a id="alternar" href="#" style="color:var(--verde);font-weight:600;">
              ${esRegistro ? "Inicia sesión" : "Regístrate"}</a>
          </p>
        </div>
      </div>`;

    contenedor.querySelector("#alternar").onclick = (e) => {
      e.preventDefault(); modo = esRegistro ? "login" : "registro"; pintar();
    };
    contenedor.querySelector("#enviar").onclick = enviar;
    contenedor.querySelectorAll("input").forEach((i) =>
      i.addEventListener("keydown", (e) => { if (e.key === "Enter") enviar(); }));
  }

  async function enviar() {
    const error = contenedor.querySelector("#error");
    const btn = contenedor.querySelector("#enviar");
    const email = contenedor.querySelector("#email").value.trim();
    const password = contenedor.querySelector("#password").value;
    const mostrar = (m) => { error.textContent = m; error.style.display = "block"; };
    error.style.display = "none";

    if (!email || !password) return mostrar("Completa correo y contraseña.");
    btn.disabled = true; btn.textContent = "Un momento…";

    try {
      if (modo === "registro") {
        const nombre = contenedor.querySelector("#nombre").value.trim();
        if (!nombre) { btn.disabled = false; return mostrar("Escribe tu nombre."); }
        const { error: e } = await registrar(nombre, email, password);
        if (e) throw e;
        contenedor.innerHTML = `
          <div class="tarjeta" style="max-width:380px;margin:3rem auto;text-align:center;">
            <h2>Revisa tu correo</h2>
            <p class="silencio">Te enviamos un enlace para confirmar tu cuenta.
            Después podrás iniciar sesión.</p>
          </div>`;
        return;
      }
      const { error: e } = await iniciarSesion(email, password);
      if (e) throw e;
      location.hash = RUTAS.dashboard;
    } catch (e) {
      btn.disabled = false; btn.textContent = modo === "registro" ? "Registrarme" : "Iniciar sesión";
      mostrar(traducir(e.message));
    }
  }

  function traducir(msg = "") {
    if (/Invalid login/i.test(msg)) return "Correo o contraseña incorrectos.";
    if (/already registered/i.test(msg)) return "Ese correo ya está registrado.";
    if (/Email not confirmed/i.test(msg)) return "Aún no confirmas tu correo. Revisa tu bandeja.";
    if (/at least 6/i.test(msg)) return "La contraseña debe tener al menos 6 caracteres.";
    return "No se pudo completar. Inténtalo de nuevo.";
  }

  pintar();
}
