/**
 * Opens the live profile page and checks that every image on it loads as an image.
 *
 * This is what a visitor's browser does, through the same GitHub image proxy,
 * so a broken card or a dead counter fails the daily run (and GitHub emails
 * the owner) instead of sitting broken on the profile unnoticed.
 * Usage: node scripts/verify-profile.mjs
 */
const LOGIN = process.env.PROFILE_LOGIN ?? 'recepteksi';
const ATTEMPTS = 3;
// Loading the visit badge counts a visit, so the counter is checked on its read-only endpoint instead.
const COUNTER = 'https://visits.recipely.net';

/** The address a Camo proxy URL stands for (its last path segment is the hex-encoded original). */
const origin = (url) => {
  const { hostname, pathname } = new URL(url);
  if (hostname !== 'camo.githubusercontent.com') return url;
  return Buffer.from(pathname.split('/').pop(), 'hex').toString('utf8');
};

const get = async (url) => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'profile-verify' }, redirect: 'follow' });
      if (response.ok || attempt === ATTEMPTS) return response;
    } catch (error) {
      if (attempt === ATTEMPTS) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
  }
};

const page = await get(`https://github.com/${LOGIN}`);
if (!page.ok) {
  console.error(`verify-profile: the profile page answered ${page.status}`);
  process.exit(1);
}
const html = await page.text();
const readme = html.slice(html.indexOf('<article'), html.indexOf('</article>'));
const urls = new Set();
for (const [, attr] of readme.matchAll(/(?:src|srcset)="([^"]+)"/g)) {
  urls.add(new URL(attr.replace(/&amp;/g, '&'), 'https://github.com').href);
}
if (urls.size === 0) {
  console.error('verify-profile: found no images in the profile README');
  process.exit(1);
}

const failures = [];
let hasCounter = false;
for (const url of urls) {
  if (origin(url).startsWith(COUNTER)) {
    hasCounter = true;
    continue;
  }
  const response = await get(url).catch((error) => ({ ok: false, status: String(error), headers: new Headers() }));
  const type = response.headers.get('content-type') ?? '';
  if (!response.ok || !type.startsWith('image/')) failures.push(`${response.status} ${type || '-'} ${url}`);
}
if (hasCounter) {
  const counter = await get(`${COUNTER}/visits.json`).catch(() => null);
  const body = counter?.ok ? await counter.json().catch(() => null) : null;
  if (!Number.isInteger(body?.count)) failures.push(`counter ${counter?.status ?? 'unreachable'} ${COUNTER}/visits.json`);
} else {
  failures.push('the visit badge is missing from the profile');
}
if (failures.length > 0) {
  console.error(`verify-profile: ${failures.length} of ${urls.size} images do not load:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`verify-profile: all ${urls.size} images load`);
