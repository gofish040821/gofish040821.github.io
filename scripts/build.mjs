import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(resolve(root, 'content.json'), 'utf8'));
const i18n = JSON.parse(await readFile(resolve(root, 'src/i18n.json'), 'utf8'));
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const paragraphs = value => escape(value).replace(/&lt;br\s*\/?&gt;/g, '<br>');
const photoPath = (name, small = false) => {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Invalid photo name: ${name}`);
  return `./assets/photos/${name}${small ? '-small' : ''}.webp`;
};
// Crests live in dist/assets/logos and are committed as-is (svg or png).
const logoPath = (name) => {
  if (!/^[a-z0-9.-]+\.(svg|png)$/.test(name)) throw new Error(`Invalid logo name: ${name}`);
  return `./assets/logos/${name}`;
};
for (const key of ['github', 'siteUrl']) {
  if (!/^https:\/\//.test(data[key])) throw new Error(`${key} should be an https URL`);
}

// --- Section renderers. The default content and every translation go through
// --- exactly the same markup, so switching language never shifts the layout.
const renderAbout = items => items.map(text => `<p>${escape(text)}</p>`).join('\n');
const renderResearch = items => items.map(item => `<article class="research-card ${escape(item.className)}"><div class="research-card-top"><span class="card-marker">${escape(item.number)}</span><span class="research-type">A QUESTION TO EXPLORE</span></div><h3>${escape(item.title)}</h3><p class="research-subtitle">${escape(item.subtitle)}</p><p class="research-description">${escape(item.description)}</p><div class="tags">${item.tags.map(tag => `<span>${escape(tag)}</span>`).join('')}</div></article>`).join('\n');
const renderEducation = items => items.map(item => `<article class="education-item${item.current ? ' current' : ''}"><div class="education-meta"><span class="education-dates">${escape(item.dates)}</span><span class="education-degree">${escape(item.degree)}</span></div><div class="education-head">${item.logo ? `<span class="school-crest"><img src="${logoPath(item.logo)}" alt="" loading="lazy" decoding="async"></span>` : ''}<div><h3>${escape(item.school)}</h3><p class="school-abbr" lang="en">${escape(item.abbr)}</p></div></div><p class="education-note">${escape(item.note)}</p></article>`).join('\n');
const renderHobbies = items => items.map(item => `<article class="hobby"><div class="hobby-title"><span class="hobby-symbol" aria-hidden="true">${escape(item.symbol)}</span><h3>${escape(item.title)}</h3></div><p>${escape(item.description)}</p></article>`).join('\n');
const renderGallery = items => items.map((item, i) => `<figure class="photo-card"><a class="photo-link" href="${photoPath(item.image)}" data-caption="${escape(item.caption)}" data-title="${escape(item.title)}" aria-label="${escape(item.title)}"><img src="${photoPath(item.image, true)}" alt="${escape(item.alt)}" width="720" height="960" style="object-position:${escape(item.position)}" loading="lazy" decoding="async"><span class="expand-icon" aria-hidden="true">↗</span></a><figcaption><span>${escape(item.title)}</span><span class="photo-number">${String(i+1).padStart(2,'0')}</span></figcaption></figure>`).join('\n');

const values = {
  ...Object.fromEntries(Object.entries(data).filter(([, value]) => typeof value === 'string').map(([key, value]) => [key, escape(value)])),
  headline: paragraphs(data.headline),
  intro: paragraphs(data.intro),
  about: renderAbout(data.about),
  research: renderResearch(data.research),
  education: renderEducation(data.education),
  hobbies: renderHobbies(data.hobbies),
  gallery: renderGallery(data.gallery),
  emailLink: data.email ? `<a class="text-link" href="mailto:${escape(data.email)}"><span data-i18n="closingEmail">Write me</span> <span aria-hidden="true">↗</span></a>` : ''
};

// --- Runtime dictionary: per language, the UI strings plus pre-rendered sections.
const translations = {};
for (const [code, entry] of Object.entries(i18n.translations || {})) {
  const content = entry.content || {};
  translations[code] = {
    strings: entry.strings || {},
    sections: {
      about: renderAbout(content.about || []),
      research: renderResearch(content.research || []),
      education: renderEducation(content.education || []),
      hobbies: renderHobbies(content.hobbies || []),
      gallery: renderGallery(content.gallery || [])
    }
  };
}
const payload = { default: i18n.default || 'en', languages: i18n.languages || [], translations };

const template = await readFile(resolve(root, 'src/index.html'), 'utf8');
let html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (!(key in values)) throw new Error(`Missing content field: ${key}`);
  return values[key];
});
// Inline dictionary, emitted before the deferred app.js so it is always available.
// "<" and ">" are escaped so the JSON can never terminate the script element early.
const json = JSON.stringify(payload).replace(/</g, '\u005cu003c').replace(/>/g, '\u005cu003e');
html = html.replace('</body>', `<script>window.__I18N__=${json};</script></body>`);

await mkdir(resolve(root, 'dist'), { recursive: true });
for (const name of new Set(['avatar', data.heroImage, ...data.gallery.map(item => item.image)])) {
  for (const small of [false, true]) await access(resolve(root, 'dist', photoPath(name, small)));
}
for (const item of data.education) if (item.logo) await access(resolve(root, 'dist', logoPath(item.logo)));
await writeFile(resolve(root, 'dist/index.html'), html);
for (const file of ['style.css', 'app.js', 'busuanzi.pure.mini.js']) await copyFile(resolve(root, 'src', file), resolve(root, 'dist', file));
await writeFile(resolve(root, 'dist/.nojekyll'), '');
await writeFile(resolve(root, 'dist/robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${data.siteUrl}/sitemap.xml\n`);
await writeFile(resolve(root, 'dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(data.siteUrl)}/</loc></url></urlset>\n`);

// A missing path (e.g. gofish040821.github.io/gofish040821/, which reads as a
// repo name rather than a route) would otherwise land on Pages' bare 404 page.
const notFound = (await readFile(resolve(root, 'src/404.html'), 'utf8')).replace(/__SITE_URL__/g, data.siteUrl);
await writeFile(resolve(root, 'dist/404.html'), notFound);
console.log(`Built Gofish homepage: ${data.gallery.length} photos, ${data.research.length} research interests, ${Object.keys(translations).length} languages.`);
