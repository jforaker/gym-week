// Gym Week — Cloudflare Worker. Needs a KV namespace bound as GYM.
// The page lives in src/page/. `npm run build` inlines it below → dist/index.js.
const HTML = __PAGE_HTML__;
const KEY_RE = /^\d{4}-\d{2}-\d{2}_(jake|dan)$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api') {
      if (request.method === 'GET') {
        const slots = (await env.GYM.get('slots', 'json')) || {};
        return Response.json(
          { slots },
          { headers: { 'Cache-Control': 'no-store' } },
        );
      }
      if (request.method === 'POST') {
        let body;
        try {
          body = await request.json();
        } catch {
          return new Response('bad json', { status: 400 });
        }
        const { key, value } = body || {};
        if (!KEY_RE.test(key) || ![null, 'yes', 'no'].includes(value))
          return new Response('bad input', { status: 400 });
        const slots = (await env.GYM.get('slots', 'json')) || {};
        if (value) slots[key] = value;
        else delete slots[key];
        await env.GYM.put('slots', JSON.stringify(slots));
        return Response.json({ slots });
      }
      return new Response('method not allowed', { status: 405 });
    }
    return new Response(HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};
