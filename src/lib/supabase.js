// Cliente único de Supabase para toda la app.
// Se importa el SDK directo desde un CDN compatible con ESM: sin build step.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,      // mantiene la sesión al recargar
    autoRefreshToken: true,    // renueva el token (JWT) automáticamente
  },
});
