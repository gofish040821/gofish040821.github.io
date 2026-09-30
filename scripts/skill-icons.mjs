import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Reuse the local brand symbols; text-only badges get quiet, original pictograms.
const fallback = {
 cpp: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M13 4l-2 16"/>',
 java: '<path d="M5 10h12v8c0 4-12 4-12 0Zm12 1h2c4 0 4 6 0 6h-2M8 7c-4-3 4-3 1-6m4 6c-4-3 4-3 1-6M4 23h15"/>',
 golang: '<path d="M10 7H7a5 5 0 0 0 0 10h4v-5H8M17 7c-6 0-6 10 0 10s6-10 0-10ZM1 9h2m-3 6h3"/>',
 html: '<path d="m4 2 2 18 6 2 6-2 2-18ZM16 7H8l1 5h6l-1 5-2 1-3-1"/>',
 css: '<path d="m4 2 2 18 6 2 6-2 2-18ZM8 7h8l-1 5H9m6 0-1 5-2 1-3-1"/>',
 javascript: '<path d="M3 3h18v18H3ZM11 9v8c0 3-5 3-5 0m12-6c-3-4-6 2-2 3s3 6-1 4"/>',
 springboot: '<path d="M19 4C5 2 1 8 6 17s16 0 13-13ZM6 19 17 7m-5 2v6h4"/>',
 docker: '<path d="M2 12h16c2 0 4-2 4-4l-3 1-1-3-1 6M3 12c-1 10 15 10 17 0M5 11V7h4v4m0-4h4v4m0-4V3h4v8"/>',
 rag: '<path d="M4 3h11v15H4ZM7 6h5M7 9h5m2 5 7 7"/><circle cx="16" cy="15" r="4"/>',
 mcp: '<path d="M8 9V3m8 6V3M5 9h14v4c0 5-14 5-14 0ZM12 17v5"/>'
};
export async function loadSkillIcons(root, items) {
  const icons = new Map();
  for (const item of items) {
    if (!/^[a-z0-9-]+$/.test(item.badge)) throw new Error(`Invalid skill badge: ${item.badge}`);
    const source = await readFile(resolve(root, 'dist/assets/skills', `${item.badge}.svg`), 'utf8');
    const match = source.match(/href="data:image\/svg\+xml;base64,([^"]+)"/);
    let drawing;
    if (match) {
      const decoded = Buffer.from(match[1], 'base64').toString('utf8');
      drawing = decoded.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[\s\S]*?<\/title>/g, '').replace(/fill="(?:white|#fff|#ffffff)"/gi, 'fill="currentColor"');
    } else {
      if (!fallback[item.badge]) throw new Error(`Missing skill icon: ${item.badge}`);
      drawing = `<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${fallback[item.badge]}</g>`;
    }
    icons.set(item.badge, `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" focusable="false">${drawing}</svg>`);
  }
  return icons;
}
