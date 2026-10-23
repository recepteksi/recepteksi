/**
 * Builds assets/stack-{light,dark}.svg: the tech stack from the CV, Flutter first.
 *
 * Logos are Simple Icons 15.0.0 paths (CC0) copied into stack-icons.json, so
 * nothing outside this repo can break the picture. Ideas without a logo are
 * pills in the last row. Usage: node scripts/build-stack.mjs
 */
import fs from 'node:fs';
import { THEMES, FONT, esc, textWidth, logoFill } from './theme.mjs';

const ICONS = JSON.parse(fs.readFileSync(new URL('./stack-icons.json', import.meta.url), 'utf8'));

/** A tile is an icon key, or [key, label] when the label is not the logo's own name. */
const ROWS = [
  { label: 'Mobile', tiles: ['flutter', 'dart', 'kotlin', 'jetpackcompose', 'android', ['react', 'React Native'], 'expo', 'ionic'] },
  { label: 'Web & backend', tiles: ['typescript', 'react', 'vuedotjs', 'angular', 'nodedotjs', 'express', 'prisma', 'postgresql'] },
  { label: 'Platform & delivery', tiles: ['firebase', 'docker', 'gitlab', 'githubactions', 'appstore', 'googleplay'] },
];
const PRACTICES = {
  label: 'Engineering',
  pills: [
    'Clean Architecture',
    'Domain-Driven Design',
    'SOLID',
    'MVVM',
    'Cubit / Bloc',
    'Coroutines / Flow',
    'Unit · widget · integration tests',
    'CI/CD',
    'SSL pinning',
    'AES / RSA',
    'Keystore / Keychain',
    'OAuth 2.0 / PKCE',
    'White-label apps',
    'Agentic development',
  ],
};
const FEATURED = new Set(['flutter', 'dart']);

const W = 1000;
const PAD = 32;
const COLS = 8;
const GAP = 10;
const TILE_W = (W - PAD * 2 - GAP * (COLS - 1)) / COLS;
const TILE_H = 88;
const LABEL_H = 34;
const PILL_H = 32;

const kicker = (t, x, y, s) => `<text x="${x}" y="${y}" style="${FONT};font-size:12px;font-weight:700;letter-spacing:1.8px" fill="${t.muted}">${esc(s.toUpperCase())}</text>`;

const tile = (t, x, y, entry) => {
  const [key, label] = Array.isArray(entry) ? entry : [entry, ICONS[entry].title];
  const icon = ICONS[key];
  const featured = FEATURED.has(key);
  const cx = x + TILE_W / 2;
  const size = Math.min(12.5, (12.5 * (TILE_W - 14)) / textWidth(label, 12.5, 600));
  return `<rect x="${x.toFixed(1)}" y="${y}" width="${TILE_W.toFixed(1)}" height="${TILE_H}" rx="14" fill="${t.surface}" stroke="${featured ? t.accent : t.border}"${featured ? ' stroke-width="1.5"' : ''}/>
<svg x="${(cx - 15).toFixed(1)}" y="${y + 17}" width="30" height="30" viewBox="0 0 24 24"><path fill="${logoFill(icon.hex, t)}" d="${icon.path}"/></svg>
<text x="${cx.toFixed(1)}" y="${y + 70}" text-anchor="middle" style="${FONT};font-size:${size.toFixed(1)}px;font-weight:600" fill="${t.text}">${esc(label)}</text>`;
};

const layoutPills = () => {
  const placed = [];
  let x = PAD;
  let line = 0;
  for (const pill of PRACTICES.pills) {
    const w = Math.round(28 + textWidth(pill, 13));
    if (x + w > W - PAD) {
      x = PAD;
      line += 1;
    }
    placed.push({ pill, x, line, w });
    x += w + 8;
  }
  return { placed, lines: line + 1 };
};

const card = (t) => {
  const parts = [];
  let y = PAD;
  for (const row of ROWS) {
    parts.push(kicker(t, PAD, y + 14, row.label));
    y += LABEL_H;
    row.tiles.forEach((entry, i) => parts.push(tile(t, PAD + i * (TILE_W + GAP), y, entry)));
    y += TILE_H + 26;
  }
  parts.push(kicker(t, PAD, y + 14, PRACTICES.label));
  y += LABEL_H;
  const { placed, lines } = layoutPills();
  for (const { pill, x, line, w } of placed) {
    const py = y + line * (PILL_H + 8);
    parts.push(`<rect x="${x}" y="${py}" width="${w}" height="${PILL_H}" rx="16" fill="${t.surface}" stroke="${t.border}"/>
<text x="${x + w / 2}" y="${py + 21}" text-anchor="middle" style="${FONT};font-size:13px;font-weight:500" fill="${t.text}">${esc(pill)}</text>`);
  }
  const h = y + lines * (PILL_H + 8) - 8 + PAD;
  const names = [...ROWS.flatMap((r) => r.tiles.map((e) => (Array.isArray(e) ? e[1] : ICONS[e].title))), ...PRACTICES.pills];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img" aria-label="Tech stack: ${esc(names.join(', '))}">
<rect x=".5" y=".5" width="${W - 1}" height="${h - 1}" rx="20" fill="${t.bg}" stroke="${t.border}"/>
${parts.join('\n')}
</svg>
`;
};

fs.mkdirSync('assets', { recursive: true });
for (const [name, t] of Object.entries(THEMES)) fs.writeFileSync(`assets/stack-${name}.svg`, card(t));
console.log('build-stack: wrote assets/stack-light.svg and assets/stack-dark.svg');
