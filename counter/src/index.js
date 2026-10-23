/**
 * Profile visit counter: a Cloudflare Worker with one SQLite-backed Durable Object.
 *
 * Why our own: the shared counter service this profile linked returned errors
 * through GitHub's image proxy and the README showed a broken image. This one
 * lives in the owner's Cloudflare account, on the free plan, with nothing to
 * renew.
 *
 * - `GET /visits.svg?theme=light|dark` counts one visit and returns the badge.
 * - `GET /visits.json` returns the count without adding to it (health checks).
 *
 * GitHub fetches every README image through its Camo proxy, which hides the
 * viewer, so this counts visits, not people. `no-store` keeps Camo from
 * serving a cached badge, so each visit reaches the counter.
 */
import { DurableObject } from 'cloudflare:workers';

const NAME = 'recepteksi';

const THEMES = {
  light: { bg: '#f6f8fa', border: '#d1d9e0', text: '#1f2328', muted: '#59636e', accent: '#02569B' },
  dark: { bg: '#151b23', border: '#3d444d', text: '#f0f6fc', muted: '#9198a1', accent: '#54C5F8' },
};
const FONT = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";
const NO_STORE = 'max-age=0, no-cache, no-store, must-revalidate';

export class Counter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS counts (name TEXT PRIMARY KEY, n INTEGER NOT NULL)');
    this.sql.exec('INSERT OR IGNORE INTO counts (name, n) VALUES (?, ?)', NAME, Number(env.SEED ?? 0));
  }

  hit() {
    return this.sql.exec('UPDATE counts SET n = n + 1 WHERE name = ? RETURNING n', NAME).one().n;
  }

  peek() {
    return this.sql.exec('SELECT n FROM counts WHERE name = ?', NAME).one().n;
  }
}

const width = (s, size) => [...s].reduce((sum, ch) => sum + (/[0-9]/.test(ch) ? 0.62 : ch === ',' || ch === ' ' ? 0.3 : 0.55), 0) * size;

const badge = (count, t) => {
  const number = count.toLocaleString('en-US');
  const label = 'profile visits';
  const numberW = width(number, 14) * 1.08;
  const w = Math.round(16 + 18 + 8 + numberW + 6 + width(label, 13) + 16);
  const h = 34;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${number} ${label}">
<title>${number} ${label}</title>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${h / 2 - 0.5}" fill="${t.bg}" stroke="${t.border}"/>
<g transform="translate(16 8) scale(.75)" fill="none" stroke="${t.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></g>
<text x="42" y="22" style="${FONT};font-size:14px;font-weight:700" fill="${t.text}">${number}</text>
<text x="${Math.round(42 + numberW + 6)}" y="22" style="${FONT};font-size:13px" fill="${t.muted}">${label}</text>
</svg>`;
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const counter = env.COUNTER.get(env.COUNTER.idFromName(NAME));
    if (url.pathname === '/visits.svg') {
      const isCounted = request.method === 'GET';
      const count = isCounted ? await counter.hit() : await counter.peek();
      const theme = THEMES[url.searchParams.get('theme')] ?? THEMES.light;
      return new Response(badge(count, theme), {
        headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': NO_STORE, Expires: '0' },
      });
    }
    if (url.pathname === '/visits.json') {
      return Response.json({ name: NAME, count: await counter.peek() }, { headers: { 'Cache-Control': NO_STORE } });
    }
    return new Response('Not found', { status: 404 });
  },
};
