// Helpers de autenticación y de sesión.
// El perfil (nombre, rol) vive en public.perfiles y se crea solo al registrarse.
import { supabase } from "./supabase.js";

let _perfilCache = null;

// Devuelve la sesión actual (o null si no hay).
export async function obtenerSesion() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

// Devuelve el perfil del usuario actual (id, nombre, rol, activo). Lo cachea.
export async function obtenerPerfil() {
  if (_perfilCache) return _perfilCache;
  const sesion = await obtenerSesion();
  if (!sesion) return null;
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre, email, rol, activo")
    .eq("id", sesion.user.id)
    .single();
  if (error) return null;
  _perfilCache = data;
  return data;
}

export async function esAdmin() {
  const perfil = await obtenerPerfil();
  return perfil?.rol === "admin";
}

// Registro con correo y contraseña. 'nombre' se guarda en metadata y el
// trigger fn_nuevo_usuario lo copia a perfiles.
export async function registrar(nombre, email, password) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } },
  });
}

export async function iniciarSesion(email, password) {
  _perfilCache = null;
  return supabase.auth.signInWithPassword({ email, password });
}

export async function cerrarSesion() {
  _perfilCache = null;
  return supabase.auth.signOut();
}

// Reacciona a cambios de sesión (login/logout en otra pestaña, expiración…).
export function alCambiarSesion(callback) {
  supabase.auth.onAuthStateChange((_evento, sesion) => {
    _perfilCache = null;
    callback(sesion);
  });
}
