// POST /api/contact — Cloudflare Pages Function
//
// Recibe el formulario de contacto, valida campos, descarta spam (honeypot)
// y envía el mensaje vía Resend (https://resend.com).
//
// Configuración requerida (Pages > Settings > Environment variables):
//   RESEND_API_KEY     (encrypted) — API key de Resend.
//   CONTACT_TO         (plain)     — destinatario, ej: contacto@domoci.com.mx
//   CONTACT_FROM       (plain)     — remitente verificado en Resend.
//                                    Mientras no exista dominio verificado:
//                                    "DOMO <onboarding@resend.dev>"
//
// Si RESEND_API_KEY no existe → responde 503 y el frontend muestra mailto fallback.

const MAX_LEN = {
  name: 120,
  organization: 160,
  sector: 80,
  email: 160,
  message: 4000,
};

function clean(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function jsonResponse(status, body, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(extraHeaders || {}) },
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function onRequestPost({ request, env }) {
  const accept = request.headers.get('Accept') || '';
  const wantsJson = accept.includes('application/json');

  let payload = {};
  try {
    const contentType = request.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      const form = await request.formData();
      for (const [k, v] of form.entries()) payload[k] = v;
    }
  } catch (_) {
    return jsonResponse(400, { ok: false, error: 'invalid-body' });
  }

  // Honeypot — bots llenan campos ocultos
  if (clean(payload.website, 200)) {
    return jsonResponse(202, { ok: true, accepted: 'silently' });
  }

  const data = {
    name: clean(payload.name, MAX_LEN.name),
    organization: clean(payload.organization, MAX_LEN.organization),
    sector: clean(payload.sector, MAX_LEN.sector),
    email: clean(payload.email, MAX_LEN.email),
    message: clean(payload.message, MAX_LEN.message),
  };

  const missing = ['name', 'organization', 'email', 'message'].filter((k) => !data[k]);
  if (missing.length) {
    return jsonResponse(400, { ok: false, error: 'missing-fields', fields: missing });
  }
  if (!isValidEmail(data.email)) {
    return jsonResponse(400, { ok: false, error: 'invalid-email' });
  }

  const apiKey = env.RESEND_API_KEY;
  const to = env.CONTACT_TO || 'contacto@domoci.com.mx';
  const from = env.CONTACT_FROM || 'DOMO <onboarding@resend.dev>';

  if (!apiKey) {
    return jsonResponse(503, {
      ok: false,
      error: 'email-service-not-configured',
      hint: `Escribe directamente a ${to}`,
    });
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const country = request.headers.get('CF-IPCountry') || 'unknown';
  const ua = request.headers.get('User-Agent') || 'unknown';
  const receivedAt = new Date().toISOString();

  const subject = `[domoci.com.mx] ${data.name} · ${data.organization}`;
  const text = [
    `Nuevo mensaje desde el formulario de contacto del sitio.`,
    ``,
    `Nombre:        ${data.name}`,
    `Organización:  ${data.organization}`,
    `Sector:        ${data.sector || '—'}`,
    `Correo:        ${data.email}`,
    ``,
    `Mensaje:`,
    data.message,
    ``,
    `— Metadatos`,
    `Recibido:      ${receivedAt}`,
    `IP:            ${ip}`,
    `País:          ${country}`,
    `User-Agent:    ${ua}`,
  ].join('\n');

  const html = `
    <h2 style="font-family:Georgia,serif;color:#0F5132;margin:0 0 16px;">Nuevo mensaje desde domoci.com.mx</h2>
    <table cellpadding="6" cellspacing="0" style="font-family:Arial,sans-serif;font-size:14px;color:#1A1F1B;border-collapse:collapse;">
      <tr><td style="font-weight:bold;width:140px;">Nombre</td><td>${escapeHtml(data.name)}</td></tr>
      <tr><td style="font-weight:bold;">Organización</td><td>${escapeHtml(data.organization)}</td></tr>
      <tr><td style="font-weight:bold;">Sector</td><td>${escapeHtml(data.sector || '—')}</td></tr>
      <tr><td style="font-weight:bold;">Correo</td><td><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
    </table>
    <h3 style="font-family:Georgia,serif;color:#0F5132;margin:24px 0 8px;">Mensaje</h3>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#1A1F1B;white-space:pre-wrap;line-height:1.55;">${escapeHtml(data.message)}</p>
    <hr style="border:none;border-top:1px solid #E5E0D2;margin:24px 0;" />
    <p style="font-family:Menlo,monospace;font-size:11px;color:#5C6660;">
      Recibido: ${receivedAt}<br/>
      IP: ${escapeHtml(ip)} · País: ${escapeHtml(country)}<br/>
      UA: ${escapeHtml(ua)}
    </p>
  `;

  let resendRes;
  try {
    resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: data.email,
        subject,
        text,
        html,
      }),
    });
  } catch (err) {
    return jsonResponse(502, { ok: false, error: 'upstream-fetch-failed' });
  }

  if (!resendRes.ok) {
    let detail = '';
    try { detail = await resendRes.text(); } catch (_) {}
    console.warn('[contact] resend error', resendRes.status, detail);
    return jsonResponse(502, { ok: false, error: 'upstream-error', status: resendRes.status });
  }

  if (wantsJson) {
    return jsonResponse(200, { ok: true });
  }

  // Submit nativo (sin JS) → redirige a la página con confirmación
  return Response.redirect(new URL('/contacto.html?ok=1', request.url).toString(), 303);
}

export async function onRequest({ request }) {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: { 'Allow': 'POST' },
  });
}
