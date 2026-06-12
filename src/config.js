// ============================================================================
// Configuración pública de la app.
// La ANON KEY es pública por diseño: RLS (seguridad por fila) protege los datos.
// NUNCA pongas aquí la clave service_role (esa va solo en el cron, como secreto).
// Reemplaza los dos valores con los de: Supabase > Project Settings > API.
// ============================================================================

export const SUPABASE_URL = "https://ofulrzsziexehkrozgpy.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_7gQfFIip_cje8mMVPvdshA_s3Htgs9W";

// Constantes de negocio (deben coincidir con la base de datos).
export const MINUTOS_CIERRE = 5;            // cierre antes del inicio
export const ZONA_HORARIA = "America/Bogota"; // visualización de horas

// Sistema de puntuación (solo informativo para la interfaz; el cálculo real
// vive en la base de datos en la función calcular_puntos()).
export const PUNTOS = {
  exacto: 5,
  diferencia: 3,
  sentido: 1,
  fallo: 0,
};

// Rutas de la app (router por hash).
export const RUTAS = {
  login: "#/login",
  dashboard: "#/dashboard",
  pronosticos: "#/pronosticos",
  historial: "#/historial",
  ranking: "#/ranking",
  admin: "#/admin",
};
