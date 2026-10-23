/**
 * Builds assets/journey-{light,dark}.svg: experience as a timeline, education and languages beside it.
 *
 * The text comes from the CV; edit the lists below when it changes.
 * Usage: node scripts/build-journey.mjs
 */
import fs from 'node:fs';
import { THEMES, FONT, esc } from './theme.mjs';

const EXPERIENCE = [
  { when: 'Apr 2026 – now', title: 'Recipely', where: 'Personal product on iOS, Android and the web', tags: 'React Native · Expo · Node.js · PostgreSQL · Docker · AI', current: true },
  { when: 'Aug 2022 – Feb 2026', title: 'Software Developer', where: 'OGZA Technology · fintech, payments, enterprise LMS', tags: 'Flutter · Kotlin · Vue.js · Ionic / Angular' },
  { when: 'Sep – Oct 2021', title: 'Web Development Intern', where: 'Monster Notebook', tags: 'React · JavaScript · HTML · CSS' },
  { when: 'Jun – Jul 2021', title: 'Software Development Intern', where: 'Hepsiburada', tags: 'SAP · ABAP · SQL' },
  { when: 'Jul – Aug 2017', title: 'IT Infrastructure Intern', where: 'İSKİ', tags: 'Servers · networking · support' },
];
const EDUCATION = [
  { when: '2018 – 2022', title: 'B.Sc. Computer Engineering', where: 'Istanbul Doğuş University' },
  { when: '2016 – 2018', title: 'A.A. Computer Programming', where: 'Istanbul Gedik University' },
];
const LANGUAGES = [
  ['Turkish', 'native'],
  ['English', 'B2'],
];

const W = 1000;
const PAD = 32;
const ROW = 84;
const TOP = 76;
const H = TOP + EXPERIENCE.length * ROW + 8;
const LINE_X = PAD + 7;
const RIGHT_X = 640;

const kicker = (t, x, y, s) => `<text x="${x}" y="${y}" style="${FONT};font-size:12px;font-weight:700;letter-spacing:1.8px" fill="${t.muted}">${esc(s.toUpperCase())}</text>`;

const card = (t) => {
  const first = TOP + 6;
  const last = TOP + (EXPERIENCE.length - 1) * ROW + 6;
  const rows = EXPERIENCE.map((e, i) => {
    const y = TOP + i * ROW;
    const dot = e.current
      ? `<circle cx="${LINE_X}" cy="${y + 6}" r="7" fill="${t.accent}" fill-opacity=".2"/><circle cx="${LINE_X}" cy="${y + 6}" r="4" fill="${t.accent}"/>`
      : `<circle cx="${LINE_X}" cy="${y + 6}" r="4.5" fill="${t.bg}" stroke="${t.accent}" stroke-width="2"/>`;
    return `${dot}
<text x="${PAD + 28}" y="${y + 10}" style="${FONT};font-size:12px;font-weight:600" fill="${t.accent}">${esc(e.when)}</text>
<text x="${PAD + 28}" y="${y + 33}" style="${FONT};font-size:16px;font-weight:700" fill="${t.text}">${esc(e.title)}</text>
<text x="${PAD + 28}" y="${y + 53}" style="${FONT};font-size:13px" fill="${t.muted}">${esc(e.where)}</text>
<text x="${PAD + 28}" y="${y + 71}" style="${FONT};font-size:12.5px;font-weight:500" fill="${t.text}" fill-opacity=".8">${esc(e.tags)}</text>`;
  }).join('\n');
  const education = EDUCATION.map((e, i) => {
    const y = TOP + i * 76;
    return `<text x="${RIGHT_X}" y="${y + 10}" style="${FONT};font-size:12px;font-weight:600" fill="${t.accent}">${esc(e.when)}</text>
<text x="${RIGHT_X}" y="${y + 33}" style="${FONT};font-size:16px;font-weight:700" fill="${t.text}">${esc(e.title)}</text>
<text x="${RIGHT_X}" y="${y + 53}" style="${FONT};font-size:13px" fill="${t.muted}">${esc(e.where)}</text>`;
  }).join('\n');
  const langTop = TOP + EDUCATION.length * 76 + 44;
  const languages = LANGUAGES.map(
    ([name, level], i) =>
      `<text x="${RIGHT_X}" y="${langTop + 30 + i * 26}" style="${FONT};font-size:14px;font-weight:600" fill="${t.text}">${esc(name)}</text><text x="${W - PAD}" y="${langTop + 30 + i * 26}" text-anchor="end" style="${FONT};font-size:13px" fill="${t.muted}">${esc(level)}</text>`,
  ).join('\n');
  const summary = [...EXPERIENCE.map((e) => `${e.title}, ${e.where}, ${e.when}`), ...EDUCATION.map((e) => `${e.title}, ${e.where}, ${e.when}`)].join('; ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(summary)}">
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="20" fill="${t.bg}" stroke="${t.border}"/>
${kicker(t, PAD, 48, 'Experience')}
<line x1="${LINE_X}" y1="${first}" x2="${LINE_X}" y2="${last}" stroke="${t.border}" stroke-width="2"/>
${rows}
<line x1="${RIGHT_X - 32}" y1="${PAD}" x2="${RIGHT_X - 32}" y2="${H - PAD}" stroke="${t.border}"/>
${kicker(t, RIGHT_X, 48, 'Education')}
${education}
${kicker(t, RIGHT_X, langTop, 'Languages')}
${languages}
</svg>
`;
};

fs.mkdirSync('assets', { recursive: true });
for (const [name, t] of Object.entries(THEMES)) fs.writeFileSync(`assets/journey-${name}.svg`, card(t));
console.log('build-journey: wrote assets/journey-light.svg and assets/journey-dark.svg');
