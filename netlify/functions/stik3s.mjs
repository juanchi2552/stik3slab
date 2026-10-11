const backend = 'https://stik3s-lab-pedidos.juancruzgil77.chatgpt.site';
const pages = new Set(['/', '/login', '/admin', '/cuenta', '/mis-reservas']);
const apis = new Set(['/api/catalog', '/api/auth', '/api/admin', '/api/favorites', '/api/orders', '/api/reservations', '/api/upload']);
const assets = new Set(['/app-icon.svg', '/favicon.svg', '/manifest.webmanifest']);
const allowed = path => pages.has(path.replace(/\/$/, '') || '/') || apis.has(path) || assets.has(path) || /^\/_next\/static\/[a-zA-Z0-9_./-]+$/.test(path) || /^\/planchuelas\/[A-Z_]+\.png$/.test(path) || /^\/api\/images\/[a-f0-9-]+\.(png|jpg|webp)$/.test(path);
const agent = 'https://www.diagent.io/shared/mtGVzFDCeWg--ank4fmHjKpH9H4yTVVKZEgAa1SWszM';
// Floating chat button for the DiAgent AI employee (Milo); the iframe loads on first open.
const widget = `<style>#milo-chat-btn{position:fixed;right:20px;bottom:20px;z-index:2147483646;width:60px;height:60px;border:0;border-radius:50%;background:#E84D1A;color:#fff;font-size:28px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25)}#milo-chat-panel{position:fixed;right:20px;bottom:92px;z-index:2147483647;width:min(380px,calc(100vw - 40px));height:min(600px,calc(100vh - 120px));border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.3);background:#fff;display:none}#milo-chat-panel.open{display:block}#milo-chat-panel iframe{width:100%;height:100%;border:0}</style><div id="milo-chat-panel" role="dialog" aria-label="Chat con Milo"></div><button id="milo-chat-btn" type="button" aria-label="Abrir chat con Milo" aria-expanded="false">💬</button><script>(()=>{const b=document.getElementById('milo-chat-btn'),p=document.getElementById('milo-chat-panel');b.addEventListener('click',()=>{if(!p.firstChild){const f=document.createElement('iframe');f.src='${agent}';f.title='Milo · DiAgent';f.allow='clipboard-write; microphone';p.appendChild(f);}const open=p.classList.toggle('open');b.setAttribute('aria-expanded',open);b.textContent=open?'✕':'💬';});})();</script>`;
const fail = (error, status) => Response.json({error}, {status, headers: {'Cache-Control': 'no-store'}});

export default async function handler(request) {
  const incoming = new URL(request.url);
  if (!allowed(incoming.pathname)) return fail('Página no disponible.', 404);
  if (!['GET', 'HEAD', 'POST'].includes(request.method)) return fail('Método no permitido.', 405);
  if (request.method === 'POST') {
    if (!apis.has(incoming.pathname)) return fail('Operación no permitida.', 405);
    if (request.headers.get('origin') !== incoming.origin) return fail('La solicitud no pertenece a esta aplicación.', 403);
  }
  const token = globalThis.Netlify?.env.get('STIK3S_BACKEND_TOKEN');
  if (!token) return fail('Falta conectar el servidor de STIK3S LAB en la configuración de Netlify.', 503);
  const upstream = new URL(incoming.pathname + incoming.search, backend);
  const headers = new Headers();
  for (const name of ['accept', 'content-type', 'rsc', 'next-router-state-tree', 'next-router-prefetch', 'next-url']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Only forward this application's session; discard platform identities and credentials.
  const session = request.headers.get('cookie')?.split(';').map(c => c.trim()).find(c => /^__Host-stik3s-admin=[a-f0-9]{64}$/.test(c));
  if (session) headers.set('cookie', session);
  headers.set('OAI-Sites-Authorization', `Bearer ${token}`);
  if (request.method === 'POST') headers.set('origin', upstream.origin);
  try {
    const body = request.method === 'POST' ? await request.arrayBuffer() : undefined;
    if (body && body.byteLength > 4_000_000) return fail('La imagen o solicitud debe pesar menos de 4 MB.', 413);
    const response = await fetch(upstream, {method: request.method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(45000)});
    const output = new Headers();
    for (const name of ['content-type', 'content-disposition', 'vary']) {
      const value = response.headers.get(name);
      if (value) output.set(name, value);
    }
    output.set('Cache-Control', 'no-store');
    output.set('X-Content-Type-Options', 'nosniff');
    for (const cookie of response.headers.getSetCookie()) {
      if (cookie.startsWith('__Host-stik3s-admin=')) output.append('Set-Cookie', cookie);
    }
    const location = response.headers.get('location');
    if (location) {
      const target = new URL(location, upstream);
      // Prevent redirects into ChatGPT/platform login or outside the app.
      if (target.origin !== upstream.origin || !pages.has(target.pathname.replace(/\/$/, '') || '/')) return fail('No pudimos conectar el servidor. Revisá la conexión de Netlify.', 502);
      output.set('Location', target.pathname + target.search + target.hash);
    }
    if ([401, 403].includes(response.status) && !incoming.pathname.startsWith('/api/')) return fail('No pudimos conectar el servidor. Revisá la conexión de Netlify.', 502);
    if (request.method === 'GET' && output.get('content-type')?.startsWith('text/html')) {
      const html = await response.text();
      const at = html.lastIndexOf('</body>');
      return new Response(at === -1 ? html + widget : html.slice(0, at) + widget + html.slice(at), {status: response.status, headers: output});
    }
    return new Response(request.method === 'HEAD' ? null : response.body, {status: response.status, headers: output});
  } catch {
    return fail('El servidor no respondió. Intentá nuevamente.', 502);
  }
}

export const config = {path: '/*'};
