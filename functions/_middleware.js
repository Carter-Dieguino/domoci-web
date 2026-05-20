// Middleware global — se ejecuta antes de servir cualquier ruta del project.
// Canonicaliza: apex domoci.com.mx → 301 → www.domoci.com.mx preservando path.

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === 'domoci.com.mx') {
    url.hostname = 'www.domoci.com.mx';
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
