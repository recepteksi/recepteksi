/**
 * Shared look of every generated image: GitHub's own light and dark surfaces,
 * with Flutter blue as the one accent.
 */
export const THEMES = {
  light: {
    name: 'light',
    bg: '#ffffff',
    surface: '#f6f8fa',
    border: '#d1d9e0',
    text: '#1f2328',
    muted: '#59636e',
    accent: '#02569B',
    accentBright: '#0175C2',
    heroFrom: '#f3f8fd',
    heroTo: '#ffffff',
    glow: '#54C5F8',
    glowOpacity: 0.28,
    heat: ['#eff2f5', '#c9e6fa', '#86c8f2', '#2f93db', '#02569B'],
  },
  dark: {
    name: 'dark',
    bg: '#0d1117',
    surface: '#151b23',
    border: '#3d444d',
    text: '#f0f6fc',
    muted: '#9198a1',
    accent: '#54C5F8',
    accentBright: '#7fd6ff',
    heroFrom: '#08111f',
    heroTo: '#0c2742',
    glow: '#54C5F8',
    glowOpacity: 0.32,
    heat: ['#151b23', '#0f3657', '#145f93', '#2a9be0', '#8ad9ff'],
  },
};

export const FONT = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";

/** Escapes text for SVG. */
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const NARROW = new Set([...'iljtf.,·/:;!|()[] \'']);
const WIDE = new Set([...'mwMW@']);

/** Approximate rendered width of system-sans text, per character class; good enough to size a pill around it. */
export const textWidth = (s, size, weight = 500) =>
  [...s].reduce((sum, ch) => {
    if (NARROW.has(ch)) return sum + 0.3;
    if (WIDE.has(ch)) return sum + 0.85;
    if (/[A-Z0-9]/.test(ch)) return sum + 0.66;
    return sum + 0.53;
  }, 0) * size * (weight >= 600 ? 1.05 : 1);

/** Brand colour of a logo, swapped for the text colour when it would vanish on a dark background. */
export const logoFill = (hex, t) => {
  const n = parseInt(hex, 16);
  const luminance = (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return t.name === 'dark' && luminance < 0.26 ? t.text : `#${hex}`;
};
