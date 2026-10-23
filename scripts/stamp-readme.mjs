/**
 * Adds a content hash to every assets/*.svg link in README.md (`?v=<hash>`).
 *
 * Browsers and GitHub's image proxy cache an image by its URL, so a card
 * rebuilt under the same name kept showing its old picture. With the hash in
 * the URL, a changed file is a new URL and an unchanged one stays cached.
 * Usage: node scripts/stamp-readme.mjs
 */
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const README = 'README.md';
const before = fs.readFileSync(README, 'utf8');
const missing = [];
const after = before.replace(/assets\/([\w-]+\.svg)(\?v=[0-9a-f]+)?/g, (_, file) => {
  const path = `assets/${file}`;
  if (!fs.existsSync(path)) {
    missing.push(path);
    return path;
  }
  const hash = createHash('sha256').update(fs.readFileSync(path)).digest('hex').slice(0, 10);
  return `${path}?v=${hash}`;
});
if (missing.length > 0) {
  console.error(`stamp-readme: README links to missing files: ${missing.join(', ')}`);
  process.exit(1);
}
if (after !== before) fs.writeFileSync(README, after);
console.log(`stamp-readme: ${after === before ? 'no change' : 'updated the image links'}`);
