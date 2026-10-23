/** Colours for the generated cards, matched to GitHub's own light and dark themes. */
export const THEMES = {
  light: { bg: '#ffffff', border: '#d0d7de', text: '#1f2328', muted: '#59636e', track: '#eaeef2', accent: '#02569B', accentSoft: '#e7f2fb' },
  dark: { bg: '#0d1117', border: '#30363d', text: '#e6edf3', muted: '#9198a1', track: '#21262d', accent: '#54C5F8', accentSoft: '#0f2a3d' },
};

export const FONT = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

/** Escapes text for SVG. */
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
