/**
 * Builds the header banner and the link buttons in assets/, light and dark.
 *
 * Static content, generated rather than drawn by hand so a wording change is
 * one edit here. Only the orbit moves, in CSS, so a visitor who asked their
 * system for reduced motion gets a still image, and text is never animated in. Usage: node scripts/build-brand.mjs
 */
import fs from 'node:fs';
import { THEMES, FONT, esc, textWidth, logoFill } from './theme.mjs';

const ICONS = JSON.parse(fs.readFileSync(new URL('./stack-icons.json', import.meta.url), 'utf8'));

const HERO = {
  kicker: 'SOFTWARE DEVELOPER',
  name: 'Recep Tayyip Ekşi',
  lines: ['Mobile, web and backend, in whatever language the problem needs.', '3.5+ years shipping fintech, payment and enterprise software.'],
  location: 'İstanbul, Türkiye',
  orbit: ['flutter', 'typescript', 'kotlin', 'nodedotjs', 'react', 'postgresql'],
};

const LINKS = [
  { id: 'linkedin', label: 'LinkedIn', icon: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 10.5V17M8 7.2v.1M12 17v-6.5M12 13.5a2.5 2.5 0 0 1 5 0V17"/>' },
  { id: 'email', label: 'Email', icon: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>' },
  { id: 'portfolio', label: 'Portfolio', icon: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>' },
  { id: 'recipely', label: 'Recipely', icon: '<path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0Z"/><path d="M9 3.5c-1 1.4 1 2.6 0 4.5M15 3.5c-1 1.4 1 2.6 0 4.5"/>' },
];

const W = 1000;
const H = 300;
const CX = 830;
const CY = 150;

const hero = (t) => {
  const rings = [64, 96, 124]
    .map((r, i) => `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="${t.accent}" stroke-opacity="${0.28 - i * 0.07}"${i === 2 ? ' stroke-dasharray="2 7"' : ''}/>`)
    .join('');
  const badges = HERO.orbit
    .map((key, i) => {
      const icon = ICONS[key];
      const r = i % 2 === 0 ? 96 : 124;
      const angle = (i * 2 * Math.PI) / HERO.orbit.length - Math.PI / 2;
      const x = CX + r * Math.cos(angle);
      const y = CY + r * Math.sin(angle);
      return `<g class="upright"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="19" fill="${t.bg}" stroke="${t.border}"/><svg x="${(x - 10).toFixed(1)}" y="${(y - 10).toFixed(1)}" width="20" height="20" viewBox="0 0 24 24"><path fill="${logoFill(icon.hex, t)}" d="${icon.path}"/></svg></g>`;
    })
    .join('');
  const pinX = 56;
  const pillW = Math.round(36 + textWidth(HERO.location, 13));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">${esc(HERO.name)} · ${esc(HERO.kicker.toLowerCase())}</title>
<desc id="d">${esc(HERO.lines.join(' '))} ${esc(HERO.location)}.</desc>
<style>
.orbit{transform-origin:${CX}px ${CY}px;animation:spin 60s linear infinite}
.upright{transform-box:fill-box;transform-origin:center;animation:spin 60s linear infinite reverse}
@keyframes spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.orbit,.upright{animation:none}}
</style>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.heroFrom}"/><stop offset="1" stop-color="${t.heroTo}"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="${t.glow}" stop-opacity="${t.glowOpacity}"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="mark" gradientUnits="userSpaceOnUse" x1="3" y1="5" x2="21" y2="19"><stop offset="0" stop-color="#54C5F8"/><stop offset="1" stop-color="#02569B"/></linearGradient>
<pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.1" fill="${t.muted}" fill-opacity=".22"/></pattern>
<linearGradient id="fade"><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>
<mask id="right"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
<clipPath id="card"><rect width="${W}" height="${H}" rx="20"/></clipPath>
</defs>
<g clip-path="url(#card)">
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#right)"/>
<circle cx="${CX}" cy="${CY}" r="250" fill="url(#glow)"/>
${rings}
<g class="orbit">${badges}</g>
<g transform="translate(${CX - 40} ${CY - 40}) scale(3.333)" fill="none" stroke="url(#mark)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/></g>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="19.5" fill="none" stroke="${t.border}"/>
<g>
<text x="56" y="86" style="${FONT};font-size:13px;font-weight:700;letter-spacing:2.4px" fill="${t.accent}">${esc(HERO.kicker)}</text>
<text x="54" y="142" style="${FONT};font-size:50px;font-weight:800;letter-spacing:-1.2px" fill="${t.text}">${esc(HERO.name)}</text>
</g>
<g>
<text x="56" y="184" style="${FONT};font-size:18px;font-weight:500" fill="${t.text}" fill-opacity=".86">${esc(HERO.lines[0])}</text>
<text x="56" y="211" style="${FONT};font-size:16px" fill="${t.muted}">${esc(HERO.lines[1])}</text>
</g>
<g>
<rect x="${pinX}" y="232" width="${pillW}" height="30" rx="15" fill="${t.bg}" fill-opacity=".7" stroke="${t.border}"/>
<path transform="translate(${pinX + 11} 239) scale(.68)" d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z M12 12.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z" fill="none" stroke="${t.accent}" stroke-width="2" stroke-linejoin="round"/>
<text x="${pinX + 30}" y="252" style="${FONT};font-size:13px;font-weight:500" fill="${t.text}">${esc(HERO.location)}</text>
</g>
</svg>
`;
};

const button = (t, link) => {
  const h = 44;
  const w = Math.round(18 + 20 + 10 + textWidth(link.label, 14, 600) + 22);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(link.label)}">
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${h / 2 - 0.5}" fill="${t.surface}" stroke="${t.border}"/>
<g transform="translate(18 12) scale(.8333)" fill="none" stroke="${t.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${link.icon}</g>
<text x="48" y="27.5" style="${FONT};font-size:14px;font-weight:600" fill="${t.text}">${esc(link.label)}</text>
</svg>
`;
};

fs.mkdirSync('assets', { recursive: true });
for (const [name, t] of Object.entries(THEMES)) {
  fs.writeFileSync(`assets/hero-${name}.svg`, hero(t));
  for (const link of LINKS) fs.writeFileSync(`assets/link-${link.id}-${name}.svg`, button(t, link));
}
console.log(`build-brand: wrote the banner and ${LINKS.length} link buttons`);
