/**
 * Builds the profile's activity and language cards as plain SVG files in assets/.
 *
 * Why generated here instead of linked from a card service: the hosted card
 * services this profile used went down (a Heroku free dyno, a rate-limited
 * shared Vercel instance) and the README showed broken images. These files
 * live in the repo, so the worst a failed run can do is leave yesterday's
 * numbers on the page.
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

// Generated platform code inside Flutter and React Native projects, not code anyone wrote.
const IGNORED_LANGUAGES = new Set(['C++', 'CMake', 'C', 'HTML', 'CSS', 'Ruby', 'Objective-C', 'Swift', 'Makefile', 'Shell', 'Batchfile', 'Starlark', 'Procfile', 'Dockerfile']);
const TOP_LANGUAGES = 6;

const QUERY = `query($login: String!) {
  user(login: $login) {
    repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, first: 100) {
      totalCount
      nodes { stargazerCount languages(first: 12, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } } }
    }
    contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } }
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
const user = payload.data.user;

// --- numbers ---------------------------------------------------------------
const repos = user.repositories.nodes;
const stars = repos.reduce((sum, repo) => sum + repo.stargazerCount, 0);
const days = user.contributionsCollection.contributionCalendar.weeks.flatMap((week) => week.contributionDays);
const total = user.contributionsCollection.contributionCalendar.totalContributions;

let longest = 0;
let run = 0;
for (const day of days) {
  run = day.contributionCount > 0 ? run + 1 : 0;
  longest = Math.max(longest, run);
}
const activeDays = days.filter((day) => day.contributionCount > 0).length;

const bytes = new Map();
for (const repo of repos) {
  for (const edge of repo.languages.edges) {
    if (IGNORED_LANGUAGES.has(edge.node.name)) continue;
    const seen = bytes.get(edge.node.name) ?? { size: 0, color: edge.node.color ?? '#8b949e' };
    seen.size += edge.size;
    bytes.set(edge.node.name, seen);
  }
}
const languageTotal = [...bytes.values()].reduce((sum, l) => sum + l.size, 0) || 1;
const languages = [...bytes.entries()]
  .map(([name, { size, color }]) => ({ name, color, share: size / languageTotal }))
  .sort((a, b) => b.share - a.share)
  .slice(0, TOP_LANGUAGES);

// --- cards -----------------------------------------------------------------
const W = 480;
const H = 210;

const frame = (t, title, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.bg}" stroke="${t.border}"/>
<text x="24" y="38" style="${FONT};font-size:15px;font-weight:600" fill="${t.text}">${esc(title)}</text>
${body}
</svg>
`;

const statsCard = (t) => {
  const rows = [
    ['Contributions (last 12 months)', total.toLocaleString('en-US')],
    ['Active days', String(activeDays)],
    ['Longest streak', `${longest} day${longest === 1 ? '' : 's'}`],
    ['Public repositories', String(user.repositories.totalCount)],
    ['Stars earned', String(stars)],
  ];
  const lines = rows
    .map(([label, value], i) => {
      const y = 70 + i * 26;
      return `<text x="24" y="${y}" style="${FONT};font-size:13px" fill="${t.muted}">${esc(label)}</text>
<text x="300" y="${y}" text-anchor="end" style="${FONT};font-size:13px;font-weight:600" fill="${t.text}">${esc(value)}</text>`;
    })
    .join('\n');
  // The last 18 weeks as small bars, so the card shows rhythm, not just totals.
  const recent = user.contributionsCollection.contributionCalendar.weeks.slice(-18).map((w) => w.contributionDays.reduce((s, d) => s + d.contributionCount, 0));
  const peak = Math.max(1, ...recent);
  const bars = recent
    .map((count, i) => {
      const h = Math.max(2, Math.round((count / peak) * 100));
      return `<rect x="${330 + i * 7.5}" y="${170 - h}" width="5" height="${h}" rx="1.5" fill="${count === 0 ? t.track : t.accent}"/>`;
    })
    .join('');
  const caption = `<text x="${330 + 9 * 7.5}" y="190" text-anchor="middle" style="${FONT};font-size:10px" fill="${t.muted}">last 18 weeks</text>`;
  return frame(t, 'GitHub activity', `${lines}\n${bars}\n${caption}`);
};

const languagesCard = (t) => {
  const barX = 24;
  const barW = W - 48;
  let x = barX;
  const segments = languages
    .map((l) => {
      const w = Math.max(2, l.share * barW);
      const rect = `<rect x="${x.toFixed(1)}" y="56" width="${w.toFixed(1)}" height="10" fill="${l.color}"/>`;
      x += w;
      return rect;
    })
    .join('');
  const bar = `<clipPath id="bar"><rect x="${barX}" y="56" width="${barW}" height="10" rx="5"/></clipPath><g clip-path="url(#bar)"><rect x="${barX}" y="56" width="${barW}" height="10" fill="${t.track}"/>${segments}</g>`;
  const legend = languages
    .map((l, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const lx = 24 + col * 220;
      const ly = 100 + row * 30;
      return `<circle cx="${lx + 6}" cy="${ly - 4}" r="6" fill="${l.color}"/>
<text x="${lx + 20}" y="${ly}" style="${FONT};font-size:13px;font-weight:600" fill="${t.text}">${esc(l.name)}</text>
<text x="${lx + 200}" y="${ly}" text-anchor="end" style="${FONT};font-size:13px" fill="${t.muted}">${(l.share * 100).toFixed(1)}%</text>`;
    })
    .join('\n');
  return frame(t, 'Languages I write', `${bar}\n${legend}`);
};

fs.mkdirSync('assets', { recursive: true });
for (const [name, t] of Object.entries(THEMES)) {
  fs.writeFileSync(`assets/activity-${name}.svg`, statsCard(t));
  fs.writeFileSync(`assets/languages-${name}.svg`, languagesCard(t));
}
console.log(`build-cards: ${total} contributions, ${activeDays} active days, longest streak ${longest}, ${languages.map((l) => l.name).join(', ')}`);
