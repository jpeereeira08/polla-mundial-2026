# Guía paso a paso — Poner en marcha la Polla Mundial 2026

Esta guía está escrita para que la sigas **sin saber programar**. No necesitas usar
la "terminal" (la pantalla negra de comandos): todo se hace desde páginas web,
arrastrando archivos y haciendo clic.

Cuando termines tendrás:
- Una página web pública (una dirección que compartes con tus 30 participantes).
- Una base de datos en la nube que guarda todo.
- La descarga automática de resultados (opcional).

Y lo mejor: **no necesitas dejar tu computador prendido**. Todo vive en la nube.

---

## Antes de empezar: crea estas cuentas gratuitas

1. **Supabase** → https://supabase.com (botón "Start your project"). Es la base de
   datos y el sistema de cuentas de tus usuarios.
2. **GitHub** → https://github.com (botón "Sign up"). Aquí guardas los archivos de
   la app y desde aquí se publica.
3. (Opcional, para resultados automáticos) **football-data.org** →
   https://www.football-data.org/client/register

Ten a la mano la carpeta `polla-mundial-2026` (la que descargaste y descomprimiste).

---

## PARTE A — Crear la base de datos en Supabase

1. Entra a Supabase e inicia sesión.
2. Clic en **New project**.
3. Ponle un nombre (por ejemplo, `polla-mundial`), crea una contraseña para la base
   (guárdala en un lugar seguro) y elige la región más cercana. Clic en **Create new project**.
4. Espera 1–2 minutos a que diga que el proyecto está listo.

### Cargar las tablas

5. En el menú de la izquierda, entra a **SQL Editor**.
6. Clic en **New query**.
7. Abre en tu computador el archivo `db/01_esquema.sql`, **copia todo su contenido**
   y **pégalo** en el editor de Supabase.
8. Clic en **Run** (abajo a la derecha). Debe decir "Success". Esto crea todas las
   tablas, las reglas de puntuación y de seguridad.

### (Opcional) Cargar datos de ejemplo para probar

9. Repite: **New query**, pega el contenido de `db/02_datos_ejemplo.sql`, clic en **Run**.
   Esto agrega unos equipos y dos partidos de prueba. (Más adelante puedes borrarlos
   y poner los reales desde el panel de administración.)

---

## PARTE B — Conectar la app con tu base de datos

1. En Supabase, ve a **Project Settings** (el ícono de engranaje, abajo a la izquierda)
   → **API**.
2. Verás dos datos que necesitas copiar:
   - **Project URL** (una dirección que termina en `.supabase.co`).
   - **anon public** (una clave larga). *Esta clave es pública y segura de usar; la
     protección está en las reglas de la base.*
3. En tu computador, abre el archivo `src/config.js` con un editor de texto
   (sirve el Bloc de notas; mejor aún **VS Code**, que descargas gratis de
   https://code.visualstudio.com).
4. Reemplaza estos dos valores con los tuyos y **guarda el archivo**:
   ```js
   export const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
   export const SUPABASE_ANON_KEY = "TU_ANON_KEY_PUBLICA";
   ```

---

## PARTE C — (Opcional) Probar la app en tu computador

Esto es solo para verla antes de publicarla. Si prefieres, puedes saltar a la PARTE D.

> Importante: **no funciona** abriendo `index.html` con doble clic. Necesita un
> pequeño servidor. La forma más fácil, sin comandos:

1. Instala **VS Code** (link arriba).
2. Ábrelo y arrastra la carpeta `polla-mundial-2026` a la ventana.
3. En VS Code, ve a la pestaña de **Extensions** (el ícono de cuadritos a la izquierda),
   busca **Live Server** e instálalo.
4. En la lista de archivos, haz **clic derecho sobre `index.html`** → **Open with Live Server**.
5. Se abrirá tu navegador con la app. Regístrate con un correo para probar.

Cuando termines de mirar, cierra la pestaña. Esto era solo en tu máquina.

---

## PARTE D — Publicar la app en internet (para que entren tus participantes)

Vamos a subir los archivos a GitHub y publicarlos. Todo desde el navegador.

### D.1 Subir el proyecto a GitHub

1. Entra a https://github.com e inicia sesión.
2. Arriba a la derecha, clic en **+** → **New repository**.
3. Ponle un nombre (por ejemplo, `polla-mundial-2026`), marca **Public** y clic en
   **Create repository**.
4. En la página que aparece, clic en el enlace **uploading an existing file**
   (o el botón **Add file → Upload files**).
5. **Arrastra todos los archivos y carpetas** de `polla-mundial-2026` a esa pantalla.
   (Selecciona todo el contenido de la carpeta, no la carpeta en sí.)
6. Abajo, clic en **Commit changes**. Espera a que terminen de subir.

### D.2 Publicar con Cloudflare Pages (gratis)

1. Entra a https://pages.cloudflare.com y crea una cuenta (o inicia sesión).
2. Clic en **Create application** → **Pages** → **Connect to Git** y autoriza tu GitHub.
3. Elige el repositorio `polla-mundial-2026`.
4. En la configuración de compilación:
   - **Framework preset:** None.
   - **Build command:** déjalo vacío.
   - **Build output directory:** escribe un punto: `.`
5. Clic en **Save and Deploy**. En ~1 minuto te dará una **dirección pública**
   (algo como `https://polla-mundial-2026.pages.dev`). **Esa es la URL que compartes.**

> Alternativa aún más rápida (sin resultados automáticos): entra a
> https://app.netlify.com/drop y **arrastra la carpeta** del proyecto. Te da una URL
> al instante. Pero para el paso automático de resultados conviene tenerlo en GitHub
> como hicimos arriba.

---

## PARTE E — Convertirte en administrador

Al registrarte eres un usuario normal. Para tener el panel de administración:

1. Entra a la app publicada y **regístrate** con tu correo. Confirma el correo si
   Supabase te envía un enlace.
2. Vuelve a Supabase → **SQL Editor** → **New query** y ejecuta (cambia el correo
   por el tuyo):
   ```sql
   update public.perfiles set rol = 'admin' where email = 'tu-correo@ejemplo.com';
   ```
3. Cierra sesión y vuelve a entrar en la app: ahora verás la pestaña **Administración**.

---

## PARTE F — (Opcional) Descarga automática de resultados

Si no la activas, no pasa nada: registras los marcadores a mano desde el panel de
administración (pestaña **Resultados**). Si la quieres automática:

### F.1 Conseguir el token de resultados

1. Regístrate en https://www.football-data.org/client/register
2. Te llega por correo un **API token** (una clave). Cópialo.

### F.2 Guardar los secretos en GitHub

1. En tu repositorio de GitHub, ve a **Settings** → **Secrets and variables** →
   **Actions** → **New repository secret**.
2. Crea estos tres secretos (uno por uno):
   - `SUPABASE_URL` → tu Project URL de Supabase.
   - `SUPABASE_SERVICE_ROLE` → en Supabase (**Project Settings → API**) copia la clave
     **service_role** (la SECRETA, no la pública). *Esta solo va aquí, nunca en la web.*
   - `FOOTBALL_DATA_TOKEN` → el token de football-data.org.

### F.3 Activarlo

1. En GitHub, abre la pestaña **Actions**. Si pide habilitar los flujos, acepta.
2. El proceso "Descargar resultados del Mundial" corre solo cada 30 minutos. Puedes
   lanzarlo a mano con el botón **Run workflow**.

Este proceso también "despierta" la base de datos, así que evita que Supabase la
pause por inactividad. No depende de tu computador.

---

## PARTE G — Cómo usar la app en el día a día

Como **administrador** (pestaña Administración):
- **Equipos:** agrega las selecciones. Si usarás resultados automáticos, el "código"
  de cada equipo debe ser su código de 3 letras de football-data.org (ARG, BRA, COL…).
- **Partidos:** crea cada partido eligiendo equipos, fase y la fecha/hora en horario
  de Colombia. La app calcula sola el cierre (5 minutos antes).
- **Resultados:** cuando termine un partido, escribe el marcador y guarda. Los puntajes
  se calculan al instante. (Si activaste la descarga automática, se llenan solos, y
  aquí puedes corregir si hace falta.)
- **Usuarios:** activa/desactiva participantes o nombra otro administrador.
- **Recalcular puntajes:** botón de emergencia que recalcula todo (por si corriges un
  resultado viejo).

Como **participante**:
- Se registra, entra, va a **Pronósticos**, escribe los marcadores y guarda. Puede
  editarlos hasta 5 minutos antes del partido. Después ve su **Historial** y el **Ranking**.

---

## PARTE H — Mantenimiento

- **Copia de seguridad:** en Supabase → **Database** puedes exportar los datos. Hazlo
  antes y después de cada jornada importante.
- **Pausa por inactividad:** el plan gratis de Supabase pausa el proyecto si pasa una
  semana sin uso. Si activaste la PARTE F, no te preocupes. Si no, basta con que
  alguien entre a la app cada pocos días, o reactívalo con un clic desde el panel de
  Supabase.
- **Cambiar algo de la app:** edita el archivo en GitHub (lápiz de "editar") o vuelve a
  subir el archivo corregido; Cloudflare publica el cambio solo.

---

## Problemas frecuentes

- **"No se pudo cargar" en la app:** casi siempre es que `src/config.js` tiene mal la
  URL o la anon key. Revísalas.
- **No me sale la pestaña Administración:** te falta la PARTE E (hacerte admin) o no
  cerraste y volviste a iniciar sesión.
- **No llegan los correos de confirmación:** en Supabase → **Authentication** puedes
  desactivar la confirmación por correo si prefieres un grupo cerrado donde tú das
  de alta a la gente.
- **Los resultados automáticos no aparecen:** verifica que los **códigos** de los
  equipos coincidan con los de football-data.org y que los tres secretos estén bien
  escritos en GitHub.

---

¡Listo! Con esto la plataforma queda funcionando de punta a punta, gratis y en la nube.
