const backend = 'https://stik3s-lab-pedidos.juancruzgil77.chatgpt.site';
const pages = new Set(['/', '/login', '/admin', '/cuenta', '/mis-reservas']);
const apis = new Set(['/api/catalog', '/api/auth', '/api/admin', '/api/favorites', '/api/orders', '/api/reservations', '/api/upload']);
const assets = new Set(['/app-icon.svg', '/favicon.svg', '/manifest.webmanifest']);
const allowed = path => pages.has(path.replace(/\/$/, '') || '/') || apis.has(path) || assets.has(path) || /^\/_next\/static\/[a-zA-Z0-9_./-]+$/.test(path) || /^\/planchuelas\/[A-Z_]+\.png$/.test(path) || /^\/api\/images\/[a-f0-9-]+\.(png|jpg|webp)$/.test(path);
const chatUrl = 'https://diagent.io/shared/mtGVzFDCeWg--ank4fmHjKpH9H4yTVVKZEgAa1SWszM';
// Customer support chat bubble, injected into public pages (not the admin panel).
const chatMarkup = `<style>
#stik3s-chat{position:fixed;right:20px;bottom:20px;z-index:2147483000;font-family:system-ui,sans-serif}
#stik3s-chat-btn{width:60px;height:60px;border:0;border-radius:50%;background:#111;color:#fff;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.3);display:grid;place-items:center;transition:transform .2s}
#stik3s-chat-btn:hover{transform:scale(1.07)}
#stik3s-chat-btn svg{width:28px;height:28px}
#stik3s-chat-panel{position:absolute;right:0;bottom:76px;width:380px;height:600px;max-height:calc(100vh - 110px);background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.3);display:none;flex-direction:column}
#stik3s-chat.open #stik3s-chat-panel{display:flex}
#stik3s-chat-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#111;color:#fff;font-size:15px;font-weight:600}
#stik3s-chat-head button{background:none;border:0;color:#fff;font-size:22px;line-height:1;cursor:pointer}
#stik3s-chat-panel iframe{flex:1;width:100%;border:0}
@media (max-width:480px){#stik3s-chat{right:12px;bottom:12px}#stik3s-chat.open #stik3s-chat-panel{position:fixed;inset:0;width:auto;height:auto;max-height:none;border-radius:0}}
</style><div id="stik3s-chat-panel" role="dialog" aria-label="Atención al cliente"><div id="stik3s-chat-head"><span>Atención al cliente</span><button type="button" aria-label="Cerrar chat" data-chat-toggle>&times;</button></div></div><button id="stik3s-chat-btn" type="button" aria-label="Abrir chat de atención al cliente" data-chat-toggle><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>`;
// Built after load, outside the app's React tree, so hydration is not affected.
const chatWidget = `<script>(()=>{const mount=()=>{if(document.getElementById('stik3s-chat'))return;const root=document.createElement('div');root.id='stik3s-chat';root.innerHTML=${JSON.stringify(chatMarkup)};document.body.appendChild(root);root.querySelectorAll('[data-chat-toggle]').forEach(b=>b.addEventListener('click',()=>{const panel=document.getElementById('stik3s-chat-panel');if(!panel.querySelector('iframe')){const f=document.createElement('iframe');f.src=${JSON.stringify(chatUrl)};f.title='Chat de atención al cliente';f.allow='microphone; clipboard-write';panel.appendChild(f);}root.classList.toggle('open');}));};if(document.readyState==='complete')mount();else addEventListener('load',mount);})();</script>`;
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
    if (request.method === 'HEAD') return new Response(null, {status: response.status, headers: output});
    const page = incoming.pathname.replace(/\/$/, '') || '/';
    if (pages.has(page) && page !== '/admin' && output.get('content-type')?.startsWith('text/html')) {
      const html = await response.text();
      const withChat = html.includes('</body>') ? html.replace('</body>', chatWidget + '</body>') : html + chatWidget;
      return new Response(withChat, {status: response.status, headers: output});
    }
    return new Response(response.body, {status: response.status, headers: output});
  } catch {
    return fail('El servidor no respondió. Intentá nuevamente.', 502);
  }
}

export const config = {path: '/*'};
