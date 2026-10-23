/**
 * Builds assets/activity-{light,dark}.svg: the last year of contributions as a heatmap.
 *
 * Generated here instead of linked from a card service because the hosted
 * services this profile used went down and left broken images. The file lives
 * in the repo, so the worst a failed run can do is leave yesterday's numbers.
 *
 * Needs GITHUB_TOKEN (the Actions token is enough for public data).
 * Usage: node scripts/build-cards.mjs
 */
import fs from 'node:fs';
import { THEMES, FONT, esc } from './theme.mjs';

const LOGIN = process.env.PROFILE_LOGIN ?? 'recepteksi';
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error('build-cards: GITHUB_TOKEN is not set');
  process.exit(1);
}

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date weekday contributionCount contributionLevel } } } }
  }
}`;

const response = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-cards' },
  body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
});
const payload = await response.json();
if (!response.ok || payload.errors) {
  console.error('build-cards: GitHub answered', response.status, JSON.stringify(payload.errors ?? payload).slice(0, 400));
  process.exit(1);
}

const calendar = payload.data.user.contributionsCollection.contributionCalendar;
const weeks = calendar.weeks;
const days = weeks.flatMap((week) => week.contributionDays);
const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

let longest = 0;
let run = 0;
for (const day of days) {
  run = day.contributionCount > 0 ? run + 1 : 0;
  longest = Math.max(longest, run);
}
// Today still counts as part of the streak while it has no contribution yet.
let current = 0;
for (let i = days.length - 1; i >= 0; i -= 1) {
  if (days[i].contributionCount > 0) current += 1;
  else if (i !== days.length - 1) break;
}
const activeDays = days.filter((day) => day.contributionCount > 0).length;

const W = 1000;
const H = 286;
const CELL = 13;
const PITCH = 16;
const GRID_X = Math.round((W - weeks.length * PITCH) / 2) + 14;
const GRID_Y = 120;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const plural = (n, word) => `${n.toLocaleString('en-US')} ${word}${n === 1 ? '' : 's'}`;

const card = (t) => {
  const cells = weeks
    .flatMap((week, w) =>
      week.contributionDays.map(
        (d) =>
          `<rect x="${GRID_X + w * PITCH}" y="${GRID_Y + d.weekday * PITCH}" width="${CELL}" height="${CELL}" rx="3" fill="${t.heat[LEVEL[d.contributionLevel] ?? 0]}"><title>${esc(`${plural(d.contributionCount, 'contribution')} on ${d.date}`)}</title></rect>`,
      ),
    )
    .join('');
  let lastMonth = -1;
  const months = weeks
    .map((week, w) => {
      const month = Number(week.contributionDays[0].date.slice(5, 7)) - 1;
      if (month === lastMonth || w > weeks.length - 3) return '';
      lastMonth = month;
      return `<text x="${GRID_X + w * PITCH}" y="${GRID_Y - 10}" style="${FONT};font-size:11px" fill="${t.muted}">${MONTHS[month]}</text>`;
    })
    .join('');
  const weekdays = [
    [1, 'Mon'],
    [3, 'Wed'],
    [5, 'Fri'],
  ]
    .map(([row, label]) => `<text x="${GRID_X - 10}" y="${GRID_Y + row * PITCH + 10}" text-anchor="end" style="${FONT};font-size:11px" fill="${t.muted}">${label}</text>`)
    .join('');
  const stats = [
    [calendar.totalContributions.toLocaleString('en-US'), 'contributions'],
    [String(activeDays), 'active days'],
    [String(longest), 'longest streak'],
    [String(current), 'current streak'],
  ]
    .map(([value, label], i) => {
      const x = W - 32 - (3 - i) * 128;
      return `<text x="${x}" y="58" text-anchor="end" style="${FONT};font-size:26px;font-weight:800;letter-spacing:-.5px" fill="${i === 0 ? t.accent : t.text}">${esc(value)}</text>
<text x="${x}" y="78" text-anchor="end" style="${FONT};font-size:12px" fill="${t.muted}">${esc(label)}</text>`;
    })
    .join('\n');
  const legendX = W - 32 - 5 * PITCH;
  const legend = `<text x="${legendX - 8}" y="${H - 26}" text-anchor="end" style="${FONT};font-size:11px" fill="${t.muted}">Less</text>${t.heat
    .map((c, i) => `<rect x="${legendX + i * PITCH}" y="${H - 36}" width="${CELL}" height="${CELL}" rx="3" fill="${c}"/>`)
    .join('')}<text x="${legendX + 5 * PITCH + 4}" y="${H - 26}" style="${FONT};font-size:11px" fill="${t.muted}">More</text>`;
  const title = `${plural(calendar.totalContributions, 'contribution')} in the last year`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t">
<title id="t">${esc(title)}; longest streak ${plural(longest, 'day')}</title>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="20" fill="${t.bg}" stroke="${t.border}"/>
<text x="32" y="52" style="${FONT};font-size:12px;font-weight:700;letter-spacing:1.8px" fill="${t.muted}">ACTIVITY</text>
<text x="32" y="76" style="${FONT};font-size:15px;font-weight:600" fill="${t.text}">The last 12 months on GitHub</text>
${stats}
${months}${weekdays}
${cells}
${legend}
<text x="32" y="${H - 26}" style="${FONT};font-size:11px" fill="${t.muted}">Updated ${new Date().toISOString().slice(0, 10)}</text>
</svg>
`;
};

fs.mkdirSync('assets', { recursive: true });
for (const [name, t] of Object.entries(THEMES)) fs.writeFileSync(`assets/activity-${name}.svg`, card(t));
console.log(`build-cards: ${calendar.totalContributions} contributions, ${activeDays} active days, longest ${longest}, current ${current}`);
