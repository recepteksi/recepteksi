/**
 * Builds assets/stack-{light,dark}.svg: the tech stack as one image, Flutter first.
 *
 * Logos are Simple Icons paths (CC0), copied into stack-icons.json once, so
 * this needs no network and no badge service: nothing outside this repo can
 * break the picture. Run it after editing GROUPS: node scripts/build-stack.mjs
 */
import fs from 'node:fs';
import { THEMES, FONT, esc } from './theme.mjs';

const ICONS = JSON.parse(fs.readFileSync(new URL('./stack-icons.json', import.meta.url), 'utf8'));

/** Each group is a row; an item is an icon key, or plain text for ideas that have no logo. */
const GROUPS = [
  { label: 'Mobile', items: ['flutter', 'dart', 'kotlin', 'android', 'swift'] },
  { label: 'Architecture', items: ['Clean Architecture', 'Domain-Driven Design', 'BLoC / Cubit', 'Provider'] },
  { label: 'Cross-platform', items: ['react', 'expo', 'typescript'] },
  { label: 'Backend & delivery', items: ['firebase', 'githubactions', 'postman', 'figma'] },
];
const FEATURED = new Set(['flutter', 'dart']);

const W = 980;
const ROW_H = 58;
const H = 36 + GROUPS.length * ROW_H;
const CHIP_H = 36;
const LABEL_W = 190;

const textWidth = (s, size) => s.length * size * 0.58;

const chip = (t, x, y, item) => {
  const icon = ICONS[item];
  const featured = FEATURED.has(item);
  const label = icon ? icon.title : item;
  const pad = 14;
  const iconSize = 18;
  const w = Math.round(pad * 2 + (icon ? iconSize + 8 : 0) + textWidth(label, 13.5));
  const fill = featured ? t.accentSoft : t.bg;
  const stroke = featured ? t.accent : t.border;
  const svgIcon = icon
    ? `<svg x="${x + pad}" y="${y + (CHIP_H - iconSize) / 2}" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24"><path fill="#${icon.hex === '000020' ? (t === THEMES.dark ? 'e6edf3' : '000020') : icon.hex}" d="${icon.path}"/></svg>`
    : '';
  const tx = x + pad + (icon ? iconSize + 8 : 0);
  return {
    w,
    svg: `<rect x="${x}" y="${y}" width="${w}" height="${CHIP_H}" rx="18" fill="${fill}" stroke="${stroke}"/>${svgIcon}<text x="${tx}" y="${y + 23}" style="${FONT};font-size:13.5px;font-weight:${featured ? 700 : 500}" fill="${t.text}">${esc(label)}</text>`,
  };
};

const card = (t) => {
  const rows = GROUPS.map((group, row) => {
    const y = 24 + row * ROW_H;
    let x = LABEL_W;
    const chips = group.items.map((item) => {
      const c = chip(t, x, y, item);
      x += c.w + 10;
      return c.svg;
    });
    return `<text x="28" y="${y + 23}" style="${FONT};font-size:13px;font-weight:600;letter-spacing:.4px" fill="${t.muted}">${esc(group.label.toUpperCase())}</text>${chips.join('')}`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tech stack: ${esc(GROUPS.flatMap((g) => g.items.map((i) => ICONS[i]?.title ?? i)).join(', '))}">
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="${t.bg}" stroke="${t.border}"/>
${rows.join('\n')}
</svg>
`;
};

fs.mkdirSync('assets', { recursive: true });
for (const [name, t] of Object.entries(THEMES)) fs.writeFileSync(`assets/stack-${name}.svg`, card(t));
console.log('build-stack: wrote assets/stack-light.svg and assets/stack-dark.svg');
