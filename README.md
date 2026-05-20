# domoci-web

Sitio institucional de **DOMO CONSULTORIA INTEGRAL S.C.** — `domoci.com.mx`.

Sitio estático puro (HTML + CSS + JS vanilla) servido por Cloudflare Pages. Una sola Function en `functions/api/contact.js` para recibir el formulario de contacto y enviarlo por email vía Resend.

## Estructura

```
domoci-web/
├── index.html                    Inicio
├── nosotros.html                 Manifiesto + trayectoria + socios
├── servicios.html                Capacidades + sectores
├── agrocolectiva.html            Producto insignia
├── contacto.html                 Form + datos institucionales
├── aviso-de-privacidad.html      LFPDPPP
├── terminos.html                 Términos de uso
├── 404.html                      Página no encontrada
├── styles.css                    Design system completo
├── functions/
│   └── api/
│       └── contact.js            POST /api/contact (Resend)
├── assets/
│   ├── domo-logo.jpg
│   ├── agrocolectiva-logo.jpg
│   └── photos/
│       ├── hero-portrait.jpg
│       └── editorial-abstract.jpg
├── brand/                        Documentación de marca (no indexable)
│   ├── brand-book.html
│   ├── wireframes.html
│   └── design-system.html
├── favicon*.png · favicon.ico · apple-touch-icon.png
├── og-default.jpg                1200×630, OG / Twitter Cards
├── manifest.webmanifest
├── robots.txt · sitemap.xml
├── wrangler.toml
└── .gitignore
```

## Sistema visual

- Tipografía: **Fraunces** (display, variable opsz+SOFT) + **Manrope** (sans) + **JetBrains Mono** (mono)
- Paleta: verde institucional anclado a sello DOMO (`#0F5132`) + tonal sand + bronze earth accent
- Light/dark nativo `prefers-color-scheme`, override por usuario con `data-theme` + `localStorage`
- Signature: doble regla con medallón centrado
- Motion: 5 duraciones / 3 easing curves definidas como tokens

## Deploy

Cloudflare Pages, factura $0 fija dentro del free tier.

### Primer deploy (CLI)

```bash
# repo GitHub (gh CLI)
git init && git add . && git commit -m "Initial public site"
gh repo create domoci-web --public --source=. --remote=origin --push

# Pages project (wrangler)
wrangler pages project create domoci-web --production-branch=main
wrangler pages deploy . --project-name=domoci-web --branch=main
```

El primer deploy publica en `https://domoci-web.pages.dev`.

### Auto-deploy en push (paso manual)

Conectar el repo de GitHub al project desde el dashboard Cloudflare → Pages → domoci-web → Settings → Builds & deployments → GitHub integration. A partir de ahí, cada push a `main` dispara deploy automático.

### Dominio custom

En Cloudflare → Pages → domoci-web → Custom domains agregar:

- `domoci.com.mx`
- `www.domoci.com.mx`

El registro DNS se crea automáticamente porque los NS ya apuntan a Cloudflare.

## Variables de entorno

Configurar desde el dashboard CF Pages → Settings → Environment variables (production):

| Variable | Tipo | Valor |
|---|---|---|
| `RESEND_API_KEY` | Encrypted | API key de https://resend.com |
| `CONTACT_TO` | Plain | `domo.consulinte@gmail.com` |
| `CONTACT_FROM` | Plain | `DOMO <onboarding@resend.dev>` (sandbox) o `DOMO <noreply@domoci.com.mx>` (cuando se valide dominio en Resend) |

O vía CLI:

```bash
wrangler pages secret put RESEND_API_KEY --project-name=domoci-web
echo "domo.consulinte@gmail.com" | wrangler pages secret put CONTACT_TO --project-name=domoci-web
```

Si `RESEND_API_KEY` no existe, `/api/contact` devuelve **503** y el form muestra el fallback "escribe directamente a domo.consulinte@gmail.com".

## Form de contacto

`POST /api/contact` con campos:

- `name` (required, max 120)
- `organization` (required, max 160)
- `sector` (optional, max 80)
- `email` (required, max 160, validado)
- `message` (required, max 4000)
- `website` (honeypot anti-spam — debe quedar vacío)

Respuestas:

- `200 OK` → email enviado correctamente.
- `400` → campos faltantes o email inválido.
- `503` → servicio de email no configurado (sin `RESEND_API_KEY`).
- `502` → Resend rechazó el envío.
- `303` redirect a `/contacto.html?ok=1` cuando el cliente envía sin JS.

El frontend en `contacto.html` usa `fetch` con `Accept: application/json` y degrada a submit nativo si JS está deshabilitado.

## Smoke local

```bash
cd domoci-web
python3 -m http.server 4173
# o
wrangler pages dev .
```

Abrir http://localhost:4173 y verificar:

- Renderizado de las 5 páginas principales + aviso + términos + 404
- Toggle light/dark
- Sticky header
- Form envía y muestra confirmación (con `wrangler pages dev` y `RESEND_API_KEY` definida en `.dev.vars`)

## Aviso legal

- **Razón social:** DOMO CONSULTORIA INTEGRAL S.C. (sin acentos, en mayúsculas, match SAT)
- **RFC:** DCI050221NF8
- **Constituida:** 21-feb-2005
- **Sede:** Camino a San José 115, Xalapa, Veracruz, CP 91098
- **Contacto:** domo.consulinte@gmail.com · +52 228 104 4773

## Licencia

Contenido propietario. Todos los derechos reservados a DOMO CONSULTORIA INTEGRAL S.C.
