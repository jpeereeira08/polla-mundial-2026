# Polla Mundial FIFA 2026

Plataforma de pronósticos para el Mundial 2026. **100% gratuita**, sin servidores
pagos: base de datos y autenticación en **Supabase**, frontend estático (sin paso
de compilado) desplegable en cualquier host gratuito, y descarga de resultados
mediante **football-data.org** + corrección manual del administrador.

> **¿Solo quieres ponerla a funcionar?** Sigue `GUIA.md`: instrucciones paso a paso, en lenguaje simple, sin usar la terminal.

- **Puntuación:** Modelo 5/3/1 (exacto / diferencia / sentido). El cálculo vive en
  la base de datos.
- **Cierre:** las predicciones se bloquean 5 minutos antes del inicio, validado en
  frontend y backend (políticas RLS + triggers).

## Estructura del proyecto

```
polla-mundial-2026/
├─ index.html            # shell de la app (raíz = sitio web)
├─ public/
│  └─ favicon.svg
├─ src/
│  ├─ config.js           # URL + anon key de Supabase (públicas) y constantes
│  ├─ lib/
│  │  ├─ supabase.js      # cliente Supabase (vía ESM, sin build)
│  │  ├─ auth.js          # sesión, perfil/rol, login, registro, logout
│  │  └─ router.js        # router por hash con guardas de acceso
│  ├─ views/              # una vista por pantalla (Bloque 3)
│  │  ├─ login.js  dashboard.js  pronosticos.js
│  │  └─ historial.js  ranking.js  admin.js
│  ├─ styles/theme.css    # tokens de diseño + estilos base
│  └─ app.js              # arranque: navegación + router
├─ cron/                  # descarga de resultados (Bloque 4)
├─ .env.example           # secretos del cron (NO del frontend)
├─ .gitignore
└─ README.md
```

## Requisitos

- Una cuenta gratuita en **Supabase**.
- Un host estático gratuito (Cloudflare Pages, Netlify, Vercel o GitHub Pages).
- Para el cron de resultados: una cuenta de **GitHub** y un token gratuito de
  **football-data.org** (se configura en el Bloque 4).

## Puesta en marcha (resumen — el detalle paso a paso va en el Bloque 5)

1. **Crear el proyecto en Supabase.** Copia la *Project URL* y la *anon key* desde
   `Project Settings > API`.
2. **Cargar la base de datos.** En `SQL Editor`, pega y ejecuta el script
   `01_esquema_polla_mundial_2026.sql` (entregado en la Fase 3).
3. **Configurar el frontend.** En `src/config.js`, reemplaza `SUPABASE_URL` y
   `SUPABASE_ANON_KEY` con tus valores. La anon key es pública: RLS protege los datos.
4. **Probar en local.** Sirve la carpeta con cualquier servidor estático, por ejemplo:
   ```bash
   npx serve .           # o: python3 -m http.server 5173
   ```
   Abre la URL que indique (ej. http://localhost:3000); carga `index.html` solo.
5. **Desplegar.** Sube la carpeta del proyecto al host estático con el directorio raíz como publicación.

## Mantenimiento

- Crear el primer administrador: regístrate normalmente y luego, en Supabase
  `SQL Editor`, ejecuta:
  ```sql
  update public.perfiles set rol = 'admin' where email = 'tu-correo@ejemplo.com';
  ```
- Backups: exporta la base desde el panel de Supabase antes y después de cada jornada.

> Notas de seguridad: la clave `service_role` **nunca** va en el frontend; solo se usa
> en el cron como secreto. Ver `.env.example`.
