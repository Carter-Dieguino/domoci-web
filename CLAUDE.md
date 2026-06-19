# domoci-web — sitio institucional DOMO (mapa para agentes)

Sitio estático de **DOMO CONSULTORIA INTEGRAL S.C.** en `domoci.com.mx`. HTML + CSS + JS **vanilla** (cero frameworks), servido por **Cloudflare Pages**, factura $0 (free tier). Detalle completo en `README.md`. Mapa raíz: `../CLAUDE.md`.

## Estructura
Páginas `.html` planas (index, nosotros, servicios, agrocolectiva, contacto, aviso-de-privacidad, terminos, 404) + `styles.css` (design system completo) + `assets/` + `brand/` (no indexable). Una sola Function: `functions/api/contact.js` → `POST /api/contact` que envía el form por email vía **Resend** (`503` si falta `RESEND_API_KEY`; honeypot `website` anti-spam).

## Deploy (⚠️ NO git-integrated)
`git push` **NO deploya**. Requiere `wrangler pages deploy . --project-name=domoci-web` cada vez (igual que agrocolectiva/mapa landings). Secrets (RESEND_API_KEY, CONTACT_TO, CONTACT_FROM) en el dashboard CF Pages o `wrangler pages secret put`.

## Sistema visual
Tipografía Fraunces (display) + Manrope (sans) + JetBrains Mono. Verde institucional `#0F5132` + sand + bronze. Light/dark por `prefers-color-scheme` con override `data-theme` + `localStorage`.

## Smoke local
`python3 -m http.server 4173` (o `wrangler pages dev .`) → verificar 8 páginas + toggle light/dark + form.

## Legal (match SAT — no acentos, mayúsculas)
DOMO CONSULTORIA INTEGRAL S.C. · RFC `DCI050221NF8` · Xalapa, Veracruz · contacto institucional `domo.consulinte@gmail.com` (NUNCA tráfico automatizado a correos personales).
